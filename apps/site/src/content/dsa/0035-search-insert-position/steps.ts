import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };

export const example: Input = { nums: [2, 5, 9, 14, 20, 27, 33], target: 16 };

export const fields: InputField[] = [
  { key: "nums", label: "nums (sorted)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const unique = [...new Set([...raw.nums].sort((a, b) => a - b))];
  const changed = unique.length !== raw.nums.length || unique.some((v, i) => v !== raw.nums[i]);
  return { input: { nums: unique, target: raw.target }, note: changed ? "The list must be sorted with no repeats, so your numbers were sorted and duplicates removed." : undefined };
}

const linear: Approach<Input> = {
  id: "linear",
  name: "Linear scan",
  code: `function searchInsert(nums, target)
  for each index i, value x in nums
    if x ≥ target
      return i
  return length(nums)
`,
  run({ nums: a, target }, t) {
    t.step({ line: 2, array: a, vars: { target }, message: `Walk from the left until a number is at least ${target}. That's where it is, or where it would go.` });
    for (let i = 0; i < a.length; i++) {
      t.op();
      const checked = Object.fromEntries(Array.from({ length: i }, (_, k) => [k, "discard" as Tone]));
      if (a[i] >= target) {
        t.step({ line: 4, array: a, pointers: { i }, tones: { ...checked, [i]: "found" }, badge: { at: i, text: `${a[i]} ≥ ${target}` }, vars: { i, target }, done: "found",
          message: a[i] === target ? `${target} is at index ${i}.` : `${a[i]} is the first number bigger than ${target}, so ${target} would go at index ${i}.` });
        return;
      }
      t.step({ line: 3, array: a, pointers: { i }, tones: { ...checked, [i]: "compare" }, badge: { at: i, text: `${a[i]} < ${target}` }, vars: { i, target },
        message: `${a[i]} < ${target}. Keep going.` });
    }
    t.step({ line: 5, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "discard" as Tone])), vars: { target }, done: "found",
      message: `Everything is smaller than ${target}, so it goes at the end: index ${a.length}.` });
  },
};

const binary: Approach<Input> = {
  id: "binary",
  name: "Binary search",
  code: `function searchInsert(nums, target)
  lo, hi ← 0, length(nums) - 1
  while lo ≤ hi
    mid ← floor((lo + hi) / 2)
    if nums[mid] = target
      return mid
    else if nums[mid] < target
      lo ← mid + 1
    else
      hi ← mid - 1
  return lo
`,
  run({ nums: a, target }, t) {
    let lo = 0, hi = a.length - 1;
    t.step({ line: 2, array: a, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi, mid: null, target },
      message: "Ordinary binary search. The only new part is what to return when the target isn't there." });
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      t.op();
      const opts = ["Found it: return mid", "Search the right half: lo = mid + 1", "Search the left half: hi = mid − 1"];
      const ask = (answer: number) => ({ q: `nums[mid] = ${a[mid]} and the target is ${target}. What happens next?`, options: opts, answer });
      const base = { array: a, range: [lo, hi] as [number, number], vars: { lo, hi, mid, target } };
      if (a[mid] === target) {
        t.step({ ...base, ask: ask(0), badge: { at: mid, text: `${a[mid]} = ${target} ✓` }, line: 6, pointers: { mid }, tones: { [mid]: "found" }, done: "found",
          message: `${target} is at index ${mid}.` });
        return;
      }
      if (a[mid] < target) {
        t.step({ ...base, ask: ask(1), badge: { at: mid, text: `${a[mid]} < ${target} →` }, line: 8, pointers: { lo, mid, hi }, tones: { [mid]: "miss" },
          message: `${a[mid]} < ${target}: the target, or its slot, is to the right. lo = ${mid + 1}.` });
        lo = mid + 1;
      } else {
        t.step({ ...base, ask: ask(2), badge: { at: mid, text: `← ${a[mid]} > ${target}` }, line: 10, pointers: { lo, mid, hi }, tones: { [mid]: "miss" },
          message: `${a[mid]} > ${target}: the target, or its slot, is to the left. hi = ${mid - 1}.` });
        hi = mid - 1;
      }
    }
    const at = lo < a.length ? `before ${a[lo]}` : "at the end";
    t.step({ ask: { q: `lo (${lo}) has passed hi (${hi}), so ${target} isn't in the list. What do we return?`, options: [`lo: ${lo}`, `hi: ${hi}`, "-1"], answer: 0 },
      line: 11, array: a, pointers: lo < a.length ? { lo } : {}, tones: lo < a.length ? { [lo]: "found" } : {}, vars: { lo, hi, target }, done: "found",
      message: `${target} isn't here. lo stopped at ${lo}: everything left of it is smaller, everything from it on is bigger. So ${target} goes at index ${lo} (${at}).` });
  },
};

export const approaches = { linear, binary };

/** Worst case: the target is bigger than everything. */
const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => 2 * i), target: 2 * n });

export const growth = measureGrowth(
  [
    { approach: linear, slot: 1 },
    { approach: binary, slot: 2 },
  ],
  worstCase,
  [16, 128, 256, 512, 768, 1024],
);
