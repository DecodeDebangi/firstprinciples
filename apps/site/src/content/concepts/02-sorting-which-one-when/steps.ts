import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [5, 2, 8, 1, 9, 3, 7] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "Give at least two numbers." };
  if (Math.max(...raw.nums) - Math.min(...raw.nums) > 30) return { error: "Keep the values within a range of 30 so counting sort's table fits." };
  return { input: raw };
}

const span = (a: number, b: number, tone: Tone): Record<number, Tone> =>
  Object.fromEntries(Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => [a + k, tone]));

const bubble: Approach<Input> = {
  id: "bubble",
  name: "Bubble sort",
  code: `function bubbleSort(a)
    n ← length(a)
    for i ← 0 to n - 1
        swapped ← false
        for j ← 0 to n - 2 - i
            if a[j] > a[j + 1]
                swap a[j] and a[j + 1]
                swapped ← true
        if not swapped
            break
`,
  run({ nums }, t) {
    const a = [...nums], n = a.length;
    t.step({ line: 2, array: [...a], vars: { pass: null }, message: "Walk the list swapping out-of-order neighbours. Each pass carries the largest remaining value to the end." });
    for (let i = 0; i < n; i++) {
      let swapped = false;
      const tail = span(n - i, n - 1, "settled");
      for (let j = 0; j < n - 1 - i; j++) {
        t.op();
        const swap = a[j] > a[j + 1];
        const ask = { q: `${a[j]} and ${a[j + 1]} are neighbours. What happens?`, options: ["Out of order: swap them", "In order: leave them"], answer: swap ? 0 : 1 };
        if (swap) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; t.op(); swapped = true; }
        t.step({ ask, line: swap ? 7 : 6, array: [...a], pointers: { j }, tones: { ...tail, [j]: swap ? "found" : "compare", [j + 1]: swap ? "found" : "compare" },
          badge: { at: j, text: swap ? "swap" : `${a[j]} ≤ ${a[j + 1]}` }, vars: { pass: i + 1 },
          message: swap ? `Swap: ${a[j + 1]} was bigger than ${a[j]}.` : `${a[j]} ≤ ${a[j + 1]}: already in order.` });
      }
      if (!swapped) {
        t.step({ line: 10, array: [...a], tones: span(0, n - 1, "settled"), vars: { pass: i + 1 }, done: "found",
          message: `A whole pass with no swaps: the list is sorted. Stopping early is why bubble sort is fast on already-sorted input.` });
        return;
      }
    }
    t.step({ line: 10, array: [...a], tones: span(0, n - 1, "settled"), vars: { pass: n }, done: "found", message: "Sorted." });
  },
};

const selection: Approach<Input> = {
  id: "selection",
  name: "Selection sort",
  code: `function selectionSort(a)
    n ← length(a)
    for i ← 0 to n - 1
        m ← i
        for j ← i + 1 to n - 1
            if a[j] < a[m]
                m ← j
        swap a[i] and a[m]
`,
  run({ nums }, t) {
    const a = [...nums], n = a.length;
    t.step({ line: 2, array: [...a], vars: { i: null }, message: "Find the smallest remaining value and swap it to the front. Repeat for the rest." });
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      for (let j = i + 1; j < n; j++) {
        t.op();
        const smaller = a[j] < a[m];
        const ask = { q: `Smallest so far is ${a[m]}. Is ${a[j]} smaller?`, options: ["Yes: it becomes the new minimum", "No: keep the current minimum"], answer: smaller ? 0 : 1 };
        if (smaller) m = j;
        t.step({ ask, line: smaller ? 7 : 6, array: [...a], pointers: { i, j, min: m }, range: [i, n - 1], tones: { ...span(0, i - 1, "settled"), [m]: "active", [j]: "compare" },
          vars: { i, min: a[m] }, message: smaller ? `${a[j]} is the new smallest.` : `${a[j]} isn't smaller than ${a[m]}.` });
      }
      [a[i], a[m]] = [a[m], a[i]];
      t.op();
      t.step({ line: 8, array: [...a], pointers: { i }, tones: { ...span(0, i, "settled"), [i]: "found" }, vars: { i, min: a[i] },
        message: `Swap the smallest, ${a[i]}, into position ${i}. It never moves again.` });
    }
    t.step({ line: 8, array: [...a], tones: span(0, n - 1, "settled"), vars: { i: null }, done: "found",
      message: "Sorted. Selection sort always does about n²/2 comparisons, even on sorted input, but at most n − 1 swaps." });
  },
};

