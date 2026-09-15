import { getOpenAI } from "./openai";

export async function synthesizeSpeechOpenAI(text: string): Promise<Response> {
  const openai = getOpenAI();
  return openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text,
    instructions:
      "Speak at a calm, slightly slow teaching pace. Pause briefly between ideas and emphasize important terms and numbers. Sound warm, patient, and clear for a complete beginner.",
    response_format: "mp3",
  });
}
