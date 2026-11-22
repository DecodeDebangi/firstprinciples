import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { partitionSteps } from "../../concepts/53-sorting-as-a-tool/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [2, 0, 1, 2, 1, 0, 0, 2] };
export const fields: InputField[] = [{ key: "nums", label: "nums (each 0, 1 or 2)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 values." };
  if (raw.nums.some((x) => x !== 0 && x !== 1 && x !== 2)) return { error: "Every value must be 0, 1 or 2." };
  return { input: raw };
}

const count: Approach<Input> = {
  id: "count",
  name: "Count, then overwrite",
  code: `function sortColors(nums)
    count ← array of 3, all 0
    for each x in nums
        count[x] += 1
    i ← 0
    for c ← 0 to 2
        repeat count[c] times
            nums[i] ← c
            i += 1
`,
  run({ nums }, t) {
    const a = [...nums], cnt = [0, 0, 0];
    t.step({ line: 2, array: [...a], grid: { title: "count", rows: [cnt.slice()], colLabels: [0, 1, 2] }, vars: {},
      message: "There are only three values, so count them in one pass, then write them back in order in a second pass." });
    a.forEach((x) => { t.op(); cnt[x]++; });
    const ask = { ask: { q: `nums is ${a.join(", ")}. How many 0s does the count find?`, options: [...new Set([cnt[0], cnt[1], cnt[2], cnt[0] + 1].map(String))], answer: 0 } };
    t.step({ ...(ask.ask.options.length > 1 ? ask : {}), line: 4, array: [...a], grid: { title: "count", rows: [cnt.slice()], colLabels: [0, 1, 2], tones: { "0,0": "found", "0,1": "found", "0,2": "found" } }, vars: { "0s": cnt[0], "1s": cnt[1], "2s": cnt[2] },
      message: `First pass: ${cnt[0]} zero${cnt[0] === 1 ? "" : "s"}, ${cnt[1]} one${cnt[1] === 1 ? "" : "s"} and ${cnt[2]} two${cnt[2] === 1 ? "" : "s"}.` });
    let i = 0;
    for (let c = 0; c < 3; c++) {
      if (!cnt[c]) continue;
      const from = i;
      for (let k = 0; k < cnt[c]; k++) { t.op(); a[i++] = c; }
      t.step({ line: 8, array: [...a], range: [from, i - 1], tones: Object.fromEntries(Array.from({ length: i - from }, (_, k) => [from + k, "found" as Tone])), grid: { title: "count", rows: [cnt.slice()], colLabels: [0, 1, 2], tones: { [`0,${c}`]: "active" } }, vars: { c, written: i },
        message: cnt[c] === 1 ? `Write the one ${c} into position ${from}.` : `Write ${cnt[c]} copies of ${c} into positions ${from} to ${i - 1}.` });
    }
    t.step({ line: 9, array: [...a], tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: {}, done: "found",
      message: "Sorted in two passes with O(1) extra space: O(n). The problem asks for one pass, though, and the count only works because the values are known." });
  },
};

const flag: Approach<Input> = {
  id: "flag",
  name: "One-pass three-way partition",
  code: `function sortColors(nums)
    lo, mid, hi ← 0, 0, length(nums) - 1
    while mid ≤ hi
        if nums[mid] = 0
            swap nums[lo] and nums[mid]
            lo, mid ← lo + 1, mid + 1
        else if nums[mid] = 2
            swap nums[mid] and nums[hi]
            hi -= 1  // recheck nums[mid]
        else
            mid += 1
`,
  run({ nums }, t) {
    t.step({ line: 2, array: [...nums], pointers: { lo: 0, mid: 0, hi: nums.length - 1 }, vars: {},
      message: "Partition around 1 in a single pass: 0s to the front, 2s to the back, and 1s are left in the middle. Before lo: all 0s. lo to mid: all 1s. After hi: all 2s. mid to hi: not checked yet." });
    partitionSteps(t, nums, 1, { less: 6, more: 9, equal: 11, end: 3 }, { less: "the 0s", equal: "the 1s", more: "the 2s" });
  },
};

export const approaches = { count, flag };

