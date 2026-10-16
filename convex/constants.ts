import { v } from "convex/values";

export const AGE_GROUPS = ["5-7", "8-10", "11-13", "university"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const TEMPLATE_IDS = [
  "classic",
  "factfile",
  "storybook",
  "timeline",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const PROJECT_STATUSES = [
  "queued",
  "researching",
  "writing",
  "done",
  "failed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MIN_SECTIONS = 3;
export const MAX_SECTIONS = 6;
export const MAX_PROJECTS_PER_DAY = 15;

/**
 * Generation watchdog. generateProject has its own hard time budget
 * (see generate.ts). If the action is ever killed or never starts, the
 * watchdog fails the project so the UI can never spin forever.
 * Rule: WATCHDOG_DELAY_MS must be larger than STALE_MS + the action budget.
 */
export const STALE_MS = 4 * 60 * 1000; // no progress for this long = stuck
export const WATCHDOG_DELAY_MS = 6 * 60 * 1000; // when failIfStuck runs

/* ---------- Convex validators (shared by schema + functions) ---------- */

export const ageGroupValidator = v.union(
  v.literal("5-7"),
  v.literal("8-10"),
  v.literal("11-13"),
  v.literal("university"),
);

export const templateValidator = v.union(
  v.literal("classic"),
  v.literal("factfile"),
  v.literal("storybook"),
  v.literal("timeline"),
);

export const statusValidator = v.union(
  v.literal("queued"),
  v.literal("researching"),
  v.literal("writing"),
  v.literal("done"),
  v.literal("failed"),
);

export const sectionValidator = v.object({
  heading: v.string(),
  body: v.string(), // paragraphs separated by a blank line
  imageIndex: v.optional(v.number()), // index into project.images
  sourceRefs: v.array(v.number()), // 1-based index into project.sources
});

export const imageValidator = v.object({
  url: v.string(),
  caption: v.string(),
  pdfSafe: v.boolean(), // jpg/png only - react-pdf cannot draw webp
});

export const sourceValidator = v.object({
  title: v.string(),
  url: v.string(),
});

export const glossaryValidator = v.object({
  term: v.string(),
  meaning: v.string(),
});

/* ---------- Templates (layout only - content is the same for all) ---------- */

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  emoji: string;
  description: string;
  bestFor: string;
  accent: string; // hex, used by web preview AND pdf
  accentSoft: string;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic: {
    id: "classic",
    name: "Classic Report",
    emoji: "📘",
    description: "Clean report look with numbered sections.",
    bestFor: "Any topic",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
  },
  factfile: {
    id: "factfile",
    name: "Fact File",
    emoji: "🔎",
    description: "Bright 'Did you know?' boxes right after the introduction.",
    bestFor: "Animals and science",
    accent: "#059669",
    accentSoft: "#d1fae5",
  },
  storybook: {
    id: "storybook",
    name: "Storybook",
    emoji: "🎨",
    description: "Big pictures, big friendly text, one section per page.",
    bestFor: "Younger kids",
    accent: "#d97706",
    accentSoft: "#fef3c7",
  },
  timeline: {
    id: "timeline",
    name: "Timeline",
    emoji: "⏳",
    description: "Sections sit along a line, one step after another.",
    bestFor: "History topics",
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
  },
};

export const TEMPLATE_LIST: TemplateMeta[] = TEMPLATE_IDS.map(
  (id) => TEMPLATES[id],
);

/* ---------- Prompt helpers ---------- */

export const AGE_GUIDE: Record<AgeGroup, string> = {
  "5-7":
    "Use very short sentences (about 12 words or fewer), simple everyday words and a warm, playful tone. Explain any big word straight away.",
  "8-10":
    "Use clear sentences and a friendly tone. Give one or two interesting facts per paragraph and briefly explain tricky words.",
  "11-13":
    "Use richer vocabulary, explain causes and effects, and include dates and context where the sources support them. Keep it engaging.",
  university:
    "Write in a clear, formal academic tone with precise terminology. Analyse causes, context and competing perspectives, include dates, names and figures where the sources support them, and define specialist terms on first use.",
};

export const WORDS_PER_SECTION: Record<AgeGroup, number> = {
  "5-7": 60,
  "8-10": 100,
  "11-13": 150,
  university: 250,
};

/**
 * Who the writer is talking to. Used in the AI prompt so it never says
 * things like "a child aged university".
 */
export const AUDIENCE: Record<AgeGroup, string> = {
  "5-7": "a child aged 5 to 7",
  "8-10": "a child aged 8 to 10",
  "11-13": "a child aged 11 to 13",
  university: "a university or college student",
};

/** True for the child reading levels (drives child-safe wording and search). */
export function isYoungAudience(age: AgeGroup): boolean {
  return age !== "university";
}
