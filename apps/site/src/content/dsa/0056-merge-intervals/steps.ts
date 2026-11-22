import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { intervalsPrepare, parseIntervals, timeline, type Iv } from "../../concepts/49-greedy-in-practice/steps";

export type Input = { pairs: number[] };
export const example: Input = { pairs: [6, 8, 1, 3, 2, 4, 7, 9, 0, 1] };
export const fields: InputField[] = [{ key: "pairs", label: "intervals (start, end pairs)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> { const e = intervalsPrepare(raw.pairs); return e ? { error: e } : { input: raw }; }
const show = (ivs: Iv[]) => ivs.map(([a, b]) => `[${a}, ${b}]`).join(", ");
const overlap = (a: Iv, b: Iv) => a[0] <= b[1] && b[0] <= a[1];

const repeat: Approach<Input> = {
  id: "repeat",
  name: "Merge any overlapping pair, repeat",
  code: `function merge(intervals)
    repeat
        find two intervals that overlap
        if there are none
            return intervals
        replace both with one interval covering both
`,
  run({ pairs }, t) {
    let ivs = parseIntervals(pairs);
    t.step({ line: 2, array: [], hideStage: true, grid: timeline(ivs.map((iv) => ({ iv }))), vars: { intervals: ivs.length },
      message: `Two intervals overlap when each starts before (or as) the other ends. Find any overlapping pair, replace it with one interval covering both, and look again, until no pair overlaps.` });
    for (;;) {
      let pair: [number, number] | null = null;
      for (let i = 0; i < ivs.length && !pair; i++) for (let j = i + 1; j < ivs.length && !pair; j++) { t.op(); if (overlap(ivs[i], ivs[j])) pair = [i, j]; }
      if (!pair) {
        t.step({ line: 5, array: [], hideStage: true, grid: timeline(ivs.map((iv) => ({ iv, tone: "settled" as Tone }))), vars: { intervals: ivs.length }, done: "found",
          message: `No two intervals overlap: ${show(ivs)}. Each round compares every pair, O(n²), and there can be n rounds: O(n³).` });
        return;
      }
      const [i, j] = pair, merged: Iv = [Math.min(ivs[i][0], ivs[j][0]), Math.max(ivs[i][1], ivs[j][1])];
      t.step({ line: 6, array: [], hideStage: true, grid: timeline(ivs.map((iv, k) => ({ iv, tone: k === i || k === j ? "compare" as Tone : undefined }))), vars: { intervals: ivs.length },
        message: `[${ivs[i].join(", ")}] and [${ivs[j].join(", ")}] overlap: replace them with [${merged.join(", ")}].` });
      ivs = [...ivs.filter((_, k) => k !== i && k !== j), merged];
    }
  },
};

const sortSweep: Approach<Input> = {
  id: "sort",
  name: "Sort by start, then sweep once",
  code: `function merge(intervals)
    sort intervals by start
    result ← empty list
    for each s, e in intervals
        last ← result.last()  // none if empty
        if last ≠ none and s ≤ last.end
            last.end ← max(last.end, e)
        else
            result.push([s, e])
    return result
`,
  run({ pairs }, t) {
    const ivs = [...parseIntervals(pairs)].sort((a, b) => a[0] - b[0]);
    t.op(Math.ceil(ivs.length * Math.log2(Math.max(2, ivs.length))));
    const out: Iv[] = [];
    const view = (cur: number, tone: Tone) => ({ grid: timeline([...ivs.map((iv, k) => ({ iv, tone: k === cur ? tone : k < cur ? "visited" as Tone : undefined })), ...out.map((iv) => ({ iv, label: `→ ${iv[0]}–${iv[1]}`, tone: "settled" as Tone }))], "sorted intervals, then the result (→)") });
    t.step({ line: 2, array: [], hideStage: true, ...view(-1, "active"), vars: {},
      message: `Sorted by start: ${show(ivs)}. Now each interval either overlaps the last merged one (it starts before that one ends) or begins a new one, so one pass is enough. The result rows are marked →.` });
    let asked = false;
    ivs.forEach(([s, e], k) => {
      t.op();
      const last = out[out.length - 1], joins = !!last && s <= last[1], lastEnd = last?.[1];
      const q = !asked && last ? (asked = true, { ask: { q: `The last merged interval is [${last.join(", ")}] and the next is [${s}, ${e}]. What happens?`, options: [`It overlaps: extend to [${last[0]}, ${Math.max(last[1], e)}]`, `It starts a new interval`], answer: joins ? 0 : 1 } }) : {};
      if (joins) last[1] = Math.max(last[1], e); else out.push([s, e]);
      t.step({ ...q, line: joins ? 7 : 9, array: [], hideStage: true, ...view(k, joins ? "found" : "active"), vars: { s, e },
        message: joins ? `[${s}, ${e}] starts at ${s} ≤ ${lastEnd}, where the last merged interval ends: it overlaps, so that interval becomes [${last.join(", ")}].` : `[${s}, ${e}] starts after the last merged interval ends: it begins a new one.` });
    });
    t.step({ line: 10, array: [], hideStage: true, grid: timeline(out.map((iv) => ({ iv, tone: "settled" as Tone })), "merged"), vars: { result: show(out) }, done: "found",
      message: `Merged: ${show(out)}. Sorting is O(n log n), and the sweep is O(n).` });
  },
};

export const approaches = { repeat, sort: sortSweep };

/** n intervals that chain together one by one. */
export const growth = measureGrowth(
  [{ approach: repeat, slot: 1 }, { approach: sortSweep, slot: 3 }],
  (n) => ({ pairs: Array.from({ length: n }, (_, i) => [2 * (n - i), 2 * (n - i) + 2]).flat() }),
  [4, 8, 12, 16, 24],
);
