import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { bin, bitsOf, placeLabels } from "../../concepts/40-binary-and-bits/steps";

export type Input = { x: number };
export const example: Input = { x: 48 };
export const fields: InputField[] = [{ key: "x", label: "n (up to 255)", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.x > 255 || raw.x < -255) return { error: "Use a number from -255 to 255, so its bits fit on screen." };
  return { input: raw };
}

const grid = (v: number, title = "n in bits", tones: Record<string, Tone> = {}) => ({ grid: { title, rows: [bitsOf(v)], colLabels: placeLabels(), dense: true, tones } });

const halve: Approach<Input> = {
  id: "halve",
  name: "Halve while even",
  code: `function isPowerOfTwo(n)
    if n ≤ 0
        return false
    while n % 2 = 0
        n ← n / 2
    return n = 1
`,
  run({ x: x0 }, t) {
    if (x0 <= 0) {
      t.op();
      t.step({ line: 3, array: [], hideStage: true, vars: { n: x0 }, done: "notfound",
        message: `${x0} isn't positive, and every power of two (1, 2, 4, 8, …) is. Return false.` });
      return;
    }
    let x = x0, asked = false;
    t.step({ line: 4, array: [], hideStage: true, ...grid(x), vars: { n: x },
      message: `A power of two is 1 doubled some number of times. So undo the doubling: halve n while it's even, and see whether 1 is left.` });
    while (x % 2 === 0) {
      t.op();
      const ask = !asked && x > 2 ? (asked = true, { ask: { q: `n is ${x}, which is even. What happens next?`, options: [`Halve it: n becomes ${x / 2}`, "Stop: return true", "Stop: return false"], answer: 0 } }) : {};
      x /= 2;
      t.step({ ...ask, line: 5, array: [], hideStage: true, ...grid(x), vars: { n: x },
        message: `Even, so halve: n = ${x}. In bits, that's a shift one place right.` });
    }
    t.op();
    const yes = x === 1;
    t.step({ line: 6, array: [], hideStage: true, ...grid(x0, "the original n", Object.fromEntries(bitsOf(x0).map((b, c) => [`0,${c}`, (b ? (yes ? "found" : "miss") : "discard") as Tone]))), vars: { n: x }, done: yes ? "found" : "notfound",
      message: yes
        ? `n reached 1: ${x0} is a power of two. That took ${Math.log2(x0)} halvings: O(log n).`
        : `n stopped at ${x}, which is odd but not 1: ${x0} = ${x0 / x} · ${x}, so it isn't a power of two. In bits, ${x0} (${bin(x0)}) has more than one 1.` });
  },
};

const oneBit: Approach<Input> = {
  id: "oneBit",
  name: "Exactly one 1 bit",
  code: `function isPowerOfTwo(n)
    return n > 0 and n & (n - 1) = 0
`,
  run({ x }, t) {
    t.op();
    if (x <= 0) {
      t.step({ line: 2, array: [], hideStage: true, vars: { n: x }, done: "notfound",
        message: `${x} isn't positive, so the first half of the test is already false. Return false.` });
      return;
    }
    const y = x - 1, z = x & y, yes = z === 0;
    t.step({ ask: { q: `n is ${bin(x)}. Is n & (n − 1) equal to 0?`, options: ["Yes: n has exactly one 1, a power of two", "No: n has more than one 1"], answer: yes ? 0 : 1 },
      line: 2, array: [], hideStage: true,
      grid: { title: "bits", rows: [bitsOf(x), bitsOf(y), bitsOf(z)], rowLabels: ["n", "n − 1", "n & (n − 1)"], colLabels: placeLabels(), dense: true, tones: Object.fromEntries(bitsOf(z).map((b, c) => [`2,${c}`, (b ? "miss" : "found") as Tone])) },
      vars: { n: x, "n & (n - 1)": z }, done: yes ? "found" : "notfound",
      message: yes
        ? `A power of two has exactly one 1 bit. n & (n − 1) removes the lowest 1, and nothing is left: ${x} is a power of two. One step: O(1).`
        : `n & (n − 1) removes only the lowest 1, and ${z} (${bin(z)}) is left, so ${x} had more than one 1. Not a power of two. One step: O(1).` });
  },
};

export const approaches = { halve, oneBit };

/** n = 2^k: the loop halves k times, the bit test takes one step. */
export const growth = measureGrowth(
  [{ approach: halve, slot: 1 }, { approach: oneBit, slot: 3 }],
  (k) => ({ x: 2 ** k }),
  [4, 8, 16, 24, 30],
);
