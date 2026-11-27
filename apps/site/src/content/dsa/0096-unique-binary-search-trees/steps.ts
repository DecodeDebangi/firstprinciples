import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { n: number };
export const example: Input = { n: 4 };
export const fields: InputField[] = [{ key: "n", label: "n", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 10) return { error: "Use n from 1 to 10." };
  return { input: raw };
}

const recursive: Approach<Input> = {
  id: "recursive", name: "Try every root, recursively",
  code: `function numTrees(n)  // shapes for n values
    if n ≤ 1
        return 1
    total ← 0
    for r from 1 to n  // r is the root
        left ← numTrees(r − 1)  // values below r
        right ← numTrees(n − r)  // values above r
        total ← total + left × right
    return total
`,
  run({ n }, t) {
    const f = (k: number): number => { t.op(); if (k <= 1) return 1; let s = 0; for (let r = 1; r <= k; r++) s += f(r - 1) * f(k - r); return s; };
    const parts: number[] = [];
    if (t.record) t.step({ line: 1, array: [], grid: { title: "shapes with root r", rows: [Array.from({ length: n }, (_, k) => `r=${k + 1}`), Array.from({ length: n }, () => "")] }, vars: { n },
      message: `Values 1 to ${n} in a BST: pick a root r. Everything below r must go left (r − 1 values) and everything above it right (${n} − r values). The two sides are independent, so the shapes multiply.` });
    let total = 0, asked = 0;
    for (let r = 1; r <= n; r++) {
      const before = (t as { ops?: number }).ops ?? 0;
      const l = f(r - 1), rr = f(n - r);
      total += l * rr; parts.push(l * rr);
      const calls = ((t as { ops?: number }).ops ?? 0) - before;
      const ask = t.record && asked < 2 && r > 1 && r < n ? (asked++, { ask: { q: `Root ${r}: the left side can be ${l} shape${l === 1 ? "" : "s"} and the right side ${rr}. How many trees have root ${r}?`, options: [...new Set([l * rr, l + rr, l * rr + 1].map(String))], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 8, array: [], grid: { title: "shapes with root r", rows: [Array.from({ length: n }, (_, k) => `r=${k + 1}`), Array.from({ length: n }, (_, k) => (k < parts.length ? parts[k] : ""))], tones: { [`1,${r - 1}`]: "found" } }, vars: { r, left: l, right: rr, total },
        message: `Root ${r}: ${r - 1} value${r - 1 === 1 ? "" : "s"} below (${l} shape${l === 1 ? "" : "s"}) × ${n - r} above (${rr}) = ${l * rr}. Working those out from scratch took ${calls} call${calls === 1 ? "" : "s"}, recounting smaller sizes again and again.` });
    }
    if (t.record) t.step({ line: 9, array: [], grid: { title: "shapes with root r", rows: [Array.from({ length: n }, (_, k) => `r=${k + 1}`), parts] }, vars: { answer: total }, done: "found",
      message: `${total} shapes. But the same sizes were counted over and over: the number of calls grows about 3× with each extra value.` });
  },
};

const table: Approach<Input> = {
  id: "table", name: "Fill a table, smallest size first",
  code: `function numTrees(n)  // c[k]: shapes of k values
    c ← list of n + 1 zeros
    c[0], c[1] ← 1, 1
    for k from 2 to n
        for r from 1 to k  // r is the root
            c[k] ← c[k] + c[r − 1] × c[k − r]
    return c[n]
`,
  run({ n }, t) {
    const c = Array(n + 1).fill(0); c[0] = 1; c[1] = 1;
    const g = (k: number, tones: Record<string, Tone> = {}) => ({ title: "c[k]: shapes of k values", rows: [c.map((x, j) => (j <= k ? x : ""))], colLabels: c.map((_, j) => j), tones });
    let asked = 0;
    if (t.record) t.step({ line: 3, array: [], grid: g(1, { "0,0": "settled", "0,1": "settled" }), vars: {},
      message: "The count only depends on how many values there are, not which. So count shapes for 0, 1, 2, … values in turn, each from the smaller counts already in the table. No size is ever counted twice." });
    for (let k = 2; k <= n; k++) {
      const terms: string[] = [];
      for (let r = 1; r <= k; r++) { t.op(); c[k] += c[r - 1] * c[k - r]; terms.push(`${c[r - 1]}×${c[k - r]}`); }
      const ask = t.record && asked < 2 && k >= 3 ? (asked++, { ask: { q: `c[${k}] adds, for each root, c[left] × c[right]: ${terms.join(" + ")}. What is it?`, options: [...new Set([c[k], c[k] + 1, c[k - 1] * 2].map(String))], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 6, array: [], grid: g(k, { ...Object.fromEntries(Array.from({ length: k }, (_, j) => [`0,${j}`, "compare" as Tone])), [`0,${k}`]: "found" }), vars: { k, "c[k]": c[k] },
        message: `${k} values: ${terms.join(" + ")} = ${c[k]}.` });
    }
    if (t.record) t.step({ line: 7, array: [], grid: g(n, { [`0,${n}`]: "found" }), vars: { answer: c[n] }, done: "found",
      message: `${c[n]} shapes. Each size k adds up k products: about n²/2 steps, O(n²).` });
  },
};

export const approaches = { recursive, table };
export const growth = measureGrowth(
  [{ approach: recursive, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ n }),
  [2, 4, 6, 8, 10, 12],
);
