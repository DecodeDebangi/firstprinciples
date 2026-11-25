import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { heights: number[] };
export const example: Input = { heights: [3, 0, 2, 0, 4, 1, 2] };
export const fields: InputField[] = [{ key: "heights", label: "bar heights", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.heights.length < 1 || raw.heights.length > 9) return { error: "Use 1 to 9 bars so everything fits." };
  if (raw.heights.some((x) => !Number.isInteger(x) || x < 0 || x > 9)) return { error: "Use whole heights from 0 to 9." };
  return { input: raw };
}
const waterGrid = (w: number[], tones: Record<string, Tone> = {}) => ({ title: "water above each bar", rows: [w.map((v) => v || "")], tones });
const sum = (w: number[]) => w.reduce((s, v) => s + v, 0);

const lookBoth: Approach<Input> = {
  id: "brute",
  name: "Look left and right from every bar",
  code: `function trap(h)
    water ← 0
    for i ← 0 to n - 1
        leftMax ← max of h[0..i]
        rightMax ← max of h[i..n - 1]
        water += min(leftMax, rightMax) - h[i]
    return water
`,
  run({ heights: h }, t) {
    const n = h.length, w = Array(n).fill(0);
    t.step({ line: 2, array: h, grid: waterGrid(w), vars: { water: 0 },
      message: `Water above a bar rises to the lower of the tallest bar on its left and the tallest bar on its right (each counting the bar itself), then spills. So for each bar, find both and subtract its own height.` });
    for (let i = 0; i < n; i++) {
      let L = 0, R = 0, li = 0, ri = 0;
      for (let k = 0; k <= i; k++) { t.op(); if (h[k] > L) { L = h[k]; li = k; } }
      for (let k = i; k < n; k++) { t.op(); if (h[k] > R) { R = h[k]; ri = k; } }
      w[i] = Math.min(L, R) - h[i];
      t.step({ line: 6, array: h, pointers: { i }, tones: { [li]: "compare", [ri]: "compare", [i]: w[i] ? "found" : "active" }, grid: waterGrid(w, { [`0,${i}`]: "found" }), vars: { i, leftMax: L, rightMax: R, water: sum(w) },
        message: `Bar ${i} (height ${h[i]}): tallest on the left ${L}, on the right ${R}. ${w[i] ? `Water rises to ${Math.min(L, R)}: ${Math.min(L, R)} − ${h[i]} = ${w[i]} above it.` : `The lower of them is ${Math.min(L, R)}, no higher than the bar: no water.`}` });
    }
    t.step({ line: 7, array: h, grid: waterGrid(w), vars: { water: sum(w) }, done: "found",
      message: `${sum(w)} units of water. But every bar scanned the whole list again for its two maximums: O(n²).` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack: fill water layer by layer",
  code: `function trap(h)
    water ← 0
    stack ← empty stack  // heights fall upward
    for each index i, value x in h
        while stack not empty and h[stack.top()] < x
            bottom ← stack.pop()
            if stack is empty
                break
            left ← stack.top()
            width ← i - left - 1
            depth ← min(h[left], x) - h[bottom]
            water += width · depth
        stack.push(i)
    return water
`,
  run({ heights: h }, t) {
    const w = Array(h.length).fill(0), st: number[] = [];
    const frames = () => [...st].reverse().map((k) => `${h[k]} (bar ${k})`);
    const waiting = (): Record<number, Tone> => Object.fromEntries(st.map((k) => [k, "side-b" as Tone]));
    let asked = false;
    t.step({ line: 3, array: h, grid: waterGrid(w), stack: [], stackTitle: "walls (top first)", vars: { water: 0 },
      message: `Keep bars on a stack with heights falling toward the top: each is a possible left wall. When a taller bar arrives, the bar on top is the floor of a dip, the bar under it is the left wall, and the new bar is the right wall. Fill that layer, then look again.` });
    h.forEach((x, i) => {
      while (st.length && h[st[st.length - 1]] < x) {
        t.op();
        const b = st.pop()!;
        if (!st.length) {
          t.step({ line: 8, array: h, pointers: { i }, tones: { ...waiting(), [b]: "discard", [i]: "active" }, grid: waterGrid(w), stack: frames(), stackTitle: "walls (top first)", vars: { i, water: sum(w) },
            message: `${x} > ${h[b]}: pop bar ${b}. Nothing is left under it, so there's no left wall: water would spill out on the left.` });
          break;
        }
        const left = st[st.length - 1], width = i - left - 1, depth = Math.min(h[left], x) - h[b];
        for (let k = left + 1; k < i; k++) w[k] += depth;
        const opts = [...new Set([String(depth), String(Math.max(h[left], x) - h[b]), String(Math.min(h[left], x))])];
        const q = !asked && depth > 0 && opts.length > 1 ? (asked = true, { ask: { q: `Floor ${h[b]} (bar ${b}) between walls ${h[left]} (bar ${left}) and ${x} (bar ${i}). How deep is this layer of water?`, options: opts, answer: 0 } }) : {};
        t.step({ ...q, line: 12, array: h, pointers: { left, i }, range: [left + 1, i - 1], tones: { ...waiting(), [b]: "found", [left]: "compare", [i]: "compare" }, grid: waterGrid(w, Object.fromEntries(Array.from({ length: width }, (_, k) => [`0,${left + 1 + k}`, depth ? "found" as Tone : "compare" as Tone]))), stack: frames(), stackTitle: "walls (top first)", vars: { width, depth, water: sum(w) },
          message: `${x} > ${h[b]}: pop the floor, bar ${b}. Walls ${h[left]} and ${x} hold water up to ${Math.min(h[left], x)}, ${depth} above the floor, across ${width} bar${width === 1 ? "" : "s"}: ${width} × ${depth} = ${width * depth}.` });
      }
      st.push(i);
      t.op();
      t.step({ line: 13, array: h, pointers: { i }, tones: { ...waiting(), [i]: "active" }, grid: waterGrid(w), stack: frames(), stackTitle: "walls (top first)", vars: { i, water: sum(w) },
        message: `Push bar ${i} (height ${x}): it waits as a possible floor or left wall.` });
    });
    t.step({ line: 14, array: h, grid: waterGrid(w), stack: frames(), stackTitle: "walls (top first)", vars: { water: sum(w) }, done: "found",
      message: `${sum(w)} units of water. Each bar is pushed once and popped once, and each pop fills one layer: O(n) time, O(n) for the stack.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "twoPointers",
  name: "Two pointers: the lower side is settled",
  code: `function trap(h)
    lo, hi ← 0, n - 1
    leftMax, rightMax, water ← 0, 0, 0
    while lo < hi
        if h[lo] < h[hi]
            leftMax ← max(leftMax, h[lo])
            water += leftMax - h[lo]
            lo += 1
        else
            rightMax ← max(rightMax, h[hi])
            water += rightMax - h[hi]
            hi -= 1
    return water
`,
  run({ heights: h }, t) {
    const n = h.length, w = Array(n).fill(0);
    let lo = 0, hi = n - 1, L = 0, R = 0, asked = 0;
    t.step({ line: 2, array: h, pointers: n > 1 ? { lo, hi } : { lo }, grid: waterGrid(w), vars: { leftMax: 0, rightMax: 0, water: 0 },
      message: `Walk in from both ends. If the left bar is lower than the right one, the right side already has a wall at least that tall, so the left bar's water depends only on the tallest bar to its left. Settle it and move on; the same goes for the right.` });
    while (lo < hi) {
      t.op();
      const left = h[lo] < h[hi];
      const q = asked < 2 ? (asked++, { ask: { q: `h[lo] = ${h[lo]}, h[hi] = ${h[hi]}. Which bar is settled next?`, options: [`Bar ${lo}, on the left`, `Bar ${hi}, on the right`], answer: left ? 0 : 1 } }) : {};
      const i = left ? lo : hi;
      if (left) { L = Math.max(L, h[lo]); w[lo] = L - h[lo]; } else { R = Math.max(R, h[hi]); w[hi] = R - h[hi]; }
      const m = left ? L : R;
      t.step({ ...q, line: left ? 7 : 11, array: h, pointers: { lo, hi }, tones: { [i]: w[i] ? "found" : "active", [left ? hi : lo]: "compare" }, grid: waterGrid(w, { [`0,${i}`]: "found" }), vars: { leftMax: L, rightMax: R, water: sum(w) },
        message: `${h[lo]} ${left ? "<" : "≥"} ${h[hi]}: settle bar ${i} on the ${left ? "left" : "right"}. The tallest on its side so far is ${m}, so it holds ${m} − ${h[i]} = ${w[i]}.` });
      if (left) lo++; else hi--;
    }
    t.step({ line: 13, array: h, grid: waterGrid(w), vars: { water: sum(w) }, done: "found",
      message: `${sum(w)} units of water. Each step settles one bar: O(n) time and only O(1) extra space.` });
  },
};

export const approaches = { brute: lookBoth, stack, twoPointers };

/** Every bar scans the whole list in the brute force, whatever the heights. */
export const growth = measureGrowth(
  [{ approach: lookBoth, slot: 1 }, { approach: stack, slot: 2 }, { approach: twoPointers, slot: 3 }],
  (n) => ({ heights: Array.from({ length: n }, (_, i) => (i * 5) % 7) }),
  [8, 16, 32, 64, 128],
);
