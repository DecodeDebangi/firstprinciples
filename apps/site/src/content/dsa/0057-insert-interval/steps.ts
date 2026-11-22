import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { intervalsPrepare, parseIntervals, timeline, type Iv } from "../../concepts/49-greedy-in-practice/steps";

export type Input = { pairs: number[]; add: number[] };
export const example: Input = { pairs: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10], add: [4, 7] };
export const fields: InputField[] = [
  { key: "pairs", label: "sorted, separate intervals", kind: "numbers" },
  { key: "add", label: "new interval (start, end)", kind: "numbers" },
];
export function prepare(raw: Input): Prepared<Input> {
  const e = intervalsPrepare(raw.pairs, 5);
  if (e) return { error: e };
  const ivs = parseIntervals(raw.pairs);
  if (ivs.some((iv, i) => i > 0 && iv[0] <= ivs[i - 1][1])) return { error: "The intervals must be sorted and must not overlap or touch." };
  if (raw.add.length !== 2 || intervalsPrepare(raw.add)) return { error: "The new interval is two numbers, start then end, from 0 to 10." };
  return { input: raw };
}
const show = (ivs: Iv[]) => ivs.map(([a, b]) => `[${a}, ${b}]`).join(", ");

const sortAll: Approach<Input> = {
  id: "sortAll",
  name: "Add it, sort, merge everything",
  code: `function insert(intervals, newInterval)
    intervals.push(newInterval)
    sort intervals by start
    return merge(intervals)  // see Merge Intervals
`,
  run({ pairs, add }, t) {
    const all: Iv[] = [...parseIntervals(pairs), [add[0], add[1]] as Iv].sort((a, b) => a[0] - b[0]);
    const n = all.length;
    t.op(Math.ceil(n * Math.log2(Math.max(2, n))));
    t.step({ line: 3, array: [], hideStage: true, grid: timeline(all.map((iv) => ({ iv, tone: iv[0] === add[0] && iv[1] === add[1] ? "active" as Tone : undefined }))), vars: { intervals: n },
      message: `The simplest way: add the new interval, sort everything by start, and merge overlapping intervals as in Merge Intervals. It ignores that the list was already sorted.` });
    const out: Iv[] = [];
    for (const [s, e] of all) { t.op(); const last = out[out.length - 1]; if (last && s <= last[1]) last[1] = Math.max(last[1], e); else out.push([s, e]); }
    t.step({ line: 4, array: [], hideStage: true, grid: timeline(out.map((iv) => ({ iv, tone: "settled" as Tone })), "result"), vars: { result: show(out) }, done: "found",
      message: `Result: ${show(out)}. The sort costs O(n log n), more than this needs.` });
  },
};

const onePass: Approach<Input> = {
  id: "onePass",
  name: "One pass: before, overlapping, after",
  code: `function insert(intervals, newInterval)
    s, e ← newInterval
    result ← empty list
    i ← 0
    while i < n and intervals[i].end < s  // before
        result.push(intervals[i])
        i += 1
    while i < n and intervals[i].start ≤ e  // merge
        s ← min(s, intervals[i].start)
        e ← max(e, intervals[i].end)
        i += 1
    result.push([s, e])
    while i < n  // after
        result.push(intervals[i])
        i += 1
    return result
`,
  run({ pairs, add }, t) {
    const ivs = parseIntervals(pairs), n = ivs.length, out: Iv[] = [];
    let [s, e] = add, i = 0, asked = false;
    const view = (cur: number, tone: Tone, merging = false) => ({ grid: timeline([
      ...ivs.map((iv, k) => ({ iv, tone: (k === cur ? tone : k < cur ? "visited" : undefined) as Tone | undefined })),
      { iv: [s, e] as Iv, label: `new ${s}–${e}`, tone: (merging ? "found" : "active") as Tone },
    ]) });
    t.step({ line: 4, array: [], hideStage: true, ...view(-1, "active"), vars: { s, e },
      message: `The list is already sorted and separate. So it splits into three runs: intervals that end before the new one starts, intervals that overlap it, and intervals that start after it ends. Copy, merge, copy.` });
    while (i < n && ivs[i][1] < s) {
      t.op(); out.push(ivs[i]);
      t.step({ line: 6, array: [], hideStage: true, ...view(i, "settled"), vars: { s, e, i },
        message: `[${ivs[i].join(", ")}] ends at ${ivs[i][1]}, before the new interval starts at ${s}: copy it unchanged.` });
      i++;
    }
    while (i < n && ivs[i][0] <= e) {
      t.op();
      const q = !asked ? (asked = true, { ask: { q: `[${ivs[i].join(", ")}] starts at ${ivs[i][0]}, and the new interval is [${s}, ${e}]. What happens?`, options: [`They overlap: grow to [${Math.min(s, ivs[i][0])}, ${Math.max(e, ivs[i][1])}]`, "Copy it unchanged"], answer: 0 } }) : {};
      s = Math.min(s, ivs[i][0]); e = Math.max(e, ivs[i][1]);
      t.step({ ...q, line: 10, array: [], hideStage: true, ...view(i, "compare", true), vars: { s, e, i },
        message: `[${ivs[i].join(", ")}] starts at ${ivs[i][0]}, no later than ${e}: it overlaps, so the new interval grows to [${s}, ${e}].` });
      i++;
    }
    out.push([s, e]);
    t.step({ line: 12, array: [], hideStage: true, ...view(i - 1, "visited", true), vars: { s, e },
      message: `Add the merged interval [${s}, ${e}].` });
    while (i < n) { t.op(); out.push(ivs[i]); i++; }
    t.step({ line: 16, array: [], hideStage: true, grid: timeline(out.map((iv) => ({ iv, tone: "settled" as Tone })), "result"), vars: { result: show(out) }, done: "found",
      message: `Copy the rest unchanged. Result: ${show(out)}. Each interval was looked at once: O(n).` });
  },
};

export const approaches = { sortAll, onePass };

/** n separate intervals, the new one landing in the middle. */
export const growth = measureGrowth(
  [{ approach: sortAll, slot: 1 }, { approach: onePass, slot: 3 }],
  (n) => ({ pairs: Array.from({ length: n }, (_, i) => [3 * i, 3 * i + 1]).flat(), add: [3 * Math.floor(n / 2) - 1, 3 * Math.floor(n / 2) - 1] }),
  [4, 8, 12, 16, 20],
);
