import { Heap, heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { nums: number[]; k: number };
export const example: Input = { nums: [7, 2, 9, 4, 6, 1, 8], k: 3 };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "k", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers." };
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > raw.nums.length) return { error: `k must be from 1 to ${raw.nums.length}, the number of values.` };
  if (raw.k > 7) return { error: "Use k up to 7 so the heap fits." };
  return { input: raw };
}
export const ordinal = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] ?? "th"}`;

const sortAll: Approach<Input> = {
  id: "sort",
  name: "Sort, then count k from the end",
  code: `function findKthLargest(nums, k)
    sort nums  // smallest first
    return nums[length(nums) - k]
`,
  run({ nums, k }, t) {
    t.step({ line: 2, array: [...nums], vars: { k }, message: `Sort all ${nums.length} numbers. Then the kth largest sits k places from the end.` });
    const a = [...nums].sort((p, q) => { t.op(); return p - q; });
    const at = a.length - k;
    t.step({ line: 3, array: a, pointers: { "n-k": at }, tones: Object.fromEntries(a.map((_, i) => [i, (i === at ? "found" : i > at ? "settled" : "discard") as Tone])), vars: { k, answer: a[at] }, done: "found",
      message: `Sorted, the ${k === 1 ? "largest" : `${ordinal(k)} largest`} is at index ${at}: ${a[at]}. But sorting put all ${a.length} numbers in order to find one: O(n log n).` });
  },
};

const heap: Approach<Input> = {
  id: "heap",
  name: "Min-heap of the k largest",
  code: `function findKthLargest(nums, k)
    heap ← empty min-heap
    for each x in nums
        heap.push(x)
        if length(heap) > k
            heap.popMin()  // not in the top k
    return heap.min()
`,
  run({ nums, k }, t) {
    type I = { id: string; val: number };
    const H = new Heap<I>((a, b) => a.val < b.val, () => t.op());
    const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ ...heapTree(H.items), tones, label: `the ${k} largest so far` }];
    t.step({ line: 2, array: [...nums], trees: view(), vars: { k },
      message: `Keep only the ${k} largest numbers seen so far, in a min-heap. Its top is the smallest of them, which is exactly the ${ordinal(k)} largest so far.` });
    let asked = false;
    nums.forEach((x, i) => {
      const it = { id: `n${i}`, val: x };
      H.push(it);
      if (H.size <= k) {
        t.step({ line: 4, array: [...nums], pointers: { x: i }, tones: { [i]: "active" }, trees: view({ [it.id]: "active" }), vars: { x, size: H.size },
          message: `Push ${x}. The heap holds ${H.size} of ${k}, so nothing needs to go yet.` });
        return;
      }
      const vals = H.items.map((y) => y.val), small = Math.min(...vals);
      const ask = !asked ? (asked = true, { ask: { q: `After pushing ${x}, the heap holds ${vals.join(", ")}: one more than k = ${k}. Which goes?`, options: [...new Set([String(small), String(Math.max(...vals)), String(x)])], answer: 0 } }) : {};
      const gone = H.pop()!;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 6, array: [...nums], pointers: { x: i }, tones: { [i]: gone.id === it.id ? "discard" : "active" }, trees: view({ [H.items[0].id]: "compare" }), vars: { x, dropped: gone.val, size: H.size },
        message: gone.id === it.id ? `Push ${x}, then pop the smallest: ${x} itself. It's smaller than all ${k} kept, so it can't be in the top ${k}.` : `Push ${x}, then pop the smallest, ${gone.val}: ${k} numbers beat it now, so it can never be the ${ordinal(k)} largest.` });
    });
    const top = H.peek()!;
    t.step({ line: 7, array: [...nums], tones: Object.fromEntries(nums.map((_, i) => [i, (H.items.some((y) => y.id === `n${i}`) ? "settled" : "discard") as Tone])), trees: view({ [top.id]: "found" }), vars: { answer: top.val }, done: "found",
      message: `The heap holds the ${k} largest; its top, ${top.val}, is the ${ordinal(k)} largest. Each number cost O(log k) on a heap of at most ${k + 1}: O(n log k), with O(k) extra space.` });
  },
};

export const approaches = { sort: sortAll, heap };

/** Random-looking numbers with k = 3: sorting grows like n log n, the small heap like n log 3. */
export const growth = measureGrowth(
  [{ approach: sortAll, slot: 1 }, { approach: heap, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 37) % 101), k: 3 }),
  [8, 16, 32, 64, 128, 256],
);
