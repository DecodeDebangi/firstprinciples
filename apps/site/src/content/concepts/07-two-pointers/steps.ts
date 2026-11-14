import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };

export const example: Input = { nums: [1, 2, 2, 4, 6, 8, 9], target: 12 };

export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "target", label: "target sum", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "Give at least 2 numbers." };
  if (raw.nums.length > 7) return { error: "Use at most 7 numbers so the pair table fits." };
  const nums = [...raw.nums].sort((a, b) => a - b);
  return { input: { ...raw, nums }, note: nums.join() !== raw.nums.join() ? "Sorted the numbers first: both techniques here need sorted input." : undefined };
}

/** The table of every pair (i, j) with i < j. "?" = never looked at, a sum = checked, "–" = ruled out unseen. */
function pairTable(n: number) {
  const cells: (number | string)[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j > i ? "?" : "")));
  const tones: Record<string, Tone> = {};
  // Row n − 1 and column 0 hold no pairs, so the panel shows rows 0..n−2 and columns 1..n−1.
  const shift = (all: Record<string, Tone>) => Object.fromEntries(Object.entries(all).map(([k, v]) => { const [r, c] = k.split(",").map(Number); return [`${r},${c - 1}`, v]; }));
  const grid = (title: string, extra: Record<string, Tone> = {}) => ({
    title, rows: cells.slice(0, n - 1).map((r) => r.slice(1)), tones: shift({ ...tones, ...extra }),
    rowLabels: Array.from({ length: n - 1 }, (_, i) => i), colLabels: Array.from({ length: n - 1 }, (_, j) => j + 1),
  });
  return { cells, tones, grid };
}

const brute: Approach<Input> = {
  id: "brute",
  name: "Brute force: every pair",
  code: `function pairSum(a, target)
  for i ← 0 to length(a) - 1
    for j ← i + 1 to length(a) - 1
      if a[i] + a[j] = target
        return [i, j]
  return none
`,
  run({ nums: a, target }, t) {
    const n = a.length;
    const P = pairTable(n);
    const title = "pairs: row i, column j";
    t.step({ line: 2, array: a, grid: P.grid(title), vars: { target, checked: 0, pairs: (n * (n - 1)) / 2 },
      message: `There are ${(n * (n - 1)) / 2} pairs (the "?" cells). The brute force checks them one by one.` });
    let checked = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op();
        checked++;
        const s = a[i] + a[j];
        P.cells[i][j] = s;
        if (s === target) {
          P.tones[`${i},${j}`] = "found";
          t.step({ line: 5, array: a, pointers: { i, j }, tones: { [i]: "found", [j]: "found" }, grid: P.grid(title), vars: { target, checked }, done: "found",
            message: `${a[i]} + ${a[j]} = ${target}. Found [${i}, ${j}] after checking ${checked} pair${checked === 1 ? "" : "s"}.` });
          return;
        }
        t.step({ line: 4, array: a, pointers: { i, j }, tones: { [i]: "compare", [j]: "compare" }, badge: { at: j, text: `${s} ≠ ${target}` }, grid: P.grid(title, { [`${i},${j}`]: "compare" }), vars: { target, checked },
          message: `${a[i]} + ${a[j]} = ${s}, not ${target}. Next pair.` });
        P.tones[`${i},${j}`] = "discard";
      }
    }
    t.step({ line: 6, array: a, grid: P.grid(title), vars: { target, checked }, done: "notfound",
      message: `Checked all ${checked} pairs: none adds up to ${target}. O(n²).` });
  },
};

