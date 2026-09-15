import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeechOpenAI } from "@/lib/openaiTts";

const requestSchema = z.object({
  text: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { text } = requestSchema.parse(await req.json());
    const upstream = await synthesizeSpeechOpenAI(text);

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/tts] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TTS request failed" },
      { status: 500 }
    );
  }
}
