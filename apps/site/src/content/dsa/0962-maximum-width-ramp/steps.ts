import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [6, 2, 7, 4, 1, 5, 3] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2 || raw.nums.length > 9) return { error: "Use 2 to 9 numbers so everything fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { error: "Use whole numbers from 0 to 99." };
  return { input: raw };
}

const pairs: Approach<Input> = {
  id: "pairs",
  name: "For each start, the furthest end that works",
  code: `function maxWidthRamp(a)
    best ← 0
    for i ← 0 to n - 1
        for j ← n - 1 down to i + 1
            if a[i] ≤ a[j]
                best ← max(best, j - i)
                break  // the furthest j for this i
    return best
`,
  run({ nums: a }, t) {
    const n = a.length;
    let best = 0, at: [number, number] | null = null;
    t.step({ line: 2, array: a, vars: { best },
      message: `A ramp is a pair i < j with a[i] ≤ a[j]; its width is j − i. For each start i, scan from the far end inward: the first j that works is the widest ramp starting at i.` });
    for (let i = 0; i < n; i++) {
      let j = n - 1;
      for (; j > i; j--) { t.op(); if (a[i] <= a[j]) break; }
      const hit = j > i, better = hit && j - i > best;
      if (better) { best = j - i; at = [i, j]; }
      t.step({ line: hit ? 6 : 4, array: a, pointers: hit ? { i, j } : { i }, range: hit ? [i, j] : null, tones: { [i]: "active", ...(hit ? { [j]: better ? "found" : "compare" } : {}) }, badge: hit ? { at: j, text: `${a[i]} ≤ ${a[j]}` } : undefined, vars: { i, best },
        message: hit ? `Start ${i} (${a[i]}): scanning in from the end, the first value at least ${a[i]} is ${a[j]} at ${j}. Width ${j - i}.${better ? " The best so far." : ` Not better than ${best}.`}` : `Start ${i} (${a[i]}): no later value is at least ${a[i]}, so no ramp starts here.` });
    }
    t.step({ line: 8, array: a, range: at, tones: at ? { [at[0]]: "settled", [at[1]]: "settled" } : {}, vars: { best }, done: "found",
      message: `The widest ramp has width ${best}${at ? `, from ${at[0]} to ${at[1]}` : ""}. But a start with no ramp scans everything after it: O(n²) when the values only fall.` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "A stack of possible starts, then sweep from the right",
  code: `function maxWidthRamp(a)
    stack ← empty stack  // possible starts
    for each index i, value x in a
        if stack is empty or x < a[stack.top()]
            stack.push(i)
    best ← 0
    for j ← n - 1 down to 0
        x ← a[j]
        while stack not empty and a[stack.top()] ≤ x
            best ← max(best, j - stack.pop())
    return best
`,
  run({ nums: a }, t) {
    const n = a.length, st: number[] = [];
    let best = 0, at: [number, number] | null = null, asked = 0;
    const frames = () => [...st].reverse().map((k) => `${a[k]} (index ${k})`);
    const starts = (): Record<number, Tone> => Object.fromEntries(st.map((k) => [k, "side-b" as Tone]));
    t.step({ line: 2, array: a, stack: [], stackTitle: "possible starts (top first)", vars: {},
      message: `A start is only worth trying if it's smaller than every value before it: an earlier value that's no bigger would give a wider ramp with the same ends. So first collect those "new lows" on a stack.` });
    a.forEach((x, i) => {
      t.op();
      const push = !st.length || x < a[st[st.length - 1]];
      const prev = st.length ? a[st[st.length - 1]] : null;
      if (push) st.push(i);
      t.step({ line: push ? 5 : 4, array: a, pointers: { i }, tones: { ...starts(), [i]: push ? "active" : "discard" }, stack: frames(), stackTitle: "possible starts (top first)", vars: { i, x },
        message: push ? (prev === null ? `${x} is the first value: push it as a start.` : `${x} < ${prev}, the lowest so far: push it as a start.`) : `${x} isn't below ${prev}, so starting at index ${st[st.length - 1]} instead always gives a wider ramp. Skip.` });
    });
    t.step({ line: 7, array: a, tones: starts(), stack: frames(), stackTitle: "possible starts (top first)", vars: { best },
      message: `The starts fall from bottom to top. Now sweep ends j from the right. While the start on top is no bigger than a[j], that's a ramp; and no end further left could do better for it, so pop it.` });
    for (let j = n - 1; j >= 0 && st.length; j--) {
      const x = a[j], got: number[] = [];
      const q = asked < 2 && st.length ? (asked++, { ask: { q: `End ${j} has ${x}; the start on top is ${a[st[st.length - 1]]} at index ${st[st.length - 1]}. Is that a ramp?`, options: ["Yes: pop it and record the width", "No: move the end left"], answer: a[st[st.length - 1]] <= x ? 0 : 1 } }) : {};
      while (st.length && a[st[st.length - 1]] <= x) { t.op(); const i = st.pop()!; got.push(i); if (j - i > best) { best = j - i; at = [i, j]; } }
      if (st.length) t.op();
      t.step({ ...q, line: got.length ? 10 : 9, array: a, pointers: { j }, range: got.length ? [got[got.length - 1], j] : null, tones: { ...starts(), ...Object.fromEntries(got.map((i) => [i, "found" as Tone])), [j]: "active" }, stack: frames(), stackTitle: "possible starts (top first)", vars: { j, x, best },
        message: got.length ? `${got.map((i) => `${a[i]} at ${i}`).join(" and ")} ${got.length === 1 ? "is" : "are"} no bigger than ${x}: width${got.length === 1 ? "" : "s"} ${got.map((i) => j - i).join(" and ")}. Pop ${got.length === 1 ? "it" : "them"}. Best: ${best}.` : `The top start, ${a[st[st.length - 1]]}, is bigger than ${x}: no ramp ends here for it. Move left.` });
    }
    t.step({ line: 11, array: a, range: at, tones: at ? { [at[0]]: "settled", [at[1]]: "settled" } : {}, vars: { best }, done: "found",
      message: `The widest ramp has width ${best}${at ? `, from ${at[0]} to ${at[1]}` : ""}. One pass to collect starts and one sweep of ends, each start popped once: O(n).` });
  },
};

export const approaches = { pairs, stack };

/** Falling values: there's no ramp at all, so every start scans to its end. */
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => n - i) }),
  [8, 16, 32, 64, 128],
);
