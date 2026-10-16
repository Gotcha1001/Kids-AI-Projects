// lib/types.ts - client-side types derived from Convex (no hand-written duplicates, no `any`)
import type { Infer } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  TEMPLATE_IDS,
  type AgeGroup,
  type ProjectStatus,
  type TemplateId,
  glossaryValidator,
  imageValidator,
  sectionValidator,
  sourceValidator,
} from "@/convex/constants";

export type ProjectDoc = Doc<"projects">;
export type ProjectListItem = FunctionReturnType<
  typeof api.projects.list
>[number];

export type ProjectSection = Infer<typeof sectionValidator>;
export type ProjectImage = Infer<typeof imageValidator>;
export type ProjectSource = Infer<typeof sourceValidator>;
export type GlossaryEntry = Infer<typeof glossaryValidator>;

/** A finished project with every content field guaranteed to exist. */
export interface ProjectView {
  title: string;
  topic: string;
  ageGroup: AgeGroup;
  template: TemplateId;
  studentName?: string;
  intro: string;
  sections: ProjectSection[];
  funFacts: string[];
  glossary: GlossaryEntry[];
  summary: string;
  images: ProjectImage[];
  sources: ProjectSource[];
  createdAt: number;
}

export function toProjectView(p: ProjectDoc): ProjectView | null {
  if (
    p.status !== "done" ||
    !p.intro ||
    !p.summary ||
    !p.sections ||
    p.sections.length === 0
  ) {
    return null;
  }
  return {
    title: p.title,
    topic: p.topic,
    ageGroup: p.ageGroup,
    template: p.template,
    studentName: p.studentName,
    intro: p.intro,
    sections: p.sections,
    funFacts: p.funFacts ?? [],
    glossary: p.glossary ?? [],
    summary: p.summary,
    images: p.images,
    sources: p.sources,
    createdAt: p.createdAt,
  };
}

export function isTemplateId(value: string | undefined): value is TemplateId {
  return (
    value !== undefined && (TEMPLATE_IDS as readonly string[]).includes(value)
  );
}

export const AGE_LABELS: Record<
  AgeGroup,
  { label: string; hint: string; emoji: string }
> = {
  "5-7": { label: "Ages 5–7", hint: "Short and simple", emoji: "🐣" },
  "8-10": { label: "Ages 8–10", hint: "Fun and clear", emoji: "🚀" },
  "11-13": { label: "Ages 11–13", hint: "More detail", emoji: "🔭" },
  university: {
    label: "University & up",
    hint: "Academic and detailed",
    emoji: "🎓",
  },
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  queued: "Starting",
  researching: "Researching",
  writing: "Writing",
  done: "Ready",
  failed: "Needs a retry",
};

export function isInProgress(status: ProjectStatus): boolean {
  return (
    status === "queued" || status === "researching" || status === "writing"
  );
}
