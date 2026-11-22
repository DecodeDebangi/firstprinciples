import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { firstTrueSteps } from "../../concepts/47-binary-search-on-answers/steps";

export type Input = { n: number; bad: number };
export const example: Input = { n: 9, bad: 7 };
export const fields: InputField[] = [
  { key: "n", label: "versions n", kind: "number" },
  { key: "bad", label: "first bad version", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.n < 1 || raw.n > 9) return { error: "Use 1 to 9 versions so they fit." };
  if (raw.bad < 1 || raw.bad > raw.n) return { error: `The first bad version is between 1 and ${raw.n}.` };
  return { input: raw };
}
const versions = (n: number) => Array.from({ length: n }, (_, i) => `v${i + 1}`);

const oneByOne: Approach<Input> = {
  id: "linear",
  name: "Check every version from the first",
  code: `function firstBadVersion(n)
    for v ← 1 to n
        if isBadVersion(v)
            return v
`,
  run({ n, bad }, t) {
    const cells = versions(n), tones: Record<number, Tone> = {};
    t.step({ line: 2, array: cells, vars: {}, message: `Test versions in order until the first bad one. Every test is a call to isBadVersion.` });
    for (let v = 1; v <= n; v++) {
      t.op();
      const b = v >= bad;
      tones[v - 1] = b ? "found" : "visited";
      t.step({ line: b ? 4 : 3, array: cells, pointers: { v: v - 1 }, tones: { ...tones }, badge: { at: v - 1, text: b ? "bad" : "good" }, vars: { v, calls: v }, ...(b ? { done: "found" as const } : {}),
        message: b ? `Version ${v} is bad: it's the first. That took ${v} calls, up to n in the worst case: O(n).` : `Version ${v} is good. Next.` });
      if (b) return;
    }
  },
};

const binary: Approach<Input> = {
  id: "binary",
  name: "Binary search for the first bad",
  code: `function firstBadVersion(n)
    lo, hi ← 1, n + 1  // first bad is in [lo, hi)
    while lo < hi
        mid ← floor((lo + hi) / 2)
        if isBadVersion(mid)
            hi ← mid  // mid might be the first bad
        else
            lo ← mid + 1
    return lo
`,
  run({ n, bad }, t) {
    firstTrueSteps({ t, cells: versions(n), ok: (i) => i + 1 >= bad, lines: { check: 5, yes: 6, no: 8, done: 9 }, ask: true, offset: 1,
      says: (i, yes) => `Version ${i + 1} is ${yes ? "bad" : "good"}.`,
      intro: `Every version after a bad one is bad too: good, good, …, bad, bad. So test the middle version and keep the half where the first bad must be.`,
      finish: (f) => `lo and hi met at version ${f + 1}: the first bad one. At most ${Math.ceil(Math.log2(n + 1))} calls here: O(log n).` });
  },
};

export const approaches = { linear: oneByOne, binary };

/** The last version is the first bad one. */
export const growth = measureGrowth(
  [{ approach: oneByOne, slot: 1 }, { approach: binary, slot: 3 }],
  (n) => ({ n, bad: n }),
  [8, 16, 32, 64, 128],
);
