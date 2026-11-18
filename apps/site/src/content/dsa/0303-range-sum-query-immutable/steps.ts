import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** calls: "0..2, 2..5, 0..5": one sumRange(l, r) call each. */
export type Input = { nums: number[]; calls: string };
export const example: Input = { nums: [-2, 5, 1, -4, 6, 3], calls: "0..2, 2..5, 1..1" };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "calls", label: "sumRange calls l..r", kind: "text" },
];
export const parseCalls = (s: string): [number, number][] =>
  [...s.matchAll(/(-?\d+)\s*\.\.\s*(-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.nums.length;
  if (n === 0) return { error: "Give at least one value." };
  if (n > 8) return { error: "Use at most 8 values so the prefix row fits." };
  const c = parseCalls(raw.calls);
  if (c.length === 0) return { error: 'Give at least one call, written like "0..2".' };
  if (c.length > 4) return { error: "Use at most 4 calls." };
  if (c.some(([l, r]) => l < 0 || r >= n || l > r)) return { error: `Each call l..r needs 0 ≤ l ≤ r ≤ ${n - 1}.` };
  return { input: { nums: raw.nums, calls: c.map(([l, r]) => `${l}..${r}`).join(", ") } };
}
const prefixGrid = (p: (number | string)[], tones: Record<number, Tone> = {}) => ({
  title: "this.prefix", rows: [[...p]], colLabels: p.map((_, k) => k), tones: Object.fromEntries(Object.entries(tones).map(([k, tn]) => [`0,${k}`, tn])),
});

const loop: Approach<Input> = {
  id: "loop",
  name: "Add up the range on every call",
  code: `class NumArray
    constructor(nums)
        this.nums ← nums
    function sumRange(l, r)
        total ← 0
        for i ← l to r
            total += this.nums[i]
        return total
`,
  run({ nums, calls }, t) {
    const cs = parseCalls(calls), answers: number[] = [];
    t.op();
    t.step({ line: 3, array: nums, vars: {}, message: "The class is built once, then sumRange is called again and again. The simple version just stores the array, and adds up the range each time it's asked." });
    for (const [l, r] of cs) {
      let total = 0;
      for (let i = l; i <= r; i++) { t.op(); total += nums[i]; }
      answers.push(total);
      t.step({ line: 8, array: nums, range: [l, r], vars: { call: `sumRange(${l}, ${r})`, returns: total },
        message: `sumRange(${l}, ${r}): loop over ${r - l + 1} value${r === l ? "" : "s"}, ${nums.slice(l, r + 1).join(" + ")} = ${total}.` });
    }
    t.step({ line: 8, array: nums, vars: { answers: answers.join(", ") }, done: "found",
      message: `Answers: ${answers.join(", ")}. Each call costs up to n additions, so q calls cost O(n · q). The problem expects up to 10,000 calls, and each one re-adds values already added before.` });
  },
};

const prefix: Approach<Input> = {
  id: "prefix",
  name: "Prefix sums built once (optimal)",
  code: `class NumArray
    constructor(nums)
        p ← array of length(nums) + 1, all 0
        for i ← 0 to length(nums) - 1
            p[i + 1] ← p[i] + nums[i]
        this.prefix ← p
    function sumRange(l, r)
        return this.prefix[r + 1] - this.prefix[l]
`,
  run({ nums, calls }, t) {
    const cs = parseCalls(calls), answers: number[] = [];
    const p: (number | string)[] = [0, ...nums.map(() => "")];
    t.step({ line: 3, array: nums, grid: prefixGrid(p, { 0: "active" }), vars: {},
      message: "Do the adding once, in the constructor: prefix[k] is the sum of the first k values. Every call after that is a single subtraction." });
    for (let i = 0; i < nums.length; i++) {
      t.op();
      p[i + 1] = (p[i] as number) + nums[i];
      t.step({ line: 5, array: nums, pointers: { i }, tones: { [i]: "active" }, grid: prefixGrid(p, { [i + 1]: "found" }), vars: { i },
        message: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${p[i]} + ${nums[i]} = ${p[i + 1]}.` });
    }
    let asked = false;
    for (const [l, r] of cs) {
      t.op();
      const ans = (p[r + 1] as number) - (p[l] as number);
      answers.push(ans);
      const ask = !asked ? (asked = true, { ask: { q: `sumRange(${l}, ${r}): which subtraction gives it?`, options: [`prefix[${r + 1}] - prefix[${l}]`, `prefix[${r}] - prefix[${l}]`, `prefix[${r + 1}] - prefix[${l + 1}]`], answer: 0 } }) : {};
      t.step({ ...ask, line: 8, array: nums, range: [l, r], grid: prefixGrid(p, { [r + 1]: "found", [l]: "compare" }), vars: { call: `sumRange(${l}, ${r})`, returns: ans },
        message: `sumRange(${l}, ${r}) = prefix[${r + 1}] - prefix[${l}] = ${p[r + 1]} - ${p[l]} = ${ans}: everything up to ${r}, minus everything before ${l}.` });
    }
    t.step({ line: 8, array: nums, grid: prefixGrid(p, Object.fromEntries(p.map((_, k) => [k, "settled" as Tone]))), vars: { answers: answers.join(", ") }, done: "found",
      message: `Answers: ${answers.join(", ")}. The constructor is O(n) once; each call is O(1). q calls: O(n + q). The prefix array takes O(n) space.` });
  },
};

export const approaches = { loop, prefix };

/** n values, n calls over the whole array. */
export const growth = measureGrowth(
  [{ approach: loop, slot: 1 }, { approach: prefix, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i % 5) - 2), calls: Array.from({ length: n }, () => `0..${n - 1}`).join(", ") }),
  [4, 8, 16, 24, 32],
);
