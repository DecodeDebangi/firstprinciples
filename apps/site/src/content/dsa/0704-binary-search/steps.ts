import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };

export const example: Input = { nums: [3, 8, 15, 21, 27, 34, 42, 56, 63, 77], target: 63 };

export const fields: InputField[] = [
  { key: "nums", label: "nums (sorted)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const sorted = [...raw.nums].sort((a, b) => a - b);
  const unique = [...new Set(sorted)];
  const changed = unique.length !== raw.nums.length || unique.some((v, i) => v !== raw.nums[i]);
  return {
    input: { nums: unique, target: raw.target },
    note: changed ? "Binary search needs sorted, distinct values, so your numbers were sorted and duplicates removed." : undefined,
  };
}

const linear: Approach<Input> = {
  id: "linear",
  name: "Linear scan",
  code: `def search(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1
`,
  run({ nums, target }, t) {
    t.step({ line: 2, array: nums, vars: { target }, message: `Check each number from the left until we hit ${target}. This ignores that the list is sorted.` });
    for (let i = 0; i < nums.length; i++) {
      t.op();
      const checked = Object.fromEntries(Array.from({ length: i }, (_, k) => [k, "discard" as const]));
      if (nums[i] === target) {
        t.step({ line: 4, array: nums, pointers: { i }, tones: { ...checked, [i]: "found" }, vars: { i, target }, done: "found", message: `nums[${i}] = ${target}. Found at index ${i} after ${i + 1} check${i ? "s" : ""}.` });
        return;
      }
      t.step({ line: 3, array: nums, pointers: { i }, tones: { ...checked, [i]: "compare" }, vars: { i, target }, message: `nums[${i}] = ${nums[i]}, not ${target}. Next.` });
    }
    t.step({ line: 5, array: nums, vars: { target }, done: "notfound", message: `Checked all ${nums.length} numbers. ${target} isn't there: return -1.` });
  },
};

const iterative: Approach<Input> = {
  id: "iterative",
  name: "Binary search",
  code: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
  run({ nums, target }, t) {
    let lo = 0, hi = nums.length - 1;
    t.step({ line: 2, array: nums, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi, mid: null, target }, message: `${target} could be anywhere between lo and hi: all ${nums.length} numbers.` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      t.op();
      const base = { array: nums, range: [lo, hi] as [number, number], vars: { lo, hi, mid, target } };
      const ask = (answer: number) => ({ q: `nums[mid] = ${nums[mid]} and the target is ${target}. What happens next?`, options: ["Found it: return mid", "Search the right half: lo = mid + 1", "Search the left half: hi = mid − 1"], answer });
      t.step({ ...base, line: 4, pointers: { lo, mid, hi }, tones: { [mid]: "compare" }, message: `Look at the middle: mid = (${lo} + ${hi}) // 2 = ${mid}, and nums[${mid}] = ${nums[mid]}.` });
      if (nums[mid] === target) {
        t.step({ ...base, ask: ask(0), line: 6, pointers: { mid }, tones: { [mid]: "found" }, done: "found", message: `nums[${mid}] = ${target}. Found at index ${mid}.` });
        return;
      }
      const size = hi - lo + 1;
      if (nums[mid] < target) {
        t.step({ ...base, ask: ask(1), line: 8, pointers: { lo, mid, hi }, tones: { [mid]: "miss" }, message: `${nums[mid]} < ${target}. Everything at or left of mid is even smaller, so drop it: lo = ${mid + 1}.` });
        lo = mid + 1;
      } else {
        t.step({ ...base, ask: ask(2), line: 10, pointers: { lo, mid, hi }, tones: { [mid]: "miss" }, message: `${nums[mid]} > ${target}. Everything at or right of mid is even bigger, so drop it: hi = ${mid - 1}.` });
        hi = mid - 1;
      }
      const left = Math.max(0, hi - lo + 1);
      if (left > 0) {
        t.step({ line: 3, array: nums, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi, mid: null, target }, message: `One comparison cut ${size} candidates down to ${left}.` });
      }
    }
    t.step({ line: 11, array: nums, pointers: { lo, hi }, range: null, tones: Object.fromEntries(nums.map((_, i) => [i, "discard" as const])), vars: { lo, hi, target }, done: "notfound", message: `lo (${lo}) passed hi (${hi}), so no candidates are left. ${target} isn't in the list: return -1.` });
  },
};

