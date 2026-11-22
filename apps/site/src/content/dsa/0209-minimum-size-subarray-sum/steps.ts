import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { shortCode, shortFields, shortPrepare, shortestSteps, type ShortInput } from "../../concepts/48-window-budgets/steps";

export type Input = ShortInput;
export const example: Input = { nums: [1, 4, 2, 1, 6, 2, 1], target: 8 };
export const fields: InputField[] = shortFields;
export const prepare: (raw: Input) => Prepared<Input> = shortPrepare;

const everyStart: Approach<Input> = {
  id: "everyStart",
  name: "From every start, extend until it's enough",
  code: `function minSubArrayLen(target, nums)
    best ← ∞
    for left ← 0 to length(nums) - 1
        total ← 0
        for right ← left to length(nums) - 1
            total += nums[right]
            if total ≥ target
                best ← min(best, right - left + 1)
                break
    return best = ∞ ? 0 : best
`,
  run({ nums, target }, t) {
    let best = Infinity;
    t.step({ line: 2, array: nums, vars: { target, best: "∞" }, message: `From each starting position, add values until the total reaches ${target}; that's the shortest window starting there.` });
    for (let l = 0; l < nums.length; l++) {
      let total = 0, r = l;
      for (; r < nums.length; r++) { t.op(); total += nums[r]; if (total >= target) break; }
      const ok = r < nums.length;
      if (ok && r - l + 1 < best) best = r - l + 1;
      t.step({ line: ok ? 9 : 5, array: nums, range: [l, Math.min(r, nums.length - 1)], tones: Object.fromEntries(nums.map((_, i) => [i, (i >= l && i <= Math.min(r, nums.length - 1) ? (ok ? "settled" : "visited") : "discard") as Tone])), vars: { left: l, total, best: best === Infinity ? "∞" : best },
        message: ok ? `Starting at ${l}, the total reaches ${total} ≥ ${target} at ${r}: length ${r - l + 1}.${r - l + 1 === best ? " The shortest so far." : ""}` : `Starting at ${l}, even everything to the end only adds up to ${total}.` });
    }
    const ans = best === Infinity ? 0 : best;
    t.step({ line: 10, array: nums, vars: { answer: ans }, done: ans ? "found" : "notfound",
      message: `${ans ? `The shortest is ${ans}` : "Nothing reaches the target: 0"}. Each start re-adds values the previous start already added: O(n²).` });
  },
};

const window: Approach<Input> = { id: "window", name: "Grow, then shrink while it's enough", code: shortCode, run(input, t) { shortestSteps(input, t, { add: 4, shrink: 8, done: 9 }); } };

export const approaches = { everyStart, window };

/** n ones and a target of n / 2: every start walks n / 2 values. */
export const growth = measureGrowth(
  [{ approach: everyStart, slot: 1 }, { approach: window, slot: 3 }],
  (n) => ({ nums: Array(n).fill(1), target: n / 2 }),
  [8, 16, 32, 48, 64],
);
