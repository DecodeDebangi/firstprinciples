import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; val: number };
export const example: Input = { nums: [3, 2, 2, 5, 3, 9], val: 3 };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "val", label: "remove every", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  return { input: raw, ...(raw.nums.length === 0 ? { note: "An empty array: there's nothing to remove, so k is 0." } : {}) };
}
const front = (k: number, tone: Tone = "settled") => Object.fromEntries(Array.from({ length: k }, (_, i) => [i, tone]));

const copyBack: Approach<Input> = {
  id: "copy",
  name: "Copy the keepers out, then back",
  code: `function removeElement(nums, val)
    kept ← empty list
    for each x in nums
        if x ≠ val then kept.push(x)
    for i ← 0 to length(kept) - 1
        nums[i] ← kept[i]
    return length(kept)
`,
  run({ nums: input, val }, t) {
    const nums = [...input], kept: number[] = [];
    const grid = () => ({ title: "kept (a second list)", rows: [kept.length ? [...kept] : ["(empty)"]] });
    t.step({ line: 2, array: [...nums], grid: grid(), vars: { val }, message: `Collect every value that isn't ${val} in a separate list, then copy them back to the front of nums.` });
    nums.forEach((x, i) => {
      t.op();
      if (x !== val) kept.push(x);
      t.step({ line: 4, array: [...nums], pointers: { i }, tones: { [i]: x === val ? "discard" : "found" }, grid: grid(), vars: { val }, message: x === val ? `${x} = ${val}: leave it out.` : `${x} ≠ ${val}: add it to kept.` });
    });
    kept.forEach((x, i) => { t.op(); nums[i] = x; });
    t.step({ line: 7, array: [...nums], tones: front(kept.length), grid: grid(), vars: { k: kept.length }, done: "found",
      message: `Copy kept back to the front and return k = ${kept.length}: nums[0..${kept.length - 1}] = ${kept.join(", ") || "nothing"}. O(n) time, but the second list can hold all n values: O(n) extra space, which the problem doesn't allow.` });
  },
};

const readWrite: Approach<Input> = {
  id: "read-write",
  name: "A read pointer and a write pointer",
  code: `function removeElement(nums, val)
    w ← 0
    for r ← 0 to length(nums) - 1
        if nums[r] ≠ val
            nums[w] ← nums[r]
            w += 1
    return w
`,
  run({ nums: input, val }, t) {
    const nums = [...input];
    let w = 0;
    t.step({ line: 2, array: [...nums], pointers: nums.length ? { r: 0, w: 0 } : {}, vars: { val, w },
      message: `No second list: r reads every position, and w is where the next kept value is written. Everything before w is finished.` });
    let asked = false;
    for (let r = 0; r < nums.length; r++) {
      t.op();
      if (nums[r] === val) {
        t.step({ line: 4, array: [...nums], pointers: { r, w }, tones: { ...front(w), [r]: "discard" }, vars: { val, w }, message: `nums[${r}] = ${val}: skip it. w stays put.` });
        continue;
      }
      const ask = !asked && r > w ? (asked = true, { ask: { q: `nums[${r}] = ${nums[r]} stays, and w = ${w}. Where is it written?`, options: [`nums[${w}]`, `nums[${r}]`, `nums[${nums.length - 1}]`].filter((o, k, a) => a.indexOf(o) === k), answer: 0 } }) : {};
      const to = w;
      nums[w] = nums[r]; w++;
      t.step({ ...(("ask" in ask) && (ask as { ask: { options: string[] } }).ask.options.length > 1 ? ask : {}), line: 6, array: [...nums], pointers: { r, w: Math.min(w, nums.length - 1) }, tones: { ...front(w), [to]: "found" }, ...(to !== r ? { move: { from: r, to } } : {}), vars: { val, w },
        message: to === r ? `nums[${r}] = ${nums[to]} stays, and it's already in place. w moves to ${w}.` : `nums[${r}] = ${nums[to]} stays: write it at nums[${to}] and move w to ${w}.` });
    }
    t.step({ line: 7, array: [...nums], tones: { ...front(w), ...Object.fromEntries(Array.from({ length: nums.length - w }, (_, i) => [w + i, "discard" as Tone])) }, vars: { k: w }, done: "found",
      message: `Return k = ${w}. The first ${w} positions hold the kept values in their original order. One pass, O(n), and O(1) extra space.` });
  },
};

const swapEnd: Approach<Input> = {
  id: "swap-end",
  name: "Swap unwanted values with the end (optimal)",
  code: `function removeElement(nums, val)
    i ← 0
    n ← length(nums)
    while i < n
        if nums[i] = val
            nums[i] ← nums[n - 1]  // cover it
            n -= 1
        else
            i += 1
    return n
`,
  run({ nums: input, val }, t) {
    const nums = [...input];
    let i = 0, n = nums.length;
    t.step({ line: 3, array: [...nums], pointers: n ? { i: 0, end: n - 1 } : {}, vars: { val, n },
      message: `The order of the kept values doesn't matter, so there's an even cheaper way: whenever nums[i] must go, cover it with the last value and shrink the array by one. Positions from n onwards no longer count.` });
    let asked = false;
    while (i < n) {
      t.op();
      if (nums[i] === val) {
        const ask = !asked && n - 1 > i ? (asked = true, { ask: { q: `nums[${i}] = ${val} must go. nums[${n - 1}] = ${nums[n - 1]} is pulled in to cover it. Does i move on afterwards?`, options: ["No: the value pulled in hasn't been checked yet", "Yes: move to the next position"], answer: 0 } }) : {};
        const from = n - 1;
        nums[i] = nums[n - 1]; n--;
        t.step({ ...ask, line: 7, array: [...nums], pointers: { i, ...(n > 0 ? { end: Math.max(0, n - 1) } : {}) }, range: n > 0 ? [0, n - 1] : null, tones: { ...front(i), [i]: from === i ? "discard" : "found" }, ...(from !== i ? { move: { from, to: i } } : {}), vars: { val, n },
          message: from === i ? `nums[${i}] = ${val} is the last counted value: just shrink n to ${n}.` : `nums[${i}] = ${val}: copy the last value, ${nums[i]}, over it and shrink n to ${n}. Stay on i: ${nums[i]} hasn't been checked.` });
      } else {
        i++;
        t.step({ line: 9, array: [...nums], pointers: { i: Math.min(i, nums.length - 1), end: n - 1 }, range: [0, n - 1], tones: front(i), vars: { val, n },
          message: `nums[${i - 1}] = ${nums[i - 1]} stays: move i on.` });
      }
    }
    t.step({ line: 10, array: [...nums], range: n > 0 ? [0, n - 1] : null, tones: front(n), vars: { k: n }, done: "found",
      message: `Return k = ${n}: nums[0..${n - 1}] = ${nums.slice(0, n).join(", ") || "nothing"}, in a different order, which the problem allows. Still O(n) and O(1) space, but each removed value costs one write, and kept values are never moved.` });
  },
};

export const approaches = { copyBack, readWrite, swapEnd };
