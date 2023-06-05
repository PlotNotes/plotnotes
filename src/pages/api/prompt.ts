import { ChatCompletionRequestMessageRoleEnum } from "openai";
import { getOpenAIClient, constructPrompt } from "./openai";


async function getStory(req: any) {
  const openai = getOpenAIClient();
  let content = `Write a short story about '${req.body.prompt}', do not end the story just yet and use every remaining token.`
  const prompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();

}



export default async function handler(req: any, res: any) {
  const createShortStory = req.body.shortStory;

  if (createShortStory) {
    const story = await getStory(req);
    const storyName = await createStoryName(story);
    res.status(200).send({story: story, storyName: storyName});
  } else {

    const prompt = req.body.prompt;
    const storyName = await createStoryName(prompt);

    let chapters: string[] = [];

    // Writes 1 chapter as a test, TODO: write more chapters
    let chapter = await writeChapter(prompt, chapters);
    chapters.push(chapter);

    res.status(200).send({chapters: chapters, storyName: storyName});
  }
}



async function writeChapter(prompt: string, chapters: string[]): Promise<string> {

  if (chapters.length == 0) {
    let content = `Write the first chapter of a story about '${prompt}', do not end the story just yet and use every remaining token.`
    
    const chapterPrompt = constructPrompt(content);

    const openai = getOpenAIClient();
    const completion = await openai.createChatCompletion(chapterPrompt);

    return completion.data.choices[0].message!.content.trim();
  }

  return "";
}



async function createStoryName(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let content = `Create a name for the story, include nothing except the name of the story: '${story}'.`

  const prompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();
}



export async function continueStory(prompt: string, oldStories: string[]): Promise<string> {
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
  let content = `Continue the following story: "${summary}" using the prompt: '${prompt}', using every remaining token.`

  const continuePrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}



export async function continueChapters(prompt: string, previousChapters: string[]) {

  // Summarizes each previous chapter
  let summaries = ""
  for (let i = 0; i < previousChapters.length; i++) {
    const chapter = previousChapters[i];
    const summary = await summarize(chapter);
    summaries += summary + " ";
  }

  // If the prompt is too long, summarize the prompt
  if (prompt.length + summaries.length > 3500) {
    summaries = await summarize(summaries);
  }
  console.log(prompt.length + summaries.length)
  const openai = getOpenAIClient();

  let content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', using every remaining token.`

  const continuePrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}



async function summarize(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let content = `Summarize the following as much as possible: '${story}'`;
  
  const summaryPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(summaryPrompt);

  return completion.data.choices[0].message!.content.trim();
}

export async function editChapter(chapter: string, prompt: string): Promise<string> {
  const openai = getOpenAIClient();

  if (chapter.length + prompt.length > 3500) {
    prompt = await summarize(prompt);
  }

  let content = `Edit the following chapter: '${chapter}' using the prompt: '${prompt}', using every remaining token.`
  console.log(content);
  const editPrompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(editPrompt);
  return completion.data.choices[0].message!.content.trim();
}