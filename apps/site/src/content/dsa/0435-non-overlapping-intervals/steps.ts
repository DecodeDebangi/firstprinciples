import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { intervalsPrepare, parseIntervals, timeline, type Iv } from "../../concepts/49-greedy-in-practice/steps";

export type Input = { pairs: number[] };
export const example: Input = { pairs: [1, 4, 2, 3, 3, 6, 5, 7, 6, 8] };
export const fields: InputField[] = [{ key: "pairs", label: "intervals (start, end pairs)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  const e = intervalsPrepare(raw.pairs);
  if (e) return { error: e };
  if (parseIntervals(raw.pairs).some(([a, b]) => a === b)) return { error: "Each interval needs start < end here." };
  return { input: raw };
}

const chainDp: Approach<Input> = {
  id: "dp",
  name: "Sort by start, longest chain that doesn't overlap",
  code: `function eraseOverlapIntervals(intervals)
    sort intervals by start
    keep ← array of n, all 1  // chain ending at i
    for i ← 1 to n - 1
        for j ← 0 to i - 1
            if intervals[j].end ≤ intervals[i].start
                keep[i] ← max(keep[i], keep[j] + 1)
    return n - max(keep)
`,
  run({ pairs }, t) {
    const ivs = [...parseIntervals(pairs)].sort((a, b) => a[0] - b[0] || a[1] - b[1]), n = ivs.length, keep = Array(n).fill(1);
    t.op(Math.ceil(n * Math.log2(Math.max(2, n))));
    const view = (cur: number, src: number[] = []) => ({ grid: timeline(ivs.map((iv, k) => ({ iv, label: `${iv[0]}–${iv[1]} keep ${k <= cur ? keep[k] : "?"}`, tone: (k === cur ? "active" : src.includes(k) ? "compare" : k < cur ? "visited" : undefined) as Tone | undefined }))) });
    t.step({ line: 3, array: [], hideStage: true, ...view(0), vars: { n },
      message: `Removing the fewest means keeping the most that don't overlap (touching ends are fine). After sorting by start, keep[i] is the longest chain of non-overlapping intervals ending with interval i. Each one looks back at every earlier interval that ends before it starts.` });
    for (let i = 1; i < n; i++) {
      const src: number[] = [];
      for (let j = 0; j < i; j++) { t.op(); if (ivs[j][1] <= ivs[i][0]) { src.push(j); keep[i] = Math.max(keep[i], keep[j] + 1); } }
      t.step({ line: 7, array: [], hideStage: true, ...view(i, src), vars: { i, "keep[i]": keep[i] },
        message: src.length ? `[${ivs[i].join(", ")}] can follow ${src.map((j) => `[${ivs[j].join(", ")}]`).join(", ")}: the longest chain ending here keeps ${keep[i]}.` : `Nothing before [${ivs[i].join(", ")}] ends in time: a chain of 1.` });
    }
    const most = Math.max(...keep);
    t.step({ line: 8, array: [], hideStage: true, ...view(n), vars: { kept: most, removed: n - most }, done: "found",
      message: `At most ${most} can be kept, so remove ${n - most}. Every interval looked back at all earlier ones: O(n²).` });
  },
};

const greedyEnd: Approach<Input> = {
  id: "greedy",
  name: "Sort by end, keep whatever fits",
  code: `function eraseOverlapIntervals(intervals)
    sort intervals by end
    kept, free ← 0, -∞  // free: last kept end
    for each s, e in intervals
        if s ≥ free
            kept += 1
            free ← e
    return length(intervals) - kept
`,
  run({ pairs }, t) {
    const ivs = [...parseIntervals(pairs)].sort((a, b) => a[1] - b[1] || a[0] - b[0]), n = ivs.length, state: (Tone | undefined)[] = Array(n).fill(undefined);
    t.op(Math.ceil(n * Math.log2(Math.max(2, n))));
    let kept = 0, free = -Infinity, asked = false;
    const view = () => ({ grid: timeline(ivs.map((iv, k) => ({ iv, tone: state[k] }))) });
    t.step({ line: 3, array: [], hideStage: true, ...view(), vars: { kept, free: "−∞" },
      message: `Sorted by end. Go through them, keeping each one that starts once the last kept one has ended. Keeping the one that ends first always leaves the most room for the rest.` });
    ivs.forEach(([s, e], k) => {
      t.op();
      const fits = s >= free;
      const q = !asked && kept > 0 ? (asked = true, { ask: { q: `The last kept interval ends at ${free}. Keep [${s}, ${e}]?`, options: ["Yes: it starts after that", "No: it overlaps, remove it"], answer: fits ? 0 : 1 } }) : {};
      if (fits) { kept++; free = e; state[k] = "settled"; } else state[k] = "miss";
      t.step({ ...q, line: fits ? 7 : 5, array: [], hideStage: true, ...view(), vars: { kept, free },
        message: fits ? `[${s}, ${e}] starts at ${s}, once the last kept one has ended: keep it. Now nothing may start before ${e}.` : `[${s}, ${e}] starts at ${s}, before ${free}: it overlaps a kept one, so remove it.` });
    });
    t.step({ line: 8, array: [], hideStage: true, ...view(), vars: { kept, removed: n - kept }, done: "found",
      message: `Keep ${kept}, remove ${n - kept}. Sorting is O(n log n), then one pass.` });
  },
};

export const approaches = { dp: chainDp, greedy: greedyEnd };

/** n short intervals in a row, none overlapping. */
export const growth = measureGrowth(
  [{ approach: chainDp, slot: 1 }, { approach: greedyEnd, slot: 3 }],
  (n) => ({ pairs: Array.from({ length: n }, (_, i) => [i, i + 1]).flat() }),
  [4, 8, 16, 24, 32],
);
export type { Iv };
