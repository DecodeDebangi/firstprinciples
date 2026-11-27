import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { nid, numberTree } from "../0386-lexicographical-numbers/steps";

export type Input = { n: number; k: number };
export const example: Input = { n: 23, k: 9 };
export const fields: InputField[] = [{ key: "n", label: "n", kind: "number" }, { key: "k", label: "k", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 30) return { error: "Use n from 1 to 30 so the tree fits." };
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > raw.n) return { error: "Use k from 1 to n." };
  return { input: raw };
}
/** How many numbers ≤ n start with the digits of p. */
const count = (n: number, p: number, t?: { op: () => void }) => { let total = 0, lo = p, hi = p; while (lo <= n) { t?.op(); total += Math.min(n, hi) - lo + 1; lo *= 10; hi = hi * 10 + 9; } return total; };
const under = (n: number, p: number): number[] => (p > n ? [] : [p, ...Array.from({ length: 10 }, (_, d) => p * 10 + d).flatMap((c) => under(n, c))]);

const walkK: Approach<Input> = {
  id: "walk", name: "Walk the order one number at a time",
  code: `function findKthNumber(n, k)
    cur ← 1
    repeat k − 1 times
        if cur × 10 ≤ n
            cur ← cur × 10
        else
            while cur mod 10 = 9 or cur + 1 > n
                cur ← floor(cur / 10)
            cur ← cur + 1
    return cur
`,
  run({ n, k }, t) {
    let cur = 1; const seen = [nid(1)];
    if (t.record) t.step({ line: 2, array: [], trees: numberTree(n, { [nid(1)]: "found" }), vars: { cur, step: 1 }, message: `Take the walk from Lexicographical Numbers and stop at the ${k}th number. Each step visits one number.` });
    for (let s = 1; s < k; s++) {
      t.op();
      if (cur * 10 <= n) cur *= 10; else { while (cur % 10 === 9 || cur + 1 > n) { t.op(); cur = Math.floor(cur / 10); } cur += 1; }
      seen.push(nid(cur));
      if (t.record) t.step({ line: 9, array: [], trees: numberTree(n, { ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), [nid(cur)]: "found" }), vars: { cur, step: s + 1 }, message: `Number ${s + 1} in dictionary order is ${cur}.` });
    }
    if (t.record) t.step({ line: 10, array: [], trees: numberTree(n, { [nid(cur)]: "found" }), vars: { answer: cur }, done: "found", message: `The ${k}th is ${cur}. That took k steps: O(k), which is up to n, too slow when n is in the billions.` });
  },
};

const skip: Approach<Input> = {
  id: "skip", name: "Count whole subtrees and skip them",
  code: `function findKthNumber(n, k)
    cur ← 1
    k ← k − 1  // cur itself is the first
    while k > 0
        size ← count(cur)
        if size ≤ k
            cur, k ← cur + 1, k − size  // skip all
        else
            cur, k ← cur × 10, k − 1  // go inside
    return cur
function count(p)  // numbers ≤ n that start with p
    total, lo, hi ← 0, p, p
    while lo ≤ n
        total ← total + min(n, hi) − lo + 1
        lo, hi ← lo × 10, hi × 10 + 9
    return total
`,
  run({ n, k: k0 }, t) {
    let cur = 1, k = k0 - 1, asked = 0;
    if (t.record) t.step({ line: 3, array: [], trees: numberTree(n, { [nid(1)]: "found" }), vars: { cur, "k left": k }, message: `Instead of visiting numbers one by one, count how many numbers sit under cur (those starting with its digits). If the k-th lies beyond all of them, skip the whole subtree at once; otherwise step inside it.` });
    while (k > 0) {
      const size = count(n, cur, t);
      const ask = t.record && asked < 2 ? (asked++, { ask: { q: `${size} number${size === 1 ? " starts" : "s start"} with ${cur}, and ${k} more steps are needed. What happens?`, options: size <= k ? [`Skip all ${size}: move to ${cur + 1}`, `Go inside, to ${cur * 10}`] : [`Go inside, to ${cur * 10}`, `Skip all ${size}: move to ${cur + 1}`], answer: 0 } }) : {};
      if (size <= k) {
        const block = under(n, cur);
        if (t.record) t.step({ ...ask, line: 7, array: [], trees: numberTree(n, { ...Object.fromEntries(block.map((x) => [nid(x), "discard" as Tone])), [nid(cur)]: "compare" }), vars: { cur, size, "k left": k - size },
          message: `${size} number${size === 1 ? "" : "s"} start${size === 1 ? "s" : ""} with ${cur} (${block.join(", ")}). ${k} more are needed, so skip them all at once and move on to ${cur + 1}.` });
        cur += 1; k -= size;
      } else {
        if (t.record) t.step({ ...ask, line: 9, array: [], trees: numberTree(n, { ...Object.fromEntries(under(n, cur).map((x) => [nid(x), "side-a" as Tone])), [nid(cur)]: "active" }), vars: { cur, size, "k left": k - 1 },
          message: `${size} numbers start with ${cur}, more than the ${k} still needed: the answer is in here. Count ${cur} itself and step inside, to ${cur * 10}.` });
        cur *= 10; k -= 1;
      }
    }
    if (t.record) t.step({ line: 10, array: [], trees: numberTree(n, { [nid(cur)]: "found" }), vars: { answer: cur }, done: "found", message: `The ${k0}th is ${cur}. Each level skips or enters a subtree, and counting one takes a step per digit: O(D²), about 100 steps even for n in the billions.` });
  },
};

export const approaches = { walk: walkK, skip };
export const growth = measureGrowth(
  [{ approach: walkK, slot: 1 }, { approach: skip, slot: 3 }],
  (n) => ({ n, k: n - 1 }),
  [16, 64, 256, 1024, 4096],
);
