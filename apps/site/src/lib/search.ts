/**
 * Site search over /search.json (see pages/search.json.ts). Every word typed must match somewhere; titles count
 * most, then aliases and subtitles, then body text. Words match from their start, so "recur" finds "recursion".
 */
export type SearchItem = { k: "problem" | "read" | "topic" | "term" | "page"; t: string; u: string; s: string; w: string; b: string };
export type SearchHit = { item: SearchItem; score: number; snippet: string };

const norm = (s: string) => s.toLowerCase().replace(/[–—-]/g, " ").replace(/[^\p{L}\p{N}²ⁿ()\s.#]/gu, " ").replace(/\s+/g, " ").trim();
const KIND: Record<SearchItem["k"], number> = { topic: 9, read: 8, problem: 6, term: 5, page: 4 };

type Prepared = { item: SearchItem; t: string; w: string; s: string; b: string };
const cache = new WeakMap<SearchItem[], Prepared[]>();
const prepare = (items: SearchItem[]) => {
  let p = cache.get(items);
  if (!p) cache.set(items, (p = items.map((item) => ({ item, t: norm(item.t), w: norm(item.w), s: norm(item.s), b: norm(item.b) }))));
  return p;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const startsWord = (hay: string, tok: string) => new RegExp(`(^|\\s)${escapeRe(tok)}`).test(hay);
const isWord = (hay: string, tok: string) => new RegExp(`(^|\\s)${escapeRe(tok)}(\\s|$)`).test(hay);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A short piece of the body around the first matched word, with every query word wrapped in <mark>. HTML-escaped. */
function snippet(body: string, tokens: string[]): string {
  const low = body.toLowerCase();
  let at = -1;
  for (const tok of tokens) {
    const m = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(tok)}`, "u").exec(low);
    if (m) { at = m.index + m[1].length; break; }
  }
  if (at < 0) return "";
  const start = Math.max(0, body.lastIndexOf(" ", Math.max(0, at - 50)) + 1);
  let piece = body.slice(start, start + 150);
  const cut = piece.lastIndexOf(" ");
  if (start + 150 < body.length && cut > 100) piece = piece.slice(0, cut);
  let out = esc(piece);
  for (const tok of [...tokens].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`(^|[^\\p{L}\\p{N}>])(${escapeRe(esc(tok))}[\\p{L}\\p{N}]*)`, "giu"), "$1<mark>$2</mark>");
  }
  return (start > 0 ? "…" : "") + out + (start + piece.length < body.length ? "…" : "");
}

export function search(items: SearchItem[], query: string, limit = 20): SearchHit[] {
  const q = norm(query);
  const tokens = q.split(" ").filter(Boolean);
  if (!tokens.length) return [];
  const hits: SearchHit[] = [];
  for (const p of prepare(items)) {
    let score = 0, ok = true, inTitle = 0;
    for (const tok of tokens) {
      const num = /^\d+$/.test(tok);
      let best = 0;
      if (num && p.s.includes(`#${tok} `) || num && p.s.endsWith(`#${tok}`)) best = 60;
      else if (isWord(p.t, tok)) best = 40;
      else if (startsWord(p.t, tok)) best = 30;
      else if (isWord(p.w, tok)) best = 25;
      else if (startsWord(p.w, tok)) best = 18;
      else if (p.t.includes(tok) && tok.length > 2) best = 14;
      else if (startsWord(p.s, tok)) best = 10;
      else if (startsWord(p.b.slice(0, 320), tok)) best = 8; // in the summary or the trick
      else if (startsWord(p.b, tok)) best = 4;
      if (!best) { ok = false; break; }
      if (best >= 30) inTitle++;
      score += best;
    }
    if (!ok) continue;
    if (p.t === q) score += 80;
    else if (p.t.startsWith(q)) score += 40;
    else if (p.t.includes(q) && tokens.length > 1) score += 20;
    score += KIND[p.item.k] + (inTitle === tokens.length ? 10 : 0);
    hits.push({ item: p.item, score, snippet: inTitle === tokens.length ? "" : snippet(p.item.b, tokens) });
  }
  return hits.sort((a, b) => b.score - a.score || a.item.t.localeCompare(b.item.t)).slice(0, limit);
}
