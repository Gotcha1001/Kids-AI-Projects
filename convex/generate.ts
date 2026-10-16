// import { v } from "convex/values";
// import { internalAction } from "./_generated/server";
// import { internal } from "./_generated/api";
// import {
//   AGE_GUIDE,
//   AUDIENCE,
//   MIN_SECTIONS,
//   WORDS_PER_SECTION,
//   isYoungAudience,
//   type AgeGroup,
// } from "./constants";
// import {
//   parseGeneratedContent,
//   readModelError,
//   type GeneratedContent,
// } from "./parse";
// import { researchTopic, type ResearchResult } from "./research";

// const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// // Tried IN ORDER, one HTTP request per model, each with its own timeout.
// // The first one is the model that produced a project in testing.
// // Free slugs churn constantly - if they all fail, check
// // https://openrouter.ai/collections/free-models and override with:
// //   npx convex env set OPENROUTER_MODELS "slugA,slugB,slugC"
// const DEFAULT_MODELS: readonly string[] = [
//   "nvidia/nemotron-3-super-120b-a12b:free", // worked in testing (can be slow)
//   "google/gemma-4-31b-it:free", // fast instruct model, good at JSON
//   "google/gemma-4-26b-a4b-it:free", // extra fallback
//   "nvidia/nemotron-3.5-lightning:free", // extra fallback
// ];
// const MAX_MODELS = 5;
// const MAX_PASSES = 2; // go through the whole list twice if everything is busy

// // Hard limits so the action ALWAYS finishes (or fails cleanly) in time.
// // STALE_MS (4 min) + this budget must stay below WATCHDOG_DELAY_MS (6 min).
// const MODEL_TIMEOUT_MS = 100_000; // one HTTP call to ONE model (was 60s)
// const GENERATION_BUDGET_MS = 5 * 60 * 1000; // whole action, start to finish
// const MIN_CALL_WINDOW_MS = 10_000; // don't start a call with less time left

// /** Errors whose message is safe to show to the person using the app. */
// class GenerationError extends Error {}

// interface OpenRouterResponse {
//   choices?: { message?: { content?: string | null } }[];
//   error?: { message?: string; code?: number };
// }

// function sleep(ms: number): Promise<void> {
//   return new Promise<void>((resolve) => setTimeout(resolve, ms));
// }

// function toTitleCase(text: string): string {
//   return text.replace(/\b\w/g, (c) => c.toUpperCase());
// }

// /* -------------------------------- prompt ------------------------------- */

// function buildPrompt(
//   topic: string,
//   ageGroup: AgeGroup,
//   sectionCount: number,
//   research: ResearchResult,
// ): string {
//   const young = isYoungAudience(ageGroup);

//   const sourceList = research.sources
//     .map(
//       (s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.snippet.slice(0, 700)}`,
//     )
//     .join("\n\n");

//   const imageList = research.images.length
//     ? research.images.map((img, i) => `[${i}] ${img.caption}`).join("\n")
//     : "(no pictures available)";

//   const intro = young
//     ? "You are a friendly, accurate educational writer"
//     : "You are an accurate, well-organised academic writer";

//   const abbreviationNote = young
//     ? `(If the topic uses abbreviations like "SA", assume the most likely child-friendly meaning, e.g. South Africa.)`
//     : `(If the topic uses abbreviations like "SA", assume the most likely meaning, e.g. South Africa.)`;

//   const safetyRules = young
//     ? `- Everything must be safe and appropriate for children. For difficult history (apartheid, war, slavery) be honest, calm and age-appropriate, with no graphic detail.
// - If the topic is unsuitable for children or cannot be written safely, reply with ONLY {"error": "a short, kind explanation"}.`
//     : `- Treat difficult topics (apartheid, war, slavery) directly, factually and respectfully, without sensationalism or graphic detail.
// - If the topic cannot be written about safely, reply with ONLY {"error": "a short, clear explanation"}.`;

//   const titleHint = young ? "short, fun title" : "clear, descriptive title";
//   const introHint = young
//     ? "an introduction of 2 short paragraphs"
//     : "an introduction of 2 paragraphs that set out the context and scope of the topic";
//   const factsHint = young
//     ? "3 to 5 short 'Did you know?' facts"
//     : "3 to 5 short key facts or notable points";
//   const summaryHint = young
//     ? "a wrap-up paragraph that recaps the key ideas"
//     : "a concluding paragraph that synthesises the key ideas";
//   const glossaryRule = young
//     ? "Include 3 to 5 glossary terms."
//     : "Include 3 to 5 glossary terms covering the key specialist vocabulary.";

