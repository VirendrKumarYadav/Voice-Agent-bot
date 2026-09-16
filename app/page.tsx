"use client";

import { Mic, Square, Volume2, VolumeX } from "lucide-react";
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
    isMuted,
    toggleMute,
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
      <header className="relative flex items-center justify-between overflow-hidden bg-slate-900 px-6 py-4 text-white shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-500/15 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 ring-1 ring-sky-300/30">
            <Mic size={17} className="text-sky-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              Voice Agent Tutor
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Learn by listening, seeing, and asking
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <p className="text-[11px] font-medium text-slate-300">Powered by Ollama or OpenAI</p>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="flex min-w-0 flex-col items-center justify-center gap-8 border-b border-slate-200 p-10 md:border-b-0 md:border-r">
          <VoiceOrb level={level} status={status} />

          <p className="text-[1.5rem] text-slate-500">{STATUS_LABEL[status]}</p>

          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? "Unmute voice agent" : "Mute voice agent"}
              title={isMuted ? "Unmute voice agent" : "Mute voice agent"}
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 transition ${
                isMuted
                  ? "bg-amber-100 text-amber-800 ring-amber-200 hover:bg-amber-200"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {errorMessage && (
            <p className="max-w-sm text-center text-xs text-red-400">{errorMessage}</p>
          )}

          <div className="w-full max-w-xl">
            <TranscriptLog entries={transcript} />
          </div>

          <form onSubmit={submitChatQuestion} className="w-full max-w-xl">
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
