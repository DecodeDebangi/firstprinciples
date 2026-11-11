import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { numbers: number[]; target: number };

export const example: Input = { numbers: [1, 3, 4, 7, 10, 12, 15], target: 25 };

export const fields: InputField[] = [
  { key: "numbers", label: "numbers (sorted)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.numbers.length < 2) return { error: "numbers needs at least two values." };
  const sorted = [...raw.numbers].sort((a, b) => a - b);
  const changed = sorted.some((v, i) => v !== raw.numbers[i]);
  return { input: { numbers: sorted, target: raw.target }, note: changed ? "This problem's list is sorted, so your numbers were sorted first." : undefined };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `def two_sum(numbers, target):
    n = len(numbers)
    for i in range(n):
        for j in range(i + 1, n):
            if numbers[i] + numbers[j] == target:
                return [i + 1, j + 1]
`,
  run({ numbers: a, target }, t) {
    const n = a.length;
    t.step({ line: 2, array: a, vars: { target }, message: "Ignore the sorting and try every pair. The answer is 1-indexed: position 1 is index 0." });
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op();
        const sum = a[i] + a[j];
        if (sum === target) {
          t.step({ line: 6, array: a, pointers: { i, j }, tones: { [i]: "found", [j]: "found" }, badge: { at: j, text: `${a[i]} + ${a[j]} = ${target} ✓` },
            vars: { i, j, sum, target }, done: "found", message: `${a[i]} + ${a[j]} = ${target}. Return [${i + 1}, ${j + 1}].` });
          return;
        }
        t.step({ line: 5, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${a[i]} + ${a[j]} = ${sum}` },
          vars: { i, j, sum, target }, message: `${a[i]} + ${a[j]} = ${sum}, not ${target}.` });
      }
    }
    t.step({ line: 2, array: a, vars: { target }, done: "notfound", message: `No pair adds up to ${target}.` });
  },
};

const binary: Approach<Input> = {
  id: "binary",
  name: "Binary search for the partner",
  code: `def two_sum(numbers, target):
    for i in range(len(numbers)):
        need = target - numbers[i]
        lo, hi = i + 1, len(numbers) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if numbers[mid] == need:
                return [i + 1, mid + 1]
            elif numbers[mid] < need:
                lo = mid + 1
            else:
                hi = mid - 1
`,
  run({ numbers: a, target }, t) {
    const n = a.length;
    t.step({ line: 2, array: a, vars: { target }, message: "Use the sorting a little: for each number, binary-search the rest of the list for its partner." });
    for (let i = 0; i < n; i++) {
      const need = target - a[i];
      let lo = i + 1, hi = n - 1;
      if (lo > hi) break;
      t.step({ line: 4, array: a, pointers: { i, lo, hi }, tones: { [i]: "active" }, range: [lo, hi], vars: { i, need, target },
        message: `numbers[${i}] = ${a[i]} needs ${target} − ${a[i]} = ${need}. Search for ${need} to its right.` });
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        t.op();
        const base = { array: a, range: [lo, hi] as [number, number], vars: { i, need, mid } };
        if (a[mid] === need) {
          t.step({ ...base, line: 8, pointers: { i, mid }, tones: { [i]: "found", [mid]: "found" }, badge: { at: mid, text: `${a[mid]} = ${need} ✓` },
            done: "found", message: `Found ${need} at index ${mid}. Return [${i + 1}, ${mid + 1}].` });
          return;
        }
        const right = a[mid] < need;
        t.step({ ...base, line: right ? 10 : 12, pointers: { i, lo, mid, hi }, tones: { [i]: "active", [mid]: "miss" },
          badge: { at: mid, text: right ? `${a[mid]} < ${need} →` : `← ${a[mid]} > ${need}` },
          message: right ? `${a[mid]} < ${need}: look right of mid.` : `${a[mid]} > ${need}: look left of mid.` });
        if (right) lo = mid + 1; else hi = mid - 1;
      }
    }
    t.step({ line: 2, array: a, vars: { target }, done: "notfound", message: `No pair adds up to ${target}.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "pointers",
  name: "Two pointers",
  code: `def two_sum(numbers, target):
    lo, hi = 0, len(numbers) - 1
    while lo < hi:
        s = numbers[lo] + numbers[hi]
        if s == target:
            return [lo + 1, hi + 1]
        elif s < target:
            lo += 1
        else:
            hi -= 1
`,
  run({ numbers: a, target }, t) {
    let lo = 0, hi = a.length - 1;
    const opts = ["Found it: return both positions", "Too small: move lo right", "Too big: move hi left"];
    t.step({ line: 2, array: a, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi, target },
      message: "Start at both ends. Sorted order means one comparison tells you which end to move." });
    while (lo < hi) {
      t.op();
      const s = a[lo] + a[hi];
      const ask = (answer: number) => ({ q: `${a[lo]} + ${a[hi]} = ${s}, and the target is ${target}. What next?`, options: opts, answer });
      const base = { array: a, pointers: { lo, hi }, range: [lo, hi] as [number, number], vars: { lo, hi, s, target } };
      if (s === target) {
        t.step({ ...base, ask: ask(0), badge: { at: lo, text: `${a[lo]} + ${a[hi]} = ${target} ✓` }, line: 6, tones: { [lo]: "found", [hi]: "found" }, done: "found",
          message: `${a[lo]} + ${a[hi]} = ${target}. Return [${lo + 1}, ${hi + 1}].` });
        return;
      }
      if (s < target) {
        t.step({ ...base, ask: ask(1), badge: { at: lo, text: `${s} < ${target}` }, line: 8, tones: { [lo]: "compare", [hi]: "compare" },
          message: `${s} is too small. ${a[hi]} is the biggest value left, so ${a[lo]} can't be in the answer. Move lo right.` });
        lo++;
      } else {
        t.step({ ...base, ask: ask(2), badge: { at: hi, text: `${s} > ${target}` }, line: 10, tones: { [lo]: "compare", [hi]: "compare" },
          message: `${s} is too big. ${a[lo]} is the smallest value left, so ${a[hi]} can't be in the answer. Move hi left.` });
        hi--;
      }
    }
    t.step({ line: 3, array: a, vars: { lo, hi, target }, done: "notfound", message: `The pointers met. No pair adds up to ${target}.` });
  },
};

export const approaches = { brute: bruteForce, binary, pointers: twoPointers };

/** Worst case: the only pair is the last two numbers. */
const worstCase = (n: number): Input => {
  const numbers = Array.from({ length: n }, (_, i) => 2 * i);
  return { numbers, target: numbers[n - 2] + numbers[n - 1] };
};

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: binary, slot: 2 },
    { approach: twoPointers, slot: 3 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
