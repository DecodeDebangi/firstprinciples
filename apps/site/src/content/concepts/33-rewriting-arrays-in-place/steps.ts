import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/* ---------- Read and write pointers ---------- */
export type KeepInput = { nums: number[]; v: number };
export const keepExample: KeepInput = { nums: [4, 0, 7, 0, 0, 3, 8], v: 0 };
export const keepFields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "v", label: "remove every", kind: "number" },
];
export function keepPrepare(raw: KeepInput): Prepared<KeepInput> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  return { input: raw };
}

const keep: Approach<KeepInput> = {
  id: "keep",
  name: "Read and write pointers",
  code: `function removeAll(a, v)
    w ← 0  // where the next kept value goes
    for r ← 0 to length(a) - 1
        if a[r] ≠ v
            a[w] ← a[r]
            w += 1
    return w  // a[0..w-1] is the answer
`,
  run({ nums, v }, t) {
    const a = [...nums];
    let w = 0;
    const kept = () => Object.fromEntries(Array.from({ length: w }, (_, k) => [k, "settled" as Tone]));
    t.step({ line: 2, array: a, pointers: { r: 0, w }, vars: { v, w },
      message: `Remove every ${v} without a second array. r reads every position in turn; w marks where the next value worth keeping should go. Everything before w is finished.` });
    let asked = false;
    for (let r = 0; r < a.length; r++) {
      t.op();
      if (a[r] === v) {
        t.step({ line: 4, array: [...a], pointers: { r, w }, tones: { ...kept(), [r]: "discard" }, vars: { v, w },
          message: `a[${r}] is ${v}: skip it. w stays where it is, so the next kept value will land on top of it.` });
        continue;
      }
      const ask = !asked && r > w ? (asked = true, { ask: { q: `a[${r}] = ${a[r]} is worth keeping, and w is ${w}. Where does it go?`, options: [`a[${w}]: the write position`, `a[${r}]: it stays put`, `the end of the array`], answer: 0 } }) : {};
      const from = r, to = w;
      a[w] = a[r];
      w++;
      t.step({ ...ask, line: 6, array: [...a], pointers: { r, w: Math.min(w, a.length - 1) }, tones: { ...kept(), [to]: "found" }, ...(from !== to ? { move: { from, to } } : {}), vars: { v, w },
        message: from === to ? `a[${r}] = ${a[to]} is kept, and it's already in place (r = w). w moves on to ${w}.` : `a[${r}] = ${a[to]} is kept: copy it to a[${to}], the write position, and move w on to ${w}.` });
    }
    t.step({ line: 7, array: [...a], tones: { ...kept(), ...Object.fromEntries(Array.from({ length: a.length - w }, (_, k) => [w + k, "discard" as Tone])) }, vars: { v, w }, done: "found",
      message: `Return ${w}: a[0..${w - 1}] = ${a.slice(0, w).join(", ")} is the answer, in the original order. Whatever is left after it doesn't matter. One pass, O(n), and no extra array: O(1) space.` });
  },
};

/* ---------- Reversing a section ---------- */
export type RevInput = { nums: number[]; i: number; j: number };
export const revExample: RevInput = { nums: [1, 2, 3, 4, 5, 6, 7], i: 1, j: 5 };
export const revFields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "i", label: "from position", kind: "number" },
  { key: "j", label: "to position", kind: "number" },
];
export function revPrepare(raw: RevInput): Prepared<RevInput> {
  const n = raw.nums.length;
  if (n === 0) return { error: "Give at least one value." };
  if (n > 8) return { error: "Use at most 8 values." };
  if (!Number.isInteger(raw.i) || !Number.isInteger(raw.j) || raw.i < 0 || raw.j >= n || raw.i > raw.j) return { error: `Pick 0 ≤ from ≤ to ≤ ${n - 1}.` };
  return { input: raw };
}
/** Reverses a[i..j] in place, emitting a step per swap. Returns nothing; `a` is changed. */
function reverseSteps(t: Parameters<Approach<RevInput>["run"]>[1], a: number[], i0: number, j0: number, line: number, extraTones: Record<number, Tone> = {}, vars: Record<string, string | number> = {}, askFirst = false) {
  let i = i0, j = j0, asked = !askFirst;
  while (i < j) {
    t.op();
    const ask = !asked ? (asked = true, { ask: { q: `a[${i}] = ${a[i]} and a[${j}] = ${a[j]}. After swapping them, where do i and j go?`, options: ["i one step right, j one step left", "Both one step right", "Both stay"], answer: 0 } }) : {};
    [a[i], a[j]] = [a[j], a[i]];
    t.step({ ...ask, line, array: [...a], pointers: { i, j }, range: [i0, j0], tones: { ...extraTones, [i]: "found", [j]: "found" }, badge: { at: i, text: `swap ${a[j]} ↔ ${a[i]}` }, vars,
      message: `Swap a[${i}] and a[${j}]: now ${a[i]} and ${a[j]}. Then i moves right and j moves left.` });
    i++; j--;
  }
}

