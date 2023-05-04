import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

export default async function handler(req: any, res: any) {
  const openai = new OpenAIApi(configuration);
  
  console.log(openai)

  let messages = [];
  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.System,
      "content": "Write a story around the following premise."
  })
  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": req.body.prompt
  })

  const completion = await openai.createChatCompletion({ 
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 1000,
  });

  res.status(200).send({response: completion.data.choices[0].message!.content.trim()});
}