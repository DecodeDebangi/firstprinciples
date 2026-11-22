import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { firstTrueSteps } from "../../concepts/47-binary-search-on-answers/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [6, 8, 9, 12, 2, 3, 5] };
export const fields: InputField[] = [{ key: "nums", label: "nums (a rotated sorted list)", kind: "numbers" }];
/** True when nums is an increasing list of different values turned at one point. */
export const isRotatedSorted = (a: number[]) => { let drops = 0; for (let i = 0; i < a.length; i++) if (a[i] >= a[(i + 1) % a.length]) drops++; return a.length === 1 || drops === 1; };
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (new Set(raw.nums).size !== raw.nums.length || !isRotatedSorted(raw.nums)) return { error: "Give different values in increasing order, possibly rotated, like 6, 8, 9, 2, 3." };
  return { input: raw };
}

const scan: Approach<Input> = {
  id: "scan",
  name: "Look at every value",
  code: `function findMin(nums)
    best ← nums[0]
    for each x in nums
        best ← min(best, x)
    return best
`,
  run({ nums }, t) {
    let best = nums[0], at = 0;
    t.step({ line: 2, array: nums, vars: { best }, message: `The simplest way ignores the order: look at every value and keep the smallest.` });
    nums.forEach((x, i) => {
      t.op();
      if (x < best) { best = x; at = i; }
      t.step({ line: 4, array: nums, pointers: { x: i }, tones: { [i]: "compare", [at]: "found" } as Record<number, Tone>, vars: { x, best },
        message: x === best && i === at ? `${x} is the smallest so far.` : `${x} isn't smaller than ${best}.` });
    });
    t.step({ line: 5, array: nums, tones: { [at]: "found" }, vars: { best }, done: "found",
      message: `The minimum is ${best}, after looking at all ${nums.length} values: O(n). The list's order was never used.` });
  },
};

const binary: Approach<Input> = {
  id: "binary",
  name: "Binary search for the drop",
  code: `function findMin(nums)
    last ← nums[length(nums) - 1]
    lo, hi ← 0, length(nums)
    while lo < hi
        mid ← floor((lo + hi) / 2)
        if nums[mid] ≤ last  // in the lower run?
            hi ← mid
        else
            lo ← mid + 1
    return nums[lo]
`,
  run({ nums }, t) {
    const last = nums[nums.length - 1];
    firstTrueSteps({ t, cells: nums, ok: (i) => nums[i] <= last, lines: { check: 6, yes: 7, no: 9, done: 10 }, ask: true, answerName: "lo",
      says: (i, yes) => `nums[${i}] = ${nums[i]} is ${yes ? `≤ ${last}, so it's in the lower run, which starts with the minimum` : `> ${last}, so it's in the upper run, before the drop`}.`,
      intro: `A rotated sorted list is two increasing runs: an upper run, then a lower run that ends with the last value, ${last}. Asking "is nums[i] ≤ ${last}?" gives no for the upper run and yes for the lower run, so the first yes is the minimum.`,
      finish: (f) => `The first value ≤ ${last} is nums[${f}] = ${nums[f]}: the minimum. O(log n) checks.` });
  },
};

export const approaches = { scan, binary };

/** n sorted values rotated so the minimum sits near the end. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: binary, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => ((i + 2) % n) + 1) }),
  [8, 16, 32, 64, 128],
);