const ends: Approach<Input> = {
  id: "ends",
  name: "Two pointers from both ends",
  code: `function pairSum(a, target)  // a is sorted
  lo, hi ← 0, length(a) - 1
  while lo < hi
    s ← a[lo] + a[hi]
    if s = target
      return [lo, hi]
    if s < target
      lo += 1  // a[lo] too small for all
    else
      hi -= 1  // a[hi] too big for all
  return none
`,
  run({ nums: a, target }, t) {
    const n = a.length;
    const P = pairTable(n);
    const title = "pairs: row lo, column hi";
    const out: Record<number, Tone> = {};
    let lo = 0, hi = n - 1, checked = 0, ruled = 0;
    const total = (n * (n - 1)) / 2;
    t.step({ line: 2, array: a, pointers: { lo, hi }, range: [lo, hi], grid: P.grid(title), vars: { target, lo, hi, "ruled out": `0 of ${total}` },
      message: "Start with the smallest and the largest number. Because the array is sorted, one sum tells us about a whole row or column of pairs." });
    while (lo < hi) {
      t.op();
      checked++;
      const s = a[lo] + a[hi];
      const [lo0, hi0] = [lo, hi];
      const ask = { q: `${a[lo0]} + ${a[hi0]} = ${s}, and the target is ${target}. What next?`, options: ["Move lo right", "Move hi left", "Stop: found it"], answer: s === target ? 2 : s < target ? 0 : 1 };
      P.cells[lo][hi] = s;
      if (s === target) {
        P.tones[`${lo},${hi}`] = "found";
        t.step({ ask, line: 6, array: a, pointers: { lo, hi }, range: [lo, hi], tones: { ...out, [lo]: "found", [hi]: "found" }, grid: P.grid(title), vars: { target, lo, hi, s, "ruled out": `${ruled} of ${total}` }, done: "found",
          message: `${a[lo]} + ${a[hi]} = ${target}. Found [${lo}, ${hi}] after ${checked} sum${checked === 1 ? "" : "s"}, not ${total}.` });
        return;
      }
      let gone = 0;
      if (s < target) {
        for (let j = lo + 1; j <= hi; j++) { if (P.cells[lo][j] === "?") { P.cells[lo][j] = "–"; gone++; } P.tones[`${lo},${j}`] = "discard"; }
        ruled += gone + 1;
        out[lo] = "discard";
        t.step({ ask, line: 8, array: a, pointers: { lo, hi }, range: [lo, hi], tones: { ...out, [hi]: "compare" }, badge: { at: lo, text: `${s} < ${target}` }, grid: P.grid(title, { [`${lo0},${hi0}`]: "compare" }), vars: { target, lo, hi, s, "ruled out": `${ruled} of ${total}` },
          message: `${s} < ${target}. Even paired with the largest number left, ${a[lo]} is too small, so every pair in row ${lo} is out: ${gone + 1} pair${gone ? "s" : ""} gone with one sum. Move lo right.` });
        lo++;
      } else {
        for (let i = lo; i < hi; i++) { if (P.cells[i][hi] === "?") { P.cells[i][hi] = "–"; gone++; } P.tones[`${i},${hi}`] = "discard"; }
        ruled += gone + 1;
        out[hi] = "discard";
        t.step({ ask, line: 10, array: a, pointers: { lo, hi }, range: [lo, hi], tones: { ...out, [lo]: "compare" }, badge: { at: hi, text: `${s} > ${target}` }, grid: P.grid(title, { [`${lo0},${hi0}`]: "compare" }), vars: { target, lo, hi, s, "ruled out": `${ruled} of ${total}` },
          message: `${s} > ${target}. Even paired with the smallest number left, ${a[hi]} is too big, so every pair in column ${hi} is out: ${gone + 1} pair${gone ? "s" : ""} gone with one sum. Move hi left.` });
        hi--;
      }
    }
    t.step({ line: 11, array: a, tones: out, grid: P.grid(title), vars: { target, lo, hi, "ruled out": `${ruled} of ${total}` }, done: "notfound",
      message: `lo met hi: every pair has been ruled out, so nothing adds up to ${target}. ${checked} sums at most n − 1: O(n).` });
  },
};

const readwrite: Approach<Input> = {
  id: "readwrite",
  name: "Same direction: remove duplicates",
  code: `function dedupe(a)  // a is sorted
  w ← 1  // next slot to write
  for r ← 1 to length(a) - 1
    if a[r] ≠ a[w - 1]
      a[w] ← a[r]  // keep it
      w += 1
  return w  // a[0..w - 1] is unique
`,
  run({ nums }, t) {
    const a = [...nums];
    let w = 1;
    const kept = (): Record<number, Tone> => Object.fromEntries(Array.from({ length: w }, (_, k) => [k, "settled" as Tone]));
    t.step({ line: 2, array: [...a], pointers: { w }, tones: kept(), vars: { w },
      message: "A different shape: both pointers move the same way. r reads every item once; w marks where the next unique value goes. Everything left of w is finished." });
    for (let r = 1; r < a.length; r++) {
      t.op();
      const [ar, last] = [a[r], a[w - 1]];
      const ask = { q: `r reads ${ar}; the last value kept is ${last}. Keep ${ar}?`, options: ["Yes: write it at w", "No: it's a duplicate, skip it"], answer: ar !== last ? 0 : 1 };
      if (ar !== last) {
        a[w] = ar;
        t.step({ ask, line: 5, array: [...a], pointers: { w, r }, tones: { ...kept(), [w]: "found", [r]: "compare" }, badge: { at: w, text: `${ar} ≠ ${last}` }, vars: { w, r },
          message: `${ar} ≠ ${last}: new value. Write it into slot ${w} and move w on.` });
        w++;
      } else {
        t.step({ ask, line: 4, array: [...a], pointers: { w, r }, tones: { ...kept(), [r]: "miss" }, badge: { at: r, text: `${ar} = ${last}` }, vars: { w, r },
          message: `${ar} = ${last}: a duplicate. Skip it; w stays put.` });
      }
    }
    const final: Record<number, Tone> = { ...kept() };
    for (let k = w; k < a.length; k++) final[k] = "discard";
    t.step({ line: 7, array: [...a], pointers: { w }, tones: final, vars: { w }, done: "found",
      message: `Done: the first ${w} slots hold [${a.slice(0, w).join(", ")}]. One pass, no extra array: O(n) time, O(1) space.` });
  },
};

export const approaches = { brute, ends, readwrite };

const sizes = [8, 16, 32, 48, 64, 96, 128];
/** Worst case for both: no pair adds up to the target. */
export const growth = measureGrowth([{ approach: brute, slot: 1 }, { approach: ends, slot: 2 }], (n) => ({ nums: Array.from({ length: n }, (_, i) => i), target: -1 }), sizes);
