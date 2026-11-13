/**
 * The practice question bank, built at build time from content that already exists:
 * - every concept's "Check yourself" quiz (src/content/concepts/<n>-<slug>/quiz.ts);
 * - for every problem, "which technique fits?" and "what's the best time complexity?", using the problem
 *   statement from its page (our own words).
 */
import type { CollectionEntry } from "astro:content";
import type { QuizQuestion } from "@firstprinciples/ui";
import { seededOrder } from "@firstprinciples/ui";
import { homeTopic, practisedTopics } from "../data/roadmap";

export interface BankItem {
  /** Stable id: progress is stored under it. */
  id: string;
  kind: "concept" | "pattern" | "complexity";
  /** Roadmap topic name, for the topic filter. */
  topic: string;
  q: string;
  /** Shown above the question, e.g. the problem statement. */
  context?: string;
  options: string[];
  answer: number;
  why: string;
  href: string;
  hrefLabel: string;
}

const quizzes = import.meta.glob<{ questions: QuizQuestion[] }>("../content/concepts/*/quiz.ts", { eager: true });

/** Markdown to plain text, enough for one paragraph. */
const plain = (md: string) => md
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/\*([^*]+)\*/g, "$1")
  .replace(/\s+/g, " ")
  .trim();

/** The text of a "## Heading" section, up to the next heading. */
function section(body: string, heading: string) {
  const start = body.indexOf(`## ${heading}`);
  if (start < 0) return "";
  const rest = body.slice(start + heading.length + 3);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}

/** The first paragraph of "## The problem". */
export function statementOf(body: string) {
  const paras = section(body, "The problem").split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith("```") && !p.startsWith("<"));
  return plain(paras[0] ?? "");
}

/** The blockquote under "## The key question". */
export function keyQuestionOf(body: string) {
  const line = section(body, "The key question").split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join(" ");
  return plain(line);
}

/** Common complexities from fastest to slowest; distractors are the right answer's nearest neighbours. */
const LADDER = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)", "O(2ⁿ)", "O(n · 2ⁿ)", "O(n · n!)"];
/** Forms with more than one variable, with hand-picked plausible wrong answers. */
const SPECIAL: Record<string, string[]> = {
  "O(V + E)": ["O(V · E)", "O(V²)", "O(E log V)"],
  "O(rows × cols)": ["O((rows × cols)²)", "O(rows + cols)", "O(rows × cols × log(rows × cols))"],
  "O(m + n)": ["O(m · n)", "O((m + n) log(m + n))", "O(max(m, n)²)"],
  "O(n + m)": ["O(n · m)", "O((n + m) log(n + m))", "O(max(n, m)²)"],
  "O(log k) per add": ["O(k) per add", "O(n) per add", "O(n log n) per add"],
};

/**
 * Three wrong answers for a complexity question, or null to skip it. O(n) is skipped: most problems here are O(n),
 * so asking it every time would just teach "pick O(n)".
 */
export function complexityDistractors(time: string): string[] | null {
  if (SPECIAL[time]) return SPECIAL[time];
  const i = LADDER.indexOf(time);
  if (i < 0 || time === "O(n)") return null;
  return LADDER.map((t, k) => ({ t, d: Math.abs(k - i) })).filter((x) => x.d > 0).sort((a, b) => a.d - b.d || LADDER.indexOf(a.t) - LADDER.indexOf(b.t)).slice(0, 3).map((x) => x.t);
}

export function buildBank(problems: CollectionEntry<"dsa">[], concepts: CollectionEntry<"concepts">[]): BankItem[] {
  const bank: BankItem[] = [];

  for (const c of concepts) {
    const folder = c.filePath?.split("/").slice(-2, -1)[0];
    const mod = Object.entries(quizzes).find(([path]) => path.includes(`/${folder}/`))?.[1];
    for (const item of mod?.questions ?? []) {
      bank.push({ id: `c:${c.id}:${item.q}`, kind: "concept", topic: c.data.topic, q: item.q, options: item.options, answer: item.answer, why: item.why,
        href: `/concepts/${c.id}/`, hrefLabel: `Read: ${c.data.title}` });
    }
  }

  // Topics that have problems, for "which technique?" options.
  const homes = [...new Set(problems.map((p) => homeTopic(p.data.topics)?.name).filter((n): n is string => !!n))];

  for (const p of problems) {
    const statement = statementOf(p.body ?? "");
    const key = keyQuestionOf(p.body ?? "");
    const home = homeTopic(p.data.topics)?.name;
    if (!statement || !home) continue;
    const practised = new Set(practisedTopics(p.data.topics).map((t) => t.name));
    const wrongTopics = seededOrder(`topic:${p.id}`, homes.length).map((i) => homes[i]).filter((t) => !practised.has(t)).slice(0, 3);
    bank.push({
      id: `p:${p.id}`, kind: "pattern", topic: home, context: statement,
      q: `${p.data.title}: which technique is the main idea?`,
      options: [home, ...wrongTopics], answer: 0,
      why: key ? `${home}. The key question: "${key}"` : `${home} is the main idea.`,
      href: `/dsa/${p.id}/`, hrefLabel: `See ${p.data.title}`,
    });
    const wrongTimes = complexityDistractors(p.data.best.time);
    if (wrongTimes) {
      bank.push({
        id: `t:${p.id}`, kind: "complexity", topic: home, context: statement,
        q: `${p.data.title}: what's the best time complexity?`,
        options: [p.data.best.time, ...wrongTimes], answer: 0,
        why: `The best approach takes ${p.data.best.time} time and ${p.data.best.space} space.${key ? ` The idea that gets there: "${key}"` : ""}`,
        href: `/dsa/${p.id}/`, hrefLabel: `See ${p.data.title}`,
      });
    }
  }
  return bank;
}
