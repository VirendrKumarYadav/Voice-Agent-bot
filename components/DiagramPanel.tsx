import { ArrowRight, ChevronDown, Download, X } from "lucide-react";
import { useState } from "react";
import katex from "katex";
import { IconRenderer } from "./IconRenderer";
import type { Diagram, FormulaStep, IconName, TopicNote } from "@/lib/diagramSchema";

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

function FlowNode({
  label,
  caption,
  icon,
  tone,
}: {
  label: string;
  caption: string;
  icon: IconName;
  tone: "input" | "process" | "output";
}) {
  const toneClasses = {
    input: "border-sky-200 bg-sky-50 text-sky-900",
    process: "border-indigo-200 bg-indigo-50 text-indigo-950",
    output: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  const iconClasses = {
    input: "bg-white text-sky-700 ring-sky-200",
    process: "bg-white text-indigo-700 ring-indigo-200",
    output: "bg-white text-emerald-700 ring-emerald-200",
  };

  return (
    <div className={`w-44 shrink-0 rounded-2xl border p-3 shadow-sm ${toneClasses[tone]}`}>
      <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${iconClasses[tone]}`}>
        <IconRenderer name={icon} size={21} />
      </div>
      <p className="text-center text-xs font-bold">{label}</p>
      <p className="mt-1 text-center text-[11px] leading-4 opacity-70">{caption}</p>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 text-slate-400">
      <ArrowRight size={22} aria-hidden="true" />
      <span className="max-w-20 text-center text-[10px] leading-3">{label}</span>
    </div>
  );
}

function DataFlowDiagram({ topic }: { topic: TopicNote }) {
  const [flowExpanded, setFlowExpanded] = useState(true);
  const { diagram } = topic;
  const center = diagram.centerObject;
  const actors = diagram.actors.length > 0
    ? diagram.actors
    : diagram.keyPoints.map((point) => ({
        icon: "FileText" as const,
        label: point,
        caption: "important idea",
      }));
  const output = diagram.keyPoints.at(-1) || "Understanding";

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setFlowExpanded((expanded) => !expanded)}
        aria-expanded={flowExpanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data flow</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{diagram.title || topic.name}</p>
        </div>
        <span className="flex items-center gap-2">
          <span className="hidden rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200 sm:inline">
            input → process → output
          </span>
          <ChevronDown
            size={17}
            className={`text-slate-500 transition-transform ${flowExpanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {flowExpanded && (
        <div className="border-t border-slate-200 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
          {actors.slice(0, 6).map((actor, index) => (
            <div key={`${actor.label}-${index}`} className="flex items-center gap-3">
              <FlowNode
                label={actor.label}
                caption={actor.caption || "feeds information"}
                icon={actor.icon}
                tone="input"
              />
              {index < actors.slice(0, 6).length - 1 ? (
                <FlowArrow label="shares data" />
              ) : center ? (
                <FlowArrow label="sends data" />
              ) : null}
            </div>
          ))}
          {center && (
            <>
              <FlowNode
                label={center.label}
                caption="transforms the input"
                icon={center.icon}
                tone="process"
              />
              <FlowArrow label="produces result" />
            </>
          )}
          {!center && actors.length > 0 && <FlowArrow label="leads to" />}
          <FlowNode
            label={output}
            caption="what you understand"
            icon="CheckCircle"
            tone="output"
          />
          </div>
          <p className="text-center text-[11px] text-slate-500">
            Follow the arrows to see how information moves through this concept.
          </p>
        </div>
      )}
    </section>
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
  const [questionsOpen, setQuestionsOpen] = useState(false);

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
        <div className="flex items-center gap-2">
          {questions.length > 0 && (
            <button
              type="button"
              onClick={() => setQuestionsOpen(true)}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
            >
              Questions asked ({questions.length})
            </button>
          )}
          <button type="button" onClick={() => void downloadNotes(topics)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div>
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
                  <DataFlowDiagram topic={topic} />
                </div>
                <DiagramVisual diagram={topic.diagram} />
              </article>
            ))}
          </div>
        </div>
      </div>
      {questionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onClick={() => setQuestionsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="questions-dialog-title"
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-4">
              <div>
                <h3 id="questions-dialog-title" className="text-sm font-semibold text-amber-900">Questions asked</h3>
                <p className="mt-1 text-xs text-amber-800/70">{questions.length} {questions.length === 1 ? "question" : "questions"}</p>
              </div>
              <button type="button" onClick={() => setQuestionsOpen(false)} aria-label="Close questions" className="rounded-lg p-1.5 text-amber-700 transition hover:bg-amber-100">
                <X size={18} />
              </button>
            </div>
            <ol className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-5">
              {questions.map((question, index) => {
                const cleanedQuestion = question.replace(/^\s*\d+[\s.)-]*/, "").trim();
                return (
                  <li key={`${question}-${index}`} className="flex items-start gap-3 text-sm leading-5 text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">{index + 1}</span>
                    <span>{cleanedQuestion || question}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
