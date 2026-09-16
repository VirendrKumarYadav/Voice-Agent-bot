"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentReply, TopicNote } from "./diagramSchema";

export type AgentStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return (body && typeof body.error === "string" && body.error) || fallback;
}

async function fetchAgentReply(messages: TranscriptEntry[]): Promise<AgentReply> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, text }) => ({ role, content: text })),
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Chat request failed"));
  return res.json();
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
}

function listenWithBrowser(): {
  promise: Promise<string>;
  stop: () => void;
} {
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) {
    throw new Error(
      "Voice transcription is not supported in this browser. Use Google Chrome or Safari."
    );
  }

  const recognition = new Recognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let resolveResult: (text: string) => void = () => undefined;
  let rejectResult: (error: Error) => void = () => undefined;
  let transcript = "";
  let settled = false;

  const promise = new Promise<string>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  recognition.onresult = (event) => {
    transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();
  };
  recognition.onerror = (event) => {
    if (settled) return;
    settled = true;
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      rejectResult(new DOMException("Microphone access was denied", "NotAllowedError"));
    } else if (event.error !== "aborted") {
      rejectResult(new Error(`Speech recognition failed: ${event.error}`));
    }
  };
  recognition.onend = () => {
    if (settled) return;
    settled = true;
    resolveResult(transcript);
  };

  recognition.start();

  return {
    promise,
    stop: () => {
      if (!settled) recognition.stop();
    },
  };
}

async function speakTextWithBrowser(
  text: string,
  mutedRef: { current: boolean }
): Promise<void> {
  if (mutedRef.current) return;
  if (!("speechSynthesis" in window)) {
    throw new Error("Browser speech synthesis is not available in this browser");
  }

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => {
      if (mutedRef.current) {
        resolve();
      } else {
        reject(new Error("Speech synthesis failed"));
      }
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

const MAX_EMPTY_RETRIES = 3;
const ERROR_RETRY_DELAY_MS = 1500;

function micErrorMessage(err: DOMException): string {
  switch (err.name) {
    case "NotAllowedError":
      return "Microphone access was denied. Allow it in your browser's site settings and click Start again.";
    case "NotFoundError":
      return "No microphone was found. Connect one and click Start again.";
    case "NotReadableError":
      return "Couldn't access the microphone — it may be in use by another app.";
    default:
      return `Microphone error: ${err.message || err.name}`;
  }
}

export function useVoiceAgent() {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [level, setLevel] = useState(0);
  const [topics, setTopics] = useState<TopicNote[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const runningRef = useRef(false);
  const mutedRef = useRef(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  const appendTranscript = useCallback((entry: TranscriptEntry) => {
    transcriptRef.current = [...transcriptRef.current, entry];
    setTranscript(transcriptRef.current);
  }, []);

  const loop = useCallback(async () => {
    let emptyStreak = 0;
    let fatal = false;

    while (runningRef.current) {
      try {
        setStatus("listening");
        const recognition = listenWithBrowser();
        recognitionRef.current = recognition;
        const text = await recognition.promise;
        recognitionRef.current = null;
        if (!runningRef.current) break;

        setStatus("thinking");
        setLevel(0);

        if (!text) {
          emptyStreak += 1;
          if (emptyStreak >= MAX_EMPTY_RETRIES) {
            setErrorMessage(
              "Having trouble hearing you — check your microphone and try again."
            );
          }
          continue;
        }
        emptyStreak = 0;
        setErrorMessage(null);
        appendTranscript({ role: "user", text });

        const reply = await fetchAgentReply(transcriptRef.current);
        setTopics(reply.topics);
        appendTranscript({ role: "assistant", text: reply.speech });

        if (!runningRef.current) break;
        setStatus("speaking");
        await speakTextWithBrowser(reply.speech, mutedRef);
        setLevel(0);
      } catch (err) {
        console.error("[voice agent loop]", err);
        setStatus("error");

        // Any DOMException here comes from getUserMedia (permission denied,
        // no mic found, mic in use by another app, etc.) — none of these
        // will resolve themselves on retry, so stop instead of looping
        // forever with the button stuck on "Stop".
        const isMicError = err instanceof DOMException;
        setErrorMessage(
          isMicError
            ? micErrorMessage(err as DOMException)
            : err instanceof Error
              ? err.message
              : "Something went wrong"
        );

        if (isMicError) {
          runningRef.current = false;
          fatal = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, ERROR_RETRY_DELAY_MS));
      }
    }

    if (!fatal) setStatus("idle");
    setLevel(0);
    setIsRunning(false);
  }, [appendTranscript]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setErrorMessage(null);
    void loop();
  }, [loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setLevel(0);
    setIsRunning(false);
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) window.speechSynthesis?.cancel();
  }, []);

  const askText = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || runningRef.current) return;

      setErrorMessage(null);
      setStatus("thinking");
      appendTranscript({ role: "user", text });

      try {
        const reply = await fetchAgentReply([
          ...transcriptRef.current,
        ]);
        setTopics(reply.topics);
        appendTranscript({ role: "assistant", text: reply.speech });
        setStatus("speaking");
        await speakTextWithBrowser(reply.speech, mutedRef);
        setStatus("idle");
      } catch (err) {
        console.error("[text question]", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [appendTranscript]
  );

  return {
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
  };
}
