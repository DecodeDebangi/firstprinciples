import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { bin, bitsOf, placeLabels, type BitTracer } from "../40-binary-and-bits/steps";

/* ---------- Dropping the lowest 1 ---------- */
export type DropInput = { x: number };
export const dropExample: DropInput = { x: 44 };
export const dropFields: InputField[] = [{ key: "x", label: "x (0 to 255)", kind: "number" }];
export function dropPrepare(raw: DropInput): Prepared<DropInput> {
  if (raw.x < 0 || raw.x > 255) return { error: "Use a number from 0 to 255, so it fits in 8 bits." };
  return { input: raw };
}

/** Counts the 1 bits of x with x & (x − 1), one step per 1. Shared with LC 191. */
export function dropSteps(x0: number, t: BitTracer, lines: { loop: number; done: number }) {
  let x = x0, count = 0;
  const grid = (rows: number[][], labels: string[], tones: Record<string, Tone> = {}) => ({ grid: { title: "bits", rows, rowLabels: labels, colLabels: placeLabels(), dense: true, tones } });
  t.step({ line: 2, array: [], hideStage: true, ...grid([bitsOf(x)], ["x"]), vars: { x, count },
    message: `x = ${x0} is ${bin(x0)}. Subtracting 1 turns the lowest 1 into a 0 and every 0 after it into a 1. So x & (x − 1) keeps everything else and wipes out exactly that lowest 1.` });
  let asked = false;
  while (x > 0) {
    t.op();
    const y = x - 1, z = x & y, low = 7 - Math.log2(x & -x);
    const ask = !asked && z > 0
      ? (asked = true, { ask: { q: `x is ${bin(x)}. Which bit does x & (x − 1) remove?`, options: [`The lowest 1 (the ${2 ** (7 - low)}s place)`, "The highest 1", "Every 1"], answer: 0 } }) : {};
    count++;
    const tones: Record<string, Tone> = { [`0,${low}`]: "miss", [`2,${low}`]: "discard" };
    for (let c = low; c < 8; c++) tones[`1,${c}`] = "compare";
    t.step({ ...ask, line: lines.loop, array: [], hideStage: true, ...grid([bitsOf(x), bitsOf(y), bitsOf(z)], ["x", "x − 1", "x & (x − 1)"], tones), vars: { x: z, count },
      message: `${x} & ${y} = ${z}: the lowest 1 (the ${2 ** (7 - low)}s place) is gone, and every higher bit is unchanged. That's ${count} one${count > 1 ? "s" : ""} so far.` });
    x = z;
  }
  t.step({ line: lines.done, array: [], hideStage: true, ...grid([bitsOf(x0)], [`${x0}`]), vars: { count }, done: "found",
    message: `x reached 0 after ${count} step${count === 1 ? "" : "s"}: ${x0} has ${count} bit${count === 1 ? "" : "s"} set. The loop runs once per 1, not once per bit.` });
  return count;
}

const drop: Approach<DropInput> = {
  id: "drop",
  name: "Drop the lowest 1 until nothing is left",
  code: `function countOnes(x)
    count ← 0
    while x > 0
        x ← x & (x - 1)  // drop the lowest 1
        count += 1
    return count
`,
  run({ x }, t) { dropSteps(x, t, { loop: 4, done: 6 }); },
};

/* ---------- XOR cancelling pairs ---------- */
export type XorInput = { nums: number[] };
export const xorExample: XorInput = { nums: [5, 9, 3, 9, 5] };
export const xorFields: InputField[] = [{ key: "nums", label: "values (0 to 255)", kind: "numbers" }];
export function xorPrepare(raw: XorInput): Prepared<XorInput> {
  if (!raw.nums.length) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  if (raw.nums.some((v) => v < 0 || v > 255)) return { error: "Use values from 0 to 255." };
  return { input: raw };
}

/** XORs every value into acc, showing acc's bits. Shared with LC 136. */
export function xorSteps(nums: number[], t: BitTracer, lines: { loop: number; done: number }, finish: (acc: number) => string) {
  let acc = 0;
  const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "acc in bits", rows: [bitsOf(acc)], colLabels: placeLabels(), dense: true, tones } });
  t.step({ line: 2, array: nums, ...grid(), vars: { acc },
    message: `XOR has two useful rules: x xor x = 0 and x xor 0 = x, and the order doesn't matter. So XOR everything together: every value that appears twice cancels itself out.` });
  let asked = false;
  nums.forEach((x, i) => {
    t.op();
    const before = acc;
    acc ^= x;
    const flipped: Record<string, Tone> = {};
    bitsOf(x).forEach((b, c) => { if (b) flipped[`0,${c}`] = "compare"; });
    const ask = !asked && i > 0 && nums.slice(0, i).includes(x)
      ? (asked = true, { ask: { q: `acc is ${before}, and ${x} has appeared before. What happens to its bits in acc?`, options: ["They cancel out: XOR undoes the earlier one", `They double: acc gains ${x} again`, "Nothing changes"], answer: 0 } }) : {};
    t.step({ ...ask, line: lines.loop, array: nums, pointers: { x: i }, tones: { [i]: "active" }, ...grid(flipped), vars: { x, acc },
      message: `${before} xor ${x} = ${acc} (${bin(acc)}). The bits that ${x} has are flipped${nums.slice(0, i).includes(x) ? `; ${x} was XORed in before, so this cancels it` : ""}.` });
  });
  t.step({ line: lines.done, array: nums, tones: Object.fromEntries(nums.map((v, k) => [k, (v === acc ? "found" : "settled") as Tone])), ...grid(), vars: { acc }, done: "found",
    message: finish(acc) });
  return acc;
}

const xorAll: Approach<XorInput> = {
  id: "xorAll",
  name: "XOR everything",
  code: `function xorAll(nums)
    acc ← 0
    for each x in nums
        acc ← acc xor x
    return acc
`,
  run({ nums }, t) {
    xorSteps(nums, t, { loop: 4, done: 5 }, (acc) => `The pairs cancelled, leaving ${acc}: the value with no partner. One pass, O(n), and one number of memory, O(1).`);
  },
};

export const dropApproaches = { drop };
export const xorApproaches = { xorAll };