//   return `${intro} helping ${AUDIENCE[ageGroup]} with a project.

// TOPIC: ${topic}
// ${abbreviationNote}

// RULES
// - Use ONLY facts supported by the SOURCES below. Never invent facts, dates, numbers, names or quotes. If the sources are thin, stay general instead of guessing.
// - ${AGE_GUIDE[ageGroup]}
// - Write exactly ${sectionCount} sections of about ${WORDS_PER_SECTION[ageGroup]} words each. Paragraphs inside "body" are separated by a blank line.
// ${safetyRules}
// - "imageIndex" is the 0-based number of the picture that best fits that section. Use each picture at most once. Omit imageIndex if none fits.
// - "sourceRefs" lists the 1-based numbers of the sources you used for that section.
// - Reply with ONE JSON object only: no markdown, no commentary.

// JSON SHAPE
// {
//   "title": "${titleHint}",
//   "intro": "${introHint}",
//   "sections": [
//     { "heading": "...", "body": "...", "imageIndex": 0, "sourceRefs": [1, 2] }
//   ],
//   "funFacts": ["${factsHint}"],
//   "glossary": [{ "term": "...", "meaning": "..." }],
//   "summary": "${summaryHint}"
// }
// ${glossaryRule}

// SOURCES
// ${sourceList}

// PICTURES
// ${imageList}`;
// }

// /* ------------------------------ OpenRouter ----------------------------- */

// type FailureReason =
//   | "timeout"
//   | "rate_limited"
//   | "gone" // 404/403: slug removed or restricted - never retried
//   | "error"
//   | "unparseable";

// type ModelResult =
//   | { ok: true; text: string }
//   | { ok: false; reason: FailureReason };

// function getModels(): string[] {
//   const fromEnv = (process.env.OPENROUTER_MODELS ?? "")
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
//   const list = fromEnv.length > 0 ? fromEnv : [...DEFAULT_MODELS];
//   return Array.from(new Set(list)).slice(0, MAX_MODELS);
// }

// /** ONE request to ONE model, with its own timeout. Never hangs. */
// async function callOneModel(
//   apiKey: string,
//   model: string,
//   prompt: string,
//   deadline: number,
// ): Promise<ModelResult> {
//   const startedAt = Date.now();
//   const remaining = deadline - startedAt;
//   const timeoutMs = Math.min(MODEL_TIMEOUT_MS, Math.max(remaining, 1_000));
//   const controller = new AbortController();
//   const timer = setTimeout(() => controller.abort(), timeoutMs);
//   console.log("[generate] calling model", {
//     model,
//     timeoutSec: Math.round(timeoutMs / 1000),
//     budgetLeftSec: Math.round(remaining / 1000),
//     promptChars: prompt.length,
//   });
//   try {
//     const res = await fetch(OPENROUTER_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model,
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.4,
//         max_tokens: 4000,
//       }),
//       signal: controller.signal,
//     });
//     console.log("[generate] model responded", {
//       model,
//       status: res.status,
//       afterMs: Date.now() - startedAt,
//     });

//     if (res.status === 401) {
//       console.error("[generate] OpenRouter rejected the API key (401)");
//       throw new GenerationError(
//         "The app isn't set up for writing yet. Please tell the person in charge of this app.",
//       );
//     }
//     if (res.status === 429) {
//       console.error("[generate] model rate limited (429)", { model });
//       return { ok: false, reason: "rate_limited" };
//     }
//     if (!res.ok) {
//       // 404 = slug no longer free / removed, 403 = restricted, 5xx = host down
//       const body = await res.text().catch(() => "");
//       console.error("[generate] model failed", {
//         model,
//         status: res.status,
//         body: body.slice(0, 300),
//       });
//       return {
//         ok: false,
//         reason: res.status === 404 || res.status === 403 ? "gone" : "error",
//       };
//     }

//     // Body is read INSIDE the timeout window (timer cleared in finally)
//     console.log("[generate] waiting for model body…", { model });
//     const json = (await res.json()) as OpenRouterResponse;
//     if (json.error?.message) {
//       console.error("[generate] model payload error", {
//         model,
//         error: json.error,
//       });
//       return {
//         ok: false,
//         reason: json.error.code === 429 ? "rate_limited" : "error",
//       };
//     }
//     const text = json.choices?.[0]?.message?.content;
//     if (typeof text === "string" && text.trim()) {
//       console.log("[generate] model body received", {
//         model,
//         chars: text.length,
//         totalMs: Date.now() - startedAt,
//       });
//       return { ok: true, text };
//     }
//     console.error("[generate] model returned empty content", { model });
//     return { ok: false, reason: "error" };
//   } catch (e) {
//     if (e instanceof GenerationError) throw e;
//     console.error("[generate] model call failed or timed out", {
//       model,
//       timedOut: controller.signal.aborted,
//       afterMs: Date.now() - startedAt,
//       e,
//     });
//     return { ok: false, reason: "timeout" };
//   } finally {
//     clearTimeout(timer);
//   }
// }

