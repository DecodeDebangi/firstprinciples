import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { concatFirst, concatWhy, ruleSortSteps } from "../../concepts/53-sorting-as-a-tool/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [4, 42, 45, 9, 90] };
export const fields: InputField[] = [{ key: "nums", label: "nums (0 to 999)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 6) return { error: "Use 1 to 6 numbers: 6 already has 720 orders." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 999)) return { error: "Use whole numbers from 0 to 999." };
  return { input: raw };
}
/** Bigger of two digit strings of the same length. */
const beats = (a: string, b: string) => a.length > b.length || (a.length === b.length && a > b);
const tidy = (s: string) => (s[0] === "0" ? "0" : s);

const orders: Approach<Input> = {
  id: "orders",
  name: "Try every order",
  code: `function largestNumber(nums)
    best ← ""
    for each order of nums  // n! of them
        s ← glue the numbers in this order
        if s > best
            best ← s
    return best  // "0" if it starts with 0
`,
  run({ nums }, t) {
    const n = nums.length, idx = nums.map((_, i) => i);
    let best = "", bestOrder = idx, tried = 0;
    t.step({ line: 2, array: [...nums], vars: { orders: [...Array(n)].reduce((p, _, i) => p * (i + 1), 1) },
      message: `Glue the numbers in every possible order and keep the biggest result. With ${n} numbers there are ${n}! orders.` });
    const perm = (p: number[], rest: number[]) => {
      if (!rest.length) {
        tried++;
        const s = p.map((i) => nums[i]).join("");
        t.op(s.length);
        if (beats(s, best)) {
          const old = best;
          best = s; bestOrder = [...p];
          t.step({ line: 6, array: p.map((i) => nums[i]), tones: Object.fromEntries(p.map((_, i) => [i, "found" as Tone])), vars: { tried, s, best },
            message: old ? `Order ${tried}: ${s} beats ${old}. New best.` : `Order ${tried}: ${s}. The first one tried is the best so far.` });
        }
        return;
      }
      rest.forEach((x, j) => perm([...p, x], [...rest.slice(0, j), ...rest.slice(j + 1)]));
    };
    perm([], idx);
    t.step({ line: 7, array: bestOrder.map((i) => nums[i]), tones: Object.fromEntries(bestOrder.map((_, i) => [i, "settled" as Tone])), vars: { tried, answer: tidy(best) }, done: "found",
      message: `The biggest of all ${tried} orders is ${tidy(best)}. But n! orders, each glued in O(n) time, is O(n · n!): already 3.6 million orders at n = 10.` });
  },
};

const rule: Approach<Input> = {
  id: "rule",
  name: "Sort with a pairwise rule",
  code: `function largestNumber(nums)
    sort nums so a comes before b when first(a, b)
    s ← glue the sorted numbers
    if s starts with "0"
        return "0"  // every number was 0
    return s
function first(a, b)  // should a go before b?
    return text(a) + text(b) > text(b) + text(a)
`,
  run({ nums }, t) {
    t.step({ line: 2, array: [...nums], vars: {},
      message: `Whether a should come before b depends only on those two: compare "a then b" with "b then a" as text. Sort by that rule, and the glued result is the largest.` });
    const a = ruleSortSteps(t, nums, concatFirst, concatWhy, { merge: 2, end: 3 });
    const s = a.join(""), ans = tidy(s);
    t.step({ line: ans !== s ? 5 : 6, array: a, tones: Object.fromEntries(a.map((_, i) => [i, "settled" as Tone])), vars: { answer: ans }, done: "found",
      message: `${ans !== s ? `The glued string ${s} starts with 0, so every number was 0: return "0".` : `Glued in this order: ${s}.`} Merge sort asks the rule O(n log n) times, and each comparison glues two numbers of up to d digits: O(d · n log n).` });
  },
};

export const approaches = { orders, rule };

export const growth = measureGrowth(
  [{ approach: orders, slot: 1 }, { approach: rule, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 37) % 100) }),
  [2, 3, 4, 5, 6, 7],
);
