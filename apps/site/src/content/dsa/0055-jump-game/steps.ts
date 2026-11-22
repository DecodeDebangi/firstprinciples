import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { jumpFields, jumpPrepare, reachCode, reachSteps, type JumpInput } from "../../concepts/49-greedy-in-practice/steps";

export type Input = JumpInput;
export const example: Input = { nums: [2, 3, 1, 1, 0, 2, 1] };
export const fields: InputField[] = jumpFields;
export const prepare: (raw: Input) => Prepared<Input> = jumpPrepare;

const markAll: Approach<Input> = {
  id: "mark",
  name: "Mark every reachable position",
  code: `function canJump(nums)
    reach ← array of length(nums), all false
    reach[0] ← true
    for i ← 0 to length(nums) - 1
        if reach[i]
            end ← min(i + nums[i], length(nums) - 1)
            for j ← i + 1 to end
                reach[j] ← true
    return reach[length(nums) - 1]
`,
  run({ nums }, t) {
    const n = nums.length, reach = Array(n).fill(false);
    reach[0] = true;
    const tones = (cur?: number) => ({ ...Object.fromEntries(reach.map((r, k) => [k, (r ? "settled" : "discard") as Tone])), ...(cur !== undefined ? { [cur]: "active" as Tone } : {}) });
    t.step({ line: 3, array: nums, tones: tones(), vars: {}, message: `Mark which positions can be reached. Position 0 can. From every reachable position, mark every position its jump can land on.` });
    for (let i = 0; i < n; i++) {
      t.op();
      if (!reach[i]) continue;
      const top = Math.min(i + nums[i], n - 1);
      for (let j = i + 1; j <= top; j++) { t.op(); reach[j] = true; }
      t.step({ line: 8, array: nums, pointers: { i }, tones: tones(i), vars: { i },
        message: nums[i] ? `From ${i}, jumps land on ${i + 1}${top > i + 1 ? ` to ${top}` : ""}: mark ${top > i + 1 ? "them" : "it"}. That's ${top - i} mark${top - i === 1 ? "" : "s"}, many already set by earlier positions.` : `${i} holds 0: no jumps from here.` });
    }
    const ok = reach[n - 1];
    t.step({ line: 9, array: nums, tones: tones(), vars: { reachable: String(ok) }, done: ok ? "found" : "notfound",
      message: `The last position ${ok ? "is" : "isn't"} marked: return ${ok}. Each position can mark up to n others: O(n²) in the worst case, and O(n) space for the marks.` });
  },
};

const reach: Approach<Input> = { id: "reach", name: "Keep the farthest reach", code: reachCode, run({ nums }, t) { reachSteps(nums, t, { stuck: 5, extend: 6, done: 8 }); } };

export const approaches = { mark: markAll, reach };

/** Every value is n: each position marks everything after it, while the reach covers the end at once. */
export const growth = measureGrowth(
  [{ approach: markAll, slot: 1 }, { approach: reach, slot: 3 }],
  (n) => ({ nums: Array(n).fill(n) }),
  [8, 16, 32, 48, 64],
);
