import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [1, 1, 2, 3, 3, 3, 5] };
export const fields: InputField[] = [{ key: "nums", label: "nums (sorted)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  if (raw.nums.some((x, i) => i && x < raw.nums[i - 1])) return { error: "The values must be sorted from smallest to largest." };
  return { input: raw };
}
const front = (k: number) => Object.fromEntries(Array.from({ length: k }, (_, i) => [i, "settled" as Tone]));

const withList: Approach<Input> = {
  id: "list",
  name: "Collect the distinct values in a second list",
  code: `function removeDuplicates(nums)
    distinct ← empty list
    for each x in nums
        if distinct is empty or x ≠ distinct.last()
            distinct.push(x)
    for i ← 0 to length(distinct) - 1
        nums[i] ← distinct[i]
    return length(distinct)
`,
  run({ nums: input }, t) {
    const nums = [...input], d: number[] = [];
    const grid = () => ({ title: "distinct (a second list)", rows: [d.length ? [...d] : ["(empty)"]] });
    t.step({ line: 2, array: [...nums], grid: grid(), vars: {},
      message: "Because nums is sorted, copies of a value sit next to each other. So a value is new exactly when it differs from the last one kept. Collect the new ones in a second list." });
    nums.forEach((x, i) => {
      t.op();
      const fresh = d.length === 0 || x !== d[d.length - 1];
      if (fresh) d.push(x);
      t.step({ line: fresh ? 5 : 4, array: [...nums], pointers: { i }, tones: { [i]: fresh ? "found" : "discard" }, grid: grid(), vars: {},
        message: fresh ? `${x} is new${d.length > 1 ? ` (the last kept was ${d[d.length - 2]})` : ""}: keep it.` : `${x} is the same as the last kept value: a duplicate, skip it.` });
    });
    d.forEach((x, i) => { t.op(); nums[i] = x; });
    t.step({ line: 8, array: [...nums], tones: front(d.length), grid: grid(), vars: { k: d.length }, done: "found",
      message: `Copy them back and return ${d.length}. O(n) time, but the second list can hold n values: O(n) extra space.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "two-pointers",
  name: "Read and write pointers (optimal)",
  code: `function removeDuplicates(nums)
    w ← 1  // nums[0] is always kept
    for r ← 1 to length(nums) - 1
        if nums[r] ≠ nums[w - 1]
            nums[w] ← nums[r]
            w += 1
    return w
`,
  run({ nums: input }, t) {
    const nums = [...input];
    let w = 1;
    t.step({ line: 2, array: [...nums], pointers: nums.length > 1 ? { r: 1, w: 1 } : { w: 0 }, tones: { 0: "settled" }, vars: { w },
      message: "The first value is always kept, so w starts at 1. r reads the rest. The last kept value is nums[w − 1], and a value is new when it differs from that." });
    let asked = false;
    for (let r = 1; r < nums.length; r++) {
      t.op();
      const last = nums[w - 1];
      if (nums[r] === last) {
        const ask = !asked ? (asked = true, { ask: { q: `nums[${r}] = ${nums[r]} and the last kept value, nums[${w - 1}], is ${last}. Keep it?`, options: ["No: it's a duplicate", "Yes"], answer: 0 } }) : {};
        t.step({ ...ask, line: 4, array: [...nums], pointers: { r, w: Math.min(w, nums.length - 1) }, tones: { ...front(w), [r]: "discard", [w - 1]: "compare" }, vars: { w },
          message: `nums[${r}] = ${nums[r]} equals the last kept value, nums[${w - 1}] = ${last}: a duplicate. Skip it.` });
        continue;
      }
      const to = w;
      nums[w] = nums[r]; w++;
      t.step({ line: 6, array: [...nums], pointers: { r, w: Math.min(w, nums.length - 1) }, tones: { ...front(w), [to]: "found" }, ...(to !== r ? { move: { from: r, to } } : {}), vars: { w },
        message: `nums[${r}] = ${nums[to]} differs from ${last}: it's new. Write it at nums[${to}] and move w to ${w}.` });
    }
    t.step({ line: 7, array: [...nums], tones: { ...front(w), ...Object.fromEntries(Array.from({ length: nums.length - w }, (_, i) => [w + i, "discard" as Tone])) }, vars: { k: w }, done: "found",
      message: `Return k = ${w}: nums[0..${w - 1}] = ${nums.slice(0, w).join(", ")}, each value once, in order. One pass, O(n), O(1) extra space.` });
  },
};

export const approaches = { withList, twoPointers };
