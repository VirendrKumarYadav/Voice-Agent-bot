import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing 'audio' field in form data" },
        { status: 400 }
      );
    }

    const file = new File([audio], "utterance.webm", {
      type: audio.type || "audio/webm",
    });

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    const text = transcription.text?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[/api/transcribe] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
