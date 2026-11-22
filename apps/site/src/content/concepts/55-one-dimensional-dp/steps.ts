import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type T = Parameters<Approach<unknown>["run"]>[1];
/** The input on top, the dp table below, lined up by index. */
export function dpGrid(input: (number | string)[], dp: (number | string)[], tones: Record<string, Tone> = {}, labels: [string, string] = ["nums", "dp"]) {
  return { title: "table", rows: [input, dp], rowLabels: labels, colLabels: input.map((_, i) => i), tones, dense: input.length > 8 };
}
const blank = (n: number) => Array(n).fill("") as (number | string)[];

/* ---------- Take or skip: the most from non-adjacent picks ---------- */

export type NumsInput = { nums: number[] };
export const robExample: NumsInput = { nums: [4, 1, 2, 9, 3, 1, 5] };
export const robFields: InputField[] = [{ key: "nums", label: "nums (0 or more)", kind: "numbers" }];
export function robPrepare(raw: NumsInput): Prepared<NumsInput> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { error: "Use whole numbers from 0 to 99." };
  return { input: raw };
}
export const robCode = `function rob(nums)
    dp ← array of n, all 0  // dp[i]: best of 0..i
    dp[0] ← nums[0]
    if n > 1
        dp[1] ← max(nums[0], nums[1])
    for i ← 2 to n - 1
        dp[i] ← max(dp[i - 1], dp[i - 2] + nums[i])
    return dp[n - 1]
`;
/** Bottom-up take-or-skip; steps point at robCode's lines. */
export function robSteps(t: T, nums: number[]) {
  const n = nums.length, dp = blank(n);
  let asked = false;
  t.step({ line: 2, array: [], grid: dpGrid(nums, dp), vars: {},
    message: "dp[i] is the most you can collect from positions 0 to i without taking two neighbours. At each position there are only two choices: skip it (keep dp[i − 1]), or take it (its value plus dp[i − 2], since its neighbour must be skipped)." });
  t.op(); dp[0] = nums[0];
  t.step({ line: 3, array: [], grid: dpGrid(nums, [...dp], { "1,0": "found", "0,0": "compare" }), vars: { "dp[0]": nums[0] }, message: `With only position 0, take it: dp[0] = ${nums[0]}.` });
  if (n > 1) {
    t.op(); dp[1] = Math.max(nums[0], nums[1]);
    t.step({ line: 5, array: [], grid: dpGrid(nums, [...dp], { "1,1": "found", "0,0": "compare", "0,1": "compare" }), vars: { "dp[1]": dp[1] }, message: `Positions 0 and 1 are neighbours, so take the bigger: dp[1] = max(${nums[0]}, ${nums[1]}) = ${dp[1]}.` });
  }
  for (let i = 2; i < n; i++) {
    t.op();
    const skip = dp[i - 1] as number, take = (dp[i - 2] as number) + nums[i];
    const ask = !asked ? (asked = true, { ask: { q: `At ${i}: skipping keeps dp[${i - 1}] = ${skip}; taking gives ${nums[i]} + dp[${i - 2}] = ${take}. What's dp[${i}]?`, options: [...new Set([Math.max(skip, take), Math.min(skip, take), skip + nums[i]].map(String))], answer: 0 } }) : {};
    dp[i] = Math.max(skip, take);
    t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 7, array: [], grid: dpGrid(nums, [...dp], { [`1,${i}`]: "found", [`1,${i - 1}`]: skip >= take ? "compare" : "discard", [`1,${i - 2}`]: take > skip ? "compare" : "discard", [`0,${i}`]: take > skip ? "compare" : "discard" }), vars: { i, skip, take, [`dp[${i}]`]: dp[i] },
      message: `Position ${i} (${nums[i]}): skip it and keep ${skip}, or take it for ${nums[i]} + ${dp[i - 2]} = ${take}. ${take > skip ? "Taking" : "Skipping"} is better: dp[${i}] = ${dp[i]}.` });
  }
  t.step({ line: 8, array: [], grid: dpGrid(nums, [...dp], { [`1,${n - 1}`]: "found" }), vars: { answer: dp[n - 1] }, done: "found",
    message: `The answer is dp[${n - 1}] = ${dp[n - 1]}. Each position looked back two places once: O(n) time, O(n) space, or O(1) keeping just the last two values.` });
  return dp[n - 1] as number;
}
const takeSkip: Approach<NumsInput> = { id: "takeSkip", name: "Take or skip, position by position", code: robCode, run({ nums }, t) { robSteps(t, nums); } };

