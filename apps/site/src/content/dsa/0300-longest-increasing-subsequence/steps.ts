import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { lisCode, lisFields, lisPrepare, lisSteps, type NumsInput } from "../../concepts/55-one-dimensional-dp/steps";

export type Input = NumsInput;
export const example: Input = { nums: [3, 8, 4, 9, 5, 6, 2] };
export const fields = lisFields;
export const prepare = lisPrepare;

const everySub: Approach<Input> = {
  id: "everySub",
  name: "Try every subsequence",
  code: `function lengthOfLIS(nums)
    best ← 0
    for each subsequence s of nums  // 2ⁿ of them
        if s is strictly increasing
            best ← max(best, length(s))
    return best
`,
  run({ nums }, t) {
    const n = nums.length;
    let best = 0, tried = 0;
    t.step({ line: 2, array: [...nums], vars: { subsequences: 2 ** n },
      message: `A subsequence keeps some of the numbers in their original order. Each number is in or out, so there are 2^${n} = ${2 ** n} of them, ${2 ** n - 1} not counting the empty one. Check each for increasing, and keep the longest.` });
    for (let mask = 1; mask < 1 << n; mask++) {
      tried++;
      const idx = nums.map((_, i) => i).filter((i) => (mask >> i) & 1);
      let ok = true;
      for (let k = 1; k < idx.length; k++) { t.op(); if (nums[idx[k - 1]] >= nums[idx[k]]) { ok = false; break; } }
      if (idx.length === 1) t.op();
      if (ok && idx.length > best) {
        best = idx.length;
        t.step({ line: 5, array: [...nums], tones: Object.fromEntries(nums.map((_, i) => [i, (idx.includes(i) ? "found" : "discard") as Tone])), vars: { tried, best },
          message: `Subsequence ${tried}: ${idx.map((i) => nums[i]).join(", ")} is increasing, with ${best} number${best === 1 ? "" : "s"}. New longest.` });
      }
    }
    t.step({ line: 6, array: [...nums], vars: { tried, answer: best }, done: "found",
      message: `The longest increasing subsequence has ${best} numbers. But all ${tried} subsequences were checked: O(n · 2ⁿ), already over a billion at n = 30.` });
  },
};

const table: Approach<Input> = { id: "table", name: "Best run ending at each position", code: lisCode, run({ nums }, t) { lisSteps(t, nums); } };

const tails: Approach<Input> = {
  id: "tails",
  name: "Smallest ending for each length (binary search)",
  code: `function lengthOfLIS(nums)
    tails ← empty list
    for each x in nums
        k ← first index with tails[k] ≥ x
        if k = length(tails)
            tails.push(x)  // a longer run
        else
            tails[k] ← x  // a smaller ending
    return length(tails)
`,
  run({ nums }, t) {
    const tl: number[] = [];
    let asked = false;
    t.step({ line: 2, array: [], grid: { title: "nums", rows: [nums] }, vars: {},
      message: "Keep one list: tails[k] is the smallest number that an increasing run of length k + 1 can end with, so far. A smaller ending is better, because more numbers can follow it. The list is always increasing, so binary search finds where each number goes." });
    nums.forEach((x, i) => {
      let lo = 0, hi = tl.length;
      while (lo < hi) { t.op(); const mid = (lo + hi) >> 1; if (tl[mid] >= x) hi = mid; else lo = mid + 1; }
      if (!tl.length) t.op();
      const grow = lo === tl.length, old = tl[lo];
      const ask = !asked && tl.length > 1 ? (asked = true, { ask: { q: `tails is ${tl.join(", ")} and the next number is ${x}. What happens?`, options: grow ? [`Append ${x}`, `Replace ${tl[tl.length - 1]}`] : [`Replace ${old} with ${x}`, `Append ${x}`], answer: 0 } }) : {};
      if (grow) tl.push(x); else tl[lo] = x;
      t.step({ ...ask, line: grow ? 6 : 8, array: [...tl], pointers: { k: lo }, tones: { [lo]: grow ? "found" : "active" }, grid: { title: "nums", rows: [nums], tones: { [`0,${i}`]: "active" } }, vars: { x, k: lo, length: tl.length },
        message: grow && tl.length === 1 ? `tails is empty, so ${x} starts a run of length 1.` : grow ? `${x} is bigger than every ending in tails${tl.length > 1 ? ` (the last was ${tl[tl.length - 2]})` : ""}: it extends the longest run. Append it; runs of length ${tl.length} now exist.` : `${x} beats ending ${old} for runs of length ${lo + 1}: a run of that length can end with ${x} instead, which leaves more room. Replace ${old}.` });
    });
    t.step({ line: 9, array: [...tl], grid: { title: "nums", rows: [nums] }, vars: { answer: tl.length }, done: "found",
      message: `tails has ${tl.length} entries, so the longest increasing subsequence has ${tl.length} numbers. (tails itself needn't be one of them.) One binary search per number: O(n log n).` });
  },
};

export const approaches = { everySub, table, tails };

export const growth = measureGrowth(
  [{ approach: everySub, slot: 1 }, { approach: table, slot: 2 }, { approach: tails, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => (i * 7) % 11) }),
  [4, 8, 12, 16],
);
