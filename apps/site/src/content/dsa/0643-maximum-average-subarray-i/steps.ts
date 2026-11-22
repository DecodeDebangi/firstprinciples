import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; k: number };
export const example: Input = { nums: [3, -2, 6, 1, -4, 8, 2], k: 3 };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "window length k", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (raw.k < 1 || raw.k > raw.nums.length) return { error: `k must be from 1 to ${raw.nums.length}.` };
  return { input: raw };
}
const avg = (s: number, k: number) => Number((s / k).toFixed(2));
const win = (n: number, l: number, r: number, extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries(Array.from({ length: n }, (_, i) => [i, (i >= l && i <= r ? "settled" : "discard") as Tone])), ...extra });

const recompute: Approach<Input> = {
  id: "recompute",
  name: "Add up every window from scratch",
  code: `function findMaxAverage(nums, k)
    best ← -∞
    for start ← 0 to length(nums) - k
        total ← 0
        for i ← start to start + k - 1
            total += nums[i]
        best ← max(best, total)
    return best / k
`,
  run({ nums, k }, t) {
    let best = -Infinity;
    t.step({ line: 2, array: nums, vars: { k }, message: `Every stretch of ${k} values is a window. Add each one up from scratch and keep the biggest total; dividing by ${k} at the end gives the average.` });
    for (let s = 0; s + k <= nums.length; s++) {
      t.op(k);
      const total = nums.slice(s, s + k).reduce((a, b) => a + b, 0);
      const better = total > best;
      if (better) best = total;
      t.step({ line: 7, array: nums, range: [s, s + k - 1], tones: win(nums.length, s, s + k - 1), vars: { start: s, total, best },
        message: `Window ${s}..${s + k - 1}: ${nums.slice(s, s + k).join(" + ")} = ${total}, ${k} additions.${better ? " The biggest so far." : ""}` });
    }
    t.step({ line: 8, array: nums, vars: { best, average: avg(best, k) }, done: "found",
      message: `The best total is ${best}, an average of ${avg(best, k)}. ${nums.length - k + 1} windows × ${k} additions: O(n · k).` });
  },
};

const slide: Approach<Input> = {
  id: "slide",
  name: "Slide a running sum",
  code: `function findMaxAverage(nums, k)
    total ← sum of nums[0..k-1]
    best ← total
    for right ← k to length(nums) - 1
        total += nums[right] - nums[right - k]
        best ← max(best, total)
    return best / k
`,
  run({ nums, k }, t) {
    let total = nums.slice(0, k).reduce((a, b) => a + b, 0), best = total, asked = false;
    t.op(k);
    t.step({ line: 3, array: nums, range: [0, k - 1], tones: win(nums.length, 0, k - 1), vars: { total, best },
      message: `Add up the first window once: ${total}. Moving the window one place right only adds the value that enters and drops the one that leaves.` });
    for (let r = k; r < nums.length; r++) {
      t.op(2);
      const inn = nums[r], out = nums[r - k], before = total;
      total += inn - out;
      const opts = [String(total), String(before + inn), String(before - out)].filter((o, i, a) => a.indexOf(o) === i);
      const q = !asked && opts.length > 1 ? (asked = true, { ask: { q: `The window's total is ${before}. ${inn} enters and ${out} leaves. What's the new total?`, options: opts, answer: 0 } }) : {};
      const better = total > best;
      if (better) best = total;
      t.step({ ...q, line: 5, array: nums, range: [r - k + 1, r], tones: win(nums.length, r - k + 1, r, { [r]: "active", [r - k]: "miss" }), vars: { total, best },
        message: `${before} + ${inn} − ${out} = ${total}.${better ? " The biggest so far." : ""}` });
    }
    t.step({ line: 7, array: nums, vars: { best, average: avg(best, k) }, done: "found",
      message: `The best total is ${best}, an average of ${avg(best, k)}. Two operations per step: O(n), whatever k is.` });
  },
};

export const approaches = { recompute, slide };

/** n values with windows of length n / 2. */
export const growth = measureGrowth(
  [{ approach: recompute, slot: 1 }, { approach: slide, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 7) % 11 - 5), k: n / 2 }),
  [8, 16, 32, 48, 64],
);
