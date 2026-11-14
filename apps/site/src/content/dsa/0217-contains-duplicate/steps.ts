import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [4, 9, 2, 7, 9, 1] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `function containsDuplicate(nums)
    n ← length(nums)
    for i ← 0 to n - 1
        for j ← i + 1 to n - 1
            if nums[i] = nums[j]
                return true
    return false
`,
  run({ nums: a }, t) {
    t.step({ line: 2, array: a, vars: { i: null, j: null }, message: "Compare every number with every number after it." });
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) {
        t.op();
        if (a[i] === a[j]) {
          t.step({ line: 6, array: a, pointers: { i, j }, tones: { [i]: "found", [j]: "found" }, badge: { at: j, text: `${a[i]} = ${a[j]} ✓` },
            vars: { i, j }, done: "found", message: `nums[${i}] and nums[${j}] are both ${a[i]}. Return true.` });
          return;
        }
        t.step({ line: 5, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${a[i]} ≠ ${a[j]}` },
          vars: { i, j }, message: `${a[i]} ≠ ${a[j]}. Next pair.` });
      }
    }
    t.step({ line: 7, array: a, vars: { i: null, j: null }, done: "notfound", message: "Every pair differs. Return false." });
  },
};

const sortNeighbours: Approach<Input> = {
  id: "sort",
  name: "Sort, then check neighbours",
  code: `function containsDuplicate(nums)
    nums ← sorted(nums)
    for i ← 1 to length(nums) - 1
        if nums[i] = nums[i - 1]
            return true
    return false
`,
  run({ nums }, t) {
    const n = nums.length;
    t.step({ line: 2, array: nums, vars: { i: null }, message: "After sorting, equal numbers end up side by side. Then only neighbours need comparing." });
    const pairs = nums.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
    const a = pairs.map((p) => p[0]);
    const labels = pairs.map((p) => `was ${p[1]}`);
    t.op(Math.ceil(n * Math.log2(Math.max(n, 2))));
    t.step({ line: 3, array: a, labels, vars: { i: null }, message: `Sorted (about n·log₂n comparisons). The label shows where each number started.` });
    for (let i = 1; i < n; i++) {
      t.op();
      const same = a[i] === a[i - 1];
      const ask = { q: `nums[${i - 1}] = ${a[i - 1]}, nums[${i}] = ${a[i]}. Equal?`, options: ["Equal: a duplicate", "Different: keep going"], answer: same ? 0 : 1 };
      if (same) {
        t.step({ ask, line: 5, array: a, labels, pointers: { i }, tones: { [i - 1]: "found", [i]: "found" }, badge: { at: i, text: `${a[i]} = ${a[i - 1]} ✓` },
          vars: { i }, done: "found", message: `Neighbours ${a[i - 1]} and ${a[i]} are equal. Return true.` });
        return;
      }
      t.step({ ask, line: 4, array: a, labels, pointers: { i }, tones: { [i - 1]: "compare", [i]: "compare" }, badge: { at: i, text: `${a[i - 1]} ≠ ${a[i]}` },
        vars: { i }, message: `${a[i - 1]} ≠ ${a[i]}. Move on.` });
    }
    t.step({ line: 6, array: a, labels, vars: { i: null }, done: "notfound", message: "No two neighbours are equal, so no duplicates. Return false." });
  },
};

const hashSet: Approach<Input> = {
  id: "set",
  name: "Hash set",
  code: `function containsDuplicate(nums)
    seen ← empty set
    for each x in nums
        if x in seen
            return true
        seen.add(x)
    return false
`,
  run({ nums: a }, t) {
    const seen = new Set<number>();
    const map = (hl?: number) => ({ title: "seen", entries: [...seen].map((v) => [String(v), "seen"] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 2, array: a, map: map(), vars: { x: null }, message: "Remember every number as you pass it. A set answers \"seen this before?\" in O(1)." });
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      t.op();
      const hit = seen.has(x);
      const ask = { q: `x = ${x}. Is ${x} already in seen?`, options: ["Yes: return true", "No: add it and move on"], answer: hit ? 0 : 1 };
      if (hit) {
        const first = a.indexOf(x);
        t.step({ ask, line: 5, array: a, pointers: { i }, tones: { [first]: "found", [i]: "found" }, badge: { at: i, text: `${x} seen ✓` },
          map: map(x), vars: { x }, done: "found", message: `${x} is already in seen. Return true.` });
        return;
      }
      seen.add(x);
      t.step({ ask, line: 6, array: a, pointers: { i }, tones: { [i]: "active" }, map: map(x), vars: { x }, message: `${x} is new. Add it to seen.` });
    }
    t.step({ line: 7, array: a, map: map(), vars: { x: null }, done: "notfound", message: "Every number was new. Return false." });
  },
};

export const approaches = { brute: bruteForce, sort: sortNeighbours, set: hashSet };

/** Worst case: all distinct, so nothing stops early. */
const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => i) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: sortNeighbours, slot: 2 },
    { approach: hashSet, slot: 3 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