// /**
//  * Tries each model in order until one returns valid project JSON.
//  * A model that times out, is rate limited, is gone (404/403) or returns junk
//  * simply hands over to the next one.
//  */
// async function generateWithFallback(
//   apiKey: string,
//   models: string[],
//   prompt: string,
//   deadline: number,
// ): Promise<GeneratedContent> {
//   const failures: FailureReason[] = [];
//   const history: { model: string; pass: number; outcome: string }[] = [];
//   const gone = new Set<string>(); // dead slugs - skipped on later passes
//   let outOfTime = false;

//   passes: for (let pass = 0; pass < MAX_PASSES; pass++) {
//     if (pass > 0) {
//       console.log("[generate] starting pass", pass + 1, "after a short wait");
//       await sleep(4_000);
//     }
//     for (const model of models) {
//       if (gone.has(model)) continue;
//       if (deadline - Date.now() < MIN_CALL_WINDOW_MS) {
//         outOfTime = true;
//         console.error("[generate] out of time budget");
//         break passes;
//       }
//       console.log("[generate] trying model", { model, pass });
//       const result = await callOneModel(apiKey, model, prompt, deadline);
//       if (!result.ok) {
//         failures.push(result.reason);
//         history.push({ model, pass, outcome: result.reason });
//         if (result.reason === "gone") {
//           gone.add(model);
//           console.error(
//             "[generate] slug unavailable - update OPENROUTER_MODELS:",
//             model,
//           );
//         }
//         continue;
//       }
//       const refusal = readModelError(result.text);
//       if (refusal) throw new GenerationError(refusal);
//       const parsed = parseGeneratedContent(result.text);
//       if (parsed && parsed.sections.length >= MIN_SECTIONS) {
//         console.log("[generate] model succeeded", { model, pass });
//         return parsed;
//       }
//       console.error("[generate] could not parse model output", {
//         model,
//         preview: result.text.slice(0, 300),
//       });
//       failures.push("unparseable");
//       history.push({ model, pass, outcome: "unparseable" });
//     }
//   }

//   console.error("[generate] ALL MODELS FAILED", { history, outOfTime });

//   const allBusy =
//     failures.length > 0 && failures.every((f) => f === "rate_limited");
//   throw new GenerationError(
//     allBusy
//       ? "The free writing helpers are very busy right now. Please try again in a minute."
//       : outOfTime || failures.includes("timeout")
//         ? "The writing helper took too long. Please try again."
//         : failures.includes("unparseable")
//           ? "The writing helper got muddled. Please press try again."
//           : "The writing helper didn't answer. Please try again.",
//   );
// }

// /* ------------------------------ post-process --------------------------- */

// interface FinalSection {
//   heading: string;
//   body: string;
//   imageIndex?: number;
//   sourceRefs: number[];
// }

// function finalizeSections(
//   content: GeneratedContent,
//   research: ResearchResult,
//   sectionCount: number,
// ): FinalSection[] {
//   const imageCount = research.images.length;
//   const sourceCount = research.sources.length;
//   const used = new Set<number>();

//   const base = content.sections.slice(0, sectionCount).map((section) => {
//     let imageIndex = section.imageIndex;
//     if (
//       imageIndex !== undefined &&
//       (imageIndex < 0 || imageIndex >= imageCount || used.has(imageIndex))
//     ) {
//       imageIndex = undefined;
//     }
//     if (imageIndex !== undefined) used.add(imageIndex);
//     const sourceRefs = Array.from(
//       new Set(section.sourceRefs.filter((n) => n >= 1 && n <= sourceCount)),
//     );
//     return {
//       heading: section.heading,
//       body: section.body,
//       imageIndex,
//       sourceRefs,
//     };
//   });

//   // Give picture-less sections an unused picture so every page looks finished
//   return base.map((section): FinalSection => {
//     let imageIndex = section.imageIndex;
//     if (imageIndex === undefined) {
//       for (let i = 0; i < imageCount; i++) {
//         if (!used.has(i)) {
//           imageIndex = i;
//           used.add(i);
//           break;
//         }
//       }
//     }
//     return {
//       heading: section.heading,
//       body: section.body,
//       sourceRefs: section.sourceRefs,
//       ...(imageIndex !== undefined ? { imageIndex } : {}),
//     };
//   });
// }

