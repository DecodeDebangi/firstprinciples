import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [0, 3, 0, 5, 8, 0, 2] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

const bubble: Approach<Input> = {
  id: "bubble",
  name: "Bubble each zero to the end",
  code: `function moveZeroes(nums)
  n ← length(nums)
  for i ← 0 to n - 1
    for j ← 0 to n - 2 - i
      if nums[j] = 0 and nums[j + 1] ≠ 0
        swap nums[j] and nums[j + 1]
`,
  run({ nums }, t) {
    const a = [...nums];
    const n = a.length;
    t.step({ line: 2, array: [...a], vars: { i: null, j: null }, message: "Like bubble sort: walk the list again and again, swapping a zero with the non-zero after it." });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        t.op();
        const tail = Object.fromEntries(Array.from({ length: i }, (_, k) => [n - 1 - k, "settled" as Tone]));
        if (a[j] === 0 && a[j + 1] !== 0) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          t.step({ line: 6, array: [...a], pointers: { j }, tones: { ...tail, [j]: "found", [j + 1]: "found" }, badge: { at: j, text: "swap" }, vars: { i, j },
            message: `A zero sat before ${a[j]}. Swap them: the zero moves one step right.` });
        } else {
          t.step({ line: 5, array: [...a], pointers: { j }, tones: { ...tail, [j]: "compare", [j + 1]: "compare" }, vars: { i, j },
            message: `${a[j]}, ${a[j + 1]}: nothing to swap.` });
        }
      }
    }
    t.step({ line: 6, array: [...a], tones: Object.fromEntries(a.map((v, k) => [k, v === 0 ? "discard" : "settled"] as const)), vars: { i: null, j: null }, done: "found",
      message: `Done: [${a.join(", ")}]. Order kept, but every pass re-walked the list.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "pointers",
  name: "Two pointers: read and write",
  code: `function moveZeroes(nums)
  write ← 0
  for read ← 0 to length(nums) - 1
    if nums[read] ≠ 0
      swap nums[write] and nums[read]
      write += 1
`,
  run({ nums }, t) {
    const a = [...nums];
    let write = 0;
    const done = () => Object.fromEntries(Array.from({ length: write }, (_, k) => [k, "settled" as Tone]));
    t.step({ line: 2, array: [...a], pointers: { write, read: 0 }, vars: { write },
      message: "read scans every number; write marks where the next non-zero belongs. Everything left of write is already final." });
    for (let read = 0; read < a.length; read++) {
      t.op();
      const x = a[read];
      const ask = { q: `nums[read] = ${x}. What happens?`, options: ["Non-zero: swap it to write, then move write", "Zero: skip it"], answer: x !== 0 ? 0 : 1 };
      if (x !== 0) {
        [a[write], a[read]] = [a[read], a[write]];
        const w = write;
        write++;
        t.step({ ask, line: 5, array: [...a], pointers: { write, read }, tones: { ...done(), [w]: "found", ...(read !== w ? { [read]: "compare" } : {}) },
          badge: { at: w, text: read === w ? "stays" : "swap" }, vars: { write },
          message: read === w ? `${x} is already where it belongs. write moves to ${write}.` : `Swap ${x} into slot ${w}; the zero there moves to slot ${read}. write moves to ${write}.` });
      } else {
        t.step({ ask, line: 4, array: [...a], pointers: { write, read }, tones: { ...done(), [read]: "discard" }, vars: { write },
          message: "A zero. Leave it; a later non-zero will be swapped over it." });
      }
    }
    t.step({ line: 6, array: [...a], tones: Object.fromEntries(a.map((v, k) => [k, v === 0 ? "discard" : "settled"] as const)), vars: { write }, done: "found",
      message: `Done in one pass: [${a.join(", ")}].` });
  },
};

export const approaches = { bubble, pointers: twoPointers };

const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => (i % 2 ? i : 0)) });

export const growth = measureGrowth(
  [
    { approach: bubble, slot: 1 },
    { approach: twoPointers, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
