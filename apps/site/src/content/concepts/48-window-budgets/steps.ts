import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ nums: number[] }>["run"]>[1];

/* ---------- Longest window within a budget (at most k zeros) ---------- */
export type BudgetInput = { nums: number[]; k: number };
export const budgetExample: BudgetInput = { nums: [1, 0, 1, 1, 0, 0, 1, 1, 0], k: 2 };
export const budgetFields: InputField[] = [
  { key: "nums", label: "nums (0s and 1s)", kind: "numbers" },
  { key: "k", label: "zeros allowed k", kind: "number" },
];
export function budgetPrepare(raw: BudgetInput): Prepared<BudgetInput> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (raw.nums.some((v) => v !== 0 && v !== 1)) return { error: "Use only 0s and 1s." };
  if (raw.k < 0 || raw.k > 9) return { error: "k must be from 0 to 9." };
  return { input: raw };
}

/** The longest window with at most k zeros. Shared with LC 1004. */
export function budgetSteps({ nums, k }: BudgetInput, t: T, lines: { add: number; shrink: number; best: number; done: number }) {
  let left = 0, zeros = 0, best = 0, bestAt: [number, number] | null = null, asked = false;
  const tones = (l: number, r: number, extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries(nums.map((v, i) => [i, (i >= l && i <= r ? (v === 0 ? "compare" : "settled") : "discard") as Tone])), ...extra });
  t.step({ line: 2, array: nums, vars: { k, zeros, best },
    message: `Find the longest stretch that contains at most ${k} zero${k === 1 ? "" : "s"} (zeros you're allowed to flip to 1). Grow the window to the right; whenever it holds too many zeros, shrink it from the left until it's back within budget.` });
  nums.forEach((v, right) => {
    t.op();
    if (v === 0) zeros++;
    if (zeros > k) {
      const q = !asked ? (asked = true, { ask: { q: `The window now holds ${zeros} zeros, but only ${k} are allowed. What happens?`, options: ["Move left forward until a zero leaves", "Start a new window at right", "Stop: this is the answer"], answer: 0 } }) : {};
      const from = left;
      while (zeros > k) { t.op(); if (nums[left] === 0) zeros--; left++; }
      t.step({ ...q, line: lines.shrink, array: nums, range: left <= right ? [left, right] : null, pointers: { ...(left <= right ? { left } : {}), right }, tones: tones(left, right, { ...Object.fromEntries(Array.from({ length: left - from }, (_, k2) => [from + k2, "miss" as Tone])) }), vars: { zeros, best },
        message: `Adding nums[${right}] = 0 made ${k + 1} zeros: over budget. Move left forward past a zero (from ${from} to ${left}), so the window holds ${zeros} again.` });
    }
    const len = right - left + 1;
    if (len > best) { best = len; bestAt = [left, right]; }
    t.step({ line: lines.best, array: nums, range: left <= right ? [left, right] : null, pointers: { ...(left <= right ? { left } : {}), right }, tones: tones(left, right, { [right]: "active" }), vars: { zeros, best },
      message: len === 0 ? `With no zeros allowed, the window is empty here: length 0.` : `Window ${left}..${right} has ${zeros} zero${zeros === 1 ? "" : "s"}, within budget: length ${len}.${len === best ? ` The longest so far.` : ""}` });
  });
  t.step({ line: lines.done, array: nums, ...(bestAt ? { range: bestAt } : {}), tones: bestAt ? tones(bestAt[0], bestAt[1]) : {}, vars: { best }, done: "found",
    message: `The longest window is ${best}${bestAt ? ` (${bestAt[0]}..${bestAt[1]})` : ""}. right and left each move forward at most n times: O(n), with O(1) space.` });
  return best;
}
export const budgetCode = `function longestOnes(nums, k)
    left, zeros, best ← 0, 0, 0
    for right ← 0 to length(nums) - 1
        if nums[right] = 0
            zeros += 1
        while zeros > k  // over budget: shrink
            if nums[left] = 0
                zeros -= 1
            left += 1
        best ← max(best, right - left + 1)
    return best
`;

