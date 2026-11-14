/**
 * Glossary marking, as a hast plugin for Astro's Markdown processor (Sätteri). On every problem and read, the
 * FIRST use of each glossary term becomes a link to /glossary/#<id> carrying its definition. A small script
 * (components/TermPopover.astro) turns it into a tap-to-define card; without JavaScript it's a plain link.
 *
 * Skips code, headings, existing links, interactive components and folded content, and a term on its own read.
 */
import { fileURLToPath } from "node:url";
import { glossary } from "../data/glossary.mjs";

const SKIP_TAGS = new Set(["code", "pre", "a", "h1", "h2", "h3", "h4", "h5", "h6", "button", "script", "style", "svg", "th", "summary"]);
// Complexity boxes and QA answers are folded by default, so a term marked there could go unseen; mark it elsewhere.
const SKIP_JSX = new Set(["Viz", "Compare", "GrowthChart", "Quiz", "Complexity", "QA"]);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Longer phrases first, so "binary search tree" wins over "binary search". */
const entries = glossary
  .map((g) => {
    // Acronyms (BST, DFS) match exactly; ordinary words match in any case ("Binary tree", "binary tree").
    const acro = g.match.filter((m) => /[A-Z]{2}/.test(m)), words = g.match.filter((m) => !/[A-Z]{2}/.test(m));
    const re = (list, flags) => list.length
      ? new RegExp(`(?<![\\w-])(${[...list].sort((x, y) => y.length - x.length).map(escape).join("|")})(?![\\w-])`, flags)
      : null;
    return { ...g, res: [re(words, "i"), re(acro, "")].filter(Boolean), longest: Math.max(...g.match.map((m) => m.length)) };
  })
  .sort((a, b) => b.longest - a.longest);

/** Split one text value into text and term links, marking each term once (tracked in `used`). Null if no terms. */
export function markTerms(value, used) {
  const out = [];
  let rest = value;
  for (;;) {
    let best = null;
    for (const e of entries) {
      if (used.has(e.id)) continue;
      for (const r of e.res) {
        const hit = r.exec(rest);
        if (hit && (!best || hit.index < best.hit.index || (hit.index === best.hit.index && hit[0].length > best.hit[0].length))) best = { e, hit };
      }
    }
    if (!best) break;
    const { e, hit } = best;
    used.add(e.id);
    if (hit.index > 0) out.push({ type: "text", value: rest.slice(0, hit.index) });
    out.push({
      type: "element", tagName: "a",
      properties: { className: ["term"], href: `/glossary/#${e.id}`, dataTerm: e.term, dataDef: e.def, ...(e.read ? { dataRead: `/concepts/${e.read}/` } : {}) },
      children: [{ type: "text", value: hit[0] }],
    });
    rest = rest.slice(hit.index + hit[0].length);
  }
  if (!out.length) return null;
  if (rest) out.push({ type: "text", value: rest });
  return out;
}

/** Which problem or read a file is, e.g. ".../content/dsa/0001-two-sum/index.mdx" → "two-sum"; null for other pages. */
const pageOf = (url) => {
  const m = (url ? fileURLToPath(url) : "").match(/content\/(dsa|concepts)\/([^/]+)\//);
  return m ? m[2].replace(/^\d+-/, "") : null;
};

export const glossaryPlugin = {
  name: "glossary-terms",
  before(_root, ctx) {
    const page = pageOf(ctx.fileURL);
    ctx.data.glossary = page ? { used: new Set(entries.filter((e) => e.read === page).map((e) => e.id)) } : null;
  },
  text(node, ctx) {
    const state = ctx.data.glossary;
    if (!state || !node.value.trim()) return;
    for (let p = ctx.parent(node); p; p = ctx.parent(p)) {
      if (p.type === "element" && SKIP_TAGS.has(p.tagName)) return;
      if ((p.type === "mdxJsxFlowElement" || p.type === "mdxJsxTextElement") && SKIP_JSX.has(p.name)) return;
    }
    const parts = markTerms(node.value, state.used);
    if (parts) ctx.replaceNode(node, parts);
  },
};
