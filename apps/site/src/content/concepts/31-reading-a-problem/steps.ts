import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { n: number };
export const example: Input = { n: 100000 };
export const fields: InputField[] = [{ key: "n", label: "the input size, n =", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 1e12) return { error: "Pick a whole number n from 1 to 1,000,000,000,000." };
  return { input: raw };
}

const BUDGET = 1e8; // simple steps in about a second
const sup = (k: number) => String(k).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");
const fmt = (x: number) => (!isFinite(x) || x > 1e300 ? "far too many" : x < 1e6 ? Math.round(x).toLocaleString("en-US") : `about ${(x / 10 ** Math.floor(Math.log10(x))).toFixed(1)} × 10${sup(Math.floor(Math.log10(x)))}`);
const factorial = (n: number) => { let f = 1; for (let i = 2; i <= n; i++) { f *= i; if (f > 1e300) return Infinity; } return f; };
const KINDS: { label: string; f: (n: number) => number; example: string }[] = [
  { label: "O(log n)", f: (n) => Math.max(1, Math.log2(n)), example: "binary search" },
  { label: "O(n)", f: (n) => n, example: "one pass" },
  { label: "O(n log n)", f: (n) => n * Math.max(1, Math.log2(n)), example: "sorting" },
  { label: "O(n²)", f: (n) => n * n, example: "every pair" },
  { label: "O(n³)", f: (n) => n * n * n, example: "every triple" },
  { label: "O(2ⁿ)", f: (n) => (n > 1000 ? Infinity : 2 ** n), example: "every subset" },
  { label: "O(n!)", f: factorial, example: "every ordering" },
];

const budget: Approach<Input> = {
  id: "budget",
  name: "Does it fit in about a second?",
  code: `function fitsInTime(steps)
    // a rough rule: about 100 million
    // simple steps run in a second
    return steps ≤ 100,000,000
`,
  run({ n }, t) {
    const rows: (string | number)[][] = [];
    const tones: Record<string, Tone> = {};
    const grid = () => ({ title: `n = ${n.toLocaleString("en-US")}`, rows: rows.length ? rows : [["", "", ""]], colLabels: ["complexity", "steps", "fits?"] });
    t.step({ line: 1, array: [], hideStage: true, grid: grid(), vars: { n },
      message: `A computer does very roughly 100 million simple steps a second. So once you know how big the input can be, you can tell in advance which approaches are fast enough, before writing any code. Let's try each common complexity on n = ${n.toLocaleString("en-US")}.` });
    let asked = false;
    for (const k of KINDS) {
      t.op();
      const steps = k.f(n), fits = steps <= BUDGET;
      rows.push([k.label, fmt(steps), fits ? "yes" : "too slow"]);
      const r = rows.length - 1;
      tones[`${r},2`] = fits ? "found" : "miss";
      const ask = !asked && k.label === "O(n²)" ? (asked = true, { ask: { q: `n is ${n.toLocaleString("en-US")}. Does an O(n²) approach (${fmt(steps)} steps) fit in about a second?`, options: fits ? ["Yes", "No"] : ["No", "Yes"], answer: 0 } }) : {};
      t.step({ ...ask, line: 4, array: [], hideStage: true, grid: { ...grid(), tones: { ...tones } }, vars: { n, steps: fmt(steps) },
        message: `${k.label} (for example ${k.example}): ${fmt(steps)} steps. ${fits ? `That's within 100 million: fine.` : `That's over 100 million: too slow.`}` });
    }
    const best = KINDS.filter((k) => k.f(n) <= BUDGET).pop();
    t.step({ line: 4, array: [], hideStage: true, grid: { ...grid(), tones: { ...tones } }, vars: { n }, done: "found",
      message: best ? `For n = ${n.toLocaleString("en-US")}, anything up to ${best.label} is fast enough. So the problem expects an approach no slower than that: a strong hint about which technique to use.` : `For n = ${n.toLocaleString("en-US")}, even O(log n) is a stretch; the answer probably needs a formula.` });
  },
};

export const approaches = { budget };