const recursive: Approach<Input> = {
  id: "recursive",
  name: "Binary search (recursive)",
  code: `def search(nums, target):
    return go(nums, target, 0, len(nums) - 1)

def go(nums, target, lo, hi):
    if lo > hi:
        return -1
    mid = (lo + hi) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        return go(nums, target, mid + 1, hi)
    return go(nums, target, lo, mid - 1)
`,
  run({ nums, target }, t) {
    const stack: string[] = [];
    const go = (lo: number, hi: number, line: number): number => {
      stack.push(`go(lo=${lo}, hi=${hi})`);
      const range: [number, number] | null = lo <= hi ? [lo, hi] : null;
      if (lo > hi) {
        t.step({ line: 6, array: nums, range, tones: Object.fromEntries(nums.map((_, i) => [i, "discard" as const])), stack: [...stack], vars: { lo, hi, target }, message: `lo > hi: nothing left to search. This call returns -1.` });
        stack.pop();
        return -1;
      }
      const mid = Math.floor((lo + hi) / 2);
      t.op();
      const ask = (answer: number) => ({ q: `nums[mid] = ${nums[mid]} and the target is ${target}. What does this call do?`, options: ["Found it: return mid", "Recurse on the right half", "Recurse on the left half"], answer });
      t.step({ line: 7, array: nums, range, pointers: { lo, mid, hi }, tones: { [mid]: "compare" }, stack: [...stack], vars: { lo, hi, mid, target }, message: `New call with lo=${lo}, hi=${hi}. mid = ${mid}, nums[mid] = ${nums[mid]}.` });
      let result: number;
      if (nums[mid] === target) {
        t.step({ ask: ask(0), line: 9, array: nums, range, pointers: { mid }, tones: { [mid]: "found" }, stack: [...stack], vars: { lo, hi, mid, target }, message: `Found ${target} at ${mid}. The stack is ${stack.length} call${stack.length > 1 ? "s" : ""} deep; now the answer is passed back down it.` });
        result = mid;
      } else if (nums[mid] < target) {
        t.step({ ask: ask(1), line: 11, array: nums, range, pointers: { lo, mid, hi }, tones: { [mid]: "miss" }, stack: [...stack], vars: { lo, hi, mid, target }, message: `${nums[mid]} < ${target}: recurse on the right half. This call waits on the stack for the answer.` });
        result = go(mid + 1, hi, 11);
      } else {
        t.step({ ask: ask(2), line: 12, array: nums, range, pointers: { lo, mid, hi }, tones: { [mid]: "miss" }, stack: [...stack], vars: { lo, hi, mid, target }, message: `${nums[mid]} > ${target}: recurse on the left half. This call waits on the stack for the answer.` });
        result = go(lo, mid - 1, 12);
      }
      stack.pop();
      if (stack.length > 0) {
        t.step({ line, array: nums, pointers: result >= 0 ? { mid: result } : {}, tones: result >= 0 ? { [result]: "found" } : {}, stack: [...stack], vars: { returned: result, target }, message: `A call finished and returned ${result} to the one waiting under it. Stack depth is now ${stack.length}.` });
      }
      return result;
    };
    t.step({ line: 2, array: nums, stack: [], vars: { target }, message: `Same idea as the loop, but each halving is a new function call.` });
    const r = go(0, nums.length - 1, 2);
    t.step({
      line: 2, array: nums, pointers: r >= 0 ? { mid: r } : {}, tones: r >= 0 ? { [r]: "found" } : {}, stack: [], vars: { result: r, target },
      done: r >= 0 ? "found" : "notfound",
      message: r >= 0 ? `search returns ${r}. Notice how tall the stack got: that's the extra space recursion costs.` : `search returns -1. ${target} isn't in the list.`,
    });
  },
};

export const approaches = { linear, iterative, recursive };

/** Worst case: the target is larger than everything, so nothing is found. */
const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => i), target: n });

export const growth = measureGrowth(
  [
    { approach: linear, slot: 1 },
    { approach: iterative, slot: 2 },
  ],
  worstCase,
  [16, 128, 256, 512, 768, 1024],
);

