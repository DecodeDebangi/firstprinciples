import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { allTopics, homeTopic, practisedTopics, topicSlug } from "../data/roadmap";
import { topicGuides } from "../data/topicGuides";
import { glossary } from "../data/glossary.mjs";

/**
 * /search.json: everything the header search can find, built with the site. The search box downloads it the
 * first time it opens. Fields: k = kind, t = title, u = URL, s = subtitle, w = extra words worth matching
 * (aliases, topic names), b = plain body text for matching and snippets.
 */
export type SearchItem = { k: "problem" | "read" | "topic" | "term" | "page"; t: string; u: string; s: string; w: string; b: string };

/** MDX source → plain text: drop imports, code blocks and component tags, keep the words. */
const plain = (src = "") =>
  src
    .replace(/^import .*$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[A-Z][^>]*\/>/g, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_#>|]/g, " ")
    .replace(/^-{3,}$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Short forms people type, mapped onto the words they stand for. */
const ALIASES: Record<string, string> = {
  "Dynamic programming": "dp memo memoization memoisation tabulation",
  "Graphs": "bfs dfs breadth depth adjacency",
  "Trees": "bst binary tree traversal dfs bfs",
  "Heaps": "priority queue pq",
  "Arrays & hashing": "hash map hashmap dictionary set",
  "Linked lists": "ll node pointer",
  "Big-O & complexity": "big o complexity time space",
  "Stack": "stacks queue queues monotonic",
};

export const GET: APIRoute = async () => {
  const problems = await getCollection("dsa");
  const concepts = await getCollection("concepts");
  const items: SearchItem[] = [];

  for (const p of problems) {
    const home = homeTopic(p.data.topics);
    items.push({
      k: "problem", t: p.data.title, u: `/dsa/${p.id}/`,
      s: `#${p.data.leetcode.number} · ${p.data.difficulty}${home ? ` · ${home.name}` : ""}`,
      w: [p.data.leetcode.number, ...p.data.topics, ...practisedTopics(p.data.topics).map((t) => t.name)].join(" "),
      b: [p.data.summary, p.data.insight ?? "", plain(p.body)].join(" "),
    });
  }
  for (const c of concepts) {
    items.push({
      k: "read", t: c.data.title, u: `/concepts/${c.id}/`, s: `${c.data.kind} · ${c.data.topic}`,
      w: `${c.data.topic} ${ALIASES[c.data.topic] ?? ""}`,
      b: [c.data.summary, plain(c.body)].join(" "),
    });
  }
  for (const t of allTopics) {
    const hasPage = problems.some((p) => practisedTopics(p.data.topics).includes(t)) || concepts.some((c) => c.data.topic === t.name);
    if (!hasPage) continue;
    const g = topicGuides[t.name];
    items.push({
      k: "topic", t: t.name, u: `/topics/${topicSlug(t.name)}/`, s: "Topic: pattern, template and problems",
      w: `${t.tags.join(" ")} ${ALIASES[t.name] ?? ""}`,
      b: [t.blurb, g?.idea ?? "", ...(g?.signals ?? [])].join(" "),
    });
  }
  for (const g of glossary) {
    items.push({ k: "term", t: g.term, u: `/glossary/#${g.id}`, s: "Glossary", w: g.match.join(" "), b: g.def });
  }
  const pages: [string, string, string][] = [
    ["All problems", "/problems/", "Search, filter by topic, difficulty and progress"],
    ["Concepts", "/concepts/", "Every read, by topic"],
    ["Topics", "/topics/", "The patterns in roadmap order"],
    ["Practice", "/practice/", "Ten questions at a time, spaced repetition, progress backup"],
    ["Cheat sheet", "/cheatsheet/", "Every pattern on one printable page, plus the toolbox in your language"],
    ["Glossary", "/glossary/", "Every term in plain English"],
    ["RSS feed", "/feed/", "Get new problems in a feed reader"],
    ["Roadmap", "/#roadmap", "Start here: the suggested order"],
  ];
  for (const [t, u, s] of pages) items.push({ k: "page", t, u, s, w: "", b: s });

  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
