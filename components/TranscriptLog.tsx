import type { TranscriptEntry } from "@/lib/conversation";

export function TranscriptLog({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <div className="flex max-h-40 w-full flex-col gap-1 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
      {entries.length === 0 && (
        <p className="text-slate-500">Transcript will appear here.</p>
      )}
      {entries.map((entry, i) => (
        <p key={i} className={entry.role === "user" ? "text-slate-700" : "text-sky-700"}>
          <span className="font-semibold">
            {entry.role === "user" ? "You: " : "Agent: "}
          </span>
          {entry.text}
        </p>
      ))}
    </div>
  );
}