// /* --------------------------------- action ------------------------------ */

// export const generateProject = internalAction({
//   args: { projectId: v.id("projects") },
//   handler: async (ctx, { projectId }) => {
//     const project = await ctx.runQuery(internal.projectsData.getForGeneration, {
//       projectId,
//     });
//     if (!project) return; // deleted before we started

//     const startedAt = Date.now();
//     const deadline = startedAt + GENERATION_BUDGET_MS;
//     console.log("[generate] start", {
//       projectId,
//       topic: project.topic,
//       ageGroup: project.ageGroup,
//     });

//     try {
//       const openRouterKey = process.env.OPENROUTER_API_KEY;
//       if (!openRouterKey) {
//         console.error(
//           "[generate] OPENROUTER_API_KEY missing. Run: npx convex env set OPENROUTER_API_KEY <key>",
//         );
//         throw new GenerationError(
//           "The app isn't set up for writing yet. Please tell the person in charge of this app.",
//         );
//       }

//       // 1) Research
//       await ctx.runMutation(internal.projectsData.setStatus, {
//         projectId,
//         status: "researching",
//         statusMessage: "Searching for facts and pictures…",
//       });
//       console.log("[generate] researching…", {
//         hasTavilyKey: Boolean(process.env.TAVILY_API_KEY),
//         hasSerpKey: Boolean(process.env.SERPAPI_API_KEY),
//       });
//       const research = await researchTopic(
//         project.topic,
//         {
//           tavily: process.env.TAVILY_API_KEY,
//           serpapi: process.env.SERPAPI_API_KEY,
//         },
//         project.ageGroup,
//       );
//       console.log("[generate] research done", {
//         sources: research.sources.length,
//         images: research.images.length,
//         elapsedSec: Math.round((Date.now() - startedAt) / 1000),
//       });
//       if (research.sources.length === 0) {
//         throw new GenerationError(
//           "We couldn't find good, reliable pages about that topic. Try different words, like a more specific topic.",
//         );
//       }

//       // 2) Write
//       await ctx.runMutation(internal.projectsData.setStatus, {
//         projectId,
//         status: "writing",
//         statusMessage: "Writing your project…",
//       });
//       const prompt = buildPrompt(
//         project.topic,
//         project.ageGroup,
//         project.sectionCount,
//         research,
//       );
//       const models = getModels();
//       console.log("[generate] models in order:", models);
//       const content = await generateWithFallback(
//         openRouterKey,
//         models,
//         prompt,
//         deadline,
//       );

//       // 3) Save
//       console.log("[generate] saving project", projectId);
//       await ctx.runMutation(internal.projectsData.finish, {
//         projectId,
//         title: content.title || toTitleCase(project.topic),
//         intro: content.intro,
//         sections: finalizeSections(content, research, project.sectionCount),
//         funFacts: content.funFacts.slice(0, 5),
//         glossary: content.glossary.slice(0, 5),
//         summary: content.summary,
//         images: research.images,
//         sources: research.sources.map((s) => ({ title: s.title, url: s.url })),
//       });
//       console.log("[generate] done", {
//         projectId,
//         totalSec: Math.round((Date.now() - startedAt) / 1000),
//       });
//     } catch (e) {
//       console.error("[generate] failed:", e);
//       const message =
//         e instanceof GenerationError
//           ? e.message
//           : "Something went wrong while building your project. Please try again.";
//       await ctx.runMutation(internal.projectsData.fail, {
//         projectId,
//         errorMessage: message,
//       });
//     }
//   },
// });
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  AGE_GUIDE,
  AUDIENCE,
  MIN_SECTIONS,
  WORDS_PER_SECTION,
  isYoungAudience,
  type AgeGroup,
} from "./constants";
import {
  parseGeneratedContent,
  readModelError,
  type GeneratedContent,
} from "./parse";
import { researchTopic, type ResearchResult } from "./research";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
// Google Gemini is tried FIRST; OpenRouter's free models are the backup.
// Override with: npx convex env set GEMINI_MODEL <model-id>
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
// Tried IN ORDER, one HTTP request per model, each with its own timeout.
// The first one is the model that produced a project in testing.
// Free slugs churn constantly - if they all fail, check
// https://openrouter.ai/collections/free-models and override with:
//   npx convex env set OPENROUTER_MODELS "slugA,slugB,slugC"
const DEFAULT_MODELS: readonly string[] = [
  "nvidia/nemotron-3-super-120b-a12b:free", // worked in testing (can be slow)
  "google/gemma-4-31b-it:free", // fast instruct model, good at JSON
  "google/gemma-4-26b-a4b-it:free", // extra fallback
  "nvidia/nemotron-3.5-lightning:free", // extra fallback
];
const MAX_MODELS = 5;
const MAX_PASSES = 2; // go through the whole list twice if everything is busy
// Hard limits so the action ALWAYS finishes (or fails cleanly) in time.
// STALE_MS (4 min) + this budget must stay below WATCHDOG_DELAY_MS (6 min).
const MODEL_TIMEOUT_MS = 100_000; // one HTTP call to ONE model (was 60s)
const GENERATION_BUDGET_MS = 5 * 60 * 1000; // whole action, start to finish
const MIN_CALL_WINDOW_MS = 10_000; // don't start a call with less time left