const insertion: Approach<Input> = {
  id: "insertion",
  name: "Insertion sort",
  code: `function insertionSort(a)
    for i ← 1 to length(a) - 1
        x ← a[i]
        j ← i - 1
        while j ≥ 0 and a[j] > x
            a[j + 1] ← a[j]
            j -= 1
        a[j + 1] ← x
`,
  run({ nums }, t) {
    const a: (number | string)[] = [...nums], n = a.length;
    t.step({ line: 2, array: [...a], range: [0, 0], vars: { x: null }, message: "Keep a sorted part on the left (the shelf). Take the next value and slide it left into place, like sorting cards in your hand." });
    for (let i = 1; i < n; i++) {
      const x = a[i] as number;
      let j = i - 1;
      t.step({ line: 3, array: [...a], pointers: { i }, range: [0, i - 1], tones: { [i]: "active" }, vars: { x }, message: `Take ${x}.` });
      while (j >= 0) {
        t.op();
        const shift = (a[j] as number) > x;
        const ask = { q: `${a[j]} is to the left of the gap. Is it bigger than ${x}?`, options: ["Yes: shift it right", `No: ${x} goes here`], answer: shift ? 0 : 1 };
        if (!shift) {
          t.step({ ask, line: 5, array: [...a], pointers: { j }, range: [0, i - 1], tones: { [j]: "compare" }, vars: { x }, message: `${a[j]} ≤ ${x}: stop shifting.` });
          break;
        }
        a[j + 1] = a[j];
        t.op();
        t.step({ ask, line: 6, array: [...a], pointers: { j }, range: [0, i], tones: { [j]: "active", [j + 1]: "compare" }, move: { from: j, to: j + 1 }, vars: { x }, message: `${a[j]} > ${x}: shift it one place right, from position ${j} to ${j + 1}.` });
        j--;
      }
      a[j + 1] = x;
      t.op();
      t.step({ line: 8, array: [...a], pointers: { at: j + 1 }, range: [0, i], tones: { [j + 1]: "found" }, vars: { x },
        message: `Drop ${x} into position ${j + 1}. The first ${i + 1} values are now sorted.` });
    }
    t.step({ line: 8, array: [...a], tones: span(0, n - 1, "settled"), vars: { x: null }, done: "found",
      message: "Sorted. On nearly sorted input each value moves only a step or two, so insertion sort is close to O(n)." });
  },
};

const merge: Approach<Input> = {
  id: "merge",
  name: "Merge sort",
  code: `function mergeSort(a, lo, hi)  // hi excluded
    // first call: mergeSort(a, 0, length(a))
    if hi - lo ≤ 1
        return
    mid ← floor((lo + hi) / 2)
    mergeSort(a, lo, mid)
    mergeSort(a, mid, hi)
    merge the two sorted halves back into a
`,
  run({ nums }, t) {
    const a = [...nums];
    const stack: string[] = [];
    t.step({ line: 2, array: [...a], stack: [], vars: {}, message: "Split the list in half, sort each half, then merge the two sorted halves. A list of one is already sorted." });
    const go = (lo: number, hi: number) => {
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      stack.push(`sort[${lo}:${hi}]`);
      go(lo, mid);
      go(mid, hi);
      const L = a.slice(lo, mid), R = a.slice(mid, hi), out: number[] = [];
      let i = 0, j = 0;
      while (i < L.length && j < R.length) { t.op(); out.push(L[i] <= R[j] ? L[i++] : R[j++]); }
      out.push(...L.slice(i), ...R.slice(j));
      t.op(out.length);
      for (let k = 0; k < out.length; k++) a[lo + k] = out[k];
      t.step({ line: 8, array: [...a], range: [lo, hi - 1], tones: span(lo, hi - 1, "found"), stack: [...stack], vars: { left: `[${L.join(", ")}]`, right: `[${R.join(", ")}]` },
        message: `Merge [${L.join(", ")}] and [${R.join(", ")}] into [${out.join(", ")}] by repeatedly taking the smaller front value.` });
      stack.pop();
    };
    go(0, a.length);
    t.step({ line: 8, array: [...a], tones: span(0, a.length - 1, "settled"), stack: [], vars: {}, done: "found",
      message: "Sorted. Always about n·log₂n work, whatever the input, and stable, but merging needs O(n) extra space." });
  },
};

