import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { isRotatedSorted } from "../0153-find-minimum-in-rotated-sorted-array/steps";

export type Input = { nums: number[]; target: number };
export const example: Input = { nums: [7, 9, 12, 15, 1, 3, 5], target: 3 };
export const fields: InputField[] = [
  { key: "nums", label: "nums (a rotated sorted list)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (new Set(raw.nums).size !== raw.nums.length || !isRotatedSorted(raw.nums)) return { error: "Give different values in increasing order, possibly rotated, like 7, 9, 1, 3." };
  return { input: raw };
}
const outside = (n: number, lo: number, hi: number) => Object.fromEntries(Array.from({ length: n }, (_, k) => k).filter((k) => k < lo || k > hi).map((k) => [k, "discard" as Tone]));

const scan: Approach<Input> = {
  id: "scan",
  name: "Check every position",
  code: `function search(nums, target)
    for i ← 0 to length(nums) - 1
        if nums[i] = target
            return i
    return -1
`,
  run({ nums, target }, t) {
    t.step({ line: 2, array: nums, vars: { target }, message: `Ignore the order and compare every value with ${target}.` });
    for (let i = 0; i < nums.length; i++) {
      t.op();
      const hit = nums[i] === target;
      t.step({ line: hit ? 4 : 3, array: nums, pointers: { i }, tones: { [i]: hit ? "found" : "compare" }, vars: { i, target }, ...(hit ? { done: "found" as const } : {}),
        message: hit ? `nums[${i}] = ${target}: return ${i}. O(n) in the worst case.` : `nums[${i}] = ${nums[i]}, not ${target}.` });
      if (hit) return;
    }
    t.step({ line: 5, array: nums, vars: { target }, done: "notfound", message: `${target} isn't there: return -1, after all ${nums.length} comparisons.` });
  },
};

const binary: Approach<Input> = {
  id: "binary",
  name: "Binary search on the sorted half",
  code: `function search(nums, target)
    lo, hi ← 0, length(nums) - 1
    while lo ≤ hi
        mid ← floor((lo + hi) / 2)
        if nums[mid] = target
            return mid
        if nums[lo] ≤ nums[mid]  // left half sorted
            if nums[lo] ≤ target < nums[mid]
                hi ← mid - 1
            else
                lo ← mid + 1
        else  // the right half is sorted
            if nums[mid] < target ≤ nums[hi]
                lo ← mid + 1
            else
                hi ← mid - 1
    return -1
`,
  run({ nums, target }, t) {
    const n = nums.length;
    let lo = 0, hi = n - 1, asked = false;
    t.step({ line: 2, array: nums, pointers: { lo, hi }, vars: { lo, hi, target },
      message: `Split anywhere and at least one half is sorted, because the list has only one drop. Check whether ${target} lies inside the sorted half's range; if so search there, otherwise search the other half.` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      t.op();
      if (nums[mid] === target) {
        t.step({ line: 6, array: nums, range: [lo, hi], pointers: { mid }, tones: { ...outside(n, lo, hi), [mid]: "found" }, vars: { lo, hi, mid }, done: "found",
          message: `nums[${mid}] = ${target}: found at ${mid}. O(log n).` });
        return;
      }
      t.op();
      const leftSorted = nums[lo] <= nums[mid];
      const inLeft = leftSorted ? nums[lo] <= target && target < nums[mid] : !(nums[mid] < target && target <= nums[hi]);
      const q = !asked ? (asked = true, { ask: { q: `The ${leftSorted ? "left" : "right"} half, ${nums[leftSorted ? lo : mid + 1] ?? "–"} to ${nums[leftSorted ? mid - 1 : hi] ?? "–"}, is sorted. Is ${target} inside its range?`, options: ["Yes: search that half", "No: search the other half"], answer: (leftSorted ? inLeft : !inLeft) ? 0 : 1 } }) : {};
      const why = leftSorted
        ? `nums[${lo}] = ${nums[lo]} ≤ nums[${mid}] = ${nums[mid]}, so the left half is sorted. ${target} is ${inLeft ? `between ${nums[lo]} and ${nums[mid]}: go left` : `not between ${nums[lo]} and ${nums[mid]}: go right`}.`
        : `nums[${lo}] = ${nums[lo]} > nums[${mid}] = ${nums[mid]}, so the drop is on the left and the right half is sorted. ${target} is ${!inLeft ? `between ${nums[mid]} and ${nums[hi]}: go right` : `not between ${nums[mid]} and ${nums[hi]}: go left`}.`;
      if (inLeft) hi = mid - 1; else lo = mid + 1;
      t.step({ ...q, line: leftSorted ? (inLeft ? 9 : 11) : (inLeft ? 16 : 14), array: nums, range: lo <= hi ? [lo, hi] : null, pointers: { mid }, tones: { ...outside(n, lo, hi), [mid]: "miss" }, vars: { lo, hi, mid },
        message: why });
    }
    t.step({ line: 17, array: nums, tones: outside(n, 1, 0), vars: { target }, done: "notfound", message: `The range is empty: ${target} isn't in the list. Return -1.` });
  },
};

export const approaches = { scan, binary };

/** n values rotated, searching for one near the end. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: binary, slot: 3 }],
  (n) => { const nums = Array.from({ length: n }, (_, i) => ((i + Math.floor(n / 3)) % n) * 2 + 1); return { nums, target: nums[n - 1] }; },
  [8, 16, 32, 64, 128],
);
