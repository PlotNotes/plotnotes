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
  let content = `Write a story about '${req.body.prompt}', use ' for dialogue, never use double quotes`

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
  res.status(200).send({response: story});
}