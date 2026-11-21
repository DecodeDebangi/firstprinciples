import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { prefixCountCode, prefixCountSteps } from "../../concepts/34-hashing-patterns/steps";

export type Input = { nums: number[]; k: number };
export const example: Input = { nums: [3, -1, 1, 2, -2, 3], k: 3 };
export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "k", label: "target sum k", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values so the animation stays short." };
  return { input: raw };
}

const everyStart: Approach<Input> = {
  id: "everyStart",
  name: "Every start, running total",
  code: `function subarraySum(a, k)
    count ← 0
    for i ← 0 to length(a) - 1
        total ← 0
        for j ← i to length(a) - 1
            total += a[j]
            if total = k
                count += 1
    return count
`,
  run({ nums: a, k }, t) {
    let count = 0;
    t.step({ line: 2, array: a, vars: { k, count },
      message: `Try every subarray: each start i, and every end j from i onwards. Extending the end by one adds one value to the running total, so each subarray costs one addition.` });
    let asked = 0;
    for (let i = 0; i < a.length; i++) {
      let total = 0;
      for (let j = i; j < a.length; j++) {
        t.op();
        const before = total;
        total += a[j];
        const hit = total === k;
        const q = j > i
          ? `${i}..${j - 1} adds up to ${before}, and the next value is a[${j}] = ${a[j]}. Does ${i}..${j} add up to ${k}?`
          : `A new start: ${i}..${j} is just a[${j}] = ${a[j]}. Does it add up to ${k}?`;
        const ask = asked < 2 && (hit || (asked === 0 && j > i))
          ? (asked++, { ask: { q, options: ["Yes: count it", "No: keep extending"], answer: hit ? 0 : 1 } }) : {};
        if (hit) count++;
        t.step({ ...ask, line: hit ? 8 : 6, array: a, range: [i, j], pointers: { i, j }, tones: { [j]: hit ? "found" : "active" },
          badge: { at: j, text: hit ? `= ${k} ✓` : `${total}` }, vars: { i, j, total, count },
          message: hit
            ? `${i}..${j} adds up to ${total} = k. count is now ${count}.`
            : `${i}..${j} adds up to ${total}, not ${k}.` });
      }
    }
    t.step({ line: 9, array: a, tones: Object.fromEntries(a.map((_, x) => [x, "settled" as Tone])), vars: { k, count }, done: count ? "found" : "notfound",
      message: `${count} subarray${count === 1 ? "" : "s"} add${count === 1 ? "s" : ""} up to ${k}. That took ${a.length * (a.length + 1) / 2} additions, one per subarray: about n² / 2, so O(n²).` });
  },
};

const withMap: Approach<Input> = {
  id: "prefixMap",
  name: "Running total and a map",
  code: prefixCountCode.replace("countSums", "subarraySum"),
  run({ nums, k }, t) { prefixCountSteps(nums, k, t, true); },
};

export const approaches = { everyStart, prefixMap: withMap };

/** Every subarray has to be visited by the first approach, whatever the values. */
export const growth = measureGrowth(
  [{ approach: everyStart, slot: 1 }, { approach: withMap, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i % 3) - 1), k: 0 }),
  [8, 16, 32, 48, 64],
);