/** Errors whose message is safe to show to the person using the app. */
class GenerationError extends Error {}

interface OpenRouterResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string; code?: number };
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function toTitleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}
/* -------------------------------- prompt ------------------------------- */

function buildPrompt(
  topic: string,
  ageGroup: AgeGroup,
  sectionCount: number,
  research: ResearchResult,
): string {
  const young = isYoungAudience(ageGroup);
  const sourceList = research.sources
    .map(
      (s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.snippet.slice(0, 700)}`,
    )
    .join("\n\n");
  const imageList = research.images.length
    ? research.images.map((img, i) => `[${i}] ${img.caption}`).join("\n")
    : "(no pictures available)";
  const intro = young
    ? "You are a friendly, accurate educational writer"
    : "You are an accurate, well-organised academic writer";
  const abbreviationNote = young
    ? `(If the topic uses abbreviations like "SA", assume the most likely child-friendly meaning, e.g. South Africa.)`
    : `(If the topic uses abbreviations like "SA", assume the most likely meaning, e.g. South Africa.)`;
  const safetyRules = young
    ? `- Everything must be safe and appropriate for children. For difficult history (apartheid, war, slavery) be honest, calm and age-appropriate, with no graphic detail.
- If the topic is unsuitable for children or cannot be written safely, reply with ONLY {"error": "a short, kind explanation"}.`
    : `- Treat difficult topics (apartheid, war, slavery) directly, factually and respectfully, without sensationalism or graphic detail.
- If the topic cannot be written about safely, reply with ONLY {"error": "a short, clear explanation"}.`;
  const titleHint = young ? "short, fun title" : "clear, descriptive title";
  const introHint = young
    ? "an introduction of 2 short paragraphs"
    : "an introduction of 2 paragraphs that set out the context and scope of the topic";
  const factsHint = young
    ? "3 to 5 short 'Did you know?' facts"
    : "3 to 5 short key facts or notable points";
  const summaryHint = young
    ? "a wrap-up paragraph that recaps the key ideas"
    : "a concluding paragraph that synthesises the key ideas";
  const glossaryRule = young
    ? "Include 3 to 5 glossary terms."
    : "Include 3 to 5 glossary terms covering the key specialist vocabulary.";
  return `${intro} helping ${AUDIENCE[ageGroup]} with a project.
TOPIC: ${topic}
${abbreviationNote}
RULES
- Use ONLY facts supported by the SOURCES below. Never invent facts, dates, numbers, names or quotes. If the sources are thin, stay general instead of guessing.
- ${AGE_GUIDE[ageGroup]}
- Write exactly ${sectionCount} sections of about ${WORDS_PER_SECTION[ageGroup]} words each. Paragraphs inside "body" are separated by a blank line.
${safetyRules}
- "imageIndex" is the 0-based number of the picture that best fits that section. Use each picture at most once. Omit imageIndex if none fits.
- "sourceRefs" lists the 1-based numbers of the sources you used for that section.
- Reply with ONE JSON object only: no markdown, no commentary.
JSON SHAPE
{
  "title": "${titleHint}",
  "intro": "${introHint}",
  "sections": [
    { "heading": "...", "body": "...", "imageIndex": 0, "sourceRefs": [1, 2] }
  ],
  "funFacts": ["${factsHint}"],
  "glossary": [{ "term": "...", "meaning": "..." }],
  "summary": "${summaryHint}"
}
${glossaryRule}
SOURCES
${sourceList}
PICTURES
${imageList}`;
}
/* ------------------------------ OpenRouter ----------------------------- */

type FailureReason =
  | "timeout"
  | "rate_limited"
  | "gone" // 404: model removed - never retried
  | "auth" // bad/missing key for that provider - skipped, never retried
  | "error"
  | "unparseable";

type Provider = "openrouter" | "gemini";

interface Attempt {
  provider: Provider;
  model: string;
}

interface Keys {
  openrouter?: string;
  gemini?: string;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
}

type ModelResult =
  | { ok: true; text: string }
  | { ok: false; reason: FailureReason };

function getModels(): string[] {
  const fromEnv = (process.env.OPENROUTER_MODELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const list = fromEnv.length > 0 ? fromEnv : [...DEFAULT_MODELS];
  return Array.from(new Set(list)).slice(0, MAX_MODELS);
}
/** Gemini first, then the OpenRouter models as backup. */
function getAttempts(keys: Keys): Attempt[] {
  const attempts: Attempt[] = [];
  if (!keys.gemini) {
    console.warn(
      "[generate] GEMINI_API_KEY is not set in this Convex deployment, so Gemini is SKIPPED. Run: npx convex env set GEMINI_API_KEY <key>",
    );
  }
  if (keys.gemini) {
    attempts.push({
      provider: "gemini",
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    });
  }
  if (keys.openrouter) {
    for (const model of getModels()) {
      attempts.push({ provider: "openrouter", model });
    }
  }
  return attempts;
}

/** ONE request to ONE model, with its own timeout. Never hangs. */

async function callOneModel(
  apiKey: string,
  model: string,
  prompt: string,
  deadline: number,
): Promise<ModelResult> {
  const startedAt = Date.now();
  const remaining = deadline - startedAt;
  const timeoutMs = Math.min(MODEL_TIMEOUT_MS, Math.max(remaining, 1_000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  console.log("[generate] calling model", {
    model,
    timeoutSec: Math.round(timeoutMs / 1000),
    budgetLeftSec: Math.round(remaining / 1000),
    promptChars: prompt.length,
  });
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });
    console.log("[generate] model responded", {
      model,
      status: res.status,
      afterMs: Date.now() - startedAt,
    });
    if (res.status === 401) {
      console.error("[generate] OpenRouter rejected the API key (401)");
      return { ok: false, reason: "auth" };
    }
    if (res.status === 429) {
      console.error("[generate] model rate limited (429)", { model });
      return { ok: false, reason: "rate_limited" };
    }
    if (!res.ok) {
      // 404 = slug no longer free / removed, 403 = restricted, 5xx = host down
      const body = await res.text().catch(() => "");
      console.error("[generate] model failed", {
        model,
        status: res.status,
        body: body.slice(0, 300),
      });
      return {
        ok: false,
        reason: res.status === 404 || res.status === 403 ? "gone" : "error",
      };
    }
    // Body is read INSIDE the timeout window (timer cleared in finally)
    console.log("[generate] waiting for model body…", { model });
    const json = (await res.json()) as OpenRouterResponse;
    if (json.error?.message) {
      console.error("[generate] model payload error", {
        model,
        error: json.error,
      });
      return {
        ok: false,
        reason: json.error.code === 429 ? "rate_limited" : "error",
      };
    }
    const text = json.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      console.log("[generate] model body received", {
        model,
        chars: text.length,
        totalMs: Date.now() - startedAt,
      });
      return { ok: true, text };
    }
    console.error("[generate] model returned empty content", { model });
    return { ok: false, reason: "error" };
  } catch (e) {
    if (e instanceof GenerationError) throw e;
    console.error("[generate] model call failed or timed out", {
      model,
      timedOut: controller.signal.aborted,
      afterMs: Date.now() - startedAt,
      e,
    });
    return { ok: false, reason: "timeout" };
  } finally {
    clearTimeout(timer);
  }
}
/** ONE request to Gemini (REST), with its own timeout. Never hangs. */

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  deadline: number,
): Promise<ModelResult> {
  const startedAt = Date.now();
  const remaining = deadline - startedAt;
  const timeoutMs = Math.min(MODEL_TIMEOUT_MS, Math.max(remaining, 1_000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  console.log("[generate] calling gemini", {
    model,
    timeoutSec: Math.round(timeoutMs / 1000),
    budgetLeftSec: Math.round(remaining / 1000),
    promptChars: prompt.length,
  });

  try {
    const res = await fetch(
      `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            // thinking tokens count toward this on 2.5 models, so leave headroom
            maxOutputTokens: 8192,
            // the prompt asks for ONE JSON object
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      },
    );

    console.log("[generate] gemini responded", {
      model,
      status: res.status,
      afterMs: Date.now() - startedAt,
    });

    if (res.status === 429) {
      console.error("[generate] gemini rate limited (429)", { model });
      return { ok: false, reason: "rate_limited" };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      // invalid/restricted key (Google returns 400 API_KEY_INVALID)
      const body = await res.text().catch(() => "");
      console.error("[generate] gemini rejected the request", {
        model,
        status: res.status,
        body: body.slice(0, 300),
      });
      return { ok: false, reason: "auth" };
    }
    if (res.status === 404) {
      console.error("[generate] gemini model not found - set GEMINI_MODEL", {
        model,
      });
      return { ok: false, reason: "gone" };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[generate] gemini failed", {
        model,
        status: res.status,
        body: body.slice(0, 300),
      });
      return { ok: false, reason: "error" };
    }

    const json = (await res.json()) as GeminiResponse;
    if (json.promptFeedback?.blockReason) {
      console.error("[generate] gemini blocked the prompt", {
        model,
        reason: json.promptFeedback.blockReason,
      });
      return { ok: false, reason: "error" };
    }

    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("");
    if (text.trim()) {
      console.log("[generate] gemini body received", {
        model,
        chars: text.length,
        totalMs: Date.now() - startedAt,
      });
      return { ok: true, text };
    }
    console.error("[generate] gemini returned empty content", { model });
    return { ok: false, reason: "error" };
  } catch (e) {
    console.error("[generate] gemini call failed or timed out", {
      model,
      timedOut: controller.signal.aborted,
      afterMs: Date.now() - startedAt,
      e,
    });
    return { ok: false, reason: "timeout" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tries each attempt (Gemini first, then OpenRouter models as backup) in order until
 * one returns valid project JSON. A model that times out, is rate limited,
 * is gone, has a bad key or returns junk simply hands over to the next one.
 */

async function generateWithFallback(
  keys: Keys,
  attempts: Attempt[],
  prompt: string,
  deadline: number,
): Promise<GeneratedContent> {
  const failures: FailureReason[] = [];
  const history: { model: string; pass: number; outcome: string }[] = [];
  const gone = new Set<string>(); // dead "provider:model" ids - skipped on later passes
  let outOfTime = false;
  passes: for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (pass > 0) {
      console.log("[generate] starting pass", pass + 1, "after a short wait");
      await sleep(4_000);
    }
    for (const { provider, model } of attempts) {
      const id = `${provider}:${model}`;
      if (gone.has(id)) continue;
      if (deadline - Date.now() < MIN_CALL_WINDOW_MS) {
        outOfTime = true;
        console.error("[generate] out of time budget");
        break passes;
      }
      console.log("[generate] trying model", { provider, model, pass });
      const result =
        provider === "gemini"
          ? await callGemini(keys.gemini ?? "", model, prompt, deadline)
          : await callOneModel(keys.openrouter ?? "", model, prompt, deadline);
      if (!result.ok) {
        failures.push(result.reason);
        history.push({ model: id, pass, outcome: result.reason });
        if (result.reason === "gone" || result.reason === "auth") {
          gone.add(id);
          console.error("[generate] model/key unavailable, skipping:", id);
        }
        continue;
      }
      const refusal = readModelError(result.text);
      if (refusal) throw new GenerationError(refusal);
      const parsed = parseGeneratedContent(result.text);
      if (parsed && parsed.sections.length >= MIN_SECTIONS) {
        console.log("[generate] model succeeded", { provider, model, pass });
        return parsed;
      }
      console.error("[generate] could not parse model output", {
        provider,
        model,
        preview: result.text.slice(0, 300),
      });
      failures.push("unparseable");
      history.push({ model: id, pass, outcome: "unparseable" });
    }
  }
  console.error("[generate] ALL MODELS FAILED", { history, outOfTime });
  if (failures.length > 0 && failures.every((f) => f === "auth")) {
    throw new GenerationError(
      "The app isn't set up for writing yet. Please tell the person in charge of this app.",
    );
  }
  const allBusy =
    failures.length > 0 && failures.every((f) => f === "rate_limited");
  throw new GenerationError(
    allBusy
      ? "The writing helpers are very busy right now. Please try again in a minute."
      : outOfTime || failures.includes("timeout")
        ? "The writing helper took too long. Please try again."
        : failures.includes("unparseable")
          ? "The writing helper got muddled. Please press try again."
          : "The writing helper didn't answer. Please try again.",
  );
}
/* ------------------------------ post-process --------------------------- */

interface FinalSection {
  heading: string;
  body: string;
  imageIndex?: number;
  sourceRefs: number[];
}

function finalizeSections(
  content: GeneratedContent,
  research: ResearchResult,
  sectionCount: number,
): FinalSection[] {
  const imageCount = research.images.length;
  const sourceCount = research.sources.length;
  const used = new Set<number>();
  const base = content.sections.slice(0, sectionCount).map((section) => {
    let imageIndex = section.imageIndex;
    if (
      imageIndex !== undefined &&
      (imageIndex < 0 || imageIndex >= imageCount || used.has(imageIndex))
    ) {
      imageIndex = undefined;
    }
    if (imageIndex !== undefined) used.add(imageIndex);
    const sourceRefs = Array.from(
      new Set(section.sourceRefs.filter((n) => n >= 1 && n <= sourceCount)),
    );
    return {
      heading: section.heading,
      body: section.body,
      imageIndex,
      sourceRefs,
    };
  });
  // Give picture-less sections an unused picture so every page looks finished
  return base.map((section): FinalSection => {
    let imageIndex = section.imageIndex;
    if (imageIndex === undefined) {
      for (let i = 0; i < imageCount; i++) {
        if (!used.has(i)) {
          imageIndex = i;
          used.add(i);
          break;
        }
      }
    }
    return {
      heading: section.heading,
      body: section.body,
      sourceRefs: section.sourceRefs,
      ...(imageIndex !== undefined ? { imageIndex } : {}),
    };
  });
}
/* --------------------------------- action ------------------------------ */

export const generateProject = internalAction({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.runQuery(internal.projectsData.getForGeneration, {
      projectId,
    });
    if (!project) return; // deleted before we started
    const startedAt = Date.now();
    const deadline = startedAt + GENERATION_BUDGET_MS;
    console.log("[generate] start", {
      projectId,
      topic: project.topic,
      ageGroup: project.ageGroup,
    });
    try {
      const keys: Keys = {
        openrouter: process.env.OPENROUTER_API_KEY || undefined,
        gemini: process.env.GEMINI_API_KEY || undefined,
      };
      if (!keys.openrouter && !keys.gemini) {
        console.error(
          "[generate] No AI key set. Run: npx convex env set GEMINI_API_KEY <key> (and/or OPENROUTER_API_KEY)",
        );
        throw new GenerationError(
          "The app isn't set up for writing yet. Please tell the person in charge of this app.",
        );
      }
      // 1) Research
      await ctx.runMutation(internal.projectsData.setStatus, {
        projectId,
        status: "researching",
        statusMessage: "Searching for facts and pictures…",
      });
      console.log("[generate] researching…", {
        hasTavilyKey: Boolean(process.env.TAVILY_API_KEY),
        hasSerpKey: Boolean(process.env.SERPAPI_API_KEY),
      });
      const research = await researchTopic(
        project.topic,
        {
          tavily: process.env.TAVILY_API_KEY,
          serpapi: process.env.SERPAPI_API_KEY,
        },
        project.ageGroup,
      );
      console.log("[generate] research done", {
        sources: research.sources.length,
        images: research.images.length,
        elapsedSec: Math.round((Date.now() - startedAt) / 1000),
      });
      if (research.sources.length === 0) {
        throw new GenerationError(
          "We couldn't find good, reliable pages about that topic. Try different words, like a more specific topic.",
        );
      }
      // 2) Write
      await ctx.runMutation(internal.projectsData.setStatus, {
        projectId,
        status: "writing",
        statusMessage: "Writing your project…",
      });
      const prompt = buildPrompt(
        project.topic,
        project.ageGroup,
        project.sectionCount,
        research,
      );
      const attempts = getAttempts(keys);
      console.log("[generate] attempts in order:", attempts);
      const content = await generateWithFallback(
        keys,
        attempts,
        prompt,
        deadline,
      );
      // 3) Save
      console.log("[generate] saving project", projectId);
      await ctx.runMutation(internal.projectsData.finish, {
        projectId,
        title: content.title || toTitleCase(project.topic),
        intro: content.intro,
        sections: finalizeSections(content, research, project.sectionCount),
        funFacts: content.funFacts.slice(0, 5),
        glossary: content.glossary.slice(0, 5),
        summary: content.summary,
        images: research.images,
        sources: research.sources.map((s) => ({ title: s.title, url: s.url })),
      });
      console.log("[generate] done", {
        projectId,
        totalSec: Math.round((Date.now() - startedAt) / 1000),
      });
    } catch (e) {
      console.error("[generate] failed:", e);
      const message =
        e instanceof GenerationError
          ? e.message
          : "Something went wrong while building your project. Please try again.";
      await ctx.runMutation(internal.projectsData.fail, {
        projectId,
        errorMessage: message,
      });
    }
  },
});
