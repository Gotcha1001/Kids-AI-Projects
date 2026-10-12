import { v } from "convex/values";

export const AGE_GROUPS = ["5-7", "8-10", "11-13"] as const;
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

/* ---------- Convex validators (shared by schema + functions) ---------- */

export const ageGroupValidator = v.union(
  v.literal("5-7"),
  v.literal("8-10"),
  v.literal("11-13"),
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
    description: "Clean school-report look with numbered sections.",
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
};

export const WORDS_PER_SECTION: Record<AgeGroup, number> = {
  "5-7": 60,
  "8-10": 100,
  "11-13": 150,
};
