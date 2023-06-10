import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";
import { Tiktoken } from "@dqbd/tiktoken";
import p50k_base from "@dqbd/tiktoken/encoders/p50k_base.json";
import { get_encoding } from "@dqbd/tiktoken";

export function getOpenAIConfiguration() {
  return new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }); 
}

export function getOpenAIClient() {
  return new OpenAIApi(getOpenAIConfiguration());
}

export function constructPrompt(content: string) {
  let messages = [];

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const max_tokens = getMaxTokens(content);
  return {
    model: "gpt-3.5-turbo",
    messages, 
    max_tokens: max_tokens,
    temperature: 1.0,
  }; 
}

function getMaxTokens(content: string) {
  const encoding = new Tiktoken(
    p50k_base.bpe_ranks,
    p50k_base.special_tokens,
    p50k_base.pat_str
  );
  
  const tokens = encoding.encode(content);

  encoding.free();

  const max_tokens = (4096 - tokens.length) - 10;
  
  return max_tokens;
  }