/* ---------- Shortest window reaching a target ---------- */
export type ShortInput = { nums: number[]; target: number };
export const shortExample: ShortInput = { nums: [2, 1, 5, 2, 3, 2], target: 7 };
export const shortFields: InputField[] = [
  { key: "nums", label: "nums (positive)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];
export function shortPrepare(raw: ShortInput): Prepared<ShortInput> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (raw.nums.some((v) => v < 1)) return { error: "Use positive values: the window relies on sums growing as it grows." };
  if (raw.target < 1) return { error: "Use a target of at least 1." };
  return { input: raw };
}

/** The shortest window whose sum is at least target. Shared with LC 209. */
export function shortestSteps({ nums, target }: ShortInput, t: T, lines: { add: number; shrink: number; done: number }) {
  let left = 0, total = 0, best = Infinity, bestAt: [number, number] | null = null, asked = false;
  const inWin = (l: number, r: number, extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries(nums.map((_, i) => [i, (i >= l && i <= r ? "settled" : "discard") as Tone])), ...extra });
  t.step({ line: 2, array: nums, vars: { target, total, best: "∞" },
    message: `Find the shortest stretch adding up to at least ${target}. Grow the window until it reaches ${target}; then, while it still does, record its length and shrink it from the left to look for something shorter.` });
  nums.forEach((v, right) => {
    t.op();
    total += v;
    t.step({ line: lines.add, array: nums, range: [left, right], pointers: { left, right }, tones: inWin(left, right, { [right]: "active" }), vars: { total, best: best === Infinity ? "∞" : best },
      message: `Add nums[${right}] = ${v}: the window ${left}..${right} adds up to ${total}${total >= target ? `, which reaches ${target}` : `, short of ${target}`}.` });
    while (total >= target) {
      t.op();
      const len = right - left + 1;
      if (len < best) { best = len; bestAt = [left, right]; }
      const q = !asked && len > 1 ? (asked = true, { ask: { q: `${left}..${right} adds up to ${total}, at least ${target}. What next?`, options: ["Record its length, then drop the leftmost value to try shorter", "Add the next value", "Stop: it's the answer"], answer: 0 } }) : {};
      const dropped = nums[left];
      total -= dropped; left++;
      t.step({ ...q, line: lines.shrink, array: nums, range: left <= right ? [left, right] : null, pointers: { ...(left <= right ? { left } : {}), right }, tones: inWin(left, right, { [left - 1]: "found" }), vars: { total, best },
        message: `${left - 1}..${right} (length ${len}) reaches ${target}${len === best ? ": the shortest so far" : ""}. Drop nums[${left - 1}] = ${dropped} from the left to see if a shorter window still reaches it: the sum is now ${total}.` });
    }
  });
  const ans = best === Infinity ? 0 : best;
  t.step({ line: lines.done, array: nums, ...(bestAt ? { range: bestAt, tones: inWin(bestAt[0], bestAt[1]) } : {}), vars: { answer: ans }, done: ans ? "found" : "notfound",
    message: ans ? `The shortest window is ${ans} long (${bestAt![0]}..${bestAt![1]}). Each value enters and leaves the window once: O(n).` : `No window reaches ${target}, even all of it: return 0.` });
  return ans;
}
export const shortCode = `function minSubArrayLen(target, nums)
    left, total, best ← 0, 0, ∞
    for right ← 0 to length(nums) - 1
        total += nums[right]
        while total ≥ target  // valid: try shorter
            best ← min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best = ∞ ? 0 : best
`;

const budget: Approach<BudgetInput> = { id: "budget", name: "Longest window within a budget", code: budgetCode, run(input, t) { budgetSteps(input, t, { add: 5, shrink: 9, best: 10, done: 11 }); } };
const shortest: Approach<ShortInput> = { id: "shortest", name: "Shortest window reaching a target", code: shortCode, run(input, t) { shortestSteps(input, t, { add: 4, shrink: 8, done: 9 }); } };
export const budgetApproaches = { budget };
export const shortApproaches = { shortest };
