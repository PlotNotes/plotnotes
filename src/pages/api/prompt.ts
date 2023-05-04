import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

export default async function handler(req: any, res: any) {
  const openai = new OpenAIApi(configuration);
  const max_tokens = 4096;
  let messages = [];
  let content = `Write a story about ${req.body.prompt}, and use every remaining token you can`

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const completion = await openai.createChatCompletion({ 
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: max_tokens - content.length,
  });

  res.status(200).send({response: completion.data.choices[0].message!.content.trim()});
}