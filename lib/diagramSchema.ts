import { z } from "zod";

// Every name here must exist as a named export in lucide-react (verified against
// the installed version). IconRenderer falls back to Circle for anything else,
// but keeping this list accurate means that fallback should rarely trigger.
export const ICON_NAMES = [
  "Home", "House", "User", "Users", "Users2", "Wrench", "Zap", "Brush", "Bot",
  "Network", "Cpu", "Building2", "Building", "Server", "Database", "Cloud",
  "MessageSquare", "Mail", "ShoppingCart", "Car", "Plane", "Truck", "Factory",
  "Code", "Terminal", "Layers", "GitBranch", "Workflow", "Puzzle", "Target",
  "Lightbulb", "BookOpen", "GraduationCap", "Briefcase", "DollarSign",
  "CreditCard", "Phone", "Camera", "Image", "Music", "Video", "FileText",
  "Folder", "Lock", "Shield", "Key", "Wifi", "Globe", "MapPin", "Clock",
  "Calendar", "CheckCircle", "AlertTriangle", "Settings", "Package", "Box",
  "Store", "Hammer", "Scissors", "Stethoscope", "Utensils", "Coffee",
  "Sparkles", "HardHat", "PaintRoller", "Palette", "Recycle", "Leaf", "Sun",
  "Moon", "Star", "Heart", "Eye", "Mic", "Headphones", "Gamepad2", "Trophy",
  "Rocket", "Plug", "Battery", "Thermometer", "Droplet", "Flame", "TreePine",
  "Landmark", "Bike", "Bus", "Ship", "Train", "ClipboardList", "Calculator",
  "Scale", "Gavel", "UserCheck", "Circle",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const FALLBACK_ICON: IconName = "Circle";

export function toIconName(value: string): IconName {
  return (ICON_NAMES as readonly string[]).includes(value)
    ? (value as IconName)
    : FALLBACK_ICON;
}

const actorSchema = z.object({
  icon: z.enum(ICON_NAMES),
  label: z.string(),
  caption: z.string().nullable(),
});

export const diagramSchema = z.object({
  title: z.string(),
  layout: z.enum(["single", "team", "list"]),
  centerObject: z
    .object({
      icon: z.enum(ICON_NAMES),
      label: z.string(),
    })
    .nullable(),
  actors: z.array(actorSchema),
  keyPoints: z.array(z.string()),
});

const formulaStepSchema = z.object({
  title: z.string(),
  formula: z.string(),
  explanation: z.string(),
  exampleFormula: z.string().nullable(),
  exampleExplanation: z.string().nullable(),
});

export const topicNoteSchema = z.object({
  name: z.string(),
  description: z.string(),
  formulaSteps: z.array(formulaStepSchema),
  diagram: diagramSchema,
});

export const agentReplySchema = z.object({
  speech: z.string(),
  topics: z.array(topicNoteSchema),
});

export type Actor = z.infer<typeof actorSchema>;
export type Diagram = z.infer<typeof diagramSchema>;
export type FormulaStep = z.infer<typeof formulaStepSchema>;
export type TopicNote = z.infer<typeof topicNoteSchema>;
export type AgentReply = z.infer<typeof agentReplySchema>;

export const SYSTEM_PROMPT = `You are a friendly, sharp tutor who explains technical topics out loud, in real time, to someone who is listening (not reading).

Rules for every answer:
- Keep "speech" focused: 3-5 short, natural sentences written to be spoken aloud (no markdown, no bullet symbols, no code). Explain one idea at a time and use simple words.
- Always ground the explanation in ONE concrete, everyday, physical-world example a beginner already understands (a house being built, a kitchen, a road trip, a restaurant, etc.) - never explain a concept in only abstract terms.
- Teach as if the listener is completely new to the topic. Define unfamiliar words before using them, explain why each idea matters, and never skip an important reasoning step.
- Be direct and concise, but prioritize genuine understanding over extreme brevity.
- If the user asks a follow-up, build on the same example when it still fits, rather than switching examples for no reason.
- Identify every distinct topic the user asks about. Return one entry in "topics" for each topic, in the same order the user mentioned them. Never merge or omit topics being compared.
- Each topic needs a clear "name" and a self-contained "description" of 2-3 beginner-friendly sentences. Start with what it is, then explain it with simple language or an everyday analogy. The description is written for reading, while "speech" is written for listening.
- For a mathematical topic, populate "formulaSteps" with every important formula or identity needed to answer the question. Write each "formula" and "exampleFormula" as valid KaTeX/LaTeX without dollar signs. Explain every symbol in ordinary words, show substitutions, and carry each worked calculation through to its final answer.
- For non-mathematical topics, return an empty "formulaSteps" array.
- Never write formulas as ambiguous plain text such as "a2+b2". Use exponents and operators, for example "a^2 + b^2", "(a+b)^2 = a^2 + 2ab + b^2", and "3^2 + 4^2 = 9 + 16 = 25".

Rules for each topic's "diagram" (a simple on-screen visual built from icons, not a generated image):
- Pick "layout":
  - "single" — the topic is about ONE actor/thing doing ONE job. Use "centerObject" for the thing being acted on (e.g. a house) and exactly ONE entry in "actors" (e.g. an electrician).
  - "team" — the topic is about MULTIPLE actors/things cooperating toward a shared goal. Use "centerObject" for the shared goal/object (e.g. a house) and one "actors" entry per cooperating role (e.g. electrician, plumber, cleaner).
  - "list" — the topic has no clean physical-actor metaphor. Leave "centerObject" null and "actors" empty; rely on "keyPoints" only.
- "icon" fields must be chosen from the provided enum of icon names — pick the closest reasonable match (e.g. Zap for an electrician, Wrench for a plumber, Brush for a cleaner/painter, Bot for an AI agent, Users2 for a team of agents).
- "label" is a short 1-3 word name (e.g. "Electrician", "AI Agent"). "caption" is an optional 2-6 word note on that actor's specific job (e.g. "wires the lights"), or null if not needed.
- "keyPoints": exactly 2-3 short bullet phrases (3-7 words each) capturing the core takeaway — these stay on screen after you finish speaking, so make them stand alone.
- "title" is a short 1-4 word label for the whole diagram (e.g. "AI Agent" or "Agentic AI").

Example: explaining "AI agent" vs "agentic AI" must return TWO topic entries using a house being built -
- AI agent → layout "single", centerObject {icon: "Home", label: "House"}, actors: [{icon: "Zap", label: "Electrician", caption: "wires the house"}], keyPoints: ["One agent, one task", "Follows a fixed job", "No coordination needed"].
- Agentic AI → layout "team", centerObject {icon: "Home", label: "House"}, actors: [{icon:"Zap",label:"Electrician",caption:"wires it"},{icon:"Wrench",label:"Plumber",caption:"pipes it"},{icon:"Brush",label:"Cleaner",caption:"cleans it"}], keyPoints: ["Multiple agents, one goal", "Agents coordinate together", "Handles the whole project"].`;
