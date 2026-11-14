import type { Approach, InputField, Prepared } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [7, 3, 9, 4, 6] };

export const fields: InputField[] = [{ key: "nums", label: "values", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "Use at least 2 values." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values so every box fits." };
  return { input: raw };
}

const uniq = (o: string[]) => o.filter((v, i, a) => a.indexOf(v) === i);

const total: Approach<Input> = {
  id: "total",
  name: "Visit every box: add them up",
  code: `function total(a)
    sum ← 0
    for i ← 0 to length(a) - 1
        sum += a[i]
    return sum
`,
  run({ nums: a }, t) {
    const n = a.length;
    t.step({ line: 2, array: a, vars: { sum: 0 },
      message: `An array is a row of boxes. Each box has a number, its index, starting at 0. This one has ${n} boxes, so the indices go from 0 to ${n - 1}.` });
    let sum = 0;
    for (let i = 0; i < n; i++) {
      t.op();
      const opts = uniq([String(a[i]), String(a[i - 1]), String(a[i + 1] ?? a[0])]);
      const before = sum;
      sum += a[i];
      t.step({
        ...(i === 2 && opts.length > 1 ? { ask: { q: `i is now ${i}. Which value does a[i] read?`, options: opts, answer: 0 } } : {}),
        line: 4, array: a, pointers: { i }, tones: { [i]: "active" }, badge: { at: i, text: `a[${i}]` }, vars: { i, "a[i]": a[i], sum },
        message: i === 0
          ? `i starts at 0, so a[0] is the first box: ${a[0]}. Add it: sum = ${before} + ${a[i]} = ${sum}.`
          : `i = ${i}, so a[${i}] is ${a[i]}. Add it: sum = ${before} + ${a[i]} = ${sum}.` });
    }
    t.step({ line: 5, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "settled"] as const)), vars: { sum }, done: "found",
      message: `The last index is ${n - 1}, so the loop stops there. Return ${sum}. Visiting ${n} boxes took ${n} steps: n boxes, n steps.` });
  },
};

const biggest: Approach<Input> = {
  id: "biggest",
  name: "Find the biggest value",
  code: `function biggest(a)
    best ← a[0]
    for i ← 1 to length(a) - 1
        if a[i] > best
            best ← a[i]
    return best
`,
  run({ nums: a }, t) {
    let best = a[0], at = 0;
    t.step({ line: 2, array: a, pointers: { best: 0 }, tones: { 0: "found" }, vars: { best },
      message: `Start by assuming the first box, a[0] = ${a[0]}, is the biggest. Then check every other box against it.` });
    for (let i = 1; i < a.length; i++) {
      t.op();
      const bigger = a[i] > best;
      t.step({
        ...(i === 1 ? { ask: { q: `best is ${best} and a[${i}] is ${a[i]}. Does best change?`, options: [bigger ? `Yes: ${a[i]} > ${best}` : `No: ${a[i]} isn't bigger`, bigger ? "No: keep the first one" : `Yes: take ${a[i]}`], answer: 0 } } : {}),
        line: 4, array: a, pointers: { i, best: at }, tones: { [i]: "compare", [at]: "found" }, badge: { at: i, text: `${a[i]} ${bigger ? ">" : "≤"} ${best}` }, vars: { i, "a[i]": a[i], best },
        message: bigger ? `${a[i]} > ${best}: a new biggest. Remember it.` : `${a[i]} isn't bigger than ${best}. Keep ${best}.` });
      if (bigger) {
        best = a[i]; at = i;
        t.step({ line: 5, array: a, pointers: { i, best: at }, tones: { [at]: "found" }, vars: { i, best }, message: `best is now ${best}, from index ${at}.` });
      }
    }
    t.step({ line: 6, array: a, pointers: { best: at }, tones: { [at]: "found" }, vars: { best }, done: "found",
      message: `Every box has been checked once. The biggest is ${best}, at index ${at}. To be sure, you have to look at all ${a.length}.` });
  },
};

export const approaches = { total, biggest };
