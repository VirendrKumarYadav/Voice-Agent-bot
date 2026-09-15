import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";
import katex from "katex";
import { IconRenderer } from "./IconRenderer";
import type { Diagram, FormulaStep, TopicNote } from "@/lib/diagramSchema";

function MathExpression({ value, display = false }: { value: string; display?: boolean }) {
  const html = katex.renderToString(value, {
    displayMode: display,
    throwOnError: false,
    strict: false,
    trust: false,
  });
  return (
    <span
      className={display ? "block overflow-x-auto py-1" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FormulaCard({ step, index }: { step: FormulaStep; index: number }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {index + 1}. {step.title}
      </p>
      <div className="my-3 rounded-lg bg-white px-3 py-2 text-center text-lg text-slate-900 ring-1 ring-indigo-100">
        <MathExpression value={step.formula} display />
      </div>
      <p className="text-xs leading-5 text-slate-600">{step.explanation}</p>
      {step.exampleFormula && (
        <div className="mt-3 border-t border-indigo-100 pt-3">
          <p className="mb-1 text-[11px] font-semibold text-slate-500">WORKED EXAMPLE</p>
          <div className="rounded-lg bg-white px-3 py-2 text-center text-base text-slate-900 ring-1 ring-indigo-100">
            <MathExpression value={step.exampleFormula} display />
          </div>
          {step.exampleExplanation && (
            <p className="mt-2 text-xs leading-5 text-slate-600">{step.exampleExplanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiagramVisual({ diagram }: { diagram: Diagram }) {
  const showScene = diagram.layout !== "list";
  return (
    <div className="flex flex-col gap-5">
      {showScene && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4">
          {diagram.centerObject && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <IconRenderer name={diagram.centerObject.icon} size={30} className="text-slate-800" />
              </div>
              <span className="text-xs font-medium text-slate-700">{diagram.centerObject.label}</span>
            </div>
          )}
          {diagram.actors.length > 0 && diagram.centerObject && <div className="h-5 w-px bg-slate-300" />}
          <div className="flex flex-wrap items-start justify-center gap-4">
            {diagram.actors.map((actor, index) => (
              <div key={`${actor.label}-${index}`} className="flex w-20 flex-col items-center gap-1.5 text-center">
                <div className="rounded-lg bg-sky-50 p-2.5 ring-1 ring-sky-100">
                  <IconRenderer name={actor.icon} size={22} className="text-sky-700" />
                </div>
                <span className="text-xs font-semibold text-slate-800">{actor.label}</span>
                {actor.caption && <span className="text-[10px] leading-tight text-slate-500">{actor.caption}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {diagram.keyPoints.length > 0 && (
        <ul className="flex flex-col gap-2">
          {diagram.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PatternStructure({ topic }: { topic: TopicNote }) {
  const center = topic.diagram.centerObject?.label || topic.name;
  const nodes = topic.diagram.actors.length > 0
    ? topic.diagram.actors.map((actor) => ({
        label: actor.label,
        caption: actor.caption || "contributes to the topic",
      }))
    : topic.diagram.keyPoints.length > 0
      ? topic.diagram.keyPoints.map((point) => ({
          label: point,
          caption: "key point",
        }))
      : [{ label: topic.name, caption: topic.description }];
  const outcome = topic.diagram.keyPoints.at(-1) || topic.description;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-center">
      <p className="mb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
        {topic.diagram.title || "Visual structure"}
      </p>
      <div className="overflow-x-auto">
        <div className="mx-auto min-w-[360px] max-w-xl font-mono text-xs">
          <div className="mx-auto w-fit rounded-lg border border-sky-400/50 bg-sky-400/10 px-4 py-2 text-sky-200">
            * {center} *
          </div>
          <div className="leading-4 text-slate-500">
            <div>.................|.................</div>
            <div>.................*.................</div>
            <div>.................|.................</div>
          </div>
          <div className="flex flex-wrap items-start justify-center gap-2">
            {nodes.slice(0, 6).map((node, index) => (
              <div key={`${node.label}-${index}`} className="flex w-28 flex-col items-center">
                <div className="text-slate-500">{index % 2 === 1 ? "***" : "..."}</div>
                <div className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sky-100">
                  <div>* {node.label} *</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400">
                    {node.caption}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="leading-4 text-slate-500">
            <div>.................|.................</div>
            <div>.................*.................</div>
            <div>.................|.................</div>
          </div>
          <div className="mx-auto w-fit rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-emerald-200">
            * {outcome} *
          </div>
        </div>
      </div>
    </div>
  );
}

async function downloadNotes(topics: TopicNote[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const bottom = pageHeight - margin;
  let y = 20;

  const ensureSpace = (height: number) => {
    if (y + height > bottom) {
      doc.addPage();
      y = margin;
    }
  };
  const writeWrapped = (text: string, size: number, lineHeight: number) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(lines.length * lineHeight);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight;
  };

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  writeWrapped("Voice Agent Notes", 20, 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  writeWrapped(new Date().toLocaleDateString(), 9, 5);
  y += 5;

  topics.forEach((topic, index) => {
    ensureSpace(35);
    if (index > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    writeWrapped(topic.name, 15, 6.5);
    y += 1;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    writeWrapped(topic.description, 10.5, 5.2);
    y += 4;
    if (topic.formulaSteps.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      writeWrapped("Formulas and examples", 11, 5.5);
      topic.formulaSteps.forEach((step) => {
        y += 2;
        doc.setFont("helvetica", "bold");
        writeWrapped(step.title, 10.5, 5.2);
        doc.setFont("courier", "normal");
        writeWrapped(step.formula, 10, 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        writeWrapped(step.explanation, 9.5, 4.8);
        if (step.exampleFormula) {
          doc.setFont("courier", "normal");
          writeWrapped(`Example: ${step.exampleFormula}`, 9.5, 4.8);
          doc.setFont("helvetica", "normal");
        }
        if (step.exampleExplanation) writeWrapped(step.exampleExplanation, 9.5, 4.8);
      });
      y += 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    writeWrapped("Key points", 11, 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    topic.diagram.keyPoints.forEach((point) => writeWrapped(`- ${point}`, 10, 5));

    const relationship = [
      topic.diagram.centerObject?.label,
      ...topic.diagram.actors.map((actor) => actor.caption ? `${actor.label}: ${actor.caption}` : actor.label),
    ].filter(Boolean) as string[];
    if (relationship.length > 0) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      writeWrapped("Diagram", 11, 5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      writeWrapped(relationship.join("  ->  "), 10, 5);
    }
    y += 6;
  });
  doc.save("voice-agent-notes.pdf");
}

export function DiagramPanel({
  topics,
  questions = [],
}: {
  topics: TopicNote[];
  questions?: string[];
}) {
  const [questionsExpanded, setQuestionsExpanded] = useState(false);

  if (topics.length === 0 && questions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="text-sm text-slate-500">Ask a question out loud — your notes and diagrams will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Topic notes</h2>
          <p className="text-xs text-slate-500">{topics.length} {topics.length === 1 ? "topic" : "topics"}</p>
        </div>
        <button type="button" onClick={() => void downloadNotes(topics)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          <Download size={14} /> Download PDF
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="order-2 min-h-0 overflow-y-auto lg:order-1">
          <div className="flex flex-col gap-5">
            {topics.map((topic, index) => (
              <article key={`${topic.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-slate-900">{topic.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{topic.description}</p>
                </div>
                {topic.formulaSteps.length > 0 && (
                  <div className="mb-5 flex flex-col gap-3">
                    {topic.formulaSteps.map((step, stepIndex) => (
                      <FormulaCard key={`${step.title}-${stepIndex}`} step={step} index={stepIndex} />
                    ))}
                  </div>
                )}
                <div className="mb-5">
                  <PatternStructure topic={topic} />
                </div>
                <DiagramVisual diagram={topic.diagram} />
              </article>
            ))}
          </div>
        </div>

        {questions.length > 0 && (
          <aside className="order-1 min-h-0 lg:order-2">
            <section className="rounded-2xl border border-amber-100 bg-amber-50/70 lg:sticky lg:top-0">
            <button
              type="button"
              onClick={() => setQuestionsExpanded((expanded) => !expanded)}
              aria-expanded={questionsExpanded}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Questions asked
                </span>
                <span className="mt-1 block text-xs text-amber-800/70">
                  {questions.length} {questions.length === 1 ? "question" : "questions"}
                </span>
              </span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-amber-700 transition-transform ${
                  questionsExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {questionsExpanded && (
              <ol className="max-h-56 overflow-y-auto flex flex-col gap-2 border-t border-amber-100 px-4 pb-4 pt-3">
                {questions.map((question, index) => {
                  const cleanedQuestion = question.replace(/^\s*\d+[\s.)-]*/, "").trim();
                  return (
                    <li
                      key={`${question}-${index}`}
                      className="flex items-start gap-2 text-sm leading-5 text-slate-700"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                        {index + 1}
                      </span>
                      <span>{cleanedQuestion || question}</span>
                    </li>
                  );
                })}
              </ol>
            )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
