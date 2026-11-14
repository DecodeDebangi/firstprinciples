import { CallTree, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [1, 2, 3] };

export const fields: InputField[] = [{ key: "nums", label: "nums (distinct)", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 4) return { error: "Use 1 to 4 numbers: 4 already gives 16 subsets." };
  if (new Set(raw.nums).size !== raw.nums.length) return { error: "The numbers must be distinct." };
  return { input: raw };
}

const show = (s: number[]) => (s.length ? s.join(",") : "∅");

/** Subsets found so far, four to a row. */
function resultGrid(subsets: number[][], fresh = 0) {
  const cells = subsets.map(show);
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
  const tones: Record<string, Tone> = {};
  for (let i = subsets.length - fresh; i < subsets.length; i++) tones[`${Math.floor(i / 4)},${i % 4}`] = "found";
  return { title: `subsets so far (${subsets.length})`, rows: rows.length ? rows : [["—"]], tones };
}

const iterative: Approach<Input> = {
  id: "iterative",
  name: "Iterative: copy and add",
  code: `function subsets(nums)
  result ← [[]]
  for each x in nums
    add a copy of each s in result, plus x
  return result
`,
  run({ nums }, t) {
    const result: number[][] = [[]];
    t.step({ line: 2, array: nums, grid: resultGrid(result, 1), vars: { count: 1 },
      message: "Start with one subset: the empty one. Each number then decides, for every subset so far, \"with me or without me\"." });
    nums.forEach((x, i) => {
      const before = result.length;
      const ask = { q: `There are ${before} subsets so far. How many will there be after adding ${x}?`, options: [...new Set([String(2 * before), String(before + 1), String(before + nums.length)])], answer: 0 };
      for (let j = 0; j < before; j++) {
        for (let c = 0; c <= result[j].length; c++) t.op(); // copying a subset costs its length, plus the new item
        result.push([...result[j], x]);
      }
      t.step({ ...(ask.options.length > 1 ? { ask } : {}), line: 4, array: nums, pointers: { x: i }, tones: { [i]: "active" }, grid: resultGrid(result, before), vars: { x, count: result.length },
        message: `Copy each of the ${before} subsets and add ${x} to the copy. The old ones are the subsets without ${x}; the new ones are those with it. ${before} → ${result.length}.` });
    });
    t.step({ line: 5, array: nums, grid: resultGrid(result), vars: { count: result.length }, done: "found",
      message: `${result.length} = 2^${nums.length} subsets: each number doubles the count. Building them copies up to n items each: O(n · 2ⁿ) time and space.` });
  },
};

const backtrack: Approach<Input> = {
  id: "backtrack",
  name: "Backtracking: choose, explore, undo",
  code: `function subsets(nums)
  result, path ← [], []
  function backtrack(start)
    result.push(copy(path))  // always a subset
    for i ← start to length(nums) - 1
      path.push(nums[i])  // choose
      backtrack(i + 1)  // explore
      path.pop()  // undo
  backtrack(0)
  return result
`,
  run({ nums }, t) {
    const tree = new CallTree();
    const result: number[][] = [];
    const path: number[] = [];
    const label = new Map<string, string>();
    const go = (parent: string | null, start: number) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "∅");
      label.set(id, `[${path.join(", ")}]`);
      result.push([...path]);
      const later = nums.slice(start);
      const ask = later.length && start > 0
        ? { q: `This call has path [${path.join(", ")}] and starts at index ${start}. Which numbers can it add next?`, options: [...new Set([later.join(", "), nums.join(", "), nums.slice(0, start).join(", ")])], answer: 0 }
        : undefined;
      tree.log({ id, kind: "solution", line: 4, note: show(path), grid: resultGrid(result, 1), vars: { path: `[${path.join(", ")}]`, start },
        ...(ask && ask.options.length > 1 ? { ask } : {}),
        message: `Record [${path.join(", ")}] as a subset.${later.length ? ` Then try adding each later number, ${later.join(", ")}, one at a time. Only later ones, so the same subset is never built in two orders.` : " No numbers come after it, so return."}` });
      for (let i = start; i < nums.length; i++) {
        path.push(nums[i]);
        go(id, i + 1);
        path.pop();
      }
    };
    go(null, 0);
    tree.replay(t, {
      intro: { line: 9, message: "Each call records its path as a subset, then extends it with each later number, one at a time, undoing each choice before trying the next. The faded tree shows every call.", grid: resultGrid([]), vars: { path: "[]" } },
      finish: () => ({ line: 10, message: `${result.length} subsets, one per call. Every call copies a path of up to n items: O(n · 2ⁿ) time; the recursion is only n deep: O(n) extra space.`, grid: resultGrid(result), vars: { count: result.length }, done: "found" }),
      stackLabel: (id) => `path ${label.get(id)}`,
    });
  },
};

export const approaches = { iterative, backtrack };
