import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; k: number };
export const example: Input = { nums: [8, 1, 6, 3, 9, 4], k: 2 };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "rotate right by k =", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  if (!Number.isInteger(raw.k) || raw.k < 0 || raw.k > 20) return { error: "Pick k from 0 to 20 here, so the slow approach finishes." };
  return { input: raw };
}
type T = Parameters<Approach<Input>["run"]>[1];
const all = (n: number, tone: Tone = "settled") => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, tone]));

const stepByStep: Approach<Input> = {
  id: "one-step",
  name: "Rotate by one, k times",
  code: `function rotate(nums, k)
    n ← length(nums)
    repeat k times
        last ← nums[n - 1]
        for i ← n - 1 down to 1
            nums[i] ← nums[i - 1]  // shift right
        nums[0] ← last
`,
  run({ nums: input, k }, t) {
    const a = [...input], n = a.length;
    t.step({ line: 2, array: [...a], vars: { k }, message: `Rotating right by 1 moves every value one place right, and the last one wraps round to the front. Do that ${k} time${k === 1 ? "" : "s"}.` });
    for (let r = 1; r <= k; r++) {
      const last = a[n - 1];
      for (let i = n - 1; i >= 1; i--) { t.op(); a[i] = a[i - 1]; }
      a[0] = last; t.op();
      t.step({ line: 7, array: [...a], tones: { 0: "found" }, ...(n > 1 ? { move: { from: n - 1, to: 0 } } : {}), vars: { round: `${r} of ${k}` },
        message: `Round ${r}: shift all ${n - 1} other values right by one and put ${last} at the front.${r % n === 0 ? " That's a full lap: the array is back where it started." : ""}` });
    }
    t.step({ line: 7, array: [...a], tones: all(n), vars: {}, done: "found",
      message: `Done after ${k} rounds of about ${n} moves each: O(n · k).${k >= n ? ` ${k - (k % n)} of those rounds only went full circle.` : ""}` });
  },
};

const extraArray: Approach<Input> = {
  id: "copy",
  name: "Copy each value to its new place",
  code: `function rotate(nums, k)
    n ← length(nums)
    out ← array of n, all 0
    for i ← 0 to n - 1
        out[(i + k) % n] ← nums[i]
    for i ← 0 to n - 1
        nums[i] ← out[i]
`,
  run({ nums: input, k }, t) {
    const a = [...input], n = a.length;
    const out: (number | string)[] = a.map(() => "");
    const grid = (hl?: number) => ({ title: "out (a second array)", rows: [[...out]], colLabels: out.map((_, i) => i), tones: hl === undefined ? {} : { [`0,${hl}`]: "found" as Tone } });
    t.step({ line: 3, array: [...a], grid: grid(), vars: { n, k }, message: `After rotating right by ${k}, the value at position i ends up at position (i + ${k}) % ${n}. Write each one straight to its new place in a second array.` });
    let asked = false;
    for (let i = 0; i < n; i++) {
      t.op();
      const to = (i + k) % n;
      out[to] = a[i];
      const ask = !asked && i + k >= n ? (asked = true, { ask: { q: `nums[${i}] = ${a[i]}. Where does it go: (${i} + ${k}) % ${n} = ?`, options: [String(to), String(i + k), String(i)].filter((o, q, arr) => arr.indexOf(o) === q), answer: 0 } }) : {};
      t.step({ ...("ask" in ask && (ask as { ask: { options: string[] } }).ask.options.length > 1 ? ask : {}), line: 5, array: [...a], pointers: { i }, tones: { [i]: "active" }, grid: grid(to), vars: { i, "new place": to },
        message: `nums[${i}] = ${a[i]} goes to (${i} + ${k}) % ${n} = ${to}.${i + k >= n ? " It wrapped round past the end." : ""}` });
    }
    for (let i = 0; i < n; i++) { t.op(); a[i] = out[i] as number; }
    t.step({ line: 7, array: [...a], tones: all(n), grid: grid(), vars: {}, done: "found",
      message: `Copy out back into nums. O(n) time, but the second array takes O(n) space.` });
  },
};

function reverse(t: T, a: number[], i0: number, j0: number, line: number, label: string, keep: Record<number, Tone>) {
  let i = i0, j = j0;
  while (i < j) {
    t.op();
    [a[i], a[j]] = [a[j], a[i]];
    t.step({ line, array: [...a], pointers: { i, j }, range: [i0, j0], tones: { ...keep, [i]: "found", [j]: "found" }, vars: { reversing: label },
      message: `${label}: swap positions ${i} and ${j}.` });
    i++; j--;
  }
}

const reversals: Approach<Input> = {
  id: "reversals",
  name: "Three reversals (optimal)",
  code: `function rotate(nums, k)
    n ← length(nums)
    k ← k % n
    reverse(nums, 0, n - 1)
    reverse(nums, 0, k - 1)
    reverse(nums, k, n - 1)
`,
  run({ nums: input, k: k0 }, t) {
    const a = [...input], n = a.length, k = k0 % n;
    t.step({ ask: k0 >= n ? { q: `n = ${n} and k = ${k0}. What does rotating by ${k0} amount to?`, options: [`Rotating by ${k}`, `Rotating by ${k0}`, "Nothing at all"].filter((o, q, arr) => arr.indexOf(o) === q), answer: 0 } : undefined,
      line: 3, array: [...a], vars: { n, k },
      message: `${k0 >= n ? `${k0} % ${n} = ${k}: whole laps change nothing. ` : ""}No second array this time. The last ${k} value${k === 1 ? "" : "s"} must come to the front; three reversals do it in place.` });
    if (k === 0) { t.step({ line: 3, array: [...a], tones: all(n), vars: { k }, done: "found", message: "k % n is 0: nothing to do." }); return; }
    const A = Object.fromEntries(Array.from({ length: k }, (_, i) => [i, "side-a" as Tone])), B = Object.fromEntries(Array.from({ length: n - k }, (_, i) => [k + i, "side-b" as Tone]));
    reverse(t, a, 0, n - 1, 4, "the whole array", {});
    t.step({ line: 4, array: [...a], tones: { ...A, ...B }, vars: { k },
      message: `Now the last ${k} values are at the front, and the others after them: the right groups, but each one backwards.` });
    reverse(t, a, 0, k - 1, 5, `the first ${k}`, B);
    reverse(t, a, k, n - 1, 6, `the last ${n - k}`, A);
    t.step({ line: 6, array: [...a], tones: all(n), vars: {}, done: "found",
      message: `Rotated: ${a.join(", ")}. Every value is swapped at most twice: O(n) time and O(1) extra space.` });
  },
};

export const approaches = { stepByStep, extraArray, reversals };

/** k = n − 1: the one-step approach does almost n² moves. */
export const growth = measureGrowth(
  [{ approach: stepByStep, slot: 1 }, { approach: extraArray, slot: 2 }, { approach: reversals, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i), k: Math.max(1, n - 1) }),
  [4, 8, 16, 24, 32],
);
