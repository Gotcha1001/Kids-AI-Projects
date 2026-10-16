// convex/projectsData.ts - internal helpers called ONLY by convex/generate.ts
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  glossaryValidator,
  imageValidator,
  sectionValidator,
  sourceValidator,
  statusValidator,
  STALE_MS,
} from "./constants";

export const getForGeneration = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return {
      topic: project.topic,
      ageGroup: project.ageGroup,
      sectionCount: project.sectionCount,
    };
  },
});

export const setStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: statusValidator,
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, status, statusMessage }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return; // deleted while generating
    await ctx.db.patch(projectId, {
      status,
      statusMessage,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const finish = internalMutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    intro: v.string(),
    sections: v.array(sectionValidator),
    funFacts: v.array(v.string()),
    glossary: v.array(glossaryValidator),
    summary: v.string(),
    images: v.array(imageValidator),
    sources: v.array(sourceValidator),
  },
  handler: async (ctx, { projectId, ...content }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return;
    await ctx.db.patch(projectId, {
      ...content,
      status: "done",
      statusMessage: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const fail = internalMutation({
  args: { projectId: v.id("projects"), errorMessage: v.string() },
  handler: async (ctx, { projectId, errorMessage }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return;
    await ctx.db.patch(projectId, {
      status: "failed",
      statusMessage: undefined,
      errorMessage,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Scheduled by create/regenerate. If the project is STILL in progress and has
 * not been updated for STALE_MS, the action died or hung - mark it failed so
 * the child sees a "Try again" button instead of an endless spinner.
 */
export const failIfStuck = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return;
    const inProgress =
      project.status === "queued" ||
      project.status === "researching" ||
      project.status === "writing";
    if (!inProgress) return;
    if (Date.now() - project.updatedAt < STALE_MS) return;
    console.error("[watchdog] project stuck, failing it:", {
      projectId,
      status: project.status,
      idleMs: Date.now() - project.updatedAt,
    });
    await ctx.db.patch(projectId, {
      status: "failed",
      statusMessage: undefined,
      errorMessage: "This took too long. Please press try again.",
      updatedAt: Date.now(),
    });
  },
});
