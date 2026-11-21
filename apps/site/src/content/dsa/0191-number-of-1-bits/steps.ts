import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { bin, bitsOf, placeLabels } from "../../concepts/40-binary-and-bits/steps";
import { dropSteps } from "../../concepts/41-bit-tricks/steps";

export type Input = { x: number };
export const example: Input = { x: 104 };
export const fields: InputField[] = [{ key: "x", label: "n (0 to 255)", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.x < 0 || raw.x > 255) return { error: "Use a number from 0 to 255, so its bits fit on screen." };
  return { input: raw };
}

const shift: Approach<Input> = {
  id: "shift",
  name: "Check the last bit, shift, repeat",
  code: `function hammingWeight(n)
    count ← 0
    while n > 0
        count += n & 1  // the last bit
        n ← n >> 1
    return count
`,
  run({ x: x0 }, t) {
    let x = x0, count = 0, asked = false;
    const grid = (v: number, tones: Record<string, Tone> = {}) => ({ grid: { title: "n in bits", rows: [bitsOf(v)], colLabels: placeLabels(), dense: true, tones } });
    t.step({ line: 2, array: [], hideStage: true, ...grid(x), vars: { n: x, count },
      message: `${x0} is ${bin(x0)}. n & 1 is its last bit. Add it to the count, then shift everything one place right so the next bit becomes the last.` });
    while (x > 0) {
      t.op();
      const last = x % 2;
      const ask = !asked && x > 1 ? (asked = true, { ask: { q: `n is ${bin(x)}. What is n & 1?`, options: [String(last), String(1 - last)], answer: 0 } }) : {};
      count += last;
      t.step({ ...ask, line: 4, array: [], hideStage: true, ...grid(x, { [`0,7`]: last ? "found" : "discard" }), vars: { n: x, "n & 1": last, count },
        message: `The last bit is ${last}${last ? `: count is now ${count}` : ""}. Shift right: ${x} >> 1 = ${Math.floor(x / 2)}.` });
      x = Math.floor(x / 2);
    }
    t.step({ line: 6, array: [], hideStage: true, ...grid(x0), vars: { count }, done: "found",
      message: `n is 0: ${x0} has ${count} bit${count === 1 ? "" : "s"} set. The loop ran once per bit up to the highest 1, ${x0 ? Math.floor(Math.log2(x0)) + 1 : 0} times: O(number of bits), at most 32.` });
  },
};

const drop: Approach<Input> = {
  id: "drop",
  name: "Drop the lowest 1, repeat",
  code: `function hammingWeight(n)
    count ← 0
    while n > 0
        n ← n & (n - 1)  // drop the lowest 1
        count += 1
    return count
`,
  run({ x }, t) { dropSteps(x, t, { loop: 4, done: 6 }); },
};

export const approaches = { shift, drop };

/** A single 1 in the top bit: the shift loop walks every place, the other jumps straight to it. */
export const growth = measureGrowth(
  [{ approach: shift, slot: 1 }, { approach: drop, slot: 3 }],
  (n) => ({ x: 2 ** (n - 1) }),
  [4, 8, 16, 24, 32],
);
