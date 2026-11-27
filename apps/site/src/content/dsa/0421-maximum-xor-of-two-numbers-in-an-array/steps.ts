import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { BitTrie, bestSteps, bitRows, widthFor } from "../../concepts/70-binary-tries/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [3, 10, 5, 12, 9] };
export const fields: InputField[] = [{ key: "nums", label: "nums (0 to 31)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2 || raw.nums.length > 6) return { error: "Use 2 to 6 numbers so the trie fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 31)) return { error: "Use whole numbers from 0 to 31." };
  return { input: raw };
}

const pairs: Approach<Input> = {
  id: "pairs", name: "Try every pair",
  code: `function findMaximumXOR(nums)
    best ← 0
    for i from 0 to length(nums) − 1
        for j from i + 1 to length(nums) − 1
            best ← max(best, nums[i] xor nums[j])
    return best
`,
  run({ nums }, t) {
    let best = 0, at: [number, number] = [0, 0];
    if (t.record) t.step({ line: 2, array: nums, vars: { best }, message: "XOR every pair and keep the largest." });
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) { t.op(); if ((nums[i] ^ nums[j]) > best) { best = nums[i] ^ nums[j]; at = [i, j]; } }
      if (t.record && i < nums.length - 1) t.step({ line: 5, array: nums, tones: { ...Object.fromEntries(nums.flatMap((_, j): [number, Tone][] => (j > i ? [[j, "compare"]] : []))), [i]: "active" }, vars: { i, best, pair: `${nums[at[0]]} xor ${nums[at[1]]}` },
        message: `${nums[i]} against the ${nums.length - 1 - i} number${nums.length - 1 - i === 1 ? "" : "s"} after it. Best so far: ${nums[at[0]]} xor ${nums[at[1]]} = ${best}.` });
    }
    if (t.record) t.step({ line: 6, array: nums, tones: { [at[0]]: "found", [at[1]]: "found" }, vars: { answer: best }, done: "found", message: `${best}, from ${nums[at[0]]} xor ${nums[at[1]]}. Every pair: O(n²).` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A binary trie: the best partner for each number",
  code: `function findMaximumXOR(nums)
    B ← bits in the largest number
    insert every x in nums, B bits, highest first
    best ← 0
    for each x in nums
        node, xor ← root, 0
        for b from B − 1 down to 0
            bit ← (x >> b) & 1
            if node has child 1 − bit
                node ← node.child[1 − bit]
                xor ← xor + 2^b
            else
                node ← node.child[bit]
        best ← max(best, xor)
    return best
`,
  run({ nums }, t) {
    const B = widthFor(nums), tr = new BitTrie(B);
    nums.forEach((x) => { tr.add(x); t.op(B); });
    let best = 0, pair = "";
    if (t.record) t.step({ line: 3, array: [], grid: bitRows(nums, B), trees: tr.bview(), vars: { B }, message: `Store every number's ${B} bits in a binary trie. Then, for each number, walk down choosing the opposite bit whenever it exists: that finds its best partner in ${B} steps.` });
    nums.forEach((x, k) => {
      // The first number's walk is shown bit by bit, so the choice at each level is visible; the rest in one step each.
      const r = k === 0 ? bestSteps(tr, x, t, { take: 11, keep: 13 }, () => ({ grid: bitRows(nums, B) }), true) : (() => { const q = tr.best(x, t); return { partner: q.partner, xor: q.xor, path: q.path }; })();
      const newBest = r.xor > best;
      if (newBest) { best = r.xor; pair = `${x} xor ${r.partner}`; }
      if (t.record) t.step({ line: 14, array: [], grid: bitRows(nums, B), trees: tr.bview(Object.fromEntries(r.path.map((p) => [p, "found" as Tone]))), vars: { x, partner: r.partner, xor: r.xor, best },
        message: `${x}'s best partner is ${r.partner}: ${x} xor ${r.partner} = ${r.xor}.${newBest ? " A new best." : ` Not more than ${best}.`}` });
    });
    if (t.record) t.step({ line: 15, array: [], grid: bitRows(nums, B), trees: tr.bview(), vars: { answer: best }, done: "found", message: `${best}, from ${pair}. Each number takes B steps: O(n · B), with B ≤ 31 for 32-bit numbers.` });
  },
};

export const approaches = { pairs, trie };
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, k) => (k * 37) % 1024) }),
  [8, 16, 32, 64, 128, 256],
);
