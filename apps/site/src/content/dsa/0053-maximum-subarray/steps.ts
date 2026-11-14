import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [4, -7, 3, -1, 5, -9] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

const span = (a: number, b: number, tone: Tone): Record<number, Tone> =>
  Object.fromEntries(Array.from({ length: b - a + 1 }, (_, k) => [a + k, tone]));

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force: every subarray",
  code: `function maxSubArray(nums)
  best ← nums[0]
  for i ← 0 to length(nums) - 1
    total ← 0
    for j ← i to length(nums) - 1
      total += nums[j]
      best ← max(best, total)
  return best
`,
  run({ nums: a }, t) {
    let best = a[0], bi = 0, bj = 0;
    t.step({ line: 2, array: a, vars: { best }, message: "Try every start and every end, keeping a running total so each new end costs one addition." });
    for (let i = 0; i < a.length; i++) {
      let total = 0;
      for (let j = i; j < a.length; j++) {
        t.op();
        total += a[j];
        const better = total > best;
        if (better) { best = total; bi = i; bj = j; }
        t.step({ line: 7, array: a, pointers: { i, j }, range: [i, j], tones: { [j]: "compare" }, badge: { at: j, text: `sum ${total}` }, vars: { total, best },
          message: better ? `nums[${i}..${j}] sums to ${total}. New best.` : `nums[${i}..${j}] sums to ${total}. Best stays ${best}.` });
      }
    }
    t.step({ line: 8, array: a, range: [bi, bj], tones: span(bi, bj, "found"), vars: { best }, done: "found",
      message: `Largest sum ${best}, from index ${bi} to ${bj}.` });
  },
};

const kadane: Approach<Input> = {
  id: "kadane",
  name: "Kadane: extend or start fresh",
  code: `function maxSubArray(nums)
  best ← nums[0], cur ← nums[0]
  for each x in nums[1..end]
    cur ← max(x, cur + x)
    best ← max(best, cur)
  return best
`,
  run({ nums: a }, t) {
    let cur = a[0], best = a[0], start = 0, bi = 0, bj = 0;
    t.step({ line: 2, array: a, pointers: { i: 0 }, range: [0, 0], tones: { 0: "active" }, vars: { cur, best },
      message: "cur is the best sum of a subarray that ends right here. At each new number, either extend that run or start a new one." });
    for (let i = 1; i < a.length; i++) {
      const x = a[i];
      t.op();
      const extend = cur + x >= x; // i.e. cur >= 0
      const ask = { q: `cur = ${cur}, next x = ${x}. Extend the run or start fresh at x?`,
        options: [`Extend: ${cur} + ${x} = ${cur + x}`, `Start fresh: ${x}`], answer: extend ? 0 : 1 };
      const before = cur;
      if (extend) cur = cur + x; else { cur = x; start = i; }
      const better = cur > best;
      if (better) { best = cur; bi = start; bj = i; }
      t.step({ ask, line: 4, array: a, pointers: { i }, range: [start, i], tones: { [i]: extend ? "compare" : "active" },
        badge: { at: i, text: extend ? `${before} + ${x} = ${cur}` : `restart at ${x}` }, vars: { cur, best },
        message: extend
          ? `${before} isn't negative, so carrying it helps: extend to ${cur}.${better ? " New best." : ""}`
          : `${before} is negative and would only drag ${x} down. Start a new run at ${x}.${better ? " New best." : ""}` });
    }
    t.step({ line: 6, array: a, range: [bi, bj], tones: span(bi, bj, "found"), vars: { cur, best }, done: "found",
      message: `Largest sum ${best}, from index ${bi} to ${bj}, in one pass.` });
  },
};

export const approaches = { brute: bruteForce, kadane };

const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => ((i * 7) % 11) - 5) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: kadane, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
