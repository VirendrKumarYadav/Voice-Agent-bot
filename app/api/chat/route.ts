import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  getAIProvider,
  getOllamaBaseUrl,
  getOllamaModel,
  getOpenAI,
  hasOpenAIKey,
} from "@/lib/openai";
import { agentReplySchema, SYSTEM_PROMPT } from "@/lib/diagramSchema";
import type { TopicNote } from "@/lib/diagramSchema";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

function parseJsonObject(raw: string): unknown {
  const cleaned = raw.trim();

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonLike = fenced ? fenced[1] : cleaned;

  const match = jsonLike.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }

  if (jsonLike.startsWith("{") || jsonLike.startsWith("[")) {
    return JSON.parse(jsonLike);
  }

  throw new Error("No JSON object found in Ollama output");
}

function normalizeOllamaReply(raw: string): unknown {
  try {
    const parsed = parseJsonObject(raw);
    if (parsed && typeof parsed === "object") {
      const reply = parsed as Record<string, unknown>;
      const speech = typeof reply.speech === "string" ? reply.speech.trim() : "";
      const topics = Array.isArray(reply.topics) ? reply.topics : [];

      if (speech) {
        return {
          speech,
          topics: Array.isArray(topics)
            ? topics.filter((topic) => typeof topic === "object" && topic !== null)
            : [],
        };
      }
    }
  } catch {
    // Fall through to the plain-text fallback below.
  }

  return {
    speech: raw.replace(/```(?:json)?/gi, "").replace(/\s+/g, " ").trim() || "I’m ready to help.",
    topics: [],
  };
}

function createFallbackTopic(question: string, speech: string): TopicNote {
  const sentences = speech
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const coreIdea = sentences[0] || speech;
  const example = sentences.find((sentence) =>
    /imagine|like|example|think of|similar to/i.test(sentence)
  );
  const takeaway = sentences[sentences.length - 1] || coreIdea;

  return {
    name: question.length > 60 ? `${question.slice(0, 57)}...` : question,
    description: speech,
    formulaSteps: [],
    diagram: {
      title: "How it works",
      layout: "list",
      centerObject: null,
      actors: [],
      keyPoints: [
        `Core idea: ${coreIdea}`,
        `Real-world example: ${example || "Connect the idea to something familiar."}`,
        `Takeaway: ${takeaway}`,
      ],
    },
  };
}

async function callOllama(messages: { role: string; content: string }[]) {
  const baseUrl = getOllamaBaseUrl().replace(/\/$/, "");
  const model = getOllamaModel();

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: {
        type: "object",
        properties: {
          speech: { type: "string" },
          topics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                formulaSteps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      formula: { type: "string" },
                      explanation: { type: "string" },
                      exampleFormula: { type: ["string", "null"] },
                      exampleExplanation: { type: ["string", "null"] },
                    },
                    required: ["title", "formula", "explanation"],
                  },
                },
                diagram: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    layout: { type: "string" },
                    centerObject: {
                      type: ["object", "null"],
                      properties: {
                        icon: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                    actors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          icon: { type: "string" },
                          label: { type: "string" },
                          caption: { type: ["string", "null"] },
                        },
                        required: ["icon", "label"],
                      },
                    },
                    keyPoints: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["title", "layout", "actors", "keyPoints"],
                },
              },
              required: ["name", "description", "formulaSteps", "diagram"],
            },
          },
        },
        required: ["speech", "topics"],
      },
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Ollama returned an empty response");
  }

  const normalized = normalizeOllamaReply(content);
  const parsed = agentReplySchema.safeParse(normalized);
  const question = messages[messages.length - 1]?.content || "Your question";

  if (parsed.success) {
    return parsed.data.topics.length > 0
      ? parsed.data
      : {
          ...parsed.data,
          topics: [createFallbackTopic(question, parsed.data.speech)],
        };
  }

  const fallbackSpeech =
    typeof (normalized as { speech?: unknown })?.speech === "string"
      ? String((normalized as { speech?: unknown }).speech).trim()
      : "I’m ready to help.";

  return {
    speech: fallbackSpeech || "I’m ready to help.",
    topics: [
      createFallbackTopic(
        question,
        fallbackSpeech || "I’m ready to help."
      ),
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());

    if (body.messages.length === 0) {
      return NextResponse.json(
        { error: "'messages' must not be empty" },
        { status: 400 }
      );
    }

    if (getAIProvider() === "ollama" || !hasOpenAIKey()) {
      const reply = await callOllama(body.messages);
      return NextResponse.json(reply);
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...body.messages,
      ],
      response_format: zodResponseFormat(agentReplySchema, "agent_reply"),
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      const refusal = completion.choices[0]?.message.refusal;
      throw new Error(refusal || "Model returned no parsed content");
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/chat] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat request failed" },
      { status: 500 }
    );
  }
}
