import { getOpenAIClient, constructPrompt, createEmbedding, tokenize } from "./openai";
import { userLoggedIn } from "./authchecks";
import { query } from "./db";

async function getStory(req: any, userid: string) {
  const openai = getOpenAIClient();
  const prompt = req.body.prompt;
  const context = await getContext(prompt, userid);

  const tokens = tokenize(prompt + " " + context);

  if (tokens > 1000) {
    summarize(context);
  }

  let content = ``;

  if (context != "") {
    content = `Write a short story about '${prompt}', here is some relevant context '${context}', do not end the story just yet and use every remaining token.`
  } else {
    content = `Write a short story about '${prompt}', do not end the story just yet and use every remaining token.`
  }
  
  const storyPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(storyPrompt);
  return completion.data.choices[0].message!.content.trim();

}

export default async function handler(req: any, res: any) {

  const userid = await userLoggedIn(req, res);

  if (userid == "") {
    res.status(401).send({ response: "Not logged in" });
    return;
  }

  const createShortStory = req.body.shortStory;

  if (createShortStory) {
    const story = await getStory(req, userid);
    const storyName = await createStoryName(story);
    res.status(200).send({story: story, storyName: storyName});
  } else {

    const prompt = req.body.prompt;
    const storyName = await createStoryName(prompt);

    const context = await getContext(prompt, userid);

    // Writes 1 chapter as a test, TODO: write more chapters
    let chapter = await writeChapter(prompt, context);

    res.status(200).send({chapter: chapter, storyName: storyName});
  }
}

async function getContext(prompt: string, userid: string): Promise<string> {
  prompt = prompt.toLowerCase();
  // Searches the userterms table for the terms that are in the prompt
  const termsQuery = await query(
    `SELECT term FROM userterms WHERE userid = $1`,
    [userid]
  );

  const terms = termsQuery.rows.map((row) => (row as any).term);

  // Checks if the prompt contains any of the terms
  let termsInPrompt = [];

  for (let i = 0; i < terms.length; i++) {
    if (prompt.includes(terms[i].toLowerCase())) {
      termsInPrompt.push(terms[i]);
    }
  }

  // If there are no terms in the prompt, return an empty string
  if (termsInPrompt.length == 0) {
    return "";
  }
  // Creates an embedding of the prompt
  const promptEmbedding = await createEmbedding(prompt);

  // Gets the relevant parts of each term by comparing the embedding of the prompt to the embedding of the context
  let context = [];

  for (let i = 0; i < termsInPrompt.length; i++) {

    const term = termsInPrompt[i];

    const termIDQuery = await query(
      `SELECT termid FROM userterms WHERE userid = $1 AND term = $2`,
      [userid, term]
    );

    const termId = (termIDQuery.rows[0] as any).termid;

    // Gets the relevant context for the term
    const contextQuery = await query(
      `SELECT context FROM usercontext WHERE termid = $1 AND embedding <-> $2 < 0.7`,
      [termId, promptEmbedding]
    );

    if (contextQuery.rows.length == 0) {
      continue;
    }

    // Adds all the relevant contexts to the context array
    for (let j = 0; j < contextQuery.rows.length; j++) {
      context.push((contextQuery.rows[j] as any).context);
    }
    
  }

  // Returns the context as a string
  return context.join("\n\n");

}

async function writeChapter(prompt: string, context: string): Promise<string> {

  let content = ``

  const tokens = tokenize(prompt + " " + context);

  if (tokens > 1000) {
    summarize(context);
  }
  
  if (context != "") {    
    content = `Write the first chapter of a story about '${prompt}', here is some relevant context '${context}', do not end the story just yet and use every remaining token.`
  } else {
    content = `Write the first chapter of a story about '${prompt}', do not end the story just yet and use every remaining token.`
  }
  
  const chapterPrompt = constructPrompt(content);

  const openai = getOpenAIClient();
  const completion = await openai.createChatCompletion(chapterPrompt);

  return completion.data.choices[0].message!.content.trim();
}

async function createStoryName(story: string): Promise<string> {

  const openai = getOpenAIClient();

  let content = `Create a name for the story, include nothing except the name of the story: '${story}'. Do not use quotes.`

  const prompt = constructPrompt(content); 

  const completion = await openai.createChatCompletion(prompt);

  return completion.data.choices[0].message!.content.trim();
}

export async function continueStory(prompt: string, oldStories: string[], userid: string): Promise<string> {
  console.log("prompt: ", prompt);
  const openai = getOpenAIClient();

  let summary = "";
  try {

    for (let i = 0; i < oldStories.length; i++) {
      let story = oldStories[i]
      summary += await summarize(story) + " ";
    }
  } catch (err) {
    console.log("prompt error: ", err);
  }
  console.log("summary: ", summary);
  let context = await getContext(prompt, userid);
  console.log("context: ", context);
  const tokens = tokenize(prompt + " " + summary + " " + context);
  console.log("tokens: ", tokens);
  if (tokens > 1000) {
    summary = await summarize(summary);
    context = await summarize(context);
  }
  console.log("summary: ", summary);
  console.log("context: ", context);
  let content = ``;

  if (context != "") {
    content = `Continue the following story: "${summary}" using the prompt: '${prompt}', here is some relevant context '${context}', using every remaining token and include only the story. Do not include the prompt in the story.`
  } else {
    content = `Continue the following story: "${summary}" using the prompt: '${prompt}', using every remaining token and include only the story. Do not include the prompt in the story.`
  }
  console.log("content: ", content);
  const continuePrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}

export async function continueChapters(prompt: string, previousChapters: string[], userid: string) {

  // Summarizes each previous chapter
  let summaries = ""
  for (let i = 0; i < previousChapters.length; i++) {
    const chapter = previousChapters[i];
    const summary = await summarize(chapter);
    summaries += summary + " ";
  }

  // If the prompt is too long, summarize the prompt
  if (prompt.length + summaries.length > 1000) {
    summaries = await summarize(summaries);
  }
  
  const openai = getOpenAIClient();


  let context = await getContext(prompt, userid);

  const tokens = tokenize(prompt + " " + summaries + " " + context);

  if (tokens > 1000) {
    summaries = await summarize(summaries);
    context = await summarize(context);
  }

  let content = ``;

  if (context != "") {
    content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', here is some relevant context '${context}', using every remaining token and include only the story. Do not include the prompt in the story.`
  } else {
    content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', using every remaining token and include only the story. Do not include the prompt in the story.`
  }

  const continuePrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}

async function summarize(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let content = `Summarize the following as much as possible: '${story}'. If there is nothing to summarize, say nothing.`;
  
  const summaryPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(summaryPrompt);

  return completion.data.choices[0].message!.content.trim();
}

export async function editExcerpt(chapter: string, prompt: string): Promise<string> {
  const openai = getOpenAIClient();

  if (chapter.length + prompt.length > 3500) {
    prompt = await summarize(prompt);
  }
  let content = `Edit the following: '${chapter}' using the prompt: '${prompt}', using every remaining token.`
  const editPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(editPrompt);
  let editedChapter = completion.data.choices[0].message!.content.trim();

  if (editedChapter.startsWith(`"`) && editedChapter.endsWith(`"`)) {
    editedChapter = editedChapter.slice(1, -1);
  }

  return editedChapter;
}