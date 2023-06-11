import { getOpenAIClient, constructPrompt } from "./openai";
import { getUserID } from "./authchecks";

async function getStory(req: any) {
  const openai = getOpenAIClient();
  let content = `Write a short story about '${req.body.prompt}', do not end the story just yet and use every remaining token.`
  const prompt = constructPrompt(content);

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();

}

export default async function handler(req: any, res: any) {

  try {
    const sessionid = req.cookies.token;
    const userid = await getUserID(sessionid);

    const createShortStory = req.body.shortStory;
    console.log("create short story: " + createShortStory);
    if (createShortStory) {
      const story = await getStory(req);
      const storyName = await createStoryName(story);
      res.status(200).send({story: story, storyName: storyName});
    } else {
      console.log("prompt: " + req.body.prompt);
      const prompt = req.body.prompt;
      const storyName = await createStoryName(prompt);
      console.log("story name: " + storyName);

      // Writes 1 chapter as a test, TODO: write more chapters
      let chapter = await writeChapter(prompt);

      res.status(200).send({chapter: chapter, storyName: storyName});
    }
  } catch (err) {
    // console.log(err);
    if (err instanceof TypeError && err.message == "Cannot read properties of undefined (reading 'userid')") {
      res.status(401).send({ response: "Not logged in" });
      return;
    }
  }
}


async function writeChapter(prompt: string): Promise<string> {

  let content = `Write the first chapter of a story about '${prompt}', do not end the story just yet and use every remaining token.`
  
  const chapterPrompt = constructPrompt(content);

  const openai = getOpenAIClient();
  const completion = await openai.createChatCompletion(chapterPrompt);

  return completion.data.choices[0].message!.content.trim();
}

async function createStoryName(story: string): Promise<string> {
  console.log("story: " + story);
  const openai = getOpenAIClient();

  let content = `Create a name for the story, include nothing except the name of the story: '${story}'.`

  const prompt = constructPrompt(content); 
  console.log("prompt: " + prompt);
  const completion = await openai.createChatCompletion(prompt);
  console.log("completion: " + completion.data.choices[0].message!.content.trim());
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
  let content = `Continue the following story: "${summary}" using the prompt: '${prompt}', using every remaining token and only include the story.`

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
  if (prompt.length + summaries.length > 1000) {
    summaries = await summarize(summaries);
  }
  console.log(prompt.length + summaries.length)
  const openai = getOpenAIClient();

  let content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', using every remaining token and include only the story.`

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