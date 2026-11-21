import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { bin } from "../../concepts/40-binary-and-bits/steps";

export type Input = { n: number };
export const example: Input = { n: 8 };
export const fields: InputField[] = [{ key: "n", label: "n (0 to 8)", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.n < 0 || raw.n > 8) return { error: "Use n from 0 to 8, so the answer row fits." };
  return { input: raw };
}

const labels = (n: number) => Array.from({ length: n + 1 }, (_, i) => `${i}: ${bin(i, 4)}`);

const eachAlone: Approach<Input> = {
  id: "eachAlone",
  name: "Count each number's bits on its own",
  code: `function countBits(n)
    ans ← array of n + 1, all 0
    for i ← 0 to n
        x ← i
        while x > 0
            x ← x & (x - 1)  // drop the lowest 1
            ans[i] += 1
    return ans
`,
  run({ n }, t) {
    const ans: (number | string)[] = Array(n + 1).fill(""), L = labels(n);
    t.step({ line: 2, array: [...ans], labels: L, vars: { n },
      message: `Under each slot is i and its bits. For each i, count its 1s with the x & (x − 1) loop, which takes one step per 1.` });
    const done: Record<number, Tone> = {};
    let asked = false;
    for (let i = 0; i <= n; i++) {
      let x = i, c = 0;
      t.op();
      while (x > 0) { t.op(); x &= x - 1; c++; }
      const ask = !asked && c > 1 ? (asked = true, { ask: { q: `${i} is ${bin(i, 4)}. How many 1 bits does it have?`, options: [String(c), String(c - 1), String(c + 1)], answer: 0 } }) : {};
      ans[i] = c;
      done[i] = "settled";
      t.step({ ...ask, line: 7, array: [...ans], labels: L, pointers: { i }, tones: { ...done, [i]: "active" }, vars: { i, "ans[i]": c },
        message: `${i} = ${bin(i, 4)}: ${c} one${c === 1 ? "" : "s"}, found in ${c} loop${c === 1 ? "" : "s"}. Nothing learned about smaller numbers is reused.` });
    }
    t.step({ line: 8, array: [...ans], labels: L, tones: done, vars: { n }, done: "found",
      message: `Done. Each number costs one loop per 1 bit, up to log₂ n of them: O(n log n) in total.` });
  },
};

const fromHalf: Approach<Input> = {
  id: "fromHalf",
  name: "Reuse the answer for i >> 1",
  code: `function countBits(n)
    ans ← array of n + 1, all 0
    for i ← 1 to n
        ans[i] ← ans[i >> 1] + (i & 1)
    return ans
`,
  run({ n }, t) {
    const ans: (number | string)[] = Array(n + 1).fill(""), L = labels(n);
    ans[0] = 0;
    const done: Record<number, Tone> = { 0: "settled" };
    t.step({ line: 2, array: [...ans], labels: L, tones: { ...done }, vars: { n },
      message: `i >> 1 is i with its last bit dropped, and it's smaller than i, so its count is already known. i has the same bits plus that last bit, i & 1. So ans[i] = ans[i >> 1] + (i & 1). ans[0] = 0.` });
    let asks = 0;
    for (let i = 1; i <= n; i++) {
      t.op();
      const h = i >> 1, last = i & 1;
      ans[i] = (ans[h] as number) + last;
      const ask = asks < 2 && i >= 3 ? (asks++, { ask: { q: `ans[${h}] = ${ans[h]}, and ${i} is ${last ? "odd" : "even"} (i & 1 = ${last}). What is ans[${i}]?`, options: [String(ans[i]), String((ans[h] as number) + 1 - last), String((ans[h] as number) + 2)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      done[i] = "settled";
      t.step({ ...ask, line: 4, array: [...ans], labels: L, pointers: { "i >> 1": h, i }, tones: { ...done, [h]: "compare", [i]: "found" }, vars: { i, "i >> 1": h, "i & 1": last },
        message: `${bin(i, 4)} is ${bin(h, 4)} (that's ${h}) with a ${last} added on the end. So ans[${i}] = ans[${h}] + ${last} = ${ans[i]}.` });
    }
    t.step({ line: 5, array: [...ans], labels: L, tones: done, vars: { n }, done: "found",
      message: `Done: one lookup and one addition per number, O(n), with each answer built from a smaller one. That's dynamic programming.` });
  },
};

export const approaches = { eachAlone, fromHalf };

export const growth = measureGrowth(
  [{ approach: eachAlone, slot: 1 }, { approach: fromHalf, slot: 3 }],
  (n) => ({ n }),
  [16, 64, 256, 512, 1024],
);