const reverse: Approach<RevInput> = {
  id: "reverse",
  name: "Reversing a section",
  code: `function reverse(a, i, j)  // a[i..j]
    while i < j
        swap a[i] and a[j]
        i += 1
        j -= 1
`,
  run({ nums, i, j }, t) {
    const a = [...nums];
    t.step({ line: 1, array: [...a], pointers: { i, j }, range: [i, j], vars: {},
      message: `Reverse just positions ${i} to ${j}. Swap the two ends, step both inwards, and repeat until they meet. Each swap puts two values in their final place.` });
    reverseSteps(t, a, i, j, 3, {}, {}, true);
    t.step({ line: 2, array: [...a], range: [i, j], tones: Object.fromEntries(Array.from({ length: j - i + 1 }, (_, k) => [i + k, "settled" as Tone])), vars: {}, done: "found",
      message: `${i === j ? "A section of one value is already reversed." : `The pointers met, so the section is reversed: ${a.slice(i, j + 1).join(", ")}.`} About (j − i) / 2 swaps: O(length of the section), and no extra space.` });
  },
};

/* ---------- Rotating with three reversals ---------- */
export type RotInput = { nums: number[]; k: number };
export const rotExample: RotInput = { nums: [1, 2, 3, 4, 5, 6, 7], k: 3 };
export const rotFields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "k", label: "rotate right by k =", kind: "number" },
];
export function rotPrepare(raw: RotInput): Prepared<RotInput> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  if (!Number.isInteger(raw.k) || raw.k < 0 || raw.k > 20) return { error: "Pick k from 0 to 20." };
  return { input: raw };
}

const rotate: Approach<RotInput> = {
  id: "rotate",
  name: "Rotating with three reversals",
  code: `function rotateRight(a, k)
    n ← length(a)
    k ← k % n
    reverse(a, 0, n - 1)  // the whole array
    reverse(a, 0, k - 1)  // the first k
    reverse(a, k, n - 1)  // the rest
`,
  run({ nums, k: k0 }, t) {
    const a = [...nums], n = a.length, k = k0 % n;
    t.step({ line: 3, array: [...a], vars: { n, k },
      message: `Rotating right by ${k0} moves the last ${k} value${k === 1 ? "" : "s"} to the front${k0 >= n ? ` (${k0} % ${n} = ${k}: whole laps change nothing)` : ""}. Three reversals do it in place.` });
    if (k === 0) {
      t.step({ line: 3, array: [...a], vars: { n, k }, done: "found", message: "k is 0: the array stays as it is." });
      return;
    }
    reverseSteps(t, a, 0, n - 1, 4, {}, { phase: "1: reverse all" });
    t.step({ line: 4, array: [...a], tones: { ...Object.fromEntries(Array.from({ length: k }, (_, q) => [q, "side-a" as Tone])), ...Object.fromEntries(Array.from({ length: n - k }, (_, q) => [k + q, "side-b" as Tone])) }, vars: { n, k },
      message: `After reversing everything, the last ${k} values are at the front, as they should be, but backwards. So are the others. Two more reversals fix the order inside each part.` });
    reverseSteps(t, a, 0, k - 1, 5, Object.fromEntries(Array.from({ length: n - k }, (_, q) => [k + q, "side-b" as Tone])), { phase: "2: first k" });
    reverseSteps(t, a, k, n - 1, 6, Object.fromEntries(Array.from({ length: k }, (_, q) => [q, "side-a" as Tone])), { phase: "3: the rest" });
    t.step({ line: 6, array: [...a], tones: Object.fromEntries(a.map((_, q) => [q, "settled" as Tone])), vars: { n, k }, done: "found",
      message: `Rotated: ${a.join(", ")}. Each value is swapped at most twice: O(n) time, O(1) extra space.` });
  },
};

export const keepApproaches = { keep };
export const revApproaches = { reverse };
export const rotApproaches = { rotate };
export { reverseSteps };
