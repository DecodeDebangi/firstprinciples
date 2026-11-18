import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/* ---------- Taking a number apart ---------- */
export type DigitsInput = { x: number };
export const digitsExample: DigitsInput = { x: 4728 };
export const digitsFields: InputField[] = [{ key: "x", label: "a whole number, x =", kind: "number" }];
export function digitsPrepare(raw: DigitsInput): Prepared<DigitsInput> {
  if (!Number.isInteger(raw.x) || raw.x < 0 || raw.x > 99999999) return { error: "Use a whole number from 0 to 99,999,999." };
  return { input: raw };
}

const digits: Approach<DigitsInput> = {
  id: "digits",
  name: "Adding up the digits",
  code: `function sumDigits(x)
    total ← 0
    while x > 0
        total += x % 10  // the last digit
        x ← floor(x / 10)  // drop it
    return total
`,
  run({ x: x0 }, t) {
    let x = x0, total = 0;
    const cells = (v: number) => (v > 0 ? String(v).split("") : ["0"]);
    t.step({ line: 2, array: cells(x), vars: { x, total },
      message: `You can't index into a number the way you index into an array. But two operations peel it apart from the right: x % 10 is the last digit, and floor(x / 10) is the number with that digit removed.` });
    let asked = false;
    while (x > 0) {
      t.op();
      const d = x % 10, cs = cells(x);
      // Ask once, on a number with at least two digits: the last digit vs the number without it.
      const ask = !asked && x >= 10 ? (asked = true, { ask: { q: `x is ${x}. What is x % 10?`, options: [String(d), String(Math.floor(x / 10) !== d ? Math.floor(x / 10) : x)], answer: 0 } }) : {};
      total += d;
      t.step({ ...ask, line: 4, array: cs, tones: { [cs.length - 1]: "found" }, badge: { at: cs.length - 1, text: `${x} % 10 = ${d}` }, vars: { x, "x % 10": d, total },
        message: `${x} % 10 = ${d}: dividing ${x} by 10 leaves a remainder of ${d}, its last digit. total becomes ${total}.` });
      const nx = Math.floor(x / 10);
      t.step({ line: 5, array: cells(nx), tones: nx > 0 ? {} : { 0: "discard" }, vars: { x: nx, total },
        message: `floor(${x} / 10) = floor(${x / 10}) = ${nx}: dividing by 10 and rounding down drops the last digit.${nx === 0 ? " x is 0 now, so the loop stops." : ""}` });
      x = nx;
    }
    t.step({ line: 6, array: cells(x0), tones: Object.fromEntries(cells(x0).map((_, i) => [i, "settled" as Tone])), vars: { total }, done: "found",
      message: `Return ${total}. The loop ran once per digit: a number up to N has about log₁₀ N digits, so this is O(log N), not O(N).` });
  },
};

/* ---------- Going round in a circle ---------- */
export type WrapInput = { values: number[]; steps: number };
export const wrapExample: WrapInput = { values: [7, 2, 9, 4, 6], steps: 7 };
export const wrapFields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "steps", label: "steps", kind: "number" },
];
export function wrapPrepare(raw: WrapInput): Prepared<WrapInput> {
  if (raw.values.length === 0) return { error: "Give at least one value." };
  if (raw.values.length > 8) return { error: "Use at most 8 values." };
  if (!Number.isInteger(raw.steps) || raw.steps < 0 || raw.steps > 12) return { error: "Use from 0 to 12 steps." };
  return { input: raw };
}

const wrap: Approach<WrapInput> = {
  id: "wrap",
  name: "Going round in a circle",
  code: `function walkRound(a, steps)
    n ← length(a)
    i ← 0
    repeat steps times
        i ← (i + 1) % n
    return a[i]
`,
  run({ values: a, steps }, t) {
    const n = a.length;
    let i = 0;
    t.step({ line: 3, array: a, pointers: { i }, vars: { n, i },
      message: `Walk along the array, but when you step off the end, come back to the start, like the hand of a clock. i + 1 moves on; % n brings ${n} back to 0.` });
    let asked = false;
    for (let s = 1; s <= steps; s++) {
      t.op();
      const prev = i;
      i = (i + 1) % n;
      const wrapped = prev === n - 1;
      const ask = wrapped && !asked && n > 1 ? (asked = true, { ask: { q: `i is ${prev}, the last position. What is (${prev} + 1) % ${n}?`, options: ["0", String(n), String(prev)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: a, pointers: { i }, tones: { [i]: wrapped ? "found" : "active" }, badge: { at: i, text: `(${prev} + 1) % ${n} = ${i}` }, vars: { step: s, i },
        message: wrapped ? `Step ${s}: ${prev} + 1 = ${prev + 1}, and ${prev + 1} % ${n} = 0. Back to the start.` : `Step ${s}: (${prev} + 1) % ${n} = ${i}. Below ${n}, % changes nothing.` });
    }
    t.step({ line: 6, array: a, pointers: { i }, tones: { [i]: "found" }, vars: { i }, done: "found",
      message: `Return a[${i}] = ${a[i]}. A shortcut: after ${steps} steps, i is simply ${steps} % ${n} = ${steps % n}. Going ${n} steps brings you back to where you started.` });
  },
};

export const digitsApproaches = { digits };
export const wrapApproaches = { wrap };
