// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  ageGroupValidator,
  glossaryValidator,
  imageValidator,
  sectionValidator,
  sourceValidator,
  statusValidator,
  templateValidator,
} from "./constants";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // One row per generated school project. Content fields are optional because
  // the row is created first (status "queued") and filled in by the AI action.
  projects: defineTable({
    userId: v.id("users"),
    slug: v.string(), // public identifier used in /p/[slug]
    topic: v.string(), // what the child typed, e.g. "Aquatic animals"
    title: v.string(), // starts as the topic, replaced by the AI title
    ageGroup: ageGroupValidator,
    template: templateValidator, // layout only - can be switched any time
    sectionCount: v.number(),
    studentName: v.optional(v.string()), // printed on the cover
    status: statusValidator,
    statusMessage: v.optional(v.string()), // friendly progress text
    errorMessage: v.optional(v.string()), // shown when status === "failed"

    // AI output
    intro: v.optional(v.string()),
    sections: v.optional(v.array(sectionValidator)),
    funFacts: v.optional(v.array(v.string())),
    glossary: v.optional(v.array(glossaryValidator)),
    summary: v.optional(v.string()),

    // Research output (real URLs from Tavily / SerpAPI - never invented by the AI)
    images: v.array(imageValidator),
    sources: v.array(sourceValidator), // becomes the bibliography

    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_slug", ["slug"]),

  generations: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_user_and_created", ["userId", "createdAt"]),
});
