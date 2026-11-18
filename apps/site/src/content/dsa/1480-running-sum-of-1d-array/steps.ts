import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [3, 1, 4, 1, 5] };
export const fields: InputField[] = [{ key: "nums", label: "values", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values so both rows fit." };
  return { input: raw };
}
const outGrid = (out: (number | string)[], tones: Record<number, Tone> = {}) => ({
  title: "answer", rows: [[...out]], colLabels: out.map((_, k) => k), tones: Object.fromEntries(Object.entries(tones).map(([k, tn]) => [`0,${k}`, tn])),
});

const fromScratch: Approach<Input> = {
  id: "scratch",
  name: "Re-add from the start for every position",
  code: `function runningSum(nums)
    answer ← array of length(nums), all 0
    for i ← 0 to length(nums) - 1
        total ← 0
        for j ← 0 to i
            total += nums[j]
        answer[i] ← total
    return answer
`,
  run({ nums }, t) {
    const out: (number | string)[] = nums.map(() => "");
    t.step({ line: 2, array: nums, grid: outGrid(out), vars: {},
      message: "answer[i] must be the sum of nums[0] through nums[i]. The direct way: for each position, add up everything from the start." });
    for (let i = 0; i < nums.length; i++) {
      let total = 0;
      for (let j = 0; j <= i; j++) { t.op(); total += nums[j]; }
      out[i] = total;
      t.step({ line: 7, array: nums, range: [0, i], pointers: { i }, grid: outGrid(out, { [i]: "found" }), vars: { i, total, additions: i + 1 },
        message: `answer[${i}]: add nums[0..${i}] from scratch, ${i + 1} addition${i ? "s" : ""}: ${nums.slice(0, i + 1).join(" + ")} = ${total}.${i ? ` But ${nums.slice(0, i).join(" + ")} was already added up for answer[${i - 1}].` : ""}` });
    }
    const n = nums.length;
    t.step({ line: 8, array: nums, grid: outGrid(out, Object.fromEntries(out.map((_, k) => [k, "settled" as Tone]))), vars: {}, done: "found",
      message: `Done, with 1 + 2 + … + ${n} = ${(n * (n + 1)) / 2} additions: O(n²). Every position re-adds the whole start of the array.` });
  },
};

const running: Approach<Input> = {
  id: "running",
  name: "Keep one running total (optimal)",
  code: `function runningSum(nums)
    answer ← array of length(nums), all 0
    total ← 0
    for i ← 0 to length(nums) - 1
        total += nums[i]
        answer[i] ← total
    return answer
`,
  run({ nums }, t) {
    const out: (number | string)[] = nums.map(() => "");
    let total = 0;
    t.step({ line: 3, array: nums, grid: outGrid(out), vars: { total },
      message: "Each running sum is the previous one plus one more value. So carry one total along: add nums[i], and that's answer[i]." });
    let asked = false;
    for (let i = 0; i < nums.length; i++) {
      t.op();
      const before = total;
      total += nums[i];
      out[i] = total;
      const ask = !asked && i >= 1 && before !== nums[i] && nums[i] !== 0 && before !== 0
        ? (asked = true, { ask: { q: `answer[${i - 1}] is ${before} and nums[${i}] is ${nums[i]}. What is answer[${i}]?`, options: [String(total), String(nums[i]), String(before)], answer: 0 } }) : {};
      t.step({ ...ask, line: 6, array: nums, pointers: { i }, tones: { [i]: "active" }, grid: outGrid(out, { [i]: "found", ...(i ? { [i - 1]: "compare" } : {}) }), vars: { total },
        message: `total = ${before} + ${nums[i]} = ${total}, so answer[${i}] = ${total}. One addition.` });
    }
    t.step({ line: 7, array: nums, grid: outGrid(out, Object.fromEntries(out.map((_, k) => [k, "settled" as Tone]))), vars: { total }, done: "found",
      message: `Done in ${nums.length} additions: O(n) time. Apart from the answer itself, only total: O(1) extra space. (You could even write the totals straight into nums.)` });
  },
};

export const approaches = { fromScratch, running };

export const growth = measureGrowth(
  [{ approach: fromScratch, slot: 1 }, { approach: running, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i % 7) - 3) }),
  [4, 8, 16, 24, 32],
);
