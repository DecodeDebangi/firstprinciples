import { CallTree, measureGrowth, type Approach, type Prepared } from "@firstprinciples/ui";
import { robCode, robFields, robPrepare, robSteps, type NumsInput } from "../../concepts/55-one-dimensional-dp/steps";

export type Input = NumsInput;
export const example: Input = { nums: [3, 8, 2, 4, 7, 1] };
export const fields = robFields;
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length > 7) return { error: "Use 1 to 7 houses: 8 already makes the first approach draw 54 calls." };
  return robPrepare(raw);
}

const recurse: Approach<Input> = {
  id: "recurse",
  name: "Plain recursion: rob it or skip it",
  code: `function rob(nums)
    return best(0)
function best(i)  // the most from houses i to n - 1
    if i ≥ n
        return 0
    skip ← best(i + 1)
    take ← nums[i] + best(i + 2)
    return max(skip, take)
`,
  run({ nums }, t) {
    const n = nums.length, tree = new CallTree(), seen = new Set<number>(), label = new Map<string, string>();
    let repeats = 0;
    const go = (parent: string | null, i: number): number => {
      if (i >= n) return 0;
      const id = tree.add(parent, `h${i}`);
      label.set(id, `best(${i})`);
      const again = seen.has(i);
      seen.add(i);
      const skip = go(id, i + 1), take = nums[i] + go(id, i + 2), r = Math.max(skip, take);
      if (again) repeats++;
      tree.log({ id, kind: again ? "prune" : "call", line: 8, note: String(r), vars: { i, skip, take, returns: r },
        message: `${again ? `best(${i}) again, worked out from scratch a second time. ` : ""}From house ${i}: skip it for ${skip}, or rob it for ${nums[i]} + ${take - nums[i]} = ${take}. Return ${r}.` });
      return r;
    };
    const ans = go(null, 0);
    tree.replay(t, {
      intro: { line: 2, message: `For each house, either rob it (and skip the next one) or skip it. Try both, recursively, and take the better. Each node is a call best(i) for houses i onwards; the number under it is what it returns.`, vars: {} },
      finish: () => ({ line: 2, message: `The most is ${ans}. But ${tree.nodes.length} calls answered only ${n} different questions: ${repeats} call${repeats === 1 ? " was a repeat" : "s were repeats"} (red). The calls grow like the Fibonacci numbers, about 1.6ⁿ.`, vars: { answer: ans }, done: "found" }),
      stackLabel: (id) => label.get(id)!,
    });
  },
};

const table: Approach<Input> = {
  id: "table",
  name: "Fill a table left to right",
  code: robCode,
  run({ nums }, t) { robSteps(t, nums); },
};

export const approaches = { recurse, table };

export const growth = measureGrowth(
  [{ approach: recurse, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 7) % 10) }),
  [4, 6, 8, 10, 12, 14],
);
