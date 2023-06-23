import { getOpenAIClient, constructPrompt, createEmbedding, tokenize, getCustomTermName } from "./openai";
import { userLoggedIn } from "./authchecks";
import { query } from "./db";
import { NextApiRequest, NextApiResponse } from "next";


const generateChapterPrompt = (prompt: string, context: string, additionalText: string) => {
  return `Write ${additionalText} about '${prompt}', ${
    context ? `here is some relevant context '${context}', ` : ""
  }do not end the story just yet and make this response as long as possible. 
  Include only the story and do not use the prompt in the response. Do not name the story.
  Chapter 1: The Start`;
};

const generateShortStoryPrompt = (prompt: string, context: string, additionalText: string) => {
  return `Write ${additionalText} about '${prompt}', ${
    context ? `here is some relevant context '${context}', ` : ""
  }do not end the story just yet and make this response as long as possible. 
  Include only the story and do not use the prompt in the response. Do not name the story.`;
}

const generateContinuePrompt = (prompt: string, context: string, summary: string) => {
  return `Continue the story: '${summary}' using the following prompt ${prompt}, ${
    context ? `here is some relevant context '${context}', ` : ""
  }. Include only the story and do not use the prompt in the response.`;
}

const getOpenAICompletion = async (content: string) => {
  const openai = getOpenAIClient();
  const prompt = constructPrompt(content);
  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();
};

export async function getStory (prompt: string, userid: string): Promise<{story: string, storyName: string}> {
  const context = await getContext(prompt, userid);
  console.log("Context: " + context);
  const content = generateShortStoryPrompt(prompt, context, 'a short story');
  console.log("Content: " + content);
  let completion = await getOpenAICompletion(content);
  console.log("Completion: " + completion);
  // If the story is too short, continue the completion where it left off
  let tokens = tokenize(completion);
  while (tokens < 1000) {
    const summary = await summarize(completion);
    const newContent = generateContinuePrompt(prompt, context, summary);
    const newCompletion = await getOpenAICompletion(newContent);
    completion += ` ${newCompletion}`;
    tokens = tokenize(completion);
    console.log("Tokens: " + tokens);
  }

  const storyName = await createStoryName(completion);

  return {story: completion, storyName};
};


export async function getChapter(prompt: string, userid: string): Promise<{chapter: string, storyName: string}> {
  const context = await getContext(prompt, userid);
  const content = generateChapterPrompt(prompt, context, 'the first chapter of a story');
  let completion = await getOpenAICompletion(content);

  // If the story is too short, continue the completion where it left off
  let tokens = tokenize(completion);
  while (tokens < 1000) {
    const summary = await summarize(completion);
    const newContent = generateContinuePrompt(prompt, context, summary);
    const newCompletion = await getOpenAICompletion(newContent);
    completion += ` ${newCompletion}`;
    tokens = tokenize(completion);
  }

  const storyName = await createStoryName(completion);

  return {chapter: completion, storyName};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userid = await userLoggedIn(req, res);

  if (!userid) {
    res.status(401).send({ response: "Not logged in" });
    return;
  }

  const createShortStory = req.body.shortStory;
  const prompt = req.body.prompt;
  const context = await getContext(prompt, userid);

  if (createShortStory) {
    // const story = await getStory(req, userid);
    // const storyName = await createStoryName(story);
    // res.status(200).send({story, storyName});
  } else {
    const chapter = await writeChapter(prompt, context);
    const storyName = await createStoryName(prompt);
    res.status(200).send({chapter, storyName});
  }
}

const getContext = async (prompt: string, userid: string) => {
  const termsQuery = await query(`SELECT term FROM userterms WHERE userid = $1`, [userid]);
  const terms = termsQuery.rows.map(row => (row as any).term);
  const termsInPrompt = terms.filter(term => prompt.toLowerCase().includes(term.toLowerCase()));

  if (!termsInPrompt.length) return "";

  const promptEmbedding = await createEmbedding(prompt);
  const context = [];

  for (const term of termsInPrompt) {
    const termIDQuery = await query(`SELECT termid FROM userterms WHERE userid = $1 AND term = $2`, [userid, term]);
    const termId = (termIDQuery.rows[0] as any).termid;

    const contextQuery = await query(`SELECT context FROM usercontext WHERE termid = $1 AND embedding <-> $2 < 0.7`, [termId, promptEmbedding]);

    if (contextQuery.rows.length) {
      context.push(...contextQuery.rows.map(row => (row as any).context));
    }
  }

  return context.join("\n\n");
};

