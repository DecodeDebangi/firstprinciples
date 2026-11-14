import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [2, 5, 1, 4, 3, 2, 3] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

/** Left part and right part rest in two tints; only the candidate lifts. */
function sides(n: number, i: number, hit = false): Record<number, Tone> {
  const t: Record<number, Tone> = {};
  for (let k = 0; k < n; k++) t[k] = k < i ? "side-a" : k > i ? "side-b" : hit ? "found" : "compare";
  return t;
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `function pivotIndex(nums)
    n ← length(nums)
    for i ← 0 to n - 1
        left ← sum(nums[0..i - 1])
        right ← sum(nums[i + 1..end])
        if left = right
            return i
    return -1
`,
  run({ nums }, t) {
    const n = nums.length;
    t.step({ line: 2, array: nums, vars: { i: null, left: null, right: null },
      message: "Try every index as the pivot. For each one, add up everything to its left and everything to its right from scratch." });
    for (let i = 0; i < n; i++) {
      const left = sum(nums.slice(0, i));
      const right = sum(nums.slice(i + 1));
      t.op(n - 1); // every other element is added once
      const vars = { i, left, right };
      if (left === right) {
        t.step({ badge: { at: i, text: `${left} = ${right} ✓` }, line: 7, array: nums, pointers: { i }, tones: sides(n, i, true), vars, done: "found",
          message: `Left of ${i} adds to ${left}, right adds to ${right}. They match, so ${i} is the pivot.` });
        return;
      }
      t.step({ badge: { at: i, text: `${left} ≠ ${right}` }, line: 6, array: nums, pointers: { i }, tones: sides(n, i), vars,
        message: `Left of ${i} adds to ${left}, right adds to ${right}. Not equal. Re-add both sides for the next index.` });
    }
    t.step({ line: 8, array: nums, vars: { i: null, left: null, right: null }, done: "notfound",
      message: "No index balances the two sides. Return -1." });
  },
};

const prefixSums: Approach<Input> = {
  id: "prefix",
  name: "Prefix sums",
  code: `function pivotIndex(nums)
    prefix ← [0]
    for each x in nums
        prefix.push(prefix.last() + x)
    total ← prefix.last()
    for i ← 0 to length(nums) - 1
        left ← prefix[i]
        right ← total - prefix[i + 1]
        if left = right
            return i
    return -1
`,
  run({ nums }, t) {
    const n = nums.length;
    const prefix = [0];
    const title = "prefix[k] = sum of the first k numbers";
    const entries = (hl?: number) => ({
      title,
      entries: prefix.map((v, k) => [`prefix[${k}]`, String(v)] as [string, string]),
      highlight: hl === undefined ? undefined : `prefix[${hl}]`,
    });
    t.step({ line: 2, array: nums, map: entries(0), vars: { total: null },
      message: "First, one pass to record running totals. prefix[k] is the sum of everything before index k." });
    for (let k = 0; k < n; k++) {
      t.op();
      prefix.push(prefix[k] + nums[k]);
      t.step({ line: 4, array: nums, pointers: { k }, tones: { [k]: "active" }, map: entries(k + 1), vars: { total: null },
        message: `prefix[${k + 1}] = prefix[${k}] + ${nums[k]} = ${prefix[k + 1]}.` });
    }
    const total = prefix[n];
    for (let i = 0; i < n; i++) {
      t.op();
      const left = prefix[i];
      const right = total - prefix[i + 1];
      const vars = { total, i, left, right };
      const ask = (yes: boolean) => ({ q: `left = prefix[${i}] = ${left}; right = ${total} − prefix[${i + 1}]. Is index ${i} the pivot?`, options: ["Yes: both sides are equal", "No: move on"], answer: yes ? 0 : 1 });
      if (left === right) {
        t.step({ ask: ask(true), badge: { at: i, text: `${left} = ${right} ✓` }, line: 10, array: nums, pointers: { i }, tones: sides(n, i, true), map: entries(i), vars, done: "found",
          message: `left = prefix[${i}] = ${left}, right = ${total} − prefix[${i + 1}] = ${right}. Equal, so ${i} is the pivot.` });
        return;
      }
      t.step({ ask: ask(false), badge: { at: i, text: `${left} ≠ ${right}` }, line: 9, array: nums, pointers: { i }, tones: sides(n, i), map: entries(i), vars,
        message: `left = prefix[${i}] = ${left}, right = ${total} − prefix[${i + 1}] = ${right}. Two lookups instead of re-adding.` });
    }
    t.step({ line: 11, array: nums, map: entries(), vars: { total }, done: "notfound", message: "No index balances. Return -1." });
  },
};

const runningTotal: Approach<Input> = {
  id: "running",
  name: "Running total",
  code: `function pivotIndex(nums)
    total ← sum(nums)
    left ← 0
    for each index i, value x in nums
        if left = total - left - x
            return i
        left += x
    return -1
`,
  run({ nums }, t) {
    const n = nums.length;
    const total = sum(nums);
    t.op(n);
    t.step({ line: 2, array: nums, vars: { total, left: 0, right: null },
      message: `One pass for the grand total: ${total}. Once you know the left sum, the right sum is just total − left − nums[i].` });
    let left = 0;
    for (let i = 0; i < n; i++) {
      t.op();
      const x = nums[i];
      const right = total - left - x;
      const vars = { total, i, left, right };
      const ask = (yes: boolean) => ({ q: `total = ${total}, left = ${left}, nums[${i}] = ${x}. Is index ${i} the pivot?`, options: ["Yes: both sides are equal", "No: move on"], answer: yes ? 0 : 1 });
      if (left === right) {
        t.step({ ask: ask(true), badge: { at: i, text: `${left} = ${right} ✓` }, line: 6, array: nums, pointers: { i }, tones: sides(n, i, true), vars, done: "found",
          message: `right = ${total} − ${left} − ${x} = ${right}, which equals left. ${i} is the pivot.` });
        return;
      }
      t.step({ ask: ask(false), badge: { at: i, text: `${left} ≠ ${right}` }, line: 5, array: nums, pointers: { i }, tones: sides(n, i), vars,
        message: `right = ${total} − ${left} − ${x} = ${right}, left = ${left}. Not equal. Add ${x} to left and move on.` });
      left += x;
    }
    t.step({ line: 8, array: nums, vars: { total, left, right: null }, done: "notfound", message: "No index balances. Return -1." });
  },
};

export const approaches = { brute: bruteForce, prefix: prefixSums, running: runningTotal };

/** Worst case: an even number of 1s has no pivot, so every index is checked. */
const worstCase = (n: number): Input => ({ nums: Array(n).fill(1) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    // Prefix sums does exactly as many reads as running total, so its line would hide under it.
    { approach: runningTotal, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
