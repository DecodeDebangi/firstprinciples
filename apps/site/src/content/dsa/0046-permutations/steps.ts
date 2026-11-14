import { CallTree, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [1, 2, 3] };

export const fields: InputField[] = [{ key: "nums", label: "nums (distinct)", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 3) return { error: "Use 1 to 3 numbers: 4 already gives 24 arrangements and a 65-call tree." };
  if (new Set(raw.nums).size !== raw.nums.length) return { error: "The numbers must be distinct." };
  return { input: raw };
}

const show = (p: number[]) => (p.length ? p.join(",") : "∅");

function resultGrid(perms: number[][], fresh = 0, title = "arrangements so far") {
  const cells = perms.map(show);
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(cells.slice(i, i + 3));
  const tones: Record<string, Tone> = {};
  for (let i = perms.length - fresh; i < perms.length; i++) tones[`${Math.floor(i / 3)},${i % 3}`] = "found";
  return { title: `${title} (${perms.length})`, rows: rows.length ? rows : [["—"]], tones };
}

const backtrack: Approach<Input> = {
  id: "backtrack",
  name: "Backtracking with a used list",
  code: `function permute(nums)
    result, path ← [], []
    used ← array of length(nums), all false
    function backtrack()
        if length(path) = length(nums)
            result.push(copy(path))  // all placed
            return
        for each index i, value x in nums
            if used[i]
                continue  // already placed
            used[i] ← true; path.push(x)  // choose
            backtrack()  // explore
            used[i] ← false; path.pop()  // undo
    backtrack()
    return result
`,
  run({ nums }, t) {
    const tree = new CallTree();
    const result: number[][] = [];
    const path: number[] = [];
    const used = nums.map(() => false);
    const label = new Map<string, string>();
    const go = (parent: string | null) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "∅");
      label.set(id, `[${path.join(", ")}]`);
      if (path.length === nums.length) {
        result.push([...path]);
        tree.log({ id, kind: "solution", line: 6, note: show(path), grid: resultGrid(result, 1), vars: { path: `[${path.join(", ")}]` },
          message: `The path [${path.join(", ")}] uses every number: record it.` });
        return;
      }
      const free = nums.filter((_, i) => !used[i]);
      const ask = path.length ? { q: `The path is [${path.join(", ")}]. Which numbers can go next?`, options: [...new Set([free.join(", "), nums.join(", "), nums.filter((_, i) => used[i]).join(", ")])], answer: 0 } : undefined;
      tree.log({ id, kind: "call", line: 8, vars: { path: `[${path.join(", ")}]`, unused: free.join(", ") }, ...(ask && ask.options.length > 1 ? { ask } : {}),
        message: path.length ? `Path [${path.join(", ")}]: try each number not used yet, ${free.join(", ")}, in the next position.` : `The first position can be any of ${free.join(", ")}: one branch each.` });
      nums.forEach((x, i) => {
        if (used[i]) return;
        used[i] = true; path.push(x);
        go(id);
        used[i] = false; path.pop();
      });
    };
    go(null);
    tree.replay(t, {
      intro: { line: 14, message: "Fill the positions one at a time. Each call tries every number not used yet, recurses, then undoes the choice (un-marks it) before trying the next. The faded tree shows every call.", grid: resultGrid([]), vars: { path: "[]" } },
      finish: () => ({ line: 15, message: `${result.length} = ${nums.length}! arrangements, one per leaf. There are n! leaves and each copies n items: O(n · n!) time; the recursion is n deep: O(n) extra space.`, grid: resultGrid(result), vars: { count: result.length }, done: "found" }),
      stackLabel: (id) => `path ${label.get(id)}`,
    });
  },
};

const insert: Approach<Input> = {
  id: "insert",
  name: "Iterative: insert into every gap",
  code: `function permute(nums)
    perms ← [[]]
    for each x in nums
        perms ← every p in perms with x inserted
            at each position 0 to length(p)
    return perms
`,
  run({ nums }, t) {
    let perms: number[][] = [[]];
    t.step({ line: 2, array: nums, grid: resultGrid(perms, 0, "arrangements"), vars: { count: 1 },
      message: "Start with one empty arrangement. Each new number is slotted into every gap of every arrangement so far." });
    nums.forEach((x, k) => {
      const before = perms.length;
      const gaps = (perms[0]?.length ?? 0) + 1;
      const ask = { q: `${before} arrangement${before === 1 ? "" : "s"} of ${k} number${k === 1 ? "" : "s"}, each with ${gaps} gap${gaps === 1 ? "" : "s"}. How many after inserting ${x}?`, options: [...new Set([String(before * gaps), String(before + gaps), String(before * 2)])], answer: 0 };
      const next: number[][] = [];
      for (const p of perms) for (let i = 0; i <= p.length; i++) { for (let c = 0; c <= p.length; c++) t.op(); next.push([...p.slice(0, i), x, ...p.slice(i)]); }
      perms = next;
      t.step({ ...(ask.options.length > 1 ? { ask } : {}), line: 4, array: nums, pointers: { x: k }, tones: { [k]: "active" }, grid: { ...resultGrid(perms, perms.length, "arrangements") }, vars: { x, count: perms.length },
        message: `Insert ${x} into each of the ${gaps} gap${gaps === 1 ? "" : "s"} of every arrangement: ${before} × ${gaps} = ${perms.length}.` });
    });
    t.step({ line: 6, array: nums, grid: resultGrid(perms, 0, "arrangements"), vars: { count: perms.length }, done: "found",
      message: `${perms.length} arrangements: 1 × 2 × … × n = n!. Each is built by copying up to n items: O(n · n!) time and space, the same as backtracking.` });
  },
};

export const approaches = { backtrack, insert };
