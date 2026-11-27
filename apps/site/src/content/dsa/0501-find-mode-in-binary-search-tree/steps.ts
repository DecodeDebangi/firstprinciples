import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { num, viewOf } from "../../concepts/57-binary-search-trees/steps";

/** Here a BST may repeat values: everything on a node's left is ≤ it, everything on its right is ≥ it. */
export type Input = { root: (number | null)[] };
export const example: Input = { root: [5, 3, 7, 3, 5, null, 7, null, null, null, null, null, 7] };
export const fields: InputField[] = [{ key: "root", label: "BST, repeats allowed (level order)", kind: "tree" }];
export function prepare(raw: Input): Prepared<Input> {
  const real = raw.root.filter((x) => x !== null);
  if (!real.length || raw.root[0] === null) return { error: "Give at least one node." };
  if (real.length > 15) return { error: "Use at most 15 nodes so the tree fits." };
  const tr = build(raw.root);
  const ok = (id: string | null, lo: number, hi: number): boolean => { if (!id) return true; const n = tr.by.get(id)!, v = num(n); return lo <= v && v <= hi && ok(n.left, lo, v) && ok(n.right, v, hi); };
  if (!ok(tr.root, -Infinity, Infinity)) return { error: "That isn't a binary search tree: every left subtree must hold values ≤ the node, and every right subtree values ≥ it." };
  return { input: raw };
}
const list = (a: number[]) => `[${a.join(", ")}]`;

const counting: Approach<Input> = {
  id: "count", name: "Count every value in a map",
  code: `function findMode(root)
    count ← empty map
    for each node in the tree
        count[node.val] ← (count[node.val] or 0) + 1
    most ← largest value in count
    return every key k with count[k] = most
`,
  run({ root: vals }, t) {
    const tr = build(vals), count = new Map<number, number>(), seen: string[] = [];
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: {}, message: "The general way, for any tree: count how often each value appears, then return the values with the highest count." });
    const order: string[] = []; const walk = (id: string | null) => { if (!id) return; order.push(id); walk(tr.by.get(id)!.left); walk(tr.by.get(id)!.right); }; walk(tr.root);
    for (const id of order) {
      t.op(); const v = num(tr.by.get(id)!); count.set(v, (count.get(v) ?? 0) + 1); seen.push(id);
      t.step({ line: 4, array: [], trees: viewOf(tr, { ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), [id]: "found" }, { node: id }), map: { title: "count", entries: [...count.entries()].sort((a, b) => a[0] - b[0]).map(([k, c]) => [String(k), String(c)] as [string, string]), highlight: String(v) }, vars: { node: v },
        message: `${v} has now been seen ${count.get(v)} time${count.get(v) === 1 ? "" : "s"}.` });
    }
    const most = Math.max(...count.values()); t.op(count.size);
    const out = [...count.entries()].filter(([, c]) => c === most).map(([k]) => k).sort((a, b) => a - b);
    t.step({ line: 6, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.filter((n) => out.includes(num(n))).map((n) => [n.id, "found" as Tone]))), map: { title: "count", entries: [...count.entries()].sort((a, b) => a[0] - b[0]).map(([k, c]) => [String(k), String(c)] as [string, string]) }, vars: { most, out: list(out) }, done: "found",
      message: `The highest count is ${most}: ${list(out)}. O(n) time, but the map holds every distinct value: O(n) extra memory, and it never used the order.` });
  },
};

const inorder: Approach<Input> = {
  id: "inorder", name: "In-order walk with a running count",
  code: `function findMode(root)
    prev, run, most, out ← none, 0, 0, []
    visit(root)
    return out
function visit(node)  // in-order: equal values meet
    if node = none
        return
    visit(node.left)
    run ← run + 1 if node.val = prev, else 1
    prev ← node.val
    if run > most
        most, out ← run, [node.val]
    else if run = most
        out.push(node.val)
    visit(node.right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), seen: string[] = [];
    let prev: number | null = null, run = 0, most = 0, out: number[] = [], asked = 0;
    t.step({ line: 3, array: [], trees: viewOf(tr), vars: { prev: "none", run: 0, most: 0, out: "[]" },
      message: "An in-order walk visits the values in sorted order, so equal values come one right after another. Count the current run of equal values, and compare it with the longest run so far. No map needed." });
    const go = (id: string | null) => {
      if (!id) return;
      const n = tr.by.get(id)!;
      go(n.left);
      t.op();
      const v = num(n), same = v === prev;
      run = same ? run + 1 : 1;
      const was = most;
      const ask = asked < 2 && run > 1 ? (asked++, { ask: { q: `${v} again: the run is now ${run}, and the longest run so far is ${was}. What happens to out?`, options: run > was ? [`It becomes [${v}]`, `${v} is added to it`, "Nothing changes"] : run === was ? [`${v} is added to it`, `It becomes [${v}]`, "Nothing changes"] : ["Nothing changes", `It becomes [${v}]`, `${v} is added to it`], answer: 0 } }) : {};
      if (run > most) { most = run; out = [v]; } else if (run === most) out.push(v);
      prev = v; seen.push(id);
      t.step({ ...ask, line: run > was ? 12 : run === was ? 14 : 10, array: [], trees: viewOf(tr, { ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), [id]: "found" }, { node: id }), vars: { node: v, run, most, out: list(out) },
        message: `${v}${same ? `, the same as the one before: the run grows to ${run}` : `: a new value, so the run starts at 1`}.${run > was ? ` That beats the longest run (${was}), so out is just [${v}].` : run === was ? ` That ties the longest run, so add ${v} to out.` : ""}` });
      go(n.right);
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.filter((n) => out.includes(num(n))).map((n) => [n.id, "found" as Tone]))), vars: { most, out: list(out) }, done: "found",
      message: `${list(out)}, appearing ${most} time${most === 1 ? "" : "s"}. One walk, O(n) time, and only a few variables besides the recursion: O(h) memory.` });
  },
};

export const approaches = { count: counting, inorder };
