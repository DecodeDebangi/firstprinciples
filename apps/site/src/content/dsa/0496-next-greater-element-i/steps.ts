import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums1: number[]; nums2: number[] };
export const example: Input = { nums1: [4, 1, 2], nums2: [3, 1, 4, 2, 6] };
export const fields: InputField[] = [
  { key: "nums1", label: "nums1 (questions)", kind: "numbers" },
  { key: "nums2", label: "nums2", kind: "numbers" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums2.length || raw.nums2.length > 8) return { error: "Give nums2 with 1 to 8 values." };
  if (new Set(raw.nums2).size !== raw.nums2.length) return { error: "nums2's values must all be different." };
  if (!raw.nums1.length || new Set(raw.nums1).size !== raw.nums1.length || raw.nums1.some((v) => !raw.nums2.includes(v))) return { error: "nums1 must be different values, each also in nums2." };
  return { input: raw };
}
const answerPanel = (nums1: number[], ans: (number | string)[], hl?: number) => ({
  title: "answers for nums1", entries: nums1.map((x, k) => [String(x), String(ans[k])] as [string, string]), highlight: hl === undefined ? undefined : String(hl),
});

const scanRight: Approach<Input> = {
  id: "scan",
  name: "Scan right from each value",
  code: `function nextGreaterElement(nums1, nums2)
    ans ← empty list
    for each x in nums1
        j ← position of x in nums2
        found ← -1
        for k ← j + 1 to length(nums2) - 1
            if nums2[k] > x
                found ← nums2[k]
                break
        ans.push(found)
    return ans
`,
  run({ nums1, nums2 }, t) {
    const ans: (number | string)[] = nums1.map(() => "");
    t.step({ line: 2, array: nums2, map: answerPanel(nums1, ans), vars: {},
      message: `For each value in nums1, find it in nums2 and walk right until something bigger appears.` });
    let asked = false;
    nums1.forEach((x, q) => {
      const j = nums2.indexOf(x);
      t.op(j + 1);
      let found = -1, k = j + 1;
      for (; k < nums2.length; k++) { t.op(); if (nums2[k] > x) { found = nums2[k]; break; } }
      ans[q] = found;
      const ask = !asked && found !== -1 && k > j + 1 ? (asked = true, { ask: { q: `Walking right from ${x}, which value is the first bigger one?`, options: [String(found), String(nums2[j + 1]), "-1"].filter((o, z, arr) => arr.indexOf(o) === z), answer: 0 } }) : {};
      const tones: Record<number, Tone> = { [j]: "active" };
      for (let z = j + 1; z < Math.min(k, nums2.length); z++) tones[z] = "discard";
      if (found !== -1) tones[k] = "found";
      t.step({ ...ask, line: found === -1 ? 10 : 8, array: nums2, ...(found !== -1 ? { range: [j, k] as [number, number] } : {}), tones, map: answerPanel(nums1, ans, x), vars: { x },
        message: found === -1 ? `Nothing to the right of ${x} is bigger: -1. That walk checked ${nums2.length - j - 1} value${nums2.length - j - 1 === 1 ? "" : "s"}.` : `The first bigger value to the right of ${x} is ${found}, after ${k - j} step${k - j === 1 ? "" : "s"}.` });
    });
    t.step({ line: 11, array: nums2, map: answerPanel(nums1, ans), vars: { answer: ans.join(", ") }, done: "found",
      message: `Answer: [${ans.join(", ")}]. Each question can walk most of nums2: O(m · n) for m questions.` });
  },
};

const monoStack: Approach<Input> = {
  id: "stack",
  name: "One pass with a decreasing stack",
  code: `function nextGreaterElement(nums1, nums2)
    nextBigger ← empty map
    stack ← empty stack  // values still waiting
    for each x in nums2
        while stack not empty and stack.top() < x
            nextBigger[stack.pop()] ← x
        stack.push(x)
    ans ← empty list
    for each x in nums1
        ans.push(nextBigger[x] or -1)
    return ans
`,
  run({ nums1, nums2 }, t) {
    const st: number[] = [], next = new Map<number, number>();
    const panel = (hl?: number) => ({ title: "nextBigger", entries: [...next].map(([k, v]) => [String(k), String(v)] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 2, array: nums2, map: panel(), stack: [], stackTitle: "waiting for something bigger", vars: {},
      message: `Work out the next bigger value for every value in nums2 in one pass. Values still waiting for an answer sit on a stack, biggest at the bottom. A new value answers every waiting value smaller than it.` });
    let asked = false;
    nums2.forEach((x, i) => {
      const answered: number[] = [];
      while (st.length && st[st.length - 1] < x) { t.op(); const v = st.pop()!; next.set(v, x); answered.push(v); }
      t.op();
      const ask = !asked && answered.length > 0 ? (asked = true, { ask: { q: `${x} arrives; the stack holds ${[...st, ...answered.slice().reverse()].join(", ")} (bottom to top). Which values get ${x} as their answer?`, options: [answered.join(" and "), String(answered[0] ?? "none"), "None of them"].filter((o, z, arr) => arr.indexOf(o) === z), answer: 0 } }) : {};
      st.push(x);
      const tones: Record<number, Tone> = { [i]: "active" };
      answered.forEach((v) => (tones[nums2.indexOf(v)] = "found"));
      t.step({ ...ask, line: answered.length ? 6 : 7, array: nums2, pointers: { x: i }, tones, map: panel(answered[0]), stack: st.map(String), stackTitle: "waiting for something bigger", vars: { x },
        message: answered.length ? `${x} is bigger than ${answered.join(" and ")} on top of the stack: that's their answer. Pop them, then push ${x} to wait.` : `Nothing waiting is smaller than ${x}. Push it to wait for something bigger.` });
    });
    t.op(nums1.length);
    const ans = nums1.map((x) => next.get(x) ?? -1);
    t.step({ line: 10, array: nums2, map: answerPanel(nums1, ans), stack: st.map(String), stackTitle: "never answered (-1)", vars: { answer: ans.join(", ") }, done: "found",
      message: `Values still on the stack never met anything bigger: -1. Then each question in nums1 is one lookup: [${ans.join(", ")}]. Every value is pushed and popped at most once: O(m + n).` });
  },
};

export const approaches = { scan: scanRight, stack: monoStack };

/** nums2 falling, then one big value at the end: every question walks to the end. */
export const growth = measureGrowth(
  [{ approach: scanRight, slot: 1 }, { approach: monoStack, slot: 3 }],
  (n) => { const nums2 = [...Array.from({ length: n - 1 }, (_, i) => n - 1 - i), 1000]; return { nums1: nums2.slice(0, n - 1), nums2 }; },
  [4, 8, 16, 24, 32],
);
