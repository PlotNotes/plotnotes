import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";

function getOpenAIConfiguration() {
  return new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }); 
}

export function getOpenAIClient() {
  return new OpenAIApi(getOpenAIConfiguration());
}

export function constructPrompt(prompt: string) {
  const max_tokens = 4096;
  let messages = [];
  let content = `Write a story about '${prompt}', try to avoid using 'Once upon a time'.`

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  return {
    model: "gpt-3.5-turbo",
    messages, 
    max_tokens: max_tokens - content.length,
    temperature: 0.0,
  }; 
}

export async function getStory(req: any) {
  const openai = getOpenAIClient();
  const prompt = constructPrompt(req.body.prompt);

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
  let messages = [];

  if (chapters.length == 0) {
    let content = `Write the first chapter of a story about '${prompt}', try to avoid using 'Once upon a time'.`
    const max_tokens = 4096 - content.length;

    messages.push({
        "role": ChatCompletionRequestMessageRoleEnum.User,
        "content": content
    })

    const chapterPrompt = {
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: max_tokens,
      temperature: 0.0,
    };

    const openai = getOpenAIClient();
    const completion = await openai.createChatCompletion(chapterPrompt);

    return completion.data.choices[0].message!.content.trim();
  }

  return "";
}

async function createStoryName(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let messages = [];
  let content = `Create a name for the story, include nothing except the name of the story: '${story}'.`

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const max_tokens = 4096 - content.length;

  const prompt = {
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: max_tokens,
    temperature: 0.0,
  };

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();
}

export async function continueStory(prompt: string, oldStories: string[]): Promise<string> {
  const openai = getOpenAIClient();

  let messages = [];
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

  messages = [];
  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const max_tokens = 4096 - content.length;

  const continuePrompt = {
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: max_tokens,
    temperature: 0.0,
  };

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}

export async function continueChapters(prompt: string, previousChapters: string[]) {

  const maxTokens = 4096;
  // Summarizes each previous chapter
  let summaries = ""
  for (let i = 0; i < previousChapters.length; i++) {
    const chapter = previousChapters[i];
    const summary = await summarize(chapter);
    summaries += summary + " ";
  }


  if (prompt.length + summaries.length > maxTokens) {
    summaries = await summarize(summaries);
  }

  const openai = getOpenAIClient();

  let messages = [];
  let content = `Continue the following story: "${summaries}" using the prompt: '${prompt}', using every remaining token.`

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const max_tokens = 4096 - content.length;
  console.log("max tokens: ", max_tokens);
  const continuePrompt = {
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: max_tokens,
    temperature: 0.0,
  };

  const completion = await openai.createChatCompletion(continuePrompt);
  return completion.data.choices[0].message!.content.trim();
}

async function summarize(story: string): Promise<string> {
  const openai = getOpenAIClient();
  let messages = [];
  let content = `Summarize the following as much as possible: '${story}'`
      messages.push({
          "role": ChatCompletionRequestMessageRoleEnum.User,
          "content": content
      })
    
      const max_tokens = 4096 - content.length;

      const summaryPrompt = {
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: max_tokens,
        temperature: 0.0,
      };
      const completion = await openai.createChatCompletion(summaryPrompt);

      return completion.data.choices[0].message!.content.trim();
}