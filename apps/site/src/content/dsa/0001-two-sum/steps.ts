import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };

export const example: Input = { nums: [3, 9, 14, 5, 11, 8, 1], target: 13 };

export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "nums needs at least two numbers." };
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `def two_sum(nums, target):
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`,
  run({ nums, target }, t) {
    const n = nums.length;
    t.step({ line: 2, array: nums, message: `Try every pair (i, j) with i < j and check whether it adds up to ${target}.`, vars: { target } });
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op();
        const sum = nums[i] + nums[j];
        if (sum === target) {
          t.step({
            badge: { at: j, text: `${nums[i]} + ${nums[j]} = ${target} ✓` },
          line: 6, array: nums, pointers: { i, j }, tones: { [i]: "found", [j]: "found" },
            vars: { i, j, sum, target }, done: "found",
            message: `${nums[i]} + ${nums[j]} = ${target}. Found it: return [${i}, ${j}].`,
          });
          return;
        }
        t.step({
          badge: { at: j, text: `${nums[i]} + ${nums[j]} = ${sum}` },
          line: 5, array: nums, pointers: { i, j }, tones: { [i]: "active", [j]: "compare" },
          vars: { i, j, sum, target },
          message: `nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]} = ${sum}, not ${target}. Move j on.`,
        });
      }
    }
    t.step({ line: 7, array: nums, vars: { target }, done: "notfound", message: `Checked every pair. None adds up to ${target}.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "pointers",
  name: "Sort + two pointers",
  code: `def two_sum(nums, target):
    pairs = sorted((v, i) for i, v in enumerate(nums))
    lo, hi = 0, len(pairs) - 1
    while lo < hi:
        s = pairs[lo][0] + pairs[hi][0]
        if s == target:
            return [pairs[lo][1], pairs[hi][1]]
        elif s < target:
            lo += 1
        else:
            hi -= 1
    return []
`,
  run({ nums, target }, t) {
    const n = nums.length;
    t.step({ line: 2, array: nums, vars: { target }, message: "The answer needs original indices, so pair each value with its index before sorting." });
    const pairs = nums.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    // Sorting costs about n·log2(n) comparisons; count that so the chart is honest.
    t.op(Math.ceil(n * Math.log2(Math.max(n, 2))));
    const vals = pairs.map((p) => p[0]);
    const labels = pairs.map((p) => `i=${p[1]}`);
    let lo = 0, hi = n - 1;
    t.step({
      line: 3, array: vals, labels, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi, target },
      message: `Sorted. The label under each cell is that value's original index. Start one pointer at each end.`,
    });
    while (lo < hi) {
      t.op();
      const s = vals[lo] + vals[hi];
      const ask = (answer: number) => ({ q: `${vals[lo]} + ${vals[hi]} = ${s}, and the target is ${target}. What next?`, options: ["Found it: return their original indices", "Too small: move lo right", "Too big: move hi left"], answer });
      const base = { array: vals, labels, pointers: { lo, hi }, range: [lo, hi] as [number, number], vars: { lo, hi, s, target } };
      if (s === target) {
        t.step({
          ...base, ask: ask(0), badge: { at: lo, text: `${vals[lo]} + ${vals[hi]} = ${target} ✓` }, line: 7, tones: { [lo]: "found", [hi]: "found" }, done: "found",
          message: `${vals[lo]} + ${vals[hi]} = ${target}. Return their original indices [${pairs[lo][1]}, ${pairs[hi][1]}].`,
        });
        return;
      }
      if (s < target) {
        t.step({
          ...base, ask: ask(1), badge: { at: lo, text: `${vals[lo]} + ${vals[hi]} = ${s} < ${target}` }, line: 9, tones: { [lo]: "compare", [hi]: "compare" },
          message: `${vals[lo]} + ${vals[hi]} = ${s} is too small. ${vals[hi]} is already the biggest value left, so ${vals[lo]} can't be in the answer. Move lo right.`,
        });
        lo++;
      } else {
        t.step({
          ...base, ask: ask(2), badge: { at: hi, text: `${vals[lo]} + ${vals[hi]} = ${s} > ${target}` }, line: 11, tones: { [lo]: "compare", [hi]: "compare" },
          message: `${vals[lo]} + ${vals[hi]} = ${s} is too big. ${vals[lo]} is already the smallest value left, so ${vals[hi]} can't be in the answer. Move hi left.`,
        });
        hi--;
      }
    }
    t.step({ line: 12, array: vals, labels, vars: { lo, hi, target }, done: "notfound", message: `The pointers met. No pair adds up to ${target}.` });
  },
};

const hashMap: Approach<Input> = {
  id: "hash",
  name: "Hash map (one pass)",
  code: `def two_sum(nums, target):
    seen = {}  # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []
`,
  run({ nums, target }, t) {
    const seen = new Map<number, number>();
    const entries = () => [...seen].map(([v, i]) => [String(v), String(i)] as [string, string]);
    const title = "seen (value → index)";
    t.step({ line: 2, array: nums, vars: { target }, map: { title, entries: [] }, message: "Walk left to right, remembering every value already seen and its index." });
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      const need = target - x;
      const ask = (yes: boolean) => ({ q: `need = ${need}. Is ${need} already in seen?`, options: ["Yes: return the pair", `No: store ${x} → ${i} and move on`], answer: yes ? 0 : 1 });
      t.step({
        badge: { at: i, text: `need ${need}` },
        line: 4, array: nums, pointers: { i }, tones: { [i]: "active" }, vars: { i, x, need, target },
        map: { title, entries: entries() },
        message: `x = ${x}. To reach ${target} it needs ${target} − ${x} = ${need}.`,
      });
      t.op();
      if (seen.has(need)) {
        const j = seen.get(need)!;
        t.step({
          ask: ask(true), badge: { at: i, text: `${need} is in seen ✓` }, line: 6, array: nums, pointers: { i }, tones: { [j]: "found", [i]: "found" }, vars: { i, x, need, target },
          map: { title, entries: entries(), highlight: String(need) }, done: "found",
          message: `${need} is already in seen, at index ${j}. One lookup found the pair: return [${j}, ${i}].`,
        });
        return;
      }
      seen.set(x, i);
      t.step({
        ask: ask(false), line: 7, array: nums, pointers: { i }, tones: { [i]: "compare" }, vars: { i, x, need, target },
        map: { title, entries: entries(), highlight: String(x) },
        message: `${need} isn't in seen yet. Store ${x} → ${i} in case a later number needs it.`,
      });
    }
    t.step({ line: 8, array: nums, vars: { target }, map: { title, entries: entries() }, done: "notfound", message: `Reached the end. No pair adds up to ${target}.` });
  },
};

export const approaches = { brute: bruteForce, pointers: twoPointers, hash: hashMap };

/** Worst case for all three: the only valid pair is the last two numbers. */
function worstCase(n: number): Input {
  const nums = Array.from({ length: n }, (_, i) => 2 * i);
  return { nums, target: nums[n - 2] + nums[n - 1] };
}

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: twoPointers, slot: 2 },
    { approach: hashMap, slot: 3 },
  ],
  worstCase,
  [8, 16, 32, 64, 96, 128],
);
