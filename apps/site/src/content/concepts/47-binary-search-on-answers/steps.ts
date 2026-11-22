import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ n: number }>["run"]>[1];

/**
 * Binary search for the first index whose yes/no answer is "yes", when the answers run no…no, yes…yes.
 * Draws one step per check. Shared with LC 278 and 875.
 */
export function firstTrueSteps(o: {
  t: T;
  cells: (number | string)[];
  labels?: string[];
  ok: (i: number) => boolean;
  /** Sentence for checking index i, given its answer. */
  says: (i: number, yes: boolean) => string;
  lines: { check: number; yes: number; no: number; done: number };
  intro: string;
  finish: (first: number) => string;
  ask?: boolean;
  /** Added to positions in the variables panel, e.g. 1 when position 0 is speed 1. */
  offset?: number;
  /** Name for the result in the variables panel (default "answer"). */
  answerName?: string;
}) {
  const off = o.offset ?? 0;
  const { t, cells, labels } = o, n = cells.length;
  const known: Record<number, Tone> = {};
  const outside = (lo: number, hi: number) => Object.fromEntries(cells.map((_, k) => [k, "discard" as Tone]).filter(([k]) => (k as number) < lo || (k as number) >= hi));
  let lo = 0, hi = n, asked = !o.ask;
  t.step({ line: o.lines.check - 3, array: cells, labels, pointers: { lo, ...(hi < n ? { hi } : {}) }, vars: { lo: lo + off, hi: hi + off }, message: o.intro });
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    t.op();
    const yes = o.ok(mid);
    const q = !asked ? (asked = true, { ask: { q: `Checking ${labels ? labels[mid] : cells[mid]}: it's "${yes ? "yes" : "no"}". Where can the first "yes" be?`, options: ["Here or to its left", "Strictly to its right", "Anywhere"], answer: yes ? 0 : 1 } }) : {};
    known[mid] = yes ? "found" : "miss";
    const range: [number, number] = [lo, hi - 1];
    if (yes) hi = mid; else lo = mid + 1;
    t.step({ ...q, line: yes ? o.lines.yes : o.lines.no, array: cells, labels, range, pointers: { mid, ...(lo < n ? { lo } : {}) },
      tones: { ...outside(lo, hi), ...known, [mid]: yes ? "found" : "miss" }, badge: { at: mid, text: yes ? "yes" : "no" }, vars: { lo: lo + off, hi: hi + off, mid: mid + off },
      message: `${o.says(mid, yes)} ${yes ? `So the first "yes" is here or further left: hi = ${mid + off}.` : `So the first "yes" is further right: lo = ${mid + 1 + off}.`}` });
  }
  t.step({ line: o.lines.done, array: cells, labels, ...(lo < n ? { pointers: { lo } } : {}), tones: { ...outside(lo, lo + 1), ...known, ...(lo < n ? { [lo]: "found" as Tone } : {}) }, vars: { [o.answerName ?? "answer"]: lo + off },
    done: lo < n ? "found" : "notfound", message: o.finish(lo) });
  return lo;
}

export const firstTrueCode = `function firstTrue(n, ok)  // no…no, yes…yes
    lo, hi ← 0, n
    while lo < hi
        mid ← floor((lo + hi) / 2)
        if ok(mid)
            hi ← mid  // mid might be the first yes
        else
            lo ← mid + 1
    return lo  // n if nothing says yes
`;

