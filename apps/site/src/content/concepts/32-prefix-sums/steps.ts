import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** queries: "1..3, 0..4": each asks for the sum of positions l to r, both included. */
export type Input = { nums: number[]; queries: string };
export const example: Input = { nums: [4, -1, 3, 6, 2], queries: "1..3, 0..4, 2..3" };
export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "queries", label: "ranges l..r", kind: "text" },
];
export const parseQueries = (s: string): [number, number][] =>
  [...s.matchAll(/(-?\d+)\s*\.\.\s*(-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.nums.length;
  if (n === 0) return { error: "Give at least one value." };
  if (n > 8) return { error: "Use at most 8 values so the prefix row fits." };
  const q = parseQueries(raw.queries);
  if (q.length === 0) return { error: 'Give at least one range, written like "1..3".' };
  if (q.length > 4) return { error: "Use at most 4 ranges." };
  if (q.some(([l, r]) => l < 0 || r >= n || l > r)) return { error: `Each range l..r needs 0 ≤ l ≤ r ≤ ${n - 1}.` };
  return { input: { nums: raw.nums, queries: q.map(([l, r]) => `${l}..${r}`).join(", ") } };
}
const prefixOf = (a: number[]) => a.reduce((p, x) => [...p, p[p.length - 1] + x], [0]);
const prefixGrid = (p: (number | string)[], tones: Record<number, Tone> = {}) => ({
  title: "prefix", rows: [[...p]], colLabels: p.map((_, k) => k), tones: Object.fromEntries(Object.entries(tones).map(([k, tn]) => [`0,${k}`, tn])),
});

const build: Approach<Input> = {
  id: "build",
  name: "Building the prefix array",
  code: `function buildPrefix(a)
    prefix ← array of length(a) + 1, all 0
    for i ← 0 to length(a) - 1
        prefix[i + 1] ← prefix[i] + a[i]
    return prefix
`,
  run({ nums: a }, t) {
    const p: (number | string)[] = [0, ...a.map(() => "")];
    t.step({ line: 2, array: a, grid: prefixGrid(p, { 0: "active" }), vars: {},
      message: `prefix[k] will hold the sum of the first k values. So prefix[0] = 0 (the first zero values add up to nothing), and the array needs one more slot than a.` });
    let asked = false;
    for (let i = 0; i < a.length; i++) {
      t.op();
      const before = p[i] as number;
      p[i + 1] = before + a[i];
      // Ask once, when the new total differs from both of the numbers it's made from (so the options are distinct).
      const ask = !asked && i >= 1 && before !== 0 && a[i] !== 0 && before !== a[i]
        ? (asked = true, { ask: { q: `prefix[${i}] is ${before} and a[${i}] is ${a[i]}. What is prefix[${i + 1}]?`, options: [String(before + a[i]), String(a[i]), String(before)], answer: 0 } }) : {};
      t.step({ ...ask, line: 4, array: a, pointers: { i }, tones: { [i]: "active" },
        grid: prefixGrid(p, { [i]: "compare", [i + 1]: "found" }), vars: { i },
        message: `prefix[${i + 1}] = prefix[${i}] + a[${i}] = ${before} + ${a[i]} = ${p[i + 1]}: the sum of the first ${i + 1} value${i ? "s" : ""}. Each new total is the last one plus one value, so nothing is added twice.` });
    }
    t.step({ line: 5, array: a, grid: prefixGrid(p, Object.fromEntries(p.map((_, k) => [k, "settled" as Tone]))), vars: {}, done: "found",
      message: `Done in one pass: O(n) time, and n + 1 slots of memory. The last slot, prefix[${a.length}] = ${p[a.length]}, is the total of everything.` });
  },
};

const loopEach: Approach<Input> = {
  id: "loop",
  name: "Add up each range with a loop",
  code: `function rangeSums(a, queries)
    answers ← empty list
    for each l, r in queries
        total ← 0
        for i ← l to r
            total += a[i]
        answers.push(total)
    return answers
`,
  run({ nums: a, queries }, t) {
    const qs = parseQueries(queries), answers: number[] = [];
    t.step({ line: 2, array: a, vars: {}, message: `Each query asks: what do positions l to r add up to? The direct way loops over the range and adds.` });
    for (const [l, r] of qs) {
      let total = 0;
      for (let i = l; i <= r; i++) {
        t.op(); total += a[i];
        t.step({ line: 6, array: a, range: [l, r], pointers: { i }, tones: { [i]: "active" }, vars: { query: `${l}..${r}`, total },
          message: `Add a[${i}] = ${a[i]}: total is ${total}.` });
      }
      answers.push(total);
      t.step({ line: 7, array: a, range: [l, r], vars: { query: `${l}..${r}`, answer: total }, message: `${l}..${r} adds up to ${total}: ${r - l + 1} additions for this range.` });
    }
    t.step({ line: 8, array: a, vars: { answers: answers.join(", ") }, done: "found",
      message: `Answers: ${answers.join(", ")}. Each range costs as many additions as it is long, up to n, so q queries take O(n · q). The same values get added again and again.` });
  },
};

const withPrefix: Approach<Input> = {
  id: "prefix",
  name: "One subtraction per range (prefix sums)",
  code: `function rangeSums(a, queries)
    prefix ← buildPrefix(a)
    answers ← empty list
    for each l, r in queries
        answers.push(prefix[r + 1] - prefix[l])
    return answers
`,
  run({ nums: a, queries }, t) {
    const qs = parseQueries(queries), p = prefixOf(a), answers: number[] = [];
    t.op(a.length);
    t.step({ line: 2, array: a, grid: prefixGrid(p), vars: {},
      message: `Build the prefix array once (one pass). prefix[r + 1] is the sum of everything up to position r, and prefix[l] is the sum of everything before l. Take one from the other and only l..r is left.` });
    let asked = false;
    for (const [l, r] of qs) {
      t.op();
      const ans = p[r + 1] - p[l];
      answers.push(ans);
      const ask = !asked ? (asked = true, { ask: { q: `Range ${l}..${r}: which two prefix values give its sum?`, options: [`prefix[${r + 1}] - prefix[${l}]`, `prefix[${r}] - prefix[${l}]`, `prefix[${r + 1}] - prefix[${l + 1}]`], answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: a, range: [l, r], grid: prefixGrid(p, { [r + 1]: "found", [l]: "compare" }), vars: { query: `${l}..${r}`, answer: ans },
        message: `${l}..${r}: prefix[${r + 1}] - prefix[${l}] = ${p[r + 1]} - ${p[l]} = ${ans}. One subtraction, however long the range.` });
    }
    t.step({ line: 6, array: a, grid: prefixGrid(p, Object.fromEntries(p.map((_, k) => [k, "settled" as Tone]))), vars: { answers: answers.join(", ") }, done: "found",
      message: `Answers: ${answers.join(", ")}. O(n) to build once, then O(1) per query: O(n + q) in total.` });
  },
};

export const approaches = { build, loopEach, withPrefix };

/** n values and n queries, each covering the whole array. */
export const growth = measureGrowth(
  [{ approach: loopEach, slot: 1 }, { approach: withPrefix, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i % 5), queries: Array.from({ length: n }, () => `0..${n - 1}`).join(", ") }),
  [4, 8, 16, 24, 32],
);
