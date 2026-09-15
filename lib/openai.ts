import OpenAI from "openai";

export type AIProvider = "ollama" | "openai";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  return provider === "openai" ? "openai" : "ollama";
}

export function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export function hasOpenAIKey(): boolean {
  return getOpenAIKey().length > 0;
}

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434";
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || "llama3.2";
}

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local or switch AI_PROVIDER=ollama."
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}
