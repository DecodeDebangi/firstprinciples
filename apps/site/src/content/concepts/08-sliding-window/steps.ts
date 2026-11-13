import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; k: number; target: number };

export const example: Input = { nums: [3, 1, 4, 1, 2, 6, 2, 3], k: 3, target: 8 };

export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "window size k", kind: "number" },
  { key: "target", label: "target sum", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1 || raw.nums.length > 10) return { error: "Use 1 to 10 numbers so the window fits." };
  if (raw.nums.some((x) => x <= 0)) return { error: "Use positive numbers only: the grow-and-shrink window relies on sums only growing as it widens." };
  if (raw.k < 1 || raw.k > raw.nums.length) return { error: `k must be between 1 and ${raw.nums.length}.` };
  if (raw.target < 1) return { error: "Use a target of at least 1." };
  return { input: raw };
}

/** Items left of the window are finished: they sink. */
const inWindow = (lo: number): Record<number, Tone> => Object.fromEntries(Array.from({ length: lo }, (_, i) => [i, "discard" as Tone]));

const recompute: Approach<Input> = {
  id: "recompute",
  name: "Recompute every window",
  code: `def max_window_sum(a, k):
    best = None
    for i in range(len(a) - k + 1):
        s = 0
        for j in range(i, i + k):
            s += a[j]  # add it again
        if best is None or s > best:
            best = s
    return best
`,
  run({ nums: a, k }, t) {
    let best: number | null = null;
    t.step({ line: 2, array: a, vars: { k, best: null }, message: `Find the largest sum of ${k} neighbours in a row. The direct way: for every window, add up its ${k} numbers from scratch.` });
    for (let i = 0; i + k <= a.length; i++) {
      let s = 0;
      for (let j = i; j < i + k; j++) {
        t.op();
        s += a[j];
        t.step({ line: 6, array: a, range: [i, i + k - 1], pointers: { j }, tones: { [j]: "active" }, vars: { k, i, s, best },
          message: `${j === i ? `New window at ${i}: start from 0. ` : ""}Add ${a[j]}: the sum is ${s}.${i > 0 && j <= i + k - 2 ? ` ${a[j]} was already added for the last window.` : ""}` });
      }
      const better = best === null || s > best;
      if (better) best = s;
      t.step({ line: better ? 8 : 7, array: a, range: [i, i + k - 1], tones: Object.fromEntries(Array.from({ length: k }, (_, d) => [i + d, better ? "found" : "compare"])), vars: { k, i, s, best },
        message: better ? `Window [${i}..${i + k - 1}] sums to ${s}: the best so far.` : `Window [${i}..${i + k - 1}] sums to ${s}, not more than ${best}.` });
    }
    t.step({ line: 9, array: a, vars: { k, best }, done: "found",
      message: `Best: ${best}. Every number was added up to ${k} times, once for each window it sits in: O(n·k).` });
  },
};

const slide: Approach<Input> = {
  id: "slide",
  name: "Fixed window: add one, drop one",
  code: `def max_window_sum(a, k):
    s = sum(a[:k])  # the first window
    best = s
    for r in range(k, len(a)):
        s += a[r] - a[r - k]  # in, out
        best = max(best, s)
    return best
`,
  run({ nums: a, k }, t) {
    let s = 0;
    for (let j = 0; j < k; j++) { t.op(); s += a[j]; }
    let best = s;
    t.step({ line: 3, array: a, range: [0, k - 1], tones: Object.fromEntries(Array.from({ length: k }, (_, d) => [d, "found"])), vars: { k, s, best },
      message: `Add up the first window once: ${a.slice(0, k).join(" + ")} = ${s}.` });
    for (let r = k; r < a.length; r++) {
      t.op(); t.op();
      const out = r - k;
      const [s0, best0] = [s, best];
      s += a[r] - a[out];
      const better = s > best0;
      best = Math.max(best0, s);
      t.step({ ...(r === k ? { ask: { q: `The window moves one step right. What has to change in its sum of ${s0}?`, options: ["One number joins, one leaves", `All ${k} numbers are added again`], answer: 0 } } : {}),
        line: 5, array: a, range: [out + 1, r], pointers: { r }, tones: { ...inWindow(out + 1), [r]: "active", [out]: "miss" }, badge: { at: r, text: `+${a[r]} −${a[out]}` },
        vars: { k, s, best },
        message: `${a[r]} joins and ${a[out]} leaves: ${s0} + ${a[r]} − ${a[out]} = ${s}.${better ? " A new best." : ""}` });
    }
    t.step({ line: 7, array: a, vars: { k, best }, done: "found",
      message: `Best: ${best}. Each move cost one addition and one subtraction, whatever k is: O(n).` });
  },
};