const writeChapter = async (prompt: string, context: string) => {
  const content = generateChapterPrompt(prompt, context, 'the first chapter of a story');
  let completion = await getOpenAICompletion(content);

  // If the story is too short, continue the completion where it left off
  let tokens = tokenize(completion);
  while (tokens < 1000) {
    const summary = await summarize(completion);
    const newContent = generateContinuePrompt(prompt, context, summary);
    const newCompletion = await getOpenAICompletion(newContent);
    completion += ` ${newCompletion}`;
    tokens = tokenize(completion);
  }
  return completion;
};

const createStoryName = async (story: string) => {
  const content = `Create a name for the story, include nothing except the name of the story: '${story}'. Do not use quotes.`;
  return await getOpenAICompletion(content);
};

export async function continueStory(prompt: string, oldStories: string[], userid: string) {

  const summary = await summarizeMultiple(oldStories);
  let context = await getContext(prompt, userid);

  let content = generateContinuationPrompt(prompt, summary, context);

  let completion = await getOpenAICompletion(content);

  // If the story is too short, continue the completion where it left off
  let tokens = tokenize(completion);
  while (tokens < 1000) {
    const summary = await summarize(completion);
    const newContent = generateContinuePrompt(prompt, context, summary);
    const newCompletion = await getOpenAICompletion(newContent);
    completion += ` ${newCompletion}`;
    tokens = tokenize(completion);
  }
  return completion;
}

export async function continueChapters(prompt: string, previousChapters: string[], userid: string) {

  let summaries = await summarizeMultiple(previousChapters);
  
  let context = await getContext(prompt, userid);

  let content = generateContinuationPrompt(prompt, summaries, context);

  let completion = await getOpenAICompletion(content);
  
  // If the story is too short, continue the completion where it left off
  let tokens = tokenize(completion);
  while (tokens < 1000) {
    const summary = await summarize(completion);
    const newContent = generateContinuePrompt(prompt, context, summary);
    const newCompletion = await getOpenAICompletion(newContent);
    completion += ` ${newCompletion}`;
    tokens = tokenize(completion);
  }
  return completion;
}

async function summarizeMultiple(texts: string[]) {
  let summaries = "";
  for (let i = 0; i < texts.length; i++) {
    let text = texts[i]
    summaries += await summarize(text) + " ";
  }
  return summaries;
}

async function summarize(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let content = `Summarize the following as much as possible: '${story}'. If there is nothing to summarize, say nothing.`;
  
  const summaryPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(summaryPrompt);

  return completion.data.choices[0].message!.content.trim();
}

function generateContinuationPrompt(prompt: string, summaries: string, context: string) {
  let content = ``;
  if (context != "") {
    content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', here is some relevant context '${context}', make it as long as possible and include only the story. Do not include the prompt in the story.`
  } else {
    content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', make it as long as possible and include only the story. Do not include the prompt in the story.`
  }
  return content;
}

export async function editExcerpt(chapter: string, prompt: string) {
  
  const tokens = tokenize(chapter + " " + prompt);
  if (tokens > 1000) {
    chapter = await summarize(chapter);
  }

  const content = `Edit the following: '${chapter}' using the prompt: '${prompt}', make it as long as possible.`;
  let editedChapter = await getOpenAICompletion(content);

  if (editedChapter.startsWith(`"`) && editedChapter.endsWith(`"`)) {
    editedChapter = editedChapter.slice(1, -1);
  }

  return editedChapter;
}

export async function createCustomTerm(termNames: any[], termName: string): Promise<{ termName: string, termDescription: string }> {

  if (!termName) {
    const termNameContent = `Create a brand new random term that doesn't exist yet for a fictional story event or character that isnt one of the following terms: 
    '${termNames.toString()}', include nothing except the name of the term. Do not use quotes or periods at the end.`;
    
    termName = await getCustomTermName(termNameContent);
  }
  
  const termContent = `Create a description for the following fictional story term '${termName}', include nothing except the description of the term. 
  Do not use quotes or attach it to an existing franchise. Make it several paragraphs.`;
  const termDescription = await getOpenAICompletion(termContent);
  
  if (termName.endsWith(`.`)) {
    termName = termName.slice(0, -1);
  }

  return { termName, termDescription };
}