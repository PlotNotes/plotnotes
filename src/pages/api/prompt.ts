import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";

export function getOpenAIConfiguration() {
  return new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }); 
}

export function getOpenAIClient() {
  return new OpenAIApi(getOpenAIConfiguration());
}

export function constructPrompt(req: any) {
  const max_tokens = 4096;
  let messages = [];
  let content = `Write a story about '${req.body.prompt}', try to avoid using 'Once upon a time'`

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  return {
    model: "gpt-3.5-turbo",
    messages, 
    max_tokens: max_tokens - content.length,
  }; 
}

export async function getStory(req: any) {
  const openai = getOpenAIClient();
  const prompt = constructPrompt(req);

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();
}

export default async function handler(req: any, res: any) {
  const story = await getStory(req);
  const storyName = await createStoryName(story);
  res.status(200).send({story: story, storyName: storyName});
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
  };

  const completion = await openai.createChatCompletion(prompt);
  return completion.data.choices[0].message!.content.trim();
}