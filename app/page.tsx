"use client";

import { Mic, Square } from "lucide-react";
import { FormEvent, useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { DiagramPanel } from "@/components/DiagramPanel";
import { TranscriptLog } from "@/components/TranscriptLog";
import { useVoiceAgent } from "@/lib/conversation";

const STATUS_LABEL: Record<string, string> = {
  idle: "Tap start and ask a question",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Something went wrong",
};

export default function Home() {
  const {
    status,
    level,
    topics,
    transcript,
    errorMessage,
    isRunning,
    start,
    stop,
    askText,
  } =
    useVoiceAgent();
  const [chatQuestion, setChatQuestion] = useState("");

  const submitChatQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = chatQuestion.trim();
    if (!question || isRunning) return;
    setChatQuestion("");
    await askText(question);
  };

  return (
    <div className="flex flex-1 flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-sm font-semibold tracking-wide text-slate-800">
          Voice Agent Tutor
        </h1>
        <p className="text-xs text-slate-500">Powered by Ollama or OpenAI</p>
      </header>

      <main className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <section className="flex min-w-0 flex-col items-center justify-center gap-8 border-b border-slate-200 p-10 md:border-b-0 md:border-r">
          <VoiceOrb level={level} status={status} />

          <p className="text-[1.5rem] text-slate-500">{STATUS_LABEL[status]}</p>

          <button
            onClick={isRunning ? stop : start}
            className={`flex items-center gap-2 rounded-full px-8 py-4 text-[1.5rem] font-medium transition-colors ${
              isRunning
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {isRunning ? (
              <>
                <Square size={16} /> Stop
              </>
            ) : (
              <>
                <Mic size={16} /> Start
              </>
            )}
          </button>

          {errorMessage && (
            <p className="max-w-sm text-center text-xs text-red-400">{errorMessage}</p>
          )}

          <div className="w-full max-w-sm">
            <TranscriptLog entries={transcript} />
          </div>

          <form onSubmit={submitChatQuestion} className="w-full max-w-sm">
            <label htmlFor="chat-question" className="mb-2 block text-xs font-medium text-slate-600">
              Or type a question
            </label>
            <div className="flex gap-2">
              <input
                id="chat-question"
                value={chatQuestion}
                onChange={(event) => setChatQuestion(event.target.value)}
                placeholder="Ask anything..."
                disabled={isRunning || status === "thinking" || status === "speaking"}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={!chatQuestion.trim() || isRunning || status === "thinking" || status === "speaking"}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Ask
              </button>
            </div>
          </form>
        </section>

        <section className="min-h-[520px] min-w-0">
          <DiagramPanel
            topics={topics}
            questions={transcript
              .filter((entry) => entry.role === "user")
              .map((entry) => entry.text)}
          />
        </section>
      </main>
    </div>
  );
}
