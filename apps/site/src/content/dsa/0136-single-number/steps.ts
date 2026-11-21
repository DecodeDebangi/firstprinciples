import type { Approach, InputField, Prepared } from "@firstprinciples/ui";
import { xorSteps } from "../../concepts/41-bit-tricks/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [7, 3, 5, 3, 7] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  const c = new Map<number, number>();
  for (const x of raw.nums) c.set(x, (c.get(x) ?? 0) + 1);
  const singles = [...c].filter(([, k]) => k === 1).length;
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (singles !== 1 || [...c].some(([, k]) => k > 2)) return { error: "Every value must appear exactly twice, except one that appears once." };
  if (raw.nums.some((v) => v < 0 || v > 255)) return { error: "Use values from 0 to 255 so their bits fit on screen." };
  return { input: raw };
}

const counting: Approach<Input> = {
  id: "count",
  name: "Count each value",
  code: `function singleNumber(nums)
    count ← empty map
    for each x in nums
        count[x] ← (count[x] or 0) + 1
    for each x in nums
        if count[x] = 1
            return x
`,
  run({ nums }, t) {
    const c = new Map<number, number>();
    const panel = (hl?: number) => ({ title: "count (value → how many)", entries: [...c].map(([k, v]) => [String(k), String(v)] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 2, array: nums, map: panel(), vars: {},
      message: `Count every value in a map, then look for the one whose count is 1.` });
    nums.forEach((x, i) => {
      t.op();
      c.set(x, (c.get(x) ?? 0) + 1);
      t.step({ line: 4, array: nums, pointers: { x: i }, tones: { [i]: "active" }, map: panel(x), vars: { x },
        message: `${x}: count is now ${c.get(x)}.` });
    });
    let asked = false;
    for (let i = 0; i < nums.length; i++) {
      t.op();
      const x = nums[i], k = c.get(x)!;
      const ask = !asked ? (asked = true, { ask: { q: `${x} appears ${k} time${k > 1 ? "s" : ""}. Is it the answer?`, options: ["Yes", "No"], answer: k === 1 ? 0 : 1 } }) : {};
      if (k === 1) {
        t.step({ ...ask, line: 7, array: nums, pointers: { x: i }, tones: { [i]: "found" }, map: panel(x), vars: { x }, done: "found",
          message: `${x} appears once: return it. O(n) time, but the map holds about n / 2 entries: O(n) space, and the problem asks for O(1).` });
        return;
      }
      t.step({ ...ask, line: 6, array: nums, pointers: { x: i }, tones: { [i]: "discard" }, map: panel(x), vars: { x },
        message: `${x} appears twice: not it.` });
    }
  },
};

const xorAll: Approach<Input> = {
  id: "xor",
  name: "XOR everything",
  code: `function singleNumber(nums)
    acc ← 0
    for each x in nums
        acc ← acc xor x
    return acc
`,
  run({ nums }, t) {
    xorSteps(nums, t, { loop: 4, done: 5 }, (acc) => `Every pair cancelled, leaving ${acc}, the value that appears once. One pass, O(n), and a single number of memory: O(1).`);
  },
};

export const approaches = { count: counting, xor: xorAll };
