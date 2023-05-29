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
  let content = `Write a story about '${prompt}', try to avoid using 'Once upon a time'`

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

    console.log("creating chapters");
    const prompt = req.body.prompt;
    const storyName = await createStoryName(prompt);
    console.log("story name: ", storyName);
    let chapters: string[] = [];

    // Writes 1 chapter as a test, TODO: write more chapters
    let chapter = await writeChapter(prompt, chapters);
    chapters.push(chapter);

    console.log("chapters: ", chapters);
    res.status(200).send({chapters: chapters, storyName: storyName});
  }
}

async function writeChapter(prompt: string, chapters: string[]): Promise<string> {
  console.log("writing chapter");
  let messages = [];

  if (chapters.length == 0) {
    let content = `Write the first chapter of a story about '${prompt}', try to avoid using 'Once upon a time'`
    const max_tokens = 4096 - content.length;

    console.log(max_tokens);

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
    console.log("chapter: ", completion.data.choices[0].message!.content.trim());
    return completion.data.choices[0].message!.content.trim();
  }

  return "";
}

async function createStoryName(story: string): Promise<string> {
  const openai = getOpenAIClient();

  let messages = [];
  let content = `Create a name for the story, include nothing except the name of the story: '${story}'`

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
      summary = oldStories[i]
    
      let content = `Summarize the following: '${oldStories}'`
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
      summary += completion.data.choices[0].message!.content.trim() + " ";
    }
  } catch (err) {
    console.log("prompt error: ", err);
  }
  let content = `Continue the following story: "${summary}" using the prompt: '${prompt}', using every remaining token`

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