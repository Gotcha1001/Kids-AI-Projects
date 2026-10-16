// convex/projects.ts - public queries + mutations used by the UI
import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ageGroupValidator,
  templateValidator,
  MAX_PROJECTS_PER_DAY,
  MAX_SECTIONS,
  MIN_SECTIONS,
  STALE_MS,
  WATCHDOG_DELAY_MS,
} from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_TOPIC_LENGTH = 3;
const MAX_TOPIC_LENGTH = 120;
const MAX_NAME_LENGTH = 60;
const MAX_TITLE_LENGTH = 120;

type AnyCtx = QueryCtx | MutationCtx;

async function getUserOrNull(ctx: AnyCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}

async function requireUser(ctx: AnyCtx): Promise<Doc<"users">> {
  const user = await getUserOrNull(ctx);
  if (!user) {
    throw new ConvexError(
      "Please sign in first (your profile may still be loading).",
    );
  }
  return user;
}

async function getOwnedProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<Doc<"projects">> {
  const user = await requireUser(ctx);
  const project = await ctx.db.get(projectId);
  if (!project || project.userId !== user._id) {
    throw new ConvexError("Project not found.");
  }
  return project;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

function randomSuffix(): string {
  return (Math.random().toString(36) + "000000").slice(2, 8);
}

async function uniqueSlug(ctx: MutationCtx, topic: string): Promise<string> {
  const base = slugify(topic) || "project";
  for (let i = 0; i < 5; i++) {
    const slug = `${base}-${randomSuffix()}`;
    const clash = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!clash) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/* ------------------------------ queries ------------------------------ */

/** Lightweight rows for the dashboard / library (no section text). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx);
    if (!user) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_and_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
    return projects.map((p) => ({
      _id: p._id,
      slug: p.slug,
      title: p.title,
      topic: p.topic,
      ageGroup: p.ageGroup,
      template: p.template,
      status: p.status,
      isPublic: p.isPublic,
      createdAt: p.createdAt,
      coverUrl:
        p.images.find((i) => i.pdfSafe)?.url ?? p.images[0]?.url ?? null,
    }));
  },
});

/** Owner can always read; everyone else only if the project is public. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!project) return null;
    const user = await getUserOrNull(ctx);
    const isOwner = user !== null && user._id === project.userId;
    if (!isOwner && !project.isPublic) return null;
    return { project, isOwner };
  },
});

/* ----------------------------- mutations ----------------------------- */

export const create = mutation({
  args: {
    topic: v.string(),
    ageGroup: ageGroupValidator,
    template: templateValidator,
    sectionCount: v.number(),
    studentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const topic = args.topic.trim().replace(/\s+/g, " ");
    if (topic.length < MIN_TOPIC_LENGTH || topic.length > MAX_TOPIC_LENGTH) {
      throw new ConvexError(
        `Topic must be between ${MIN_TOPIC_LENGTH} and ${MAX_TOPIC_LENGTH} characters.`,
      );
    }

    const sectionCount = Math.min(
      MAX_SECTIONS,
      Math.max(MIN_SECTIONS, Math.round(args.sectionCount)),
    );

    // Daily limit (free AI + free search quotas are precious)
    const recent = await ctx.db
      .query("projects")
      .withIndex("by_user_and_created", (q) =>
        q.eq("userId", user._id).gte("createdAt", Date.now() - DAY_MS),
      )
      .take(MAX_PROJECTS_PER_DAY);
    if (recent.length >= MAX_PROJECTS_PER_DAY) {
      throw new ConvexError(
        `You've made ${MAX_PROJECTS_PER_DAY} projects in the last 24 hours. Come back tomorrow!`,
      );
    }

    const now = Date.now();
    const slug = await uniqueSlug(ctx, topic);
    const studentName = args.studentName?.trim().slice(0, MAX_NAME_LENGTH);

    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      slug,
      topic,
      title: topic,
      ageGroup: args.ageGroup,
      template: args.template,
      sectionCount,
      ...(studentName ? { studentName } : {}),
      status: "queued",
      statusMessage: "Getting started…",
      images: [],
      sources: [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.generate.generateProject, {
      projectId,
    });
    await ctx.scheduler.runAfter(
      WATCHDOG_DELAY_MS,
      internal.projectsData.failIfStuck,
      { projectId },
    );

    return { projectId, slug };
  },
});

/** Rename, switch template or change the cover name. Layout changes are free. */
export const updateMeta = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    template: v.optional(templateValidator),
    studentName: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, title, template, studentName }) => {
    await getOwnedProject(ctx, projectId);
    const patch: Partial<
      Pick<Doc<"projects">, "title" | "template" | "studentName">
    > = {};
    if (title !== undefined) {
      const clean = title.trim().slice(0, MAX_TITLE_LENGTH);
      if (clean) patch.title = clean;
    }
    if (template !== undefined) patch.template = template;
    if (studentName !== undefined) {
      patch.studentName =
        studentName.trim().slice(0, MAX_NAME_LENGTH) || undefined;
    }
    await ctx.db.patch(projectId, { ...patch, updatedAt: Date.now() });
  },
});

export const setPublic = mutation({
  args: { projectId: v.id("projects"), isPublic: v.boolean() },
  handler: async (ctx, { projectId, isPublic }) => {
    await getOwnedProject(ctx, projectId);
    await ctx.db.patch(projectId, { isPublic, updatedAt: Date.now() });
  },
});

/** Run the whole research + writing pipeline again for the same topic. */
export const regenerate = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await getOwnedProject(ctx, projectId);
    const inProgress = project.status !== "done" && project.status !== "failed";
    // A project that has made no progress for STALE_MS is stuck - allow a retry
    if (inProgress && Date.now() - project.updatedAt < STALE_MS) {
      throw new ConvexError("This project is still being built.");
    }
    await ctx.db.patch(projectId, {
      status: "queued",
      statusMessage: "Starting again…",
      errorMessage: undefined,
      intro: undefined,
      sections: undefined,
      funFacts: undefined,
      glossary: undefined,
      summary: undefined,
      images: [],
      sources: [],
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.generate.generateProject, {
      projectId,
    });
    await ctx.scheduler.runAfter(
      WATCHDOG_DELAY_MS,
      internal.projectsData.failIfStuck,
      { projectId },
    );
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await getOwnedProject(ctx, projectId);
    await ctx.db.delete(projectId);
  },
});

async function enforceDailyLimit(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const recent = await ctx.db
    .query("generations")
    .withIndex("by_user_and_created", (q) =>
      q.eq("userId", userId).gte("createdAt", Date.now() - DAY_MS),
    )
    .take(MAX_PROJECTS_PER_DAY);
  if (recent.length >= MAX_PROJECTS_PER_DAY) {
    throw new ConvexError(
      `You've reached ${MAX_PROJECTS_PER_DAY} projects in 24 hours. Come back tomorrow!`,
    );
  }
  await ctx.db.insert("generations", { userId, createdAt: Date.now() });
}
