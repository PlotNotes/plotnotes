import { OpenAIApi, Configuration, ChatCompletionRequestMessageRoleEnum } from "openai";
import { Tiktoken } from "@dqbd/tiktoken";
import p50k_base from "@dqbd/tiktoken/encoders/p50k_base.json";

export function getOpenAIConfiguration() {
  return new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }); 
}

export async function createEmbedding(content: string) {
  const openai = getOpenAIClient();
  try {

    // Normalizes the content
    content = normalizeText(content);

    const embedding = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: [content],
    });
    
    const embeddingArray = embedding.data.data[0].embedding;
    const embeddingString = "[" + embeddingArray.join(", ") + "]";

    return embeddingString;
  } catch (err) {
    console.log(err);
  }

}

export function getOpenAIClient() {
  return new OpenAIApi(getOpenAIConfiguration());
}

export function constructPrompt(content: string, temperature?: number) {
  let messages = [];

  messages.push({
      "role": ChatCompletionRequestMessageRoleEnum.User,
      "content": content
  })

  const max_tokens = getMaxTokens(content);

  if (temperature) {
    return {
      model: "gpt-3.5-turbo",
      messages, 
      max_tokens: max_tokens,
      temperature: temperature,
      top_p: 0,
    };
  }

  return {
    model: "gpt-3.5-turbo",
    messages, 
    max_tokens: max_tokens,
    temperature: 1.5,
    top_p: 0,
  }; 
}

export function tokenize(content: string) {
  const encoding = new Tiktoken(
    p50k_base.bpe_ranks,
    p50k_base.special_tokens,
    p50k_base.pat_str
  );

  const tokens = encoding.encode(content);

  encoding.free();

  return tokens.length;
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

  export async function getCustomTermName(content: string): Promise<string> {

    const openai = getOpenAIClient();

    const prompt = constructPrompt(content, 2);

    const completion = await openai.createChatCompletion(prompt);

    const termName = completion.data.choices[0].message!.content.trim();

    return termName;
  }

  // Helper method that normalizes given text by making it all lowercase and removing punctuation
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
}