import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [3, 1, 2, 4, 2] };
export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1 || raw.nums.length > 8) return { error: "Use 1 to 8 numbers so everything fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 1 || x > 99)) return { error: "Use whole numbers from 1 to 99." };
  return { input: raw };
}
const MOD = 1_000_000_007;

const pairs: Approach<Input> = {
  id: "pairs",
  name: "Every subarray, with a running minimum",
  code: `function sumSubarrayMins(a)
    total ← 0
    for i ← 0 to n - 1  // start
        low ← a[i]
        for j ← i to n - 1  // end
            low ← min(low, a[j])
            total += low
    return total mod (10⁹ + 7)
`,
  run({ nums: a }, t) {
    const n = a.length;
    let total = 0;
    t.step({ line: 2, array: a, vars: { total },
      message: `Add up the minimum of every subarray (every unbroken run of values). For each start, extend the end one value at a time, keeping the minimum so far up to date.` });
    for (let i = 0; i < n; i++) {
      let low = Infinity, row = 0;
      const mins: number[] = [];
      for (let j = i; j < n; j++) { t.op(); low = Math.min(low, a[j]); row += low; mins.push(low); }
      total += row;
      t.step({ line: 7, array: a, pointers: { i }, range: [i, n - 1], tones: { [i]: "active" }, vars: { start: i, "this row": row, total },
        message: `Subarrays starting at ${i}: their minimums are ${mins.join(", ")}, adding ${row}. Total ${total}.` });
    }
    t.step({ line: 8, array: a, vars: { answer: total % MOD }, done: "found",
      message: `The sum is ${total}. But all n(n + 1)/2 subarrays were visited one by one: O(n²).` });
  },
};

const share: Approach<Input> = {
  id: "share",
  name: "Count each value's share with two stack passes",
  code: `function sumSubarrayMins(a)
    left, right ← two arrays of length(a)
    stack ← empty stack  // values rise upward
    for i ← 0 to n - 1
        while stack not empty and
                a[stack.top()] > a[i]
            stack.pop()
        left[i] ← i - (stack.top(), or -1)
        stack.push(i)
    stack ← empty stack
    for i ← n - 1 down to 0
        while stack not empty and
                a[stack.top()] ≥ a[i]
            stack.pop()
        right[i] ← (stack.top(), or n) - i
        stack.push(i)
    total ← 0
    for i ← 0 to n - 1
        total += a[i] · left[i] · right[i]
    return total mod (10⁹ + 7)
`,
  run({ nums: a }, t) {
    const n = a.length, L: (number | string)[] = Array(n).fill(""), R: (number | string)[] = Array(n).fill(""), C: (number | string)[] = Array(n).fill("");
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "how many subarrays each value is the minimum of", rows: [[...L], [...R], [...C]], rowLabels: ["left", "right", "share"], tones });
    t.step({ line: 2, array: a, grid: grid(), vars: {},
      message: `Turn it round: instead of finding each subarray's minimum, ask for each value how many subarrays it is the minimum of. It is, for every subarray that starts after the nearest smaller value on its left and ends before the nearest smaller value on its right.` });
    let asked = false;
    for (const pass of ["left", "right"] as const) {
      const st: number[] = [], order = pass === "left" ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
      for (const i of order) {
        let pops = 0;
        while (st.length && (pass === "left" ? a[st[st.length - 1]] > a[i] : a[st[st.length - 1]] >= a[i])) { t.op(); st.pop(); pops++; }
        if (st.length) t.op();
        const b = st.length ? st[st.length - 1] : pass === "left" ? -1 : n;
        const cnt = pass === "left" ? i - b : b - i;
        const opts = [...new Set([String(cnt), String(pass === "left" ? i + 1 : n - i), "1"])];
        const q = !asked && pass === "left" && b >= 0 && opts.length > 1 ? (asked = true, { ask: { q: `${a[i]} at index ${i}: the nearest value on its left that's no bigger is ${a[b]} at index ${b}. How many places can a subarray start so ${a[i]} is still its minimum?`, options: opts, answer: 0 } }) : {};
        (pass === "left" ? L : R)[i] = cnt;
        st.push(i);
        const blocker = b >= 0 && b < n ? `${a[b]} at index ${b}` : pass === "left" ? "nothing (the start)" : "nothing (the end)";
        t.step({ ...q, line: pass === "left" ? 8 : 15, array: a, pointers: { i }, tones: { ...Object.fromEntries(st.slice(0, -1).map((k) => [k, "side-b" as Tone])), [i]: "active", ...(b >= 0 && b < n ? { [b]: "compare" } : {}) },
          grid: grid({ [`${pass === "left" ? 0 : 1},${i}`]: "found" }), stack: [...st].reverse().map((k) => `${a[k]} (index ${k})`), stackTitle: "stack (top first)", vars: { pass, i, [pass]: cnt },
          message: `${pops ? `Pop ${pops} value${pops === 1 ? "" : "s"} ${pass === "left" ? "bigger than" : "no smaller than"} ${a[i]}. ` : ""}On the ${pass}, ${a[i]} is blocked by ${blocker}, so a subarray can ${pass === "left" ? "start" : "end"} at ${cnt} place${cnt === 1 ? "" : "s"}.${b >= 0 && b < n && a[b] === a[i] ? ` An equal value blocks on the left but not on the right, so a subarray with two equal minimums is counted once, not twice.` : ""}` });
      }
    }
    let total = 0;
    for (let i = 0; i < n; i++) { t.op(); C[i] = a[i] * (L[i] as number) * (R[i] as number); total += C[i] as number; }
    t.step({ line: 20, array: a, grid: grid(Object.fromEntries(C.map((_, i) => [`2,${i}`, "found" as Tone]))), vars: { answer: total % MOD },
      message: `Each value adds itself once per subarray it's the minimum of: value × left × right. ${a.map((x, i) => `${x}·${L[i]}·${R[i]}`).join(" + ")} = ${total}. Two stack passes and one loop: O(n).`, done: "found" });
  },
};

export const approaches = { pairs, share };

/** The brute force always visits every subarray; the stacks push and pop each value once. */
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: share, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => ((i * 7) % 11) + 1) }),
  [8, 16, 32, 64, 128],
);
