import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const fields: InputField[] = [{ key: "nums", label: "values", kind: "numbers" }];
const sizeCheck = (max: number) => (raw: Input): Prepared<Input> => {
  if (raw.nums.length < 1 || raw.nums.length > max) return { error: `Use 1 to ${max} values so everything fits.` };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { error: "Use whole numbers from 0 to 99." };
  return { input: raw };
};
const frames = (a: number[], st: number[]) => [...st].reverse().map((k) => `${a[k]} (day ${k})`);
const waiting = (st: number[]): Record<number, Tone> => Object.fromEntries(st.map((k) => [k, "side-b" as Tone]));

/* ---------- Looking back: stock spans ---------- */
export const spanExample: Input = { nums: [31, 40, 28, 33, 35, 30, 45] };
export const spanPrepare = sizeCheck(9);
/** Reference: how many days in a row, ending today, were at most today's value. */
export const spansRef = (a: number[]) => a.map((x, i) => { let j = i; while (j >= 0 && a[j] <= x) j--; return i - j; });

const span: Approach<Input> = {
  id: "span",
  name: "Look back: how many days in a row were no higher",
  code: `function stockSpans(a)
    span ← array of length(a), all 0
    stack ← empty stack  // values fall upward
    for each index i, value x in a
        while stack not empty and a[stack.top()] ≤ x
            stack.pop()
        prev ← stack.top(), or -1 if empty
        span[i] ← i - prev
        stack.push(i)
    return span
`,
  run({ nums: a }, t) {
    const sp: number[] = Array(a.length).fill(0), st: number[] = [];
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "span (days in a row ≤ today)", rows: [sp.map((v) => v || "")], tones });
    t.step({ line: 3, array: a, grid: grid(), stack: [], stackTitle: "stack (top first)", vars: {},
      message: `For each day, count the days in a row, ending today, whose value was no higher than today's. That means finding the previous day that was higher. The stack keeps only days that could still be "the previous higher day" for someone later.` });
    let asked = 0;
    a.forEach((x, i) => {
      const popped: number[] = [];
      const top0 = st.length ? st[st.length - 1] : -1;
      while (st.length && a[st[st.length - 1]] <= x) { t.op(); popped.push(st.pop()!); }
      if (st.length) t.op();
      if (popped.length) t.step({ line: 6, array: a, pointers: { i }, tones: { ...waiting(st), ...Object.fromEntries(popped.map((k) => [k, "discard" as Tone])), [i]: "active" }, grid: grid(), stack: frames(a, st), stackTitle: "stack (top first)", vars: { i, x, popped: popped.length },
        message: `${x} is at least ${popped.map((k) => a[k]).join(" and ")}, so pop ${popped.length === 1 ? "it" : "them"}. Any later day that sees past ${x} also sees past ${popped.length === 1 ? "that value" : "those values"}: they can never be anyone's "previous higher day" again.` });
      const prev = st.length ? st[st.length - 1] : -1;
      sp[i] = i - prev;
      const q = asked < 2 && i > 0 && top0 >= 0 ? (asked++, { ask: { q: `Day ${i} is ${x}, and the stack's top is ${a[top0]} (day ${top0}). What is day ${i}'s span?`, options: [...new Set([`${sp[i]}`, `${i - top0}`, `${i + 1}`])], answer: 0 } }) : {};
      st.push(i);
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 8, array: a, pointers: { i }, tones: { ...waiting(st.slice(0, -1)), [i]: "found", ...(prev >= 0 ? { [prev]: "compare" } : {}) }, badge: prev >= 0 ? { at: prev, text: `${a[prev]} > ${x}` } : undefined,
        grid: grid({ [`0,${i}`]: "found" }), stack: frames(a, st), stackTitle: "stack (top first)", vars: { i, x, prev, span: sp[i] },
        message: prev >= 0 ? `The top is now ${a[prev]} on day ${prev}, the previous higher day. Span = ${i} − ${prev} = ${sp[i]}. Push day ${i}.` : `The stack is empty: no earlier day was higher, so the span is ${i + 1}, every day so far. Push day ${i}.` });
    });
    t.step({ line: 10, array: a, tones: waiting(st), grid: grid(), stack: frames(a, st), stackTitle: "stack (top first)", vars: { answer: sp.join(" ") }, done: "found",
      message: `Spans: [${sp.join(", ")}]. Looking back, the answer is whatever is left on top after popping, not something written while popping. Each day is pushed and popped at most once: O(n).` });
  },
};

