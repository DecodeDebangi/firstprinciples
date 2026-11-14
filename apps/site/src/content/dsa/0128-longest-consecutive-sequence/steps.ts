import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [10, 4, 20, 1, 3, 2, 11] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

const sortScan: Approach<Input> = {
  id: "sort",
  name: "Sort, then count runs",
  code: `function longestConsecutive(nums)
    if nums is empty
        return 0
    nums ← unique values of nums, sorted
    best ← 1, run ← 1
    for i ← 1 to length(nums) - 1
        if nums[i] = nums[i - 1] + 1
            run += 1
        else
            run ← 1
        best ← max(best, run)
    return best
`,
  run({ nums }, t) {
    const n = nums.length;
    t.step({ line: 4, array: nums, vars: { run: null, best: null }, message: "Sort the distinct values; consecutive numbers then sit side by side." });
    const a = [...new Set(nums)].sort((x, y) => x - y);
    t.op(n + Math.ceil(a.length * Math.log2(Math.max(a.length, 2))));
    let run = 1, best = 1, start = 0, bs = 0, be = 0;
    t.step({ line: 5, array: a, range: [0, 0], vars: { run, best }, message: `Sorted: [${a.join(", ")}]. Walk once, extending the run while each number is one more than the last.` });
    for (let i = 1; i < a.length; i++) {
      t.op();
      const cont = a[i] === a[i - 1] + 1;
      if (cont) run++; else { run = 1; start = i; }
      if (run > best) { best = run; bs = start; be = i; }
      t.step({ ask: { q: `${a[i - 1]} then ${a[i]}. Does the run continue?`, options: ["Yes: it's one more", "No: start a new run"], answer: cont ? 0 : 1 },
        line: cont ? 8 : 10, array: a, pointers: { i }, range: [start, i], tones: { [i]: cont ? "compare" : "active" }, badge: { at: i, text: `run ${run}` }, vars: { run, best },
        message: cont ? `${a[i]} = ${a[i - 1]} + 1: the run grows to ${run}.` : `${a[i]} isn't ${a[i - 1]} + 1: a new run starts.` });
    }
    t.step({ line: 12, array: a, range: [bs, be], tones: Object.fromEntries(Array.from({ length: be - bs + 1 }, (_, k) => [bs + k, "found" as Tone])), vars: { run, best }, done: "found",
      message: `Longest run: ${a.slice(bs, be + 1).join(", ")}, length ${best}.` });
  },
};

const hashSet: Approach<Input> = {
  id: "set",
  name: "Hash set: count only from run starts",
  code: `function longestConsecutive(nums)
    seen ← set of nums
    best ← 0
    for each x in seen
        if x - 1 not in seen
            run ← 1
            while x + run in seen
                run += 1
            best ← max(best, run)
    return best
`,
  run({ nums: a }, t) {
    const seen = new Set(a);
    t.op(a.length);
    const idx = new Map<number, number>();
    a.forEach((v, k) => { if (!idx.has(v)) idx.set(v, k); });
    let best = 0;
    const done = new Set<number>();
    t.step({ line: 2, array: a, vars: { best }, message: "Put everything in a set for O(1) lookups. Only a number with no x − 1 starts a run, so count upward only from those." });
    for (const x of [...seen]) {
      t.op();
      const k = idx.get(x)!;
      const isStart = !seen.has(x - 1);
      const ask = { q: `x = ${x}. Is ${x - 1} in the set?`, options: ["Yes: x isn't a start, skip it", "No: x starts a run, count upward"], answer: isStart ? 1 : 0 };
      if (!isStart) {
        t.step({ ask, line: 5, array: a, pointers: { x: k }, tones: { [k]: "discard", ...(idx.has(x - 1) ? { [idx.get(x - 1)!]: "compare" } : {}) }, badge: { at: k, text: `${x - 1} exists` },
          vars: { best }, message: `${x - 1} is in the set, so ${x} is in the middle of some run. Skip it; that run is counted from its start.` });
        continue;
      }
      let length = 1;
      while (seen.has(x + length)) { t.op(); length++; }
      t.op();
      const members = Array.from({ length }, (_, d) => idx.get(x + d)!);
      const better = length > best;
      best = Math.max(best, length);
      members.forEach((m) => done.add(m));
      t.step({ ask, line: 9, array: a, pointers: { x: k }, tones: Object.fromEntries(members.map((m) => [m, better ? "found" : "compare"] as const)),
        badge: { at: k, text: `run ${length}` }, vars: { best },
        message: `${x} starts a run: ${Array.from({ length }, (_, d) => x + d).join(", ")}. Length ${length}${better ? ", the best so far" : ""}.` });
    }
    t.step({ line: 10, array: a, vars: { best }, done: "found", message: `Longest run: ${best}. Each number was looked up a constant number of times, so this is O(n).` });
  },
};

export const approaches = { sort: sortScan, set: hashSet };

/** Shuffled consecutive numbers: one long run, the worst case for both. */
const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => (i * 37) % n) });

export const growth = measureGrowth(
  [
    { approach: sortScan, slot: 1 },
    { approach: hashSet, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
