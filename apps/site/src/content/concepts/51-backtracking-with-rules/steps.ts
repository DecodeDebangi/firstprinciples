import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** Subsets of a list that may hold repeated values, each distinct subset once. */
export type Input = { nums: number[] };
export const example: Input = { nums: [2, 1, 2, 2] };
export const fields: InputField[] = [{ key: "nums", label: "nums (repeats allowed)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 5) return { error: "Use 1 to 5 numbers: 5 already gives a tree of 32 calls." };
  if (raw.nums.some((x) => !Number.isInteger(x) || Math.abs(x) > 99)) return { error: "Use whole numbers from -99 to 99." };
  return { input: raw };
}

export const show = (s: number[]) => (s.length ? s.join(",") : "∅");
/** Answers so far, four to a row, the newest one green. */
export function answersGrid(list: string[], title: string, fresh = false) {
  const rows: string[][] = [];
  for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));
  const tones: Record<string, Tone> = fresh && list.length ? { [`${Math.floor((list.length - 1) / 4)},${(list.length - 1) % 4}`]: "found" } : {};
  return { title: `${title} (${list.length})`, rows: rows.length ? rows : [["—"]], tones };
}

const dedupe: Approach<Input> = {
  id: "dedupe",
  name: "Build every subset, drop repeats",
  code: `function subsetsWithDup(nums)
    sort nums  // equal subsets now look equal
    seen, result, path ← empty set, [], []
    function backtrack(start)
        if path not in seen
            seen.add(copy(path))
            result.push(copy(path))
        for i ← start to length(nums) - 1
            path.push(nums[i])
            backtrack(i + 1)
            path.pop()
    backtrack(0)
    return result
`,
  run({ nums: raw }, t) {
    const nums = [...raw].sort((a, b) => a - b);
    const tree = new CallTree(), seen = new Set<string>(), result: string[] = [], path: number[] = [], label = new Map<string, string>();
    let dups = 0, asked = false;
    const go = (parent: string | null, start: number) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "∅");
      label.set(id, `[${path.join(", ")}]`);
      const k = show(path), dup = seen.has(k);
      const ask = !asked && dup ? (asked = true, { ask: { q: `The path is [${path.join(", ")}], and [${path.join(", ")}] is already in seen. What happens?`, options: ["It's skipped, but the call still runs its loop", "It's recorded a second time", "The whole search stops"], answer: 0 } }) : {};
      if (dup) dups++;
      else { seen.add(k); result.push(k); }
      tree.log({ id, kind: dup ? "prune" : "solution", line: dup ? 8 : 7, note: k, vars: { path: `[${path.join(", ")}]`, repeats: dups }, grid: answersGrid(result, "subsets", !dup), ...ask,
        message: dup ? (dups === 1 ? `[${path.join(", ")}] was already built along another branch: a repeat. It isn't recorded, but the call still tries every later number, so its whole subtree is repeats too.` : `[${path.join(", ")}] is a repeat too: not recorded.`) : `[${path.join(", ")}] is new: record it.` });
      for (let i = start; i < nums.length; i++) { path.push(nums[i]); go(id, i + 1); path.pop(); }
    };
    go(null, 0);
    tree.replay(t, {
      intro: { line: 2, message: `Sorted, the list is ${nums.join(", ")}. Run the plain subsets search, which treats the equal values as different, so it builds some subsets more than once. A set of seen subsets drops the repeats.`, grid: answersGrid([], "subsets"), vars: { nums: nums.join(", ") } },
      finish: () => ({ line: 13, message: `${result.length} distinct subsets, but the search made ${tree.nodes.length} calls: ${dups} of them only built a repeat. It always makes 2ⁿ calls, however many repeats there are.`, grid: answersGrid(result, "subsets"), vars: { calls: tree.nodes.length, repeats: dups }, done: "found" }),
      stackLabel: (id) => `path ${label.get(id)}`,
    });
  },
};

const skip: Approach<Input> = {
  id: "skip",
  name: "Sort, then skip equal values at the same depth",
  code: `function subsetsWithDup(nums)
    sort nums  // equal values side by side
    result, path ← [], []
    function backtrack(start)
        result.push(copy(path))
        for i ← start to length(nums) - 1
            if i > start and nums[i] = nums[i - 1]
                continue  // same value, same depth
            path.push(nums[i])
            backtrack(i + 1)
            path.pop()
    backtrack(0)
    return result
`,
  run({ nums: raw }, t) {
    const nums = [...raw].sort((a, b) => a - b);
    const tree = new CallTree(), result: string[] = [], path: number[] = [], label = new Map<string, string>();
    let skipped = 0, asked = false;
    const go = (parent: string | null, start: number) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "∅");
      label.set(id, `[${path.join(", ")}]`);
      result.push(show(path));
      const tried: number[] = [], cut: number[] = [];
      for (let i = start; i < nums.length; i++) (i > start && nums[i] === nums[i - 1] ? cut : tried).push(i);
      skipped += cut.length;
      const later = nums.slice(start);
      const opts = [tried.map((i) => nums[i]).join(", "), later.join(", ")].filter((o, i, a) => a.indexOf(o) === i);
      const ask = !asked && cut.length && opts.length > 1 ? (asked = true, { ask: { q: `This call can add any of ${later.join(", ")}. Which values does its loop actually try?`, options: opts, answer: 0 } }) : {};
      tree.log({ id, kind: "solution", line: 5, note: show(path), vars: { path: `[${path.join(", ")}]`, start, skipped }, grid: answersGrid(result, "subsets", true), ...ask,
        message: `Record [${path.join(", ")}].${later.length ? ` Its loop tries ${tried.map((i) => nums[i]).join(", ")}${cut.length ? `, and skips the repeated ${[...new Set(cut.map((i) => nums[i]))].join(" and ")}: an equal value at the same depth would only build the same subsets again` : ""}.` : " Nothing comes after it: return."}` });
      for (let i = start; i < nums.length; i++) { if (i > start && nums[i] === nums[i - 1]) continue; path.push(nums[i]); go(id, i + 1); path.pop(); }
    };
    go(null, 0);
    tree.replay(t, {
      intro: { line: 2, message: `Sorted, the list is ${nums.join(", ")}. Equal values now sit side by side. Within one call's loop, only the first of a run of equal values is tried; a later one would start exactly the same branches.`, grid: answersGrid([], "subsets"), vars: { nums: nums.join(", ") } },
      finish: () => ({ line: 13, message: `${result.length} distinct subsets from ${tree.nodes.length} calls: every call is a new answer, and the ${skipped} skipped branch${skipped === 1 ? "" : "es"} were never started.`, grid: answersGrid(result, "subsets"), vars: { calls: tree.nodes.length, skipped }, done: "found" }),
      stackLabel: (id) => `path ${label.get(id)}`,
    });
  },
};

export const approaches = { dedupe, skip };

/** n copies of the same value: 2ⁿ calls without the rule, n + 1 with it. */
export const growth = measureGrowth(
  [{ approach: dedupe, slot: 1 }, { approach: skip, slot: 3 }],
  (n) => ({ nums: Array(n).fill(1) }),
  [2, 4, 6, 8, 10],
);
