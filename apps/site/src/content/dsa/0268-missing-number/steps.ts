import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { bin } from "../../concepts/40-binary-and-bits/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [4, 0, 1, 5, 2] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.nums.length;
  if (!n || n > 9) return { error: "Give 1 to 9 values." };
  if (new Set(raw.nums).size !== n || raw.nums.some((v) => !Number.isInteger(v) || v < 0 || v > n))
    return { error: `Give ${n} different whole numbers from 0 to ${n}, so exactly one of them is missing.` };
  return { input: raw };
}

const withSet: Approach<Input> = {
  id: "set",
  name: "Put them in a set, then check 0 to n",
  code: `function missingNumber(nums)
    seen ← empty set
    for each x in nums
        seen.add(x)
    for v ← 0 to length(nums)
        if v not in seen
            return v
`,
  run({ nums }, t) {
    const n = nums.length, seen = new Set<number>();
    const panel = (hl?: number) => ({ title: "seen", entries: [...seen].sort((a, b) => a - b).map((v) => [String(v), "✓"] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 2, array: nums, map: panel(), vars: { n },
      message: `The list should hold every number from 0 to ${n}, but one is missing. Remember which ones are there, then check each candidate.` });
    nums.forEach((x, i) => {
      t.op(); seen.add(x);
      t.step({ line: 4, array: nums, pointers: { x: i }, tones: { [i]: "active" }, map: panel(x), vars: { x },
        message: `Add ${x} to the set.` });
    });
    let asked = false;
    for (let v = 0; v <= n; v++) {
      t.op();
      const has = seen.has(v);
      const ask = !asked && !has ? (asked = true, { ask: { q: `Is ${v} in the set?`, options: ["No: it's the missing one", "Yes: keep checking"], answer: 0 } }) : {};
      if (!has) {
        t.step({ ...ask, line: 7, array: nums, map: panel(), vars: { v }, done: "found",
          message: `${v} isn't in the set: it's missing. O(n) time, but the set costs O(n) space.` });
        return;
      }
      t.step({ line: 6, array: nums, tones: { [nums.indexOf(v)]: "settled" }, map: panel(v), vars: { v },
        message: `${v} is there.` });
    }
  },
};

const withSum: Approach<Input> = {
  id: "sum",
  name: "Expected sum minus actual sum",
  code: `function missingNumber(nums)
    n ← length(nums)
    expected ← n · (n + 1) / 2  // 0 + 1 + … + n
    actual ← 0
    for each x in nums
        actual += x
    return expected - actual
`,
  run({ nums }, t) {
    const n = nums.length, expected = (n * (n + 1)) / 2;
    let actual = 0;
    t.step({ line: 3, array: nums, vars: { n, expected },
      message: `If nothing were missing, the numbers 0 to ${n} would add up to ${n} · ${n + 1} / 2 = ${expected}. The missing number is exactly how far short the real total falls.` });
    let asked = false;
    nums.forEach((x, i) => {
      t.op(); actual += x;
      t.step({ line: 6, array: nums, pointers: { x: i }, tones: { [i]: "active" }, vars: { expected, actual },
        message: `Add ${x}: the total so far is ${actual}.` });
    });
    t.op();
    t.step({ ask: !asked ? (asked = true, { q: `expected is ${expected} and actual is ${actual}. What's missing?`, options: [String(expected - actual), String(actual - expected + n), String(n)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 }) : undefined,
      line: 7, array: nums, tones: Object.fromEntries(nums.map((_, k) => [k, "settled" as Tone])), vars: { expected, actual, missing: expected - actual }, done: "found",
      message: `${expected} − ${actual} = ${expected - actual}. One pass, O(n), and two numbers: O(1) space. (With very large n the sums can overflow in fixed-size integers; XOR can't.)` });
  },
};

const withXor: Approach<Input> = {
  id: "xor",
  name: "XOR the positions with the values",
  code: `function missingNumber(nums)
    acc ← length(nums)  // n, the last position
    for each index i, value x in nums
        acc ← acc xor i xor x
    return acc
`,
  run({ nums }, t) {
    const n = nums.length;
    let acc = n;
    t.step({ line: 2, array: nums, vars: { acc, "acc in bits": bin(acc, 4) },
      message: `The numbers 0 to ${n} should each appear once among the values. XOR them all with the values: everything present appears twice and cancels, leaving the missing one. Positions 0 to ${n - 1} supply 0 to ${n - 1}; acc starts at ${n} to supply the last one.` });
    let asked = false;
    nums.forEach((x, i) => {
      t.op();
      const before = acc;
      acc = acc ^ i ^ x;
      const ask = !asked && i > 0 ? (asked = true, { ask: { q: `acc is ${before}. What is acc xor ${i} xor ${x}?`, options: [String(acc), String(before + i + x), String(before ^ x)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      t.step({ ...ask, line: 4, array: nums, pointers: { i }, tones: { [i]: "active" }, vars: { i, x, acc, "acc in bits": bin(acc, 4) },
        message: `acc = ${before} xor ${i} xor ${x} = ${acc}. Position ${i} and value ${x} each cancel a match, now or later.` });
    });
    t.step({ line: 5, array: nums, tones: Object.fromEntries(nums.map((_, k) => [k, "settled" as Tone])), vars: { acc }, done: "found",
      message: `Every number that's present was XORed twice and vanished. ${acc} is the missing one. One pass, O(n), O(1) space, and no risk of overflow.` });
  },
};

export const approaches = { set: withSet, sum: withSum, xor: withXor };
