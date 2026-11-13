import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [7, 5, 2, 2, 7, 2, 2] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  const counts = new Map<number, number>();
  for (const x of raw.nums) counts.set(x, (counts.get(x) ?? 0) + 1);
  if (![...counts.values()].some((c) => c > raw.nums.length / 2))
    return { error: "This problem promises a majority: one value must appear more than half the time." };
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force: count each value",
  code: `def majority_element(nums):
    n = len(nums)
    for x in nums:
        count = 0
        for y in nums:
            if y == x:
                count += 1
        if count > n // 2:
            return x
`,
  run({ nums: a }, t) {
    const n = a.length, half = Math.floor(n / 2);
    t.step({ line: 2, array: a, vars: { x: null, count: null, need: `> ${half}` }, message: `For each value, count how often it appears in the whole list. The majority appears more than ${half} times.` });
    for (let i = 0; i < n; i++) {
      t.op(n);
      const x = a[i];
      const count = a.filter((y) => y === x).length;
      const tones: Record<number, Tone> = Object.fromEntries(a.map((y, k) => [k, y === x ? "compare" : "discard"] as const));
      if (count > half) {
        t.step({ line: 9, array: a, pointers: { x: i }, tones: Object.fromEntries(a.map((y, k) => [k, y === x ? "found" : "discard"] as const)), badge: { at: i, text: `${count} > ${half} ✓` },
          vars: { x, count, need: `> ${half}` }, done: "found", message: `${x} appears ${count} times, more than ${half}. Return ${x}.` });
        return;
      }
      t.step({ line: 8, array: a, pointers: { x: i }, tones: { ...tones, [i]: "active" }, badge: { at: i, text: `${count} times` }, vars: { x, count, need: `> ${half}` },
        message: `${x} appears ${count} time${count > 1 ? "s" : ""}: not a majority. That took a full pass of ${n} reads.` });
    }
  },
};

const counting: Approach<Input> = {
  id: "hash",
  name: "Hash map of counts",
  code: `def majority_element(nums):
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
        if counts[x] > len(nums) // 2:
            return x
`,
  run({ nums: a }, t) {
    const n = a.length, half = Math.floor(n / 2);
    const counts = new Map<number, number>();
    const map = (hl?: number) => ({ title: "counts (value → times seen)", entries: [...counts].map(([v, c]) => [String(v), String(c)] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 2, array: a, map: map(), vars: { need: `> ${half}` }, message: "One pass, keeping a count per value. Stop the moment one passes half." });
    for (let i = 0; i < n; i++) {
      t.op();
      const x = a[i];
      counts.set(x, (counts.get(x) ?? 0) + 1);
      const c = counts.get(x)!;
      if (c > half) {
        t.step({ line: 6, array: a, pointers: { i }, tones: { [i]: "found" }, badge: { at: i, text: `${x}: ${c} > ${half} ✓` }, map: map(x), vars: { need: `> ${half}` }, done: "found",
          message: `${x} has now appeared ${c} times, more than ${half}. Return ${x}.` });
        return;
      }
      t.step({ line: 4, array: a, pointers: { i }, tones: { [i]: "compare" }, badge: { at: i, text: `${x}: ${c}` }, map: map(x), vars: { need: `> ${half}` },
        message: `Count ${x}: ${c} so far.` });
    }
  },
};

const voting: Approach<Input> = {
  id: "vote",
  name: "Boyer–Moore voting",
  code: `def majority_element(nums):
    candidate, count = None, 0
    for x in nums:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    return candidate
`,
  run({ nums: a }, t) {
    let candidate: number | null = null, count = 0;
    t.step({ line: 2, array: a, vars: { candidate: "None", count }, message: "Pair each majority value off against a different value. The majority has more copies than everything else combined, so it's the one left standing." });
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      t.op();
      const opts = ["count is 0: x becomes the candidate", "x matches the candidate: count goes up", "x differs: count goes down"];
      const ask = { q: `candidate = ${candidate ?? "None"}, count = ${count}, x = ${x}. What happens?`, options: opts, answer: count === 0 ? 0 : x === candidate ? 1 : 2 };
      let what: string;
      let tone: Tone;
      if (count === 0) { candidate = x; count = 1; what = `count was 0, so ${x} becomes the candidate with count 1.`; tone = "active"; }
      else if (x === candidate) { count++; what = `${x} supports the candidate: count up to ${count}.`; tone = "found"; }
      else { count--; what = `${x} cancels one vote for ${candidate}: count down to ${count}.`; tone = "miss"; }
      t.step({ ask, line: 6, array: a, pointers: { i }, tones: { [i]: tone }, badge: { at: i, text: `${candidate}: ${count}` }, vars: { candidate, count }, message: what });
    }
    t.step({ line: 7, array: a, tones: Object.fromEntries(a.map((y, k) => [k, y === candidate ? "found" : "discard"] as const)), vars: { candidate, count }, done: "found",
      message: `${candidate} survives every cancellation. It's the majority, found with two variables and one pass.` });
  },
};

export const approaches = { brute: bruteForce, hash: counting, vote: voting };

/** Worst case for the brute force: the minority comes first, so every one of them is counted in full. */
const worstCase = (n: number): Input => {
  const k = Math.floor((n - 1) / 2);
  return { nums: [...Array.from({ length: k }, (_, i) => i + 100), ...Array(n - k).fill(7)] };
};

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    // The hash map does exactly as many steps as voting here, so its line would hide under it.
    { approach: voting, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