/* ---------- Circular arrays: walk twice ---------- */
export const circExample: Input = { nums: [4, 2, 5, 1, 3] };
export const circPrepare = sizeCheck(7);
export const circRef = (a: number[]) => a.map((x, i) => { for (let k = 1; k < a.length; k++) { const y = a[(i + k) % a.length]; if (y > x) return y; } return -1; });

const circular: Approach<Input> = {
  id: "circular",
  name: "Circular next greater: walk the array twice",
  code: `function nextGreaterCircular(a)
    n ← length(a)
    answer ← array of n, all -1
    stack ← empty stack  // values fall upward
    for i ← 0 to 2 · n - 1  // walk twice
        x ← a[i mod n]
        while stack not empty and a[stack.top()] < x
            answer[stack.pop()] ← x
        if i < n
            stack.push(i)
    return answer
`,
  run({ nums: a }, t) {
    const n = a.length, ans: number[] = Array(n).fill(-1), st: number[] = [];
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "answer: next greater, wrapping round", rows: [[...ans]], tones });
    const fr = () => [...st].reverse().map((k) => `${a[k]} (index ${k})`);
    t.step({ line: 4, array: a, grid: grid(), stack: [], stackTitle: "waiting (top first)", vars: {},
      message: `The array is a circle: after the last value comes the first again. A value near the end may find its bigger value back at the start. Walk the array twice; the second lap only answers values still waiting, and pushes nothing.` });
    let asked = false;
    for (let i = 0; i < 2 * n; i++) {
      const k = i % n, x = a[k], got: number[] = [];
      const top0 = st.length ? st[st.length - 1] : null;
      while (st.length && a[st[st.length - 1]] < x) { t.op(); const j = st.pop()!; ans[j] = x; got.push(j); }
      if (st.length) t.op();
      if (i >= n && !got.length) continue;
      const lap2 = i >= n;
      const q = !asked && lap2 && top0 !== null ? (asked = true, { ask: { q: `Second lap: ${x} (index ${k}) comes round again, and ${a[top0]} (index ${top0}) is waiting on top. What happens?`, options: ["It answers the waiting value, and isn't pushed", "It's pushed again to wait", "Nothing: the second lap only reads"], answer: 0 } }) : {};
      if (!lap2) st.push(i);
      const msg = got.length ? `${x} > ${got.map((j) => a[j]).join(" and ")}: ${got.map((j) => `index ${j}'s next greater is ${x}`).join(", ")}.` : top0 === null ? `Nothing is waiting yet.` : `${x} isn't bigger than ${a[top0]} on top, so it answers nothing.`;
      t.step({ ...q, line: got.length ? 8 : 10, array: a, pointers: { [lap2 ? "lap 2" : "i"]: k }, tones: { ...waiting(st), ...Object.fromEntries(got.map((j) => [j, "found" as Tone])), [k]: lap2 ? "compare" : "active" },
        grid: grid(Object.fromEntries(got.map((j) => [`0,${j}`, "found" as Tone]))), stack: fr(), stackTitle: "waiting (top first)", vars: { i, "i mod n": k, x },
        message: lap2 ? `Lap 2, index ${k}: ${msg} Nothing is pushed on this lap.` : `${msg} Push index ${k} to wait.` });
    }
    t.step({ line: 11, array: a, tones: waiting(st), grid: grid(), stack: fr(), stackTitle: "waiting (top first)", vars: { answer: ans.join(" ") }, done: "found",
      message: `Done: [${ans.join(", ")}]. ${st.length ? `Still waiting after two laps: ${st.map((j) => a[j]).join(", ")}, the largest value${st.length === 1 ? "" : "s"}, so −1. ` : ""}Two laps of n, and each index pushed and popped at most once: O(n).` });
  },
};

/* ---------- Largest rectangle in a histogram ---------- */
export const histExample: Input = { nums: [2, 4, 3, 5, 1, 3] };
export const histPrepare = sizeCheck(8);
export const histRef = (h: number[]) => { let best = 0; for (let i = 0; i < h.length; i++) { let m = Infinity; for (let j = i; j < h.length; j++) { m = Math.min(m, h[j]); best = Math.max(best, m * (j - i + 1)); } } return best; };

const histogram: Approach<Input> = {
  id: "histogram",
  name: "Largest rectangle: a pop knows both edges",
  code: `function largestRectangle(h)
    best ← 0
    stack ← empty stack  // heights rise upward
    for i ← 0 to n  // treat h[n] as 0
        x ← h[i] if i < n, else 0
        while stack not empty and h[stack.top()] ≥ x
            j ← stack.pop()
            left ← stack.top() + 1, or 0 if empty
            best ← max(best, h[j] · (i - left))
        stack.push(i)
    return best
`,
  run({ nums: h }, t) {
    const n = h.length, st: number[] = [];
    let best = 0, bestAt: [number, number] = [0, -1], asked = false;
    const fr = () => [...st].reverse().filter((k) => k < n).map((k) => `${h[k]} (bar ${k})`);
    t.step({ line: 3, array: h, stack: [], stackTitle: "bars (top first)", vars: { best },
      message: `Each value is the height of a bar, 1 wide. The biggest rectangle uses some bar's full height, stretched left and right until a shorter bar blocks it. A rising stack finds both blockers: when a bar is popped, the bar under it blocks the left, and the bar popping it blocks the right.` });
    for (let i = 0; i <= n; i++) {
      const x = i < n ? h[i] : 0;
      while (st.length && h[st[st.length - 1]] >= x) {
        t.op();
        const j = st.pop()!, left = st.length ? st[st.length - 1] + 1 : 0, w = i - left, area = h[j] * w;
        const q = !asked && w > 1 ? (asked = true, { ask: { q: `Bar ${j} (height ${h[j]}) is popped by ${i < n ? `bar ${i} (height ${x})` : "the end"}${st.length ? `, and bar ${st[st.length - 1]} is now on top` : ", and the stack is now empty"}. How wide is its rectangle?`, options: [...new Set([`${w}`, `${i - j}`, "1"])], answer: 0 } }) : {};
        const better = area > best;
        if (better) { best = area; bestAt = [left, i - 1]; }
        t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 9, array: h, pointers: i < n ? { i } : {}, range: [left, i - 1],
          tones: { ...waiting(st), [j]: better ? "found" : "compare", ...(i < n ? { [i]: "active" } : {}) }, badge: { at: j, text: `${h[j]} × ${w} = ${area}` },
          stack: fr(), stackTitle: "bars (top first)", vars: { i, popped: j, left, width: w, area, best },
          message: `${i < n ? `${x} ≤ ${h[j]}` : "The end acts as a bar of height 0"}: pop bar ${j}. ${st.length ? `Bar ${left - 1} under it is shorter, so the rectangle starts at ${left}` : "Nothing under it is shorter, so it reaches back to 0"} and ends at ${i - 1}: ${h[j]} × ${w} = ${area}.${better ? " The best so far." : ` Not better than ${best}.`}` });
      }
      st.push(i);
      if (i < n) t.step({ line: 10, array: h, pointers: { i }, tones: { ...waiting(st.slice(0, -1)), [i]: "active" }, stack: fr(), stackTitle: "bars (top first)", vars: { i, best },
        message: `Push bar ${i} (height ${x}). ${st.length > 1 ? "Every bar below it is shorter" : "It's alone on the stack"}, and no shorter bar has come after it yet, so its rectangle can't be measured yet.` });
    }
    t.step({ line: 11, array: h, range: bestAt, tones: Object.fromEntries(Array.from({ length: bestAt[1] - bestAt[0] + 1 }, (_, k) => [bestAt[0] + k, "settled" as Tone])), stack: [], stackTitle: "bars (top first)", vars: { best }, done: "found", ...(best === 0 ? { range: null } : {}),
      message: `The largest rectangle has area ${best}, across bars ${bestAt[0]} to ${bestAt[1]}. Each bar is pushed and popped once, and each pop computes one rectangle: O(n), instead of trying every pair of edges in O(n²).` });
  },
};

export const approaches = { span, circular, histogram };
