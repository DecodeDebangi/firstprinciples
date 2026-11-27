import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { lowbit } from "../../concepts/65-range-query-trees/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [4, 9, 2, 7, 2, 5, 1] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers so everything fits." };
  return { input: raw };
}
const list = (a: number[]) => `[${a.join(", ")}]`;

const brute: Approach<Input> = {
  id: "brute", name: "Check every later number",
  code: `function countSmaller(nums)
    out ← list of n zeros
    for i from 0 to n − 1
        for j from i + 1 to n − 1
            if nums[j] < nums[i]
                out[i] ← out[i] + 1
    return out
`,
  run({ nums }, t) {
    const n = nums.length, out = Array(n).fill(0);
    if (t.record) t.step({ line: 2, array: nums, vars: { out: list(out) }, message: "For each number, count how many numbers to its right are smaller. The direct way looks at every later number." });
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) { t.op(); if (nums[j] < nums[i]) out[i]++; }
      if (t.record) t.step({ line: 6, array: nums, pointers: { i }, tones: { [i]: "active", ...Object.fromEntries(nums.map((x, j) => [j, j > i ? (x < nums[i] ? "found" : "discard") : "idle"]).filter(([, x]) => x !== "idle")) }, vars: { i, checked: n - 1 - i, out: list(out) },
        message: `${nums[i]}: of the ${n - 1 - i} number${n - 1 - i === 1 ? "" : "s"} after it, ${out[i]} ${out[i] === 1 ? "is" : "are"} smaller.` });
    }
    if (t.record) t.step({ line: 7, array: nums, vars: { out: list(out) }, done: "found", message: `${list(out)}. That compared every pair: n(n − 1)/2 checks, O(n²).` });
  },
};

const fenwick: Approach<Input> = {
  id: "fenwick", name: "Walk right to left, counting with a Fenwick tree",
  code: `function countSmaller(nums)
    vals ← sorted distinct values of nums
    rank(x) ← position of x in vals, from 1
    m ← length(vals)
    tree ← m zeros, positions 1 to m
    out ← list of n zeros
    for i from n − 1 down to 0
        r ← rank(nums[i])
        out[i] ← prefix(r − 1)  // seen and smaller
        add(r, 1)  // now nums[i] has been seen
    return out
// prefix and add as in a Fenwick tree:
// prefix(k) jumps k ← k − lowbit(k) adding tree[k]
// add(k, 1) jumps k ← k + lowbit(k) adding 1
`,
  run({ nums }, t) {
    const n = nums.length, vals = [...new Set(nums)].sort((a, b) => { t.op(); return a - b; }), m = vals.length;
    const rank = new Map(vals.map((v, k) => [v, k + 1])), tree = Array(m + 1).fill(0), seen = Array(m).fill(0), out = Array(n).fill(0);
    let asked = 0;
    const g = (tones: Record<string, Tone> = {}) => ({ title: "by rank", rows: [vals, seen, tree.slice(1)], rowLabels: ["value", "seen", "tree"], colLabels: vals.map((_, k) => k + 1), tones });
    if (t.record) t.step({ line: 5, array: nums, grid: g(), vars: { out: list(out) },
      message: `Walk from the right. Then "smaller numbers after nums[i]" means "smaller numbers already seen". Number the ${m} distinct values by size (their rank), and keep a Fenwick tree of how many of each rank have been seen, so "how many seen with rank below r" is a fast prefix total.` });
    for (let i = n - 1; i >= 0; i--) {
      const r = rank.get(nums[i])!;
      let total = 0;
      const hits: number[] = [];
      for (let k = r - 1; k > 0; k -= lowbit(k)) { t.op(); total += tree[k]; hits.push(k); }
      out[i] = total;
      const smaller = seen.slice(0, r - 1).reduce((a, b) => a + b, 0);
      const ask = t.record && asked < 2 && i < n - 1 ? (asked++, { ask: { q: `${nums[i]} has rank ${r}. Ranks 1 to ${r - 1} have been seen ${smaller} time${smaller === 1 ? "" : "s"} in all. What is out[${i}]?`, options: [String(smaller), String(n - 1 - i), String(r - 1), String(smaller + 1)].filter((x, k, a) => a.indexOf(x) === k).slice(0, 3), answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 9, array: nums, pointers: { i }, tones: { [i]: "active", ...Object.fromEntries(nums.map((_, j) => [j, "settled" as Tone]).slice(i + 1)) }, grid: g({ ...Object.fromEntries(Array.from({ length: r - 1 }, (_, k) => [`1,${k}`, "side-a" as Tone])), ...Object.fromEntries(hits.map((k) => [`2,${k - 1}`, "found" as Tone])), [`0,${r - 1}`]: "active" }), vars: { "nums[i]": nums[i], rank: r, "out[i]": total, out: list(out) },
        message: r === 1 ? `${nums[i]} is the smallest value (rank 1): nothing can be smaller, so out[${i}] = 0.` : `${nums[i]} has rank ${r}. Already seen with a smaller rank: prefix(${r - 1}) = ${hits.map((k) => `tree[${k}]`).join(" + ")} = ${total}. So out[${i}] = ${total}.` });
      const up: number[] = [];
      for (let k = r; k <= m; k += lowbit(k)) { t.op(); tree[k]++; up.push(k); }
      seen[r - 1]++;
      if (t.record) t.step({ line: 10, array: nums, pointers: { i }, tones: { ...Object.fromEntries(nums.map((_, j) => [j, "settled" as Tone]).slice(i)) }, grid: g({ [`1,${r - 1}`]: "found", ...Object.fromEntries(up.map((k) => [`2,${k - 1}`, "active" as Tone])) }), vars: { "nums[i]": nums[i], rank: r, out: list(out) },
        message: `Mark ${nums[i]} as seen: add 1 at rank ${r}, which updates ${up.map((k) => `tree[${k}]`).join(", ")}.` });
    }
    if (t.record) t.step({ line: 11, array: nums, grid: g(), vars: { out: list(out) }, done: "found",
      message: `${list(out)}. Sorting is O(n log n), and each number does one prefix and one add of O(log n): O(n log n) in all.` });
  },
};

export const approaches = { brute, fenwick };
/** Distinct values in a scrambled order. */
export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: fenwick, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, k) => (k * 37) % n) }),
  [8, 16, 32, 64, 128, 256],
);
