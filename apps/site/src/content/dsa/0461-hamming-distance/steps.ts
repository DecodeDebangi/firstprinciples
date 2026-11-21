import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { bin, bitsOf, placeLabels } from "../../concepts/40-binary-and-bits/steps";

export type Input = { x: number; y: number };
export const example: Input = { x: 37, y: 22 };
export const fields: InputField[] = [
  { key: "x", label: "x (0 to 255)", kind: "number" },
  { key: "y", label: "y (0 to 255)", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if ([raw.x, raw.y].some((v) => v < 0 || v > 255)) return { error: "Use numbers from 0 to 255, so their bits fit on screen." };
  return { input: raw };
}

const bitByBit: Approach<Input> = {
  id: "bitByBit",
  name: "Compare the last bits, shift, repeat",
  code: `function hammingDistance(x, y)
    count ← 0
    while x > 0 or y > 0
        if x & 1 ≠ y & 1
            count += 1
        x, y ← x >> 1, y >> 1
    return count
`,
  run({ x: x0, y: y0 }, t) {
    const X = bitsOf(x0), Y = bitsOf(y0);
    const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "bits", rows: [X, Y], rowLabels: ["x", "y"], colLabels: placeLabels(), dense: true, tones } });
    let x = x0, y = y0, count = 0, col = 7, asked = false;
    t.step({ line: 2, array: [], hideStage: true, ...grid(), vars: { x, y, count },
      message: `The Hamming distance is the number of places where x and y have different bits. Compare their last bits, shift both right, and repeat until both are 0.` });
    while (x > 0 || y > 0) {
      t.op();
      const a = x & 1, b = y & 1, diff = a !== b;
      if (diff) count++;
      const ask = !asked && diff ? (asked = true, { ask: { q: `In the ${2 ** (7 - col)}s place, x has ${a} and y has ${b}. Does the count go up?`, options: ["Yes: the bits differ", "No: the bits match"], answer: 0 } }) : {};
      t.step({ ...ask, line: diff ? 5 : 4, array: [], hideStage: true, ...grid({ [`0,${col}`]: diff ? "miss" : "found", [`1,${col}`]: diff ? "miss" : "found" }), vars: { "x & 1": a, "y & 1": b, count },
        message: `${2 ** (7 - col)}s place: ${a} vs ${b}, ${diff ? `different, so count is now ${count}` : "the same"}.` });
      x >>= 1; y >>= 1; col--;
    }
    t.step({ line: 7, array: [], hideStage: true, ...grid(), vars: { count }, done: "found",
      message: `Distance ${count}. One loop per bit up to the higher number's highest 1: O(number of bits), at most 32.` });
  },
};

const xorCount: Approach<Input> = {
  id: "xorCount",
  name: "XOR, then count the 1s",
  code: `function hammingDistance(x, y)
    z ← x xor y  // 1 exactly where they differ
    count ← 0
    while z > 0
        z ← z & (z - 1)  // drop the lowest 1
        count += 1
    return count
`,
  run({ x, y }, t) {
    t.op();
    let z = x ^ y, count = 0;
    const X = bitsOf(x), Y = bitsOf(y);
    const grid = (zv: number, tones: Record<string, Tone> = {}) => ({ grid: { title: "bits", rows: [X, Y, bitsOf(zv)], rowLabels: ["x", "y", "z"], colLabels: placeLabels(), dense: true, tones } });
    const ones = (v: number) => Object.fromEntries(bitsOf(v).map((b, c) => [`2,${c}`, (b ? "miss" : "discard") as Tone]));
    t.step({ ask: { q: `x is ${bin(x)} and y is ${bin(y)}. Where does x xor y have its 1s?`, options: ["Exactly where x and y differ", "Where both have a 1", "Where both have a 0"], answer: 0 },
      line: 2, array: [], hideStage: true, ...grid(z, ones(z)), vars: { z, count },
      message: `XOR gives 1 exactly where the bits differ, so z = ${x} xor ${y} = ${z} (${bin(z)}) marks every difference at once. Now count z's 1s.` });
    while (z > 0) {
      t.op();
      const low = 7 - Math.log2(z & -z);
      z &= z - 1;
      count++;
      t.step({ line: 5, array: [], hideStage: true, ...grid(z, { ...ones(z), [`2,${low}`]: "found" }), vars: { z, count },
        message: `z & (z − 1) removes the lowest 1 (the ${2 ** (7 - low)}s place): ${count} difference${count > 1 ? "s" : ""} counted.` });
    }
    t.step({ line: 7, array: [], hideStage: true, ...grid(x ^ y), vars: { count }, done: "found",
      message: `Distance ${count}. One XOR, then one loop per difference: O(number of differing bits).` });
  },
};

export const approaches = { bitByBit, xorCount };
