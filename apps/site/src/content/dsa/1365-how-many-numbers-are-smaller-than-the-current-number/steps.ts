import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [7, 2, 9, 2, 4] };
export const fields: InputField[] = [{ key: "nums", label: "nums (0 to 9)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2 || raw.nums.length > 9) return { error: "Use 2 to 9 numbers." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 9)) return { error: "Use whole numbers from 0 to 9, so the count table fits (the real problem allows up to 100)." };
  return { input: raw };
}
const outGrid = (out: (number | string)[], fresh = -1) => ({ title: "answer", rows: [out], tones: fresh >= 0 ? { [`0,${fresh}`]: "found" as Tone } : {} });

const brute: Approach<Input> = {
  id: "brute",
  name: "Compare every pair",
  code: `function smallerNumbersThanCurrent(nums)
    result ← array of n, all 0
    for i ← 0 to n - 1
        for each x in nums
            if x < nums[i]
                result[i] += 1
    return result
`,
  run({ nums }, t) {
    const out: (number | string)[] = nums.map(() => "");
    t.step({ line: 2, array: [...nums], grid: outGrid(out), vars: {}, message: "For each number, scan the whole list and count the values smaller than it." });
    let asked = false;
    nums.forEach((v, i) => {
      let k = 0;
      nums.forEach((x) => { t.op(); if (x < v) k++; });
      const ask = !asked && i > 0 ? (asked = true, { ask: { q: `How many values in ${nums.join(", ")} are smaller than ${v}?`, options: [...new Set([k, k + 1, nums.filter((x) => x <= v).length].map(String))], answer: 0 } }) : {};
      out[i] = k;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 6, array: [...nums], pointers: { i }, tones: { ...Object.fromEntries(nums.map((x, j) => [j, (x < v ? "compare" : "discard") as Tone])), [i]: "active" }, grid: outGrid([...out], i), vars: { "nums[i]": v, smaller: k },
        message: `${v}: a full scan finds ${k} smaller value${k === 1 ? "" : "s"}${k ? ` (${nums.filter((x) => x < v).join(", ")})` : ""}.` });
    });
    t.step({ line: 7, array: [...nums], grid: outGrid([...out]), vars: {}, done: "found", message: `Done, but every number scanned all n values: O(n²).` });
  },
};

const counting: Approach<Input> = {
  id: "counting",
  name: "Count each value, then add up",
  code: `function smallerNumbersThanCurrent(nums)
    count ← array of 101, all 0  // values 0 to 100
    for each x in nums
        count[x] += 1
    below ← array of 101, all 0
    for v ← 1 to 100
        below[v] ← below[v - 1] + count[v - 1]
    result ← empty list
    for each x in nums
        result.push(below[x])
    return result
`,
  run({ nums }, t) {
    const K = 10, cnt = Array(K).fill(0);
    nums.forEach((x) => { t.op(); cnt[x]++; });
    const below = Array(K).fill(0);
    const table = (rows: (number | string)[][], tones: Record<string, Tone> = {}) => ({ title: "per value", rows, rowLabels: ["count", "below"], colLabels: Array.from({ length: K }, (_, i) => i), tones, dense: true });
    t.step({ line: 4, array: [...nums], grid: table([cnt.slice(), below.map(() => "")]), vars: {},
      message: `The values are small, so count how many times each appears, without comparing any two numbers. (The table here runs 0 to 9; the real problem's runs 0 to 100.)` });
    for (let v = 1; v < K; v++) { t.op(); below[v] = below[v - 1] + cnt[v - 1]; }
    const v0 = nums[0];
    const opts = [...new Set([below[v0], below[v0] + cnt[v0], below[v0] + 1].map(String))];
    t.step({ ask: { q: `below[v] counts values smaller than v. What's below[${v0}]?`, options: opts, answer: 0 }, line: 7, array: [...nums], grid: table([cnt.slice(), below.slice()], Object.fromEntries(Array.from({ length: K }, (_, i) => [`1,${i}`, "settled" as Tone]))), vars: {},
      message: `Running totals: below[v] = below[v − 1] + count[v − 1], the number of values smaller than v. For example below[${v0}] = ${below[v0]}.` });
    const out = nums.map((x) => { t.op(); return below[x]; });
    t.step({ line: 11, array: [...nums], grid: outGrid(out), vars: {}, done: "found",
      message: `Each answer is one lookup: [${out.join(", ")}]. Counting is O(n), the running totals O(k) for k possible values: O(n + k), with O(k) extra space.` });
  },
};

export const approaches = { brute, counting };

export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: counting, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 7) % 10) }),
  [8, 16, 32, 64, 128],
);
