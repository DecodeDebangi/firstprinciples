import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { fmt, medianFields, medianPrepare, medianSteps, type StreamInput } from "../../concepts/52-heaps-in-practice/steps";

export type Input = StreamInput;
export const example: Input = { nums: [6, 3, 9, 4, 1, 7] };
export const fields = medianFields;
export const prepare = medianPrepare;

const sorted: Approach<Input> = {
  id: "sorted",
  name: "Keep every number sorted",
  code: `class MedianFinder
    vals ← empty list  // kept sorted
    function addNum(x)
        insert x in sorted order  // shifts the rest
    function findMedian()
        n ← length(vals)
        if n is odd
            return vals[floor(n / 2)]
        return (vals[n / 2 - 1] + vals[n / 2]) / 2
`,
  run({ nums }, t) {
    const vals: number[] = [], outs: string[] = [];
    const grid = (fresh = false) => ({ title: "medians", rows: [outs.length ? [...outs] : ["—"]], tones: fresh && outs.length ? { [`0,${outs.length - 1}`]: "found" as Tone } : {} });
    t.step({ line: 2, array: [], grid: grid(), vars: {}, message: "Keep every number in one sorted list. The median is then the middle value, or the average of the middle two." });
    let asked = false;
    nums.forEach((x) => {
      let lo = 0, hi = vals.length;
      while (lo < hi) { t.op(); const mid = (lo + hi) >> 1; if (vals[mid] <= x) lo = mid + 1; else hi = mid; }
      const shifted = vals.length - lo;
      for (let s = 0; s < shifted; s++) t.op();
      vals.splice(lo, 0, x);
      const n = vals.length, odd = n % 2 === 1;
      const med = odd ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2;
      const ask = !asked && !odd ? (asked = true, { ask: { q: `The sorted list is ${vals.join(", ")}. What's the median?`, options: [...new Set([fmt(med), String(vals[n / 2]), String(vals[n / 2 - 1])])], answer: 0 } }) : {};
      outs.push(fmt(med));
      const mids = odd ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: odd ? 8 : 9, array: [...vals], tones: { [lo]: "active", ...Object.fromEntries(mids.map((i) => [i, "found" as Tone])) }, badge: { at: lo, text: shifted ? `${shifted} shifted` : "at the end" }, grid: grid(true), vars: { x, shifted, median: fmt(med) },
        message: `Insert ${x} at index ${lo}${shifted ? `, shifting ${shifted} larger value${shifted === 1 ? "" : "s"} right` : ""}. ${odd ? `The middle value is ${med}.` : `The middle two are ${vals[n / 2 - 1]} and ${vals[n / 2]}: median ${fmt(med)}.`}` });
    });
    t.step({ line: 4, array: [...vals], grid: grid(), vars: { count: vals.length }, done: "found",
      message: `Finding the spot is a quick binary search, but inserting shifts every larger value: O(n) per number, O(n²) for a stream of n.` });
  },
};

const heaps: Approach<Input> = {
  id: "heaps",
  name: "Two heaps: the smaller and larger halves",
  code: `class MedianFinder
    low ← empty max-heap  // the smaller half
    high ← empty min-heap  // the larger half
    function addNum(x)
        if low is empty or x ≤ low.max()
            low.push(x)
        else
            high.push(x)
        if length(low) > length(high) + 1
            high.push(low.popMax())  // rebalance
        if length(high) > length(low)
            low.push(high.popMin())
    function findMedian()
        if length(low) > length(high)
            return low.max()
        return (low.max() + high.min()) / 2
`,
  run({ nums }, t) {
    t.step({ line: 2, array: [...nums], trees: [{ root: null, nodes: [], label: "smaller half (max-heap)" }, { root: null, nodes: [], label: "larger half (min-heap)" }], grid: { title: "medians", rows: [["—"]] }, vars: {},
      message: "The median only depends on the middle of the sorted order. Keep the smaller half in a max-heap and the larger half in a min-heap; the middle values are then the two tops." });
    medianSteps(t, nums, { low: 6, high: 8, toHigh: 10, toLow: 12, odd: 15, even: 16, end: 14 });
  },
};

export const approaches = { sorted, heaps };

/** Numbers arriving in decreasing order: each insert into the sorted list shifts everything. */
export const growth = measureGrowth(
  [{ approach: sorted, slot: 1 }, { approach: heaps, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => n - i) }),
  [8, 16, 32, 64, 128, 256],
);
