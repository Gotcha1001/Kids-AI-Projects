// Turns the raw text from the AI model into a typed, validated object.
// No `any` anywhere - everything is narrowed from `unknown`.

export interface GeneratedSection {
  heading: string;
  body: string;
  imageIndex?: number;
  sourceRefs: number[];
}

export interface GeneratedGlossaryItem {
  term: string;
  meaning: string;
}

export interface GeneratedContent {
  title: string;
  intro: string;
  sections: GeneratedSection[];
  funFacts: string[];
  glossary: GeneratedGlossaryItem[];
  summary: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asIntegerList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is number =>
      typeof item === "number" && Number.isInteger(item),
  );
}

/** Pulls the first {...} block out of the reply and parses it. */
export function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json|```/gi, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

/** If the model politely refused the topic it returns {"error": "..."}. */
export function readModelError(raw: string): string | null {
  const json = extractJson(raw);
  if (isRecord(json) && typeof json.error === "string" && json.error.trim()) {
    return json.error.trim();
  }
  return null;
}

export function parseGeneratedContent(raw: string): GeneratedContent | null {
  const json = extractJson(raw);
  if (!isRecord(json)) return null;

  const intro = asText(json.intro);
  const summary = asText(json.summary);
  if (!intro || !summary || !Array.isArray(json.sections)) return null;

  const sections: GeneratedSection[] = [];
  for (const item of json.sections) {
    if (!isRecord(item)) continue;
    const heading = asText(item.heading);
    const body = asText(item.body);
    if (!heading || !body) continue;
    const imageIndex =
      typeof item.imageIndex === "number" && Number.isInteger(item.imageIndex)
        ? item.imageIndex
        : undefined;
    sections.push({
      heading,
      body,
      imageIndex,
      sourceRefs: asIntegerList(item.sourceRefs),
    });
  }
  if (sections.length === 0) return null;

  const glossary: GeneratedGlossaryItem[] = [];
  if (Array.isArray(json.glossary)) {
    for (const item of json.glossary) {
      if (!isRecord(item)) continue;
      const term = asText(item.term);
      const meaning = asText(item.meaning);
      if (term && meaning) glossary.push({ term, meaning });
    }
  }

  return {
    title: asText(json.title),
    intro,
    sections,
    funFacts: asTextList(json.funFacts),
    glossary,
    summary,
  };
}
