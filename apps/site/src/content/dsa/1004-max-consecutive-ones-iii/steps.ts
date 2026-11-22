import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { budgetCode, budgetFields, budgetPrepare, budgetSteps, type BudgetInput } from "../../concepts/48-window-budgets/steps";

export type Input = BudgetInput;
export const example: Input = { nums: [1, 1, 0, 1, 0, 0, 1, 1, 1], k: 2 };
export const fields: InputField[] = budgetFields;
export const prepare: (raw: Input) => Prepared<Input> = budgetPrepare;

const everyStart: Approach<Input> = {
  id: "everyStart",
  name: "From every start, extend while within budget",
  code: `function longestOnes(nums, k)
    best ← 0
    for left ← 0 to length(nums) - 1
        zeros ← 0
        for right ← left to length(nums) - 1
            if nums[right] = 0
                zeros += 1
            if zeros > k
                break
            best ← max(best, right - left + 1)
    return best
`,
  run({ nums, k }, t) {
    let best = 0;
    t.step({ line: 2, array: nums, vars: { k, best }, message: `From each start, extend to the right until the window would hold more than ${k} zero${k === 1 ? "" : "s"}. That's the longest window starting there.` });
    for (let l = 0; l < nums.length; l++) {
      let zeros = 0, r = l;
      for (; r < nums.length; r++) { t.op(); if (nums[r] === 0) zeros++; if (zeros > k) break; }
      const len = r - l;
      if (len > best) best = len;
      t.step({ line: 10, array: nums, ...(len ? { range: [l, r - 1] as [number, number] } : {}), tones: Object.fromEntries(nums.map((v, i) => [i, (i >= l && i < r ? (v ? "settled" : "compare") : i === r ? "miss" : "discard") as Tone])), vars: { left: l, length: len, best },
        message: `Starting at ${l}: ${len} value${len === 1 ? "" : "s"} fit within ${k} zero${k === 1 ? "" : "s"}${r < nums.length ? `, and position ${r} would be one zero too many` : ", all the way to the end"}.${len === best && len ? " The longest so far." : ""}` });
    }
    t.step({ line: 11, array: nums, vars: { best }, done: "found",
      message: `The longest is ${best}. Every start rescans values the previous start already scanned: O(n²).` });
  },
};

const window: Approach<Input> = { id: "window", name: "Grow, and shrink only when over budget", code: budgetCode, run(input, t) { budgetSteps(input, t, { add: 5, shrink: 9, best: 10, done: 11 }); } };

export const approaches = { everyStart, window };

/** All ones: every start runs to the end. */
export const growth = measureGrowth(
  [{ approach: everyStart, slot: 1 }, { approach: window, slot: 3 }],
  (n) => ({ nums: Array(n).fill(1), k: 1 }),
  [8, 16, 32, 48, 64],
);
