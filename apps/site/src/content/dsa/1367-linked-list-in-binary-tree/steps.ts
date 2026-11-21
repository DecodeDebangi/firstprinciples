import { treeFromLevelOrder, type Approach, type InputField, type ListRow, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

export type Input = { list: number[]; tree: (number | null)[] };
type P = Input;
export const example: Input = { list: [3, 4, 8], tree: [5, 3, 3, 4, null, 4, null, 2, null, 2, 8] };
export const fields: InputField[] = [
  { key: "list", label: "list", kind: "numbers" },
  { key: "tree", label: "tree (level order)", kind: "tree" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.list.length === 0) return { error: "Give the list at least one value." };
  if (raw.list.length > 5) return { error: "Keep the list to at most 5 nodes." };
  if (!raw.tree.length || raw.tree[0] === null) return { error: "Give the tree at least one node." };
  if (raw.tree.filter((x) => x !== null).length > 12) return { error: "Keep the tree to at most 12 nodes so it fits." };
  return { input: raw };
}

const END = { id: "end", val: "none", kind: "null" as const };
function setup({ list, tree }: P) {
  const T = treeFromLevelOrder(tree);
  const byId = new Map(T.nodes.map((n) => [n.id, n]));
  const listRow = (at: number | null, tones: Record<number, Tone> = {}): ListRow => ({
    label: "list", nodes: [...list.map((v, i) => ({ id: `l${i}`, val: v })), END], arrows: list.map(() => "right" as const),
    pointers: at === null ? {} : { node: at >= list.length ? "end" : `l${at}` }, tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`l${i}`, tn])),
  });
  const treeView = (tones: Record<string, Tone> = {}, pointers: Record<string, string | null> = {}): TreeData[] => [{ root: T.root, nodes: T.nodes, tones, pointers }];
  return { T, byId, listRow, treeView };
}

const paths: Approach<P> = {
  id: "paths",
  name: "Search every root-to-leaf path",
  code: `function isSubPath(head, root)
    target ← the list's values, in order
    for each root-to-leaf path in the tree
        values ← the values along that path
        if target appears in values as a run
            return true
    return false
`,
  run(input, t) {
    const g = setup(input);
    const { list } = input;
    const all: TreeNodeData[][] = [];
    const go = (id: string | null, path: TreeNodeData[]) => {
      if (!id) return;
      const n = g.byId.get(id)!; const p = [...path, n];
      if (!n.left && !n.right) { all.push(p); return; }
      go(n.left, p); go(n.right, p);
    };
    go(g.T.root, []);
    t.step({ line: 2, array: [], trees: g.treeView(), lists: [g.listRow(null)], vars: {},
      message: `A downward path is a chain of nodes where each is a child of the one before. Does the list's run of values, ${list.join(", ")}, appear along one? The direct way: write out every path from the root to a leaf and search each one.` });
    for (const p of all) {
      const vals = p.map((n) => n.val as number);
      t.op(p.length);
      let at = -1;
      for (let s = 0; s + list.length <= vals.length && at < 0; s++) { let ok = true; for (let k = 0; k < list.length; k++) { t.op(); if (vals[s + k] !== list[k]) { ok = false; break; } } if (ok) at = s; }
      const tones: Record<string, Tone> = Object.fromEntries(p.map((n, j) => [n.id, (at >= 0 && j >= at && j < at + list.length ? "found" : "active") as Tone]));
      t.step({ line: at >= 0 ? 6 : 5, array: [], trees: g.treeView(tones), lists: [g.listRow(null, at >= 0 ? Object.fromEntries(list.map((_, i) => [i, "found" as Tone])) : {})], vars: { path: vals.join(" → ") }, done: at >= 0 ? "found" : undefined,
        message: at >= 0 ? `This path reads ${vals.join(", ")}, and ${list.join(", ")} appears in it as a run. Return true.` : `This path reads ${vals.join(", ")}. ${list.join(", ")} doesn't appear in it as a run.` });
      if (at >= 0) return;
    }
    t.step({ line: 7, array: [], trees: g.treeView(), lists: [g.listRow(null)], vars: {}, done: "notfound",
      message: `No path contains ${list.join(", ")}: return false. Writing out every path copies the nodes near the root again and again: up to O(n · h) values for a tree of height h.` });
  },
};

