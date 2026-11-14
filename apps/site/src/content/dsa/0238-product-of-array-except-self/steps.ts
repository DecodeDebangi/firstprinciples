import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [2, 3, 1, 4] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "nums needs at least two numbers." };
  if (raw.nums.length > 8) return { error: "Use at most 8 numbers so every row fits." };
  return { input: raw };
}

const sides = (n: number, i: number): Record<number, Tone> =>
  Object.fromEntries(Array.from({ length: n }, (_, k) => [k, k < i ? "side-a" : k > i ? "side-b" : "compare"] as const));

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `function productExceptSelf(nums)
  n ← length(nums)
  out ← empty list
  for i ← 0 to n - 1
    p ← 1
    for j ← 0 to n - 1
      if j ≠ i
        p *= nums[j]
    out.push(p)
  return out
`,
  run({ nums: a }, t) {
    const n = a.length;
    const out: (number | string)[] = Array(n).fill("·");
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "out", rows: [[...out]], tones });
    t.step({ line: 3, array: a, grid: grid(), vars: { i: null, p: null }, message: "For each position, multiply every other number from scratch." });
    for (let i = 0; i < n; i++) {
      let p = 1;
      for (let j = 0; j < n; j++) if (j !== i) { t.op(); p *= a[j]; }
      out[i] = p;
      t.step({ line: 9, array: a, pointers: { i }, tones: sides(n, i), badge: { at: i, text: `= ${p}` }, grid: grid({ [`0,${i}`]: "found" }),
        vars: { i, p }, message: `Everything except nums[${i}] multiplies to ${p}: ${n - 1} multiplications, most of them repeated from the last position.` });
    }
    t.step({ line: 10, array: a, grid: grid(Object.fromEntries(out.map((_, k) => [`0,${k}`, "settled" as Tone]))), vars: { i: null, p: null }, done: "found",
      message: `Done, after ${n * (n - 1)} multiplications.` });
  },
};

const twoArrays: Approach<Input> = {
  id: "arrays",
  name: "Prefix and suffix arrays",
  code: `function productExceptSelf(nums)
  n ← length(nums)
  left, right ← two arrays of n, all 1
  for i ← 1 to n - 1
    left[i] ← left[i - 1] * nums[i - 1]
  for i ← n - 2 down to 0
    right[i] ← right[i + 1] * nums[i + 1]
  return [left[i] * right[i] for each i]
`,
  run({ nums: a }, t) {
    const n = a.length;
    const left = Array(n).fill(1), right = Array(n).fill(1);
    const out: (number | string)[] = Array(n).fill("·");
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "rows: left · right · out", rows: [[...left], [...right], [...out]], tones });
    t.step({ line: 3, array: a, grid: grid(), vars: { i: null },
      message: "The answer at i is (product of everything left of i) × (product of everything right of i). Build both as tables." });
    for (let i = 1; i < n; i++) {
      t.op();
      left[i] = left[i - 1] * a[i - 1];
      t.step({ line: 5, array: a, pointers: { i }, tones: { [i - 1]: "side-a", [i]: "compare" }, grid: grid({ [`0,${i}`]: "found", [`0,${i - 1}`]: "compare" }),
        vars: { i }, message: `left[${i}] = left[${i - 1}] × nums[${i - 1}] = ${left[i - 1]} × ${a[i - 1]} = ${left[i]}.` });
    }
    for (let i = n - 2; i >= 0; i--) {
      t.op();
      right[i] = right[i + 1] * a[i + 1];
      t.step({ line: 7, array: a, pointers: { i }, tones: { [i + 1]: "side-b", [i]: "compare" }, grid: grid({ [`1,${i}`]: "found", [`1,${i + 1}`]: "compare" }),
        vars: { i }, message: `right[${i}] = right[${i + 1}] × nums[${i + 1}] = ${right[i + 1]} × ${a[i + 1]} = ${right[i]}.` });
    }
    for (let i = 0; i < n; i++) {
      t.op();
      out[i] = left[i] * right[i];
    }
    t.step({ line: 8, array: a, grid: grid(Object.fromEntries(out.map((_, k) => [`2,${k}`, "found" as Tone]))), vars: { i: null }, done: "found",
      message: `Multiply the two tables position by position: [${out.join(", ")}]. Linear time, but two extra arrays.` });
  },
};

const oneArray: Approach<Input> = {
  id: "inplace",
  name: "One output array",
  code: `function productExceptSelf(nums)
  n ← length(nums)
  out ← array of n, all 1
  for i ← 1 to n - 1
    out[i] ← out[i - 1] * nums[i - 1]
  right ← 1
  for i ← n - 1 down to 0
    out[i] *= right
    right *= nums[i]
  return out
`,
  run({ nums: a }, t) {
    const n = a.length;
    const out = Array(n).fill(1);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "out", rows: [[...out]], tones });
    t.step({ line: 3, array: a, grid: grid(), vars: { right: null },
      message: "Same idea, less memory: fill out with the left products, then sweep back multiplying in a running right product." });
    for (let i = 1; i < n; i++) {
      t.op();
      out[i] = out[i - 1] * a[i - 1];
      t.step({ ...(i === 1 ? { ask: { q: `out[${i}] should hold the product of everything left of ${i}. What is it?`, options: [`out[${i - 1}] × nums[${i - 1}]`, `nums[${i}] × nums[${i - 1}]`], answer: 0 } } : {}),
        line: 5, array: a, pointers: { i }, tones: { [i - 1]: "side-a", [i]: "compare" }, grid: grid({ [`0,${i}`]: "found" }), vars: { right: null },
        message: `out[${i}] = ${out[i - 1]} × ${a[i - 1]} = ${out[i]}: the product of everything left of ${i}.` });
    }
    let right = 1;
    for (let i = n - 1; i >= 0; i--) {
      t.op(2);
      const before = out[i];
      out[i] *= right;
      const r0 = right;
      right *= a[i];
      t.step({ ...(i === n - 1 ? { ask: { q: `out[${i}] holds the product left of ${i}. What does it get multiplied by?`, options: ["right: the product of everything to its right", `nums[${i}] itself`], answer: 0 } } : {}),
        line: 8, array: a, pointers: { i }, tones: { ...Object.fromEntries(Array.from({ length: n - 1 - i }, (_, k) => [i + 1 + k, "side-b" as Tone])), [i]: "compare" },
        badge: { at: i, text: `${before} × ${r0} = ${out[i]}` }, grid: grid({ [`0,${i}`]: "found" }), vars: { right },
        message: `out[${i}] = ${before} × ${r0} = ${out[i]}. Then fold nums[${i}] into right: ${r0} × ${a[i]} = ${right}.` });
    }
    t.step({ line: 10, array: a, grid: grid(Object.fromEntries(out.map((_, k) => [`0,${k}`, "settled" as Tone]))), vars: { right }, done: "found",
      message: `[${out.join(", ")}] with no division and no extra arrays beyond the answer itself.` });
  },
};

export const approaches = { brute: bruteForce, arrays: twoArrays, inplace: oneArray };

const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => (i % 3) + 1) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    // The two-array version does the same ~3n multiplications, so its line would hide under this one.
    { approach: oneArray, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