/* ---------- Example 1: the first "yes" in a row of answers ---------- */
export type RowInput = { n: number; first: number };
export const rowExample: RowInput = { n: 9, first: 6 };
export const rowFields: InputField[] = [
  { key: "n", label: "items n", kind: "number" },
  { key: "first", label: "first yes at", kind: "number" },
];
export function rowPrepare(raw: RowInput): Prepared<RowInput> {
  if (raw.n < 1 || raw.n > 9) return { error: "Use 1 to 9 items so they fit." };
  if (raw.first < 0 || raw.first > raw.n) return { error: `The first yes is a position from 0 to ${raw.n - 1}, or ${raw.n} for none.` };
  return { input: raw };
}
const row: Approach<RowInput> = {
  id: "row",
  name: "First yes",
  code: firstTrueCode,
  run({ n, first }, t) {
    const cells = Array.from({ length: n }, (_, i) => (i >= first ? "yes" : "no"));
    firstTrueSteps({ t, cells: cells.map(() => "?"), labels: cells.map((_, i) => String(i)), ok: (i) => i >= first, lines: { check: 5, yes: 6, no: 8, done: 9 }, ask: true,
      says: (i, yes) => `ok(${i}) says ${yes ? "yes" : "no"}.`,
      intro: `The answers are hidden (?), but they run no, no, …, yes, yes: once they turn to yes they stay yes. Find where they turn by checking the middle of what's left.`,
      finish: (f) => (f < n ? `lo and hi met at ${f}: the first yes. ${Math.ceil(Math.log2(n + 1))} checks at most, instead of up to ${n} from the left.` : `Nothing said yes: the answer is n = ${n}.`) });
  },
};

/* ---------- Example 2: searching the possible answers (slowest speed that still finishes) ---------- */
export type SpeedInput = { piles: number[]; h: number };
export const speedExample: SpeedInput = { piles: [3, 6, 7, 2], h: 8 };
export const speedFields: InputField[] = [
  { key: "piles", label: "piles (1 to 9 each)", kind: "numbers" },
  { key: "h", label: "hours h", kind: "number" },
];
export function speedPrepare(raw: SpeedInput): Prepared<SpeedInput> {
  if (!raw.piles.length || raw.piles.length > 6) return { error: "Give 1 to 6 piles." };
  if (raw.piles.some((p) => p < 1 || p > 9)) return { error: "Each pile has 1 to 9 items, so the speeds fit on screen." };
  if (raw.h < raw.piles.length || raw.h > 40) return { error: `h must be at least the number of piles (${raw.piles.length}), and at most 40.` };
  return { input: raw };
}
export const hoursAt = (piles: number[], k: number) => piles.reduce((s, p) => s + Math.ceil(p / k), 0);

/** Binary search over speeds 1 … max(piles). Shared with LC 875. */
export function speedSearchSteps({ piles, h }: SpeedInput, t: T, lines = { check: 5, yes: 6, no: 8, done: 9 }) {
  const max = Math.max(...piles), cells = Array.from({ length: max }, (_, i) => i + 1);
  return firstTrueSteps({ t, cells, ok: (i) => { t.op(piles.length); return hoursAt(piles, i + 1) <= h; }, lines, ask: true, offset: 1,
    says: (i, yes) => `At speed ${i + 1}: ${piles.map((p) => `⌈${p}/${i + 1}⌉`).join(" + ")} = ${hoursAt(piles, i + 1)} hours, which is ${yes ? `within ${h}: fast enough` : `more than ${h}: too slow`}.`,
    intro: `Search the possible answers instead of a list. A speed is either fast enough or not, and every speed above a fast-enough one is also fast enough: too slow, …, too slow, fast enough, …. So binary search finds the slowest speed that works, among 1 to ${max}.`,
    finish: (f) => `The slowest speed that finishes within ${h} hours is ${f + 1}. Each check costs one pass over the ${piles.length} piles, and there are O(log max) checks: O(n log max).` }) + 1;
}
export const speedCode = `function minEatingSpeed(piles, h)
    lo, hi ← 1, max(piles) + 1  // speeds to try
    while lo < hi
        k ← floor((lo + hi) / 2)
        if hours(piles, k) ≤ h  // fast enough?
            hi ← k
        else
            lo ← k + 1
    return lo
`;
const speed: Approach<SpeedInput> = { id: "speed", name: "Search the possible speeds", code: speedCode, run(input, t) { speedSearchSteps(input, t); } };

export const rowApproaches = { row };
export const speedApproaches = { speed };