const tryEach: Approach<P> = {
  id: "try-each",
  name: "Try a match from every node (optimal)",
  code: `function isSubPath(head, root)
    if root = none then return false
    if matchFrom(head, root) then return true
    return isSubPath(head, root.left)
        or isSubPath(head, root.right)

function matchFrom(node, t)
    if node = none then return true  // all matched
    if t = none or t.val ≠ node.val
        return false
    return matchFrom(node.next, t.left)
        or matchFrom(node.next, t.right)
`,
  run(input, t) {
    const g = setup(input);
    const { list } = input;
    const tried = new Set<string>();
    let asked = false;
    const base = () => Object.fromEntries([...tried].map((id) => [id, "visited" as Tone]));
    t.step({ line: 2, array: [], trees: g.treeView(), lists: [g.listRow(0)], vars: {},
      message: `Visit every tree node as a possible starting point. From each, matchFrom walks down the tree and along the list together, and gives up at the first value that differs. No paths are copied.` });
    /** Returns true if the list from index k matches downward from tree node id; `path` is the matched chain so far. */
    const match = (start: string, k: number, id: string | null, path: string[]): boolean => {
      if (k === list.length) {
        t.step({ line: 8, array: [], trees: g.treeView({ ...base(), ...Object.fromEntries(path.map((x) => [x, "found" as Tone])) }, { start }), lists: [g.listRow(k, Object.fromEntries(list.map((_, i) => [i, "found" as Tone])))], vars: {},
          message: `node is none: every value of the list matched, along ${path.map((x) => g.byId.get(x)!.val).join(" → ")}.` });
        return true;
      }
      t.op();
      const n = id ? g.byId.get(id)! : null;
      if (!n || n.val !== list[k]) {
        if (k > 0) t.step({ line: 11, array: [], trees: g.treeView({ ...base(), ...Object.fromEntries(path.map((x) => [x, "active" as Tone])), ...(n ? { [n.id]: "miss" as Tone } : {}) }, { start, t: id }), lists: [g.listRow(k, { ...Object.fromEntries(Array.from({ length: k }, (_, i) => [i, "active" as Tone])), [k]: "miss" })], vars: {},
          message: n ? `The ${n.val} ≠ ${list[k]}: this branch fails.` : `No child here, but the list still needs ${list[k]}: this branch fails.` });
        return false;
      }
      const next = [...path, n.id];
      if (k > 0) t.step({ line: 11, array: [], trees: g.treeView({ ...base(), ...Object.fromEntries(next.map((x) => [x, "active" as Tone])) }, { start, t: n.id }), lists: [g.listRow(k, Object.fromEntries(Array.from({ length: k + 1 }, (_, i) => [i, "active" as Tone])))], vars: {},
        message: `The ${n.val} matches the list's ${list[k]} too. Keep going: try both children for the next value${k + 1 < list.length ? `, ${list[k + 1]}` : ""}.` });
      return match(start, k + 1, n.left, next) || match(start, k + 1, n.right, next);
    };
    const visit = (id: string | null): boolean => {
      if (!id) return false;
      const n = g.byId.get(id)!;
      t.op();
      const first = n.val === list[0];
      const ask = first && !asked && list.length > 1 ? (asked = true, { ask: { q: `The ${n.val} matches the list's first value. What does matchFrom check next?`, options: [`Whether a child of the ${n.val} holds ${list[1]}`, `Whether the ${n.val}'s parent holds ${list[1]}`, "Nothing: one match is enough"], answer: 0 } }) : {};
      t.step({ ...ask, line: 3, array: [], trees: g.treeView({ ...base(), [n.id]: first ? "active" : "compare" }, { start: n.id }), lists: [g.listRow(0, first ? { 0: "active" } : { 0: "miss" })], vars: {},
        message: first ? `Start at the ${n.val}: it matches the list's first value, ${list[0]}. Follow it down.` : `Start at the ${n.val}: it isn't ${list[0]}, so this start fails straight away.` });
      if (first && match(n.id, 1, n.left, [n.id]) || first && match(n.id, 1, n.right, [n.id])) return true;
      tried.add(n.id);
      return visit(n.left) || visit(n.right);
    };
    if (visit(g.T.root)) {
      t.step({ line: 3, array: [], trees: g.treeView({ ...base() }), lists: [g.listRow(null, Object.fromEntries(list.map((_, i) => [i, "settled" as Tone])))], vars: {}, done: "found",
        message: `Found: return true. Each start can walk up to m nodes down, and there are n starts: O(n · m) in the worst case, but most starts fail on the first value. The recursion uses O(h) stack space.` });
      return;
    }
    t.step({ line: 2, array: [], trees: g.treeView(base()), lists: [g.listRow(null)], vars: {}, done: "notfound",
      message: `Every node was tried as a start, and none matched the whole list: return false. O(n · m) in the worst case, O(h) stack space.` });
  },
};

export const approaches = { paths, tryEach };
