import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { nums: number[]; limit: number; target: number };

export const example: Input = { nums: [4, 8, 1, 6, 3], limit: 5, target: 9 };

export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "limit", label: "limit (one loop)", kind: "number" },
  { key: "target", label: "target (pairs)", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "Use at least 2 values." };
  if (raw.nums.length > 6) return { error: "Use at most 6 values, so the pairs don't take forever to step through." };
  return { input: raw };
}

const oneLoop: Approach<Input> = {
  id: "one-loop",
  name: "One loop: count values above a limit",
  code: `function countAbove(a, limit)
    count ← 0
    for each x in a
        if x > limit
            count += 1
    return count
`,
  run({ nums: a, limit }, t) {
    let count = 0;
    t.step({ line: 2, array: a, vars: { limit, count },
      message: `A function takes inputs (here a list and a limit), runs its lines from top to bottom, and hands back an answer with return. First, count starts at 0.` });
    a.forEach((x, i) => {
      t.op();
      const above = x > limit;
      t.step({
        ...(i === 1 ? { ask: { q: `x is ${x} and the limit is ${limit}. Does count go up?`, options: [above ? "Yes" : "No", above ? "No" : "Yes"], answer: 0 } } : {}),
        line: 4, array: a, pointers: { x: i }, tones: { [i]: above ? "found" : "discard" }, badge: { at: i, text: `${x} ${above ? ">" : "≤"} ${limit}` }, vars: { x, limit, count },
        message: i === 0 ? `The loop body runs once for each value. First x = ${x}: is ${x} > ${limit}? ${above ? "Yes." : "No."}` : `Next x = ${x}: is ${x} > ${limit}? ${above ? "Yes." : "No."}` });
      if (above) {
        count++;
        t.step({ line: 5, array: a, pointers: { x: i }, tones: { [i]: "found" }, vars: { x, limit, count }, message: `count goes up to ${count}.` });
      }
    });
    t.step({ line: 6, array: a, tones: Object.fromEntries(a.map((v, k) => [k, v > limit ? "settled" : "discard"] as const)), vars: { count }, done: "found",
      message: `No values left, so the loop ends and the function returns ${count}. One loop over ${a.length} values did ${a.length} checks.` });
  },
};

const pairs: Approach<Input> = {
  id: "pairs",
  name: "A loop inside a loop: every pair",
  code: `function countPairs(a, target)
    count ← 0
    for i ← 0 to length(a) - 1
        for j ← i + 1 to length(a) - 1
            if a[i] + a[j] = target
                count += 1
    return count
`,
  run({ nums: a, target }, t) {
    let count = 0, checks = 0;
    const n = a.length;
    t.step({ line: 2, array: a, vars: { target, count },
      message: `Now a loop inside a loop. For each i, the inner loop runs j over every box after it. Together they visit every pair once.` });
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op(); checks++;
        const hit = a[i] + a[j] === target;
        t.step({
          ...(i === 0 && j === 2 ? { ask: { q: `i = 0 and j = 1 was just checked. Which pair comes next?`, options: ["i = 0, j = 2", "i = 1, j = 2", "i = 1, j = 1"], answer: 0 } } : {}),
          line: 5, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: hit ? "found" : "compare" }, badge: { at: j, text: `${a[i]} + ${a[j]} = ${a[i] + a[j]}` }, vars: { i, j, count, checks },
          message: `${a[i]} + ${a[j]} = ${a[i] + a[j]}${hit ? `: that's the target, ${target}.` : `, not ${target}.`}${j === n - 1 ? ` That was the last j for i = ${i}, so i moves on.` : ""}` });
        if (hit) {
          count++;
          t.step({ line: 6, array: a, pointers: { i, j }, tones: { [i]: "found", [j]: "found" }, vars: { i, j, count, checks }, message: `count goes up to ${count}.` });
        }
      }
    }
    t.step({ line: 7, array: a, vars: { count, checks }, done: "found",
      message: `Return ${count}. ${n} values made ${checks} check${checks === 1 ? "" : "s"}: every pair, about n × n ÷ 2. Double the values and the checks roughly quadruple.` });
  },
};

export const approaches = { oneLoop, pairs };

/** Checks done by each: n for one loop, n(n-1)/2 for every pair. */
export const growth = measureGrowth(
  [{ approach: oneLoop, slot: 1 }, { approach: pairs, slot: 2 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i + 1), limit: 0, target: -1 }),
  [4, 8, 16, 24, 32],
);
