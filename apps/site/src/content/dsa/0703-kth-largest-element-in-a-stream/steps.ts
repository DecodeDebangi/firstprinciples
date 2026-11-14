import { Heap, heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { k: number; nums: number[]; adds: number[] };

export const example: Input = { k: 3, nums: [5, 1, 8, 3], adds: [6, 2, 9, 4] };

export const fields: InputField[] = [
  { key: "k", label: "k", kind: "number" },
  { key: "nums", label: "starting nums", kind: "numbers" },
  { key: "adds", label: "then add", kind: "numbers" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > 7) return { error: "Use k from 1 to 7 so the heap fits." };
  if (raw.nums.length > 8) return { error: "Use at most 8 starting numbers." };
  if (raw.nums.length < raw.k - 1) return { error: `Start with at least ${raw.k - 1} numbers, so there are k after the first add.` };
  if (!raw.adds.length || raw.adds.length > 6) return { error: "Add 1 to 6 numbers." };
  return { input: raw };
}

/** 1st, 2nd, 3rd, 4th, … */
const ordinal = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] ?? "th"}`;

const answersGrid = (out: number[], hl = false) => ({ title: "add() returned", rows: [out.length ? [...out] : ["—"]], tones: hl && out.length ? { [`0,${out.length - 1}`]: "found" as Tone } : {} });

const sorted: Approach<Input> = {
  id: "sorted",
  name: "Keep everything sorted",
  code: `// vals stays sorted, smallest first
class KthLargest
  constructor(k, nums)
    this.k, this.vals ← k, sorted(nums)
  function add(val)
    insert val in sorted order  // shifts rest
    return this.vals[length(this.vals) - k]
`,
  run({ k, nums, adds }, t) {
    const a = [...nums].sort((p, q) => { t.op(); return p - q; });
    const out: number[] = [];
    const kth = () => a.length - k;
    t.step({ line: 4, array: [...a], tones: a.length >= k ? { [kth()]: "settled" } : {}, grid: answersGrid(out), vars: { k },
      message: `Keep every number, sorted. The kth largest is then always k places from the end.` });
    for (const v of adds) {
      // Binary search for the insertion point, then shift everything after it.
      let lo = 0, hi = a.length;
      while (lo < hi) { t.op(); const mid = (lo + hi) >> 1; if (a[mid] <= v) lo = mid + 1; else hi = mid; }
      const moved = a.length - lo;
      for (let s = 0; s < moved; s++) t.op();
      a.splice(lo, 0, v);
      out.push(a[kth()]);
      t.step({ ask: { q: `add(${v}): after inserting it, what's the ${k === 1 ? "largest" : `${ordinal(k)} largest`} value?`, options: [...new Set([a[kth()], a[a.length - 1], v].map(String))], answer: 0 },
        line: 7, array: [...a], tones: { [lo]: "found", [kth()]: lo === kth() ? "found" : "compare" }, badge: { at: lo, text: moved ? `${moved} shifted` : "at the end" }, grid: answersGrid(out, true),
        vars: { val: v, "items shifted": moved, answer: a[kth()] },
        message: `Insert ${v} at index ${lo}${moved ? `, shifting the ${moved} larger value${moved === 1 ? "" : "s"} one place right` : ""}. The kth largest is ${a[kth()]}.` });
    }
    t.step({ line: 7, array: [...a], tones: { [kth()]: "settled" }, grid: answersGrid(out), vars: { k, stored: a.length }, done: "found",
      message: `Returned [${out.join(", ")}]. But the list keeps every number ever added, and each insert can shift all of them: O(n) per add.` });
  },
};

const heapApproach: Approach<Input> = {
  id: "heap",
  name: "Min-heap of the k largest",
  code: `// heap: a min-heap, smallest item on top
class KthLargest
  constructor(k, nums)
    this.k, this.heap ← k, empty min-heap
    for each x in nums
      this.add(x)
  function add(val)
    this.heap.push(val)
    if length(this.heap) > this.k
      this.heap.popMin()  // drop the smallest
    return this.heap.min()  // the kth largest
`,
  run({ k, nums, adds }, t) {
    type I = { id: string; val: number };
    let next = 0;
    const H = new Heap<I>((p, q) => p.val < q.val, () => t.op());
    const out: number[] = [];
    const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ ...heapTree(H.items), tones }];
    const grid = () => answersGrid(out, true);
    t.step({ line: 4, array: [], trees: view(), grid: answersGrid(out), vars: { k, size: 0 },
      message: `Keep only the ${k} largest numbers seen so far, in a min-heap. Its top is the smallest of them: exactly the ${ordinal(k)} largest.` });
    const add = (v: number, initial: boolean) => {
      const item = { id: `v${next++}`, val: v };
      H.push(item);
      t.step({ line: 8, array: [], trees: view({ [item.id]: "active" }), grid: initial ? answersGrid(out) : grid(), vars: { val: v, size: H.size },
        message: `${initial ? "Starting number" : `add(${v})`}: push ${v}. It swaps up past any larger parent.` });
      if (H.size > k) {
        const vals = H.items.map((x) => x.val);
        const small = Math.min(...vals), large = Math.max(...vals);
        const ask = { q: `The heap holds ${H.size} numbers, one more than k = ${k}. Which one goes?`, options: [...new Set([`${small}, the smallest`, `${large}, the largest`, `${v}, the newest`])], answer: 0 };
        const gone = H.pop()!;
        t.step({ ...(ask.options.length > 1 ? { ask } : {}), line: 10, array: [], trees: view(H.size ? { [H.items[0].id]: "compare" } : {}), grid: initial ? answersGrid(out) : grid(), vars: { val: v, dropped: gone.val, size: H.size },
          message: `Pop the top, ${gone.val}: it's smaller than ${k} others, so it can never be the ${ordinal(k)} largest again.${gone.id === item.id ? ` (That was ${v} itself: too small to matter.)` : ""}` });
      }
    };
    for (const x of nums) add(x, true);
    for (const v of adds) {
      add(v, false);
      out.push(H.peek()!.val);
      t.step({ line: 11, array: [], trees: view({ [H.items[0].id]: "found" }), grid: grid(), vars: { val: v, size: H.size, answer: H.peek()!.val },
        message: `Return the top: ${H.peek()!.val}.` });
    }
    t.step({ line: 11, array: [], trees: view({ [H.items[0].id]: "settled" }), grid: answersGrid(out), vars: { k, stored: H.size }, done: "found",
      message: `Returned [${out.join(", ")}]. The heap never holds more than ${k + 1} numbers, so each add is O(log k), however long the stream runs.` });
  },
};

export const approaches = { sorted, heap: heapApproach };

const sizes = [8, 16, 32, 48, 64, 96, 128];
/** n starting numbers, then n adds that are each smaller than everything stored: the sorted list shifts it all. */
export const growth = measureGrowth([{ approach: sorted, slot: 1 }, { approach: heapApproach, slot: 2 }],
  (n) => ({ k: 3, nums: Array.from({ length: n }, (_, i) => 1000 + i), adds: Array.from({ length: n }, (_, i) => n - i) }), sizes);
