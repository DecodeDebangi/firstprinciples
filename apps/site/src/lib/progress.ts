/**
 * The reader's progress, kept only in this browser (localStorage). No account, nothing sent anywhere.
 * Every access is wrapped in try/catch: in a private window or with storage blocked, pages still work,
 * they just don't remember anything.
 */

export type Status = "solved" | "shaky";

/** A practice question's spaced-repetition state (a Leitner box). */
export interface Card {
  /** 0 = new or last answered wrong; each right answer moves it up one box. */
  box: number;
  /** The day it's next due, YYYY-MM-DD in the reader's time zone. */
  due: string;
  seen: number;
  right: number;
  /** When it was last answered (ISO), so imports keep the newer copy. */
  last: string;
}

export interface Progress {
  v: 1;
  problems: Record<string, { status: Status; at: string }>;
  cards: Record<string, Card>;
}

const KEY = "firstprinciples:progress";
const EVENT = "fp:progress";

/** Days until a card is due again, after a right answer lands it in box i (box 0 is "due now"). */
export const INTERVALS = [0, 1, 3, 7, 16, 35];

const empty = (): Progress => ({ v: 1, problems: {}, cards: {} });

/** Accepts anything and keeps only well-formed entries. */
function clean(raw: unknown): Progress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Progress>;
  if (r.v !== 1) return null;
  const out = empty();
  for (const [slug, e] of Object.entries(r.problems ?? {})) {
    if (e && (e.status === "solved" || e.status === "shaky") && typeof e.at === "string") out.problems[slug] = { status: e.status, at: e.at };
  }
  for (const [id, c] of Object.entries(r.cards ?? {})) {
    if (c && Number.isInteger(c.box) && c.box >= 0 && c.box < INTERVALS.length && /^\d{4}-\d{2}-\d{2}$/.test(c.due)
      && Number.isInteger(c.seen) && Number.isInteger(c.right) && typeof c.last === "string") out.cards[id] = { ...c };
  }
  return out;
}

export function load(): Progress {
  try {
    const s = localStorage.getItem(KEY);
    return (s && clean(JSON.parse(s))) || empty();
  } catch {
    return empty();
  }
}

/** Saves and tells every listener on the page. Returns false if the browser refused to store it. */
export function save(p: Progress): boolean {
  let ok = true;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { ok = false; }
  try { window.dispatchEvent(new CustomEvent(EVENT)); } catch { /* not in a browser */ }
  return ok;
}

/** Runs `cb` whenever progress changes, on this page or in another tab. Returns an unsubscribe function. */
export function onChange(cb: () => void): () => void {
  const storage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", storage); };
}

/** Today in the reader's own time zone, as YYYY-MM-DD. */
export function today(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function setStatus(slug: string, status: Status | null): Progress {
  const p = load();
  if (status) p.problems[slug] = { status, at: new Date().toISOString() };
  else delete p.problems[slug];
  save(p);
  return p;
}

/** Records an answer: right moves the card up a box (due later), wrong sends it back to box 0 (due today). */
export function review(p: Progress, id: string, correct: boolean, now = new Date()): Card {
  const prev = p.cards[id] ?? { box: 0, due: today(now), seen: 0, right: 0, last: "" };
  const box = correct ? Math.min(prev.box + 1, INTERVALS.length - 1) : 0;
  const card: Card = { box, due: addDays(today(now), INTERVALS[box]), seen: prev.seen + 1, right: prev.right + (correct ? 1 : 0), last: now.toISOString() };
  p.cards[id] = card;
  return card;
}

/** Joins two progress records, keeping the newer copy of each problem mark and each card. */
export function merge(a: Progress, b: Progress): Progress {
  const out = empty();
  for (const src of [a, b]) {
    for (const [k, v] of Object.entries(src.problems)) if (!out.problems[k] || out.problems[k].at < v.at) out.problems[k] = v;
    for (const [k, v] of Object.entries(src.cards)) if (!out.cards[k] || out.cards[k].last < v.last) out.cards[k] = v;
  }
  return out;
}

/** A backup code: the progress as compact, URL-safe text, to paste on another device. */
export function toCode(p: Progress): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return "fp1." + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reads a backup: either a code from `toCode` or the JSON from a downloaded file. */
export function fromBackup(text: string): Progress | { error: string } {
  const t = text.trim();
  try {
    let json = t;
    if (t.startsWith("fp1.")) {
      const b64 = t.slice(4).replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
      json = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
    }
    return clean(JSON.parse(json)) ?? { error: "That doesn't look like a firstprinciples backup." };
  } catch {
    return { error: "That doesn't look like a firstprinciples backup. Paste the whole code, starting with fp1." };
  }
}
