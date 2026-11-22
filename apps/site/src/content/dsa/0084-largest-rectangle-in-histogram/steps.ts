import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { approaches as read, histPrepare } from "../../concepts/56-monotonic-stack-patterns/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [2, 4, 3, 5, 1, 3] };
export const fields: InputField[] = [{ key: "nums", label: "bar heights", kind: "numbers" }];
export const prepare = (raw: Input): Prepared<Input> => histPrepare(raw);
const span = (a: number, b: number, tone: Tone) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, k) => [a + k, tone]));

const pairs: Approach<Input> = {
  id: "pairs",
  name: "Try every left and right edge",
  code: `function largestRectangleArea(h)
    best ← 0
    for i ← 0 to n - 1  // left edge
        low ← h[i]
        for j ← i to n - 1  // right edge
            low ← min(low, h[j])  // shortest bar
            best ← max(best, low · (j - i + 1))
    return best
`,
  run({ nums: h }, t) {
    const n = h.length;
    let best = 0, at: [number, number] = [0, -1];
    t.step({ line: 2, array: h, vars: { best },
      message: `Each value is a bar 1 unit wide. A rectangle between a left edge i and a right edge j can only be as tall as the shortest bar between them. Try every pair of edges, keeping that shortest height up to date as j moves right.` });
    for (let i = 0; i < n; i++) {
      let low = Infinity, bi = 0, bj = i;
      for (let j = i; j < n; j++) { t.op(); low = Math.min(low, h[j]); const area = low * (j - i + 1); if (area > bi) { bi = area; bj = j; } }
      const better = bi > best;
      if (better) { best = bi; at = [i, bj]; }
      t.step({ line: 7, array: h, pointers: { i }, range: [i, bj], tones: { ...span(i, bj, better ? "found" : "compare"), [i]: "active" }, vars: { i, "edges tried": n - i, best },
        message: `Left edge ${i}: try ${n - i === 1 ? "its only right edge" : `all ${n - i} right edges`}. The biggest is bars ${i} to ${bj}, area ${bi}.${better ? " The best so far." : ` Not better than ${best}.`}` });
    }
    t.step({ line: 8, array: h, range: best ? at : null, tones: best ? span(at[0], at[1], "settled") : {}, vars: { best }, done: "found",
      message: `The largest rectangle has area ${best}. But every pair of edges was tried: n(n + 1)/2 pairs, O(n²).` });
  },
};

const twoPasses: Approach<Input> = {
  id: "twoPass",
  name: "Find each bar's shorter neighbours, then measure",
  code: `function largestRectangleArea(h)
    left, right ← two arrays of length(h)
    stack ← empty stack  // heights rise upward
    for each index i, value x in h
        while stack not empty and h[stack.top()] ≥ x
            stack.pop()
        left[i] ← stack.top(), or -1 if empty
        stack.push(i)
    stack ← empty stack
    for i ← n - 1 down to 0
        x ← h[i]
        while stack not empty and h[stack.top()] ≥ x
            stack.pop()
        right[i] ← stack.top(), or n if empty
        stack.push(i)
    best ← 0
    for i ← 0 to n - 1
        width ← right[i] - left[i] - 1
        best ← max(best, h[i] · width)
    return best
`,
  run({ nums: h }, t) {
    const n = h.length, L: (number | string)[] = Array(n).fill(""), R: (number | string)[] = Array(n).fill("");
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "nearest shorter bar", rows: [[...L], [...R]], rowLabels: ["left", "right"], tones });
    t.step({ line: 2, array: h, grid: grid(), vars: {},
      message: `The biggest rectangle is as tall as some bar, stretched until a shorter bar blocks each side. So for every bar, find the nearest shorter bar on the left and on the right; then its rectangle's width is everything between them.` });
    const asked: Record<string, boolean> = {};
    for (const pass of ["left", "right"] as const) {
      const st: number[] = [], order = pass === "left" ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
      const row = pass === "left" ? L : R, none = pass === "left" ? -1 : n;
      for (const i of order) {
        let pops = 0;
        const top0 = st.length ? st[st.length - 1] : null;
        while (st.length && h[st[st.length - 1]] >= h[i]) { t.op(); st.pop(); pops++; }
        if (st.length) t.op();
        const b = st.length ? st[st.length - 1] : none;
        row[i] = b;
        const near = pass === "left" ? i - 1 : i + 1, name = (k: number) => (k < 0 || k >= n ? `None: it reaches the ${pass === "left" ? "start" : "end"}` : `Bar ${k} (height ${h[k]})`);
        const opts = [...new Set([name(b), name(near), ...(top0 !== null ? [name(top0)] : [])])];
        const q = pops && !asked[pass] && opts.length > 1 ? (asked[pass] = true, { ask: { q: `Bar ${i} has height ${h[i]}. Which bar is the nearest shorter one on its ${pass}?`, options: opts, answer: 0 } }) : {};
        st.push(i);
        t.step({ ...q, line: pass === "left" ? 7 : 14, array: h, pointers: { i }, tones: { ...Object.fromEntries(st.slice(0, -1).map((k) => [k, "side-b" as Tone])), [i]: "active", ...(b >= 0 && b < n ? { [b]: "compare" } : {}) },
          grid: grid({ [`${pass === "left" ? 0 : 1},${i}`]: "found" }), stack: [...st].reverse().map((k) => `${h[k]} (bar ${k})`), stackTitle: "stack (top first)", vars: { pass, i, [pass]: b },
          message: b >= 0 && b < n ? `Bar ${i} (height ${h[i]}): ${pops ? `pop ${pops} bar${pops === 1 ? "" : "s"} at least as tall; ` : ""}bar ${b} (height ${h[b]}) is the nearest shorter one on the ${pass}.` : `Bar ${i} (height ${h[i]}): ${pops ? `pop ${pops} bar${pops === 1 ? "" : "s"} at least as tall, and the stack is empty: ` : ""}no shorter bar on the ${pass}, so it reaches the ${pass === "left" ? "start (−1)" : `end (${n})`}.` });
      }
    }
    let best = 0, at: [number, number] = [0, -1];
    for (let i = 0; i < n; i++) { t.op(); const w = (R[i] as number) - (L[i] as number) - 1; if (h[i] * w > best) { best = h[i] * w; at = [(L[i] as number) + 1, (R[i] as number) - 1]; } }
    t.step({ line: 20, array: h, range: best ? at : null, tones: best ? span(at[0], at[1], "settled") : {}, grid: grid(), vars: { best }, done: "found",
      message: `Each bar's area is its height × (right − left − 1). The biggest is ${best}, across bars ${at[0]} to ${at[1]}. Two stack passes and one loop: O(n). It needs two extra arrays, though, and the next approach does it in one pass.` });
  },
};

const onePass: Approach<Input> = {
  ...read.histogram,
  id: "stack",
  name: "One pass: a pop knows both edges",
  code: read.histogram.code.replace("largestRectangle(", "largestRectangleArea("),
};

export const approaches = { pairs, twoPass: twoPasses, stack: onePass };

/** Rising heights: the brute force tries every pair; the stacks push and pop each bar once. */
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: twoPasses, slot: 2 }, { approach: onePass, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i % 9) + 1) }),
  [8, 16, 32, 64, 128],
);