const quick: Approach<Input> = {
  id: "quick",
  name: "Quicksort",
  code: `function quickSort(a, lo, hi)  // hi included
    // first call: quickSort(a, 0, n - 1)
    if lo ≥ hi
        return
    pivot, i ← a[hi], lo
    for j ← lo to hi - 1
        if a[j] < pivot
            swap a[i] and a[j]
            i += 1
    swap a[i] and a[hi]
    quickSort(a, lo, i - 1)
    quickSort(a, i + 1, hi)
`,
  run({ nums }, t) {
    const a = [...nums];
    const placed = new Set<number>();
    const settled = () => Object.fromEntries([...placed].map((k) => [k, "settled" as Tone]));
    t.step({ line: 2, array: [...a], vars: { pivot: null }, message: "Pick a pivot (here the last value), move everything smaller to its left, then sort each side the same way." });
    const go = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) { placed.add(lo); return; }
      const pivot = a[hi];
      let i = lo;
      t.step({ line: 5, array: [...a], pointers: { pivot: hi }, range: [lo, hi], tones: { ...settled(), [hi]: "active" }, vars: { pivot }, message: `Pivot ${pivot}. Partition positions ${lo}–${hi} around it.` });
      for (let j = lo; j < hi; j++) {
        t.op();
        const smaller = a[j] < pivot;
        const ask = { q: `Is ${a[j]} smaller than the pivot ${pivot}?`, options: ["Yes: swap it into the left part", "No: leave it on the right"], answer: smaller ? 0 : 1 };
        if (smaller) { [a[i], a[j]] = [a[j], a[i]]; t.op(); i++; }
        t.step({ ask, line: smaller ? 8 : 7, array: [...a], pointers: { i, j, pivot: hi }, range: [lo, hi], tones: { ...settled(), ...span(lo, i - 1, "side-a"), [hi]: "active", [j]: smaller ? "found" : "compare" },
          vars: { pivot }, message: smaller ? `${a[i - 1]} < ${pivot}: it joins the "smaller" part.` : `${a[j]} ≥ ${pivot}: stays on the right.` });
      }
      [a[i], a[hi]] = [a[hi], a[i]];
      t.op();
      placed.add(i);
      t.step({ line: 10, array: [...a], pointers: { pivot: i }, range: [lo, hi], tones: { ...settled(), [i]: "found" }, vars: { pivot }, message: `Swap the pivot into position ${i}: it's in its final place. Now sort each side.` });
      go(lo, i - 1);
      go(i + 1, hi);
    };
    go(0, a.length - 1);
    t.step({ line: 12, array: [...a], tones: span(0, a.length - 1, "settled"), vars: { pivot: null }, done: "found",
      message: "Sorted. Usually the fastest in practice, but with the last value as pivot, already-sorted input makes every split lopsided: O(n²)." });
  },
};

const counting: Approach<Input> = {
  id: "counting",
  name: "Counting sort",
  code: `function countingSort(a)
    lo, hi ← min(a), max(a)
    count ← array of hi - lo + 1, all 0
    for each x in a
        count[x - lo] += 1
    i ← 0
    for each index v, value c in count
        repeat c times
            a[i] ← v + lo
            i += 1
`,
  run({ nums }, t) {
    const a = [...nums];
    const lo = Math.min(...a), hi = Math.max(...a);
    const count = Array(hi - lo + 1).fill(0);
    t.op(a.length);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: `count of each value ${lo}…${hi}`, rows: [count.map((_, k) => k + lo), [...count]], tones });
    t.step({ line: 3, array: [...a], grid: grid(), vars: { lo, hi }, message: `No comparisons at all: count how many times each value from ${lo} to ${hi} appears, then write them back in order.` });
    a.forEach((x, k) => {
      t.op();
      count[x - lo]++;
      t.step({ line: 5, array: [...a], pointers: { x: k }, tones: { [k]: "compare" }, grid: grid({ [`1,${x - lo}`]: "found" }), vars: { lo, hi }, message: `Count ${x}.` });
    });
    let i = 0;
    for (let v = 0; v < count.length; v++) {
      t.op();
      for (let c = 0; c < count[v]; c++) { a[i++] = v + lo; t.op(); }
    }
    t.step({ line: 9, array: [...a], tones: span(0, a.length - 1, "settled"), grid: grid(), vars: { lo, hi }, done: "found",
      message: `Written back in order: O(n + k) for k possible values. Unbeatable when k is small, wasteful when values spread widely.` });
  },
};

export const approaches = { bubble, selection, insertion, merge, quick, counting };

const randomish = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => (i * 37 + 11) % 101) });
const nearlySorted = (n: number): Input => {
  const nums = Array.from({ length: n }, (_, i) => i);
  const m = n >> 1;
  [nums[m], nums[m + 1]] = [nums[m + 1], nums[m]];
  return { nums };
};
const sizes = [8, 16, 32, 48, 64, 96, 128];

/** Shuffled input: the O(n²) sorts fall far behind. */
export const growthRandom = measureGrowth(
  [{ approach: bubble, slot: 1 }, { approach: insertion, slot: 2 }, { approach: merge, slot: 3 }],
  randomish, sizes,
);

/** Nearly sorted input: insertion sort wins, quicksort with a last-element pivot collapses. */
export const growthNearly = measureGrowth(
  [{ approach: quick, slot: 1 }, { approach: merge, slot: 2 }, { approach: insertion, slot: 3 }],
  nearlySorted, sizes,
);