/* ---------- Best ending here: longest increasing subsequence ---------- */

export const lisExample: NumsInput = { nums: [3, 8, 4, 9, 5, 6, 2] };
export const lisFields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function lisPrepare(raw: NumsInput): Prepared<NumsInput> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers." };
  return { input: raw };
}
export const lisCode = `function lengthOfLIS(nums)
    dp ← array of n, all 1  // longest ending at i
    for i ← 1 to n - 1
        for j ← 0 to i - 1
            if nums[j] < nums[i]
                dp[i] ← max(dp[i], dp[j] + 1)
    return max of dp
`;
/** dp[i] = longest increasing subsequence ending at i; steps point at lisCode's lines. */
export function lisSteps(t: T, nums: number[]) {
  const n = nums.length, dp = Array(n).fill(1) as number[];
  let asked = false;
  t.step({ line: 2, array: [], grid: dpGrid(nums, [...dp]), vars: {},
    message: "dp[i] is the length of the longest increasing run of picks that ends exactly at position i. Each number alone is a run of 1. To end at i, the pick before it must be an earlier, smaller number: extend the best of those." });
  for (let i = 1; i < n; i++) {
    const smaller: number[] = [];
    for (let j = 0; j < i; j++) { t.op(); if (nums[j] < nums[i]) smaller.push(j); }
    const best = smaller.length ? Math.max(...smaller.map((j) => dp[j])) : 0;
    const from = smaller.find((j) => dp[j] === best);
    const val = best + 1;
    const ask = !asked && smaller.length > 1 ? (asked = true, { ask: { q: `Before ${nums[i]}, the smaller numbers have dp values ${smaller.map((j) => dp[j]).join(", ")}. What's dp[${i}]?`, options: [...new Set([val, smaller.length + 1, best].map(String))], answer: 0 } }) : {};
    dp[i] = val;
    t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 6, array: [], grid: dpGrid(nums, [...dp], { ...Object.fromEntries(Array.from({ length: i }, (_, j) => [`0,${j}`, (nums[j] < nums[i] ? "compare" : "discard") as Tone])), ...(from !== undefined ? { [`1,${from}`]: "compare" } : {}), [`1,${i}`]: "found", [`0,${i}`]: "active" }), vars: { i, "nums[i]": nums[i], [`dp[${i}]`]: val },
      message: smaller.length ? `${nums[i]}: earlier smaller numbers are ${smaller.map((j) => nums[j]).join(", ")} (blue). The longest run ending at one of them is ${best}${from !== undefined ? ` (at ${nums[from]})` : ""}, so dp[${i}] = ${best} + 1 = ${val}.` : `${nums[i]}: nothing earlier is smaller, so the best run ending here is just ${nums[i]}: dp[${i}] = 1.` });
  }
  const ans = Math.max(...dp), at = dp.indexOf(ans);
  t.step({ line: 7, array: [], grid: dpGrid(nums, [...dp], { [`1,${at}`]: "found" }), vars: { answer: ans }, done: "found",
    message: `The longest increasing subsequence can end anywhere, so the answer is the biggest dp value: ${ans}. Each position looked back at every earlier one: O(n²) time, O(n) space.` });
  return ans;
}
const endingHere: Approach<NumsInput> = { id: "endingHere", name: "Best run ending at each position", code: lisCode, run({ nums }, t) { lisSteps(t, nums); } };

export const robApproaches = { takeSkip };
export const lisApproaches = { endingHere };
