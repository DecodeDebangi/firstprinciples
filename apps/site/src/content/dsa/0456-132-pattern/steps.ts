import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [2, 3, 1, 4, 0, 6, 5] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1 || raw.nums.length > 9) return { error: "Use 1 to 9 numbers so everything fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < -99 || x > 99)) return { error: "Use whole numbers from -99 to 99." };
  return { input: raw };
}
const fmt = (x: number) => (x === -Infinity ? "−∞" : String(x));

const scan: Approach<Input> = {
  id: "scan",
  name: "Smallest so far, then scan right",
  code: `function find132pattern(a)
    low ← a[0]  // smallest so far: the "1"
    for j ← 1 to n - 1  // the "3"
        for k ← j + 1 to n - 1  // the "2"
            if low < a[k] and a[k] < a[j]
                return true
        low ← min(low, a[j])
    return false
`,
  run({ nums: a }, t) {
    const n = a.length;
    let low = a[0], lowAt = 0;
    t.step({ line: 2, array: a, pointers: { low: 0 }, tones: { 0: "side-a" }, vars: { low },
      message: `A 132 pattern is three values in order, i < j < k, with a[i] < a[k] < a[j]: a low one, then a high one, then one in between. For each j as the "3", the best "1" is the smallest value before it; then scan right for a "2" between them.` });
    for (let j = 1; j < n; j++) {
      let found = -1;
      for (let k = j + 1; k < n; k++) { t.op(); if (low < a[k] && a[k] < a[j]) { found = k; break; } }
      if (found >= 0) {
        t.step({ line: 6, array: a, pointers: { low: lowAt, j, k: found }, tones: { [lowAt]: "found", [j]: "found", [found]: "found" }, vars: { low, "a[j]": a[j], "a[k]": a[found], answer: "true" }, done: "found",
          message: `${low} < ${a[found]} < ${a[j]}: the values ${low}, ${a[j]}, ${a[found]} at indices ${lowAt}, ${j}, ${found} form a 132 pattern. Return true.` });
        return;
      }
      t.step({ line: 7, array: a, pointers: { low: lowAt, j }, range: j + 1 < n ? [j + 1, n - 1] : null, tones: { [lowAt]: "side-a", [j]: "active" }, vars: { low, "a[j]": a[j] },
        message: a[j] <= low ? `j = ${j} (${a[j]}): it's no bigger than the smallest before it (${low}), so it can't be a "3".${a[j] < low ? ` It's the new smallest.` : ""}` : a[j] - low === 1 ? `j = ${j} (${a[j]}): no whole number fits strictly between ${low} and ${a[j]}, so there's no "2" for it.` : `j = ${j} (${a[j]}): no value after it lies strictly between ${low} and ${a[j]}.` });
      if (a[j] < low) { low = a[j]; lowAt = j; }
    }
    t.step({ line: 8, array: a, vars: { answer: "false" }, done: "notfound",
      message: `No 132 pattern: return false. Each j scanned everything after it: O(n²).` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Walk from the right with a monotonic stack",
  code: `function find132pattern(a)
    two ← -∞  // the best "2" found so far
    stack ← empty stack  // values fall upward
    for i ← n - 1 down to 0
        if a[i] < two
            return true  // a[i] is the "1"
        while stack not empty and stack.top() < a[i]
            two ← stack.pop()  // a[i] is a "3"
        stack.push(a[i])
    return false
`,
  run({ nums: a }, t) {
    const n = a.length, st: number[] = [];
    let two = -Infinity, twoAt = -1, asked = 0;
    const frames = () => [...st].reverse().map((k) => `${a[k]} (index ${k})`);
    const tones = (): Record<number, Tone> => ({ ...Object.fromEntries(st.map((k) => [k, "side-b" as Tone])), ...(twoAt >= 0 ? { [twoAt]: "side-a" as Tone } : {}) });
    t.step({ line: 3, array: a, stack: [], stackTitle: "stack (top first)", vars: { two: fmt(two) },
      message: `Walk from the right. Keep "two": the biggest value seen so far that has a bigger value to its left. That's the best "2", because a bigger "2" leaves more room for a "1" below it. Then any later value smaller than two is a "1" and completes the pattern.` });
    for (let i = n - 1; i >= 0; i--) {
      t.op();
      const q = asked < 2 && two !== -Infinity ? (asked++, { ask: { q: `a[i] = ${a[i]} and two = ${two}. Does ${a[i]} complete a 132 pattern as the "1"?`, options: [`Yes: ${a[i]} < ${two}`, `No: ${a[i]} ≥ ${two}`], answer: a[i] < two ? 0 : 1 } }) : {};
      if (a[i] < two) {
        const three = Math.min(...a.slice(i + 1, twoAt).filter((v) => v > two)) , threeAt = a.findIndex((v, k) => k > i && k < twoAt && v === three);
        t.step({ ...q, line: 6, array: a, pointers: { i }, tones: { ...tones(), [i]: "found", [twoAt]: "found", ...(threeAt >= 0 ? { [threeAt]: "found" } : {}) }, stack: frames(), stackTitle: "stack (top first)", vars: { "a[i]": a[i], two, answer: "true" }, done: "found",
          message: `${a[i]} < two (${two}): ${a[i]} is the "1". ${threeAt >= 0 ? `With ${a[threeAt]} at index ${threeAt} as the "3" and ${two} at index ${twoAt} as the "2", ` : ""}that's a 132 pattern. Return true.` });
        return;
      }
      const popped: number[] = [], two0 = two;
      while (st.length && a[st[st.length - 1]] < a[i]) { t.op(); const k = st.pop()!; popped.push(k); two = a[k]; twoAt = k; }
      st.push(i);
      t.step({ ...q, line: popped.length ? 8 : 9, array: a, pointers: { i }, tones: { ...tones(), [i]: "active" }, stack: frames(), stackTitle: "stack (top first)", vars: { "a[i]": a[i], two: fmt(two) },
        message: `${two0 === -Infinity ? "" : `${a[i]} isn't below two (${two0}). `}${popped.length ? `${a[i]} is bigger than ${popped.map((k) => a[k]).join(" and ")} to its right, so it can be ${popped.length === 1 ? `its "3": pop it, and two becomes ${two}` : `their "3": pop them, and two becomes ${two}, the last and biggest popped`}. ` : ""}Push ${a[i]}.` });
    }
    t.step({ line: 10, array: a, tones: tones(), stack: frames(), stackTitle: "stack (top first)", vars: { two: fmt(two), answer: "false" }, done: "notfound",
      message: `No value was ever below two: return false. Each value is pushed once and popped at most once: O(n).` });
  },
};

export const approaches = { scan, stack };

/** Rising values: no pattern exists, so every scan runs to the end. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i) }),
  [8, 16, 32, 64, 128],
);