const grow: Approach<Input> = {
  id: "grow-shrink",
  name: "Variable window: grow, then shrink",
  code: `def shortest_window(a, target):  # a[i] > 0
    best = float("inf")
    lo = s = 0
    for hi, x in enumerate(a):
        s += x  # grow right
        while s >= target:
            best = min(best, hi - lo + 1)
            s -= a[lo]  # shrink left
            lo += 1
    return 0 if best == float("inf") else best
`,
  run({ nums: a, target }, t) {
    let lo = 0, s = 0, best = Infinity;
    const show = (b: number) => (b === Infinity ? "∞" : b);
    t.step({ line: 3, array: a, vars: { target, lo, hi: null, s, best: "∞" },
      message: `Find the shortest run of neighbours that adds up to at least ${target}. Grow the window on the right until it's big enough, then shrink it from the left while it still is.` });
    let prev: { lo: number; hi: number; s: number } | null = null;
    for (let hi = 0; hi < a.length; hi++) {
      t.op();
      const ask = prev ? { q: `The window [${prev.lo}..${prev.hi}] sums to ${prev.s}; the target is ${target}. What next?`, options: ["Grow it to the right", "Shrink it from the left"], answer: 0 } : undefined;
      s += a[hi];
      t.step({ ...(ask ? { ask } : {}), line: 5, array: a, range: [lo, hi], pointers: { lo, hi }, tones: { ...inWindow(lo), [hi]: "active" }, badge: { at: hi, text: `+${a[hi]}` },
        vars: { target, lo, hi, s, best: show(best) },
        message: `Add ${a[hi]}: the window sums to ${s}${s >= target ? `, at least ${target}` : `, still below ${target}`}.` });
      while (s >= target) {
        t.op();
        const [lo0, s0] = [lo, s];
        const len = hi - lo + 1;
        const better = len < best;
        best = Math.min(best, len);
        s -= a[lo];
        lo++;
        t.step({ ask: { q: `The window [${lo0}..${hi}] sums to ${s0}; the target is ${target}. What next?`, options: ["Grow it to the right", "Shrink it from the left"], answer: 1 },
          line: 8, array: a, range: lo <= hi ? [lo, hi] : null, pointers: { lo: Math.min(lo, hi), hi }, tones: { ...inWindow(lo0), [lo0]: "miss" }, badge: { at: lo0, text: `−${a[lo0]}` },
          vars: { target, lo, hi, s, best: show(best) },
          message: `${s0} ≥ ${target}, so [${lo0}..${hi}] works: length ${len}${better ? ", the shortest so far" : ""}. Drop ${a[lo0]} from the left to try a shorter one: the sum is now ${s}.` });
      }
      prev = { lo, hi, s };
    }
    t.step({ line: 10, array: a, tones: inWindow(lo), vars: { target, best: show(best) }, done: best === Infinity ? "notfound" : "found",
      message: best === Infinity ? `No run adds up to ${target}, even the whole array: return 0.` : `Shortest: ${best}. Each index joined the window once and left at most once, so the two loops do at most 2n steps: O(n).` });
  },
};

export const approaches = { recompute, slide, "grow-shrink": grow };

const sizes = [8, 16, 32, 48, 64, 96, 128];
/** Window size n / 2: the recompute version's worst case. */
export const growth = measureGrowth([{ approach: recompute, slot: 1 }, { approach: slide, slot: 2 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i % 7) + 1), k: Math.floor(n / 2), target: 1 }), sizes);
