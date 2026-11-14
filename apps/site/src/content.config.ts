import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { allTopics } from "./data/roadmap";

/**
 * One folder per problem: src/content/dsa/<number>-<slug>/index.mdx
 * The folder name (minus the number) becomes the URL: /dsa/<slug>
 */
const dsa = defineCollection({
  loader: glob({
    pattern: "*/index.mdx",
    base: "./src/content/dsa",
    generateId: ({ entry }) => entry.split("/")[0].replace(/^\d+-/, ""),
  }),
  schema: z.object({
    title: z.string(),
    /** Required: every problem page links to the original question. */
    leetcode: z.object({ number: z.number().int(), url: z.url().startsWith("https://leetcode.com/problems/") }),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    topics: z.array(z.string()).min(1),
    /** The day it was added to the site. */
    added: z.coerce.date(),
    summary: z.string(),
    /** The key idea in one plain sentence, for the "In one minute" box (hidden in try-it-first mode). */
    insight: z.string().optional(),
    /** Best time / space, shown on cards. */
    best: z.object({ time: z.string(), space: z.string() }),
    /** Clean Instagram reel URL for this problem (no ?share-tracking query). */
    reel: z.url().regex(/^https:\/\/www\.instagram\.com\/reel\/[\w-]+\/$/, "Use the clean form https://www.instagram.com/reel/<id>/ with no query string").optional(),
  }),
});

/**
 * Concept articles (theory): src/content/concepts/<order>-<slug>/index.mdx → /concepts/<slug>
 * Each one belongs to a roadmap topic and is listed on that topic's page under "Read first".
 */
const topicNames = allTopics.map((t) => t.name) as [string, ...string[]];
const concepts = defineCollection({
  loader: glob({
    pattern: "*/index.mdx",
    base: "./src/content/concepts",
    generateId: ({ entry }) => entry.split("/")[0].replace(/^\d+-/, ""),
  }),
  schema: z.object({
    title: z.string(),
    /** Must be a roadmap topic name, e.g. "Sorting". */
    topic: z.enum(topicNames),
    kind: z.enum(["Explainer", "Comparison guide", "Interview theory"]),
    /** Reading order within its topic (1 first). */
    order: z.number().int().min(1),
    summary: z.string(),
    added: z.coerce.date(),
  }),
});

export const collections = { dsa, concepts };
