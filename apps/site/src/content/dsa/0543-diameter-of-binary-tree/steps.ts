import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { build, isLeaf, treeFields, treePrepare, view, type TreeInput, type Tree } from "../../concepts/54-tree-recursion/steps";

export type Input = TreeInput;
export const example: Input = { root: [6, 3, 9, 1, 4, null, null, 0, null, null, 5, 2, null, null, 7] };
export const fields = treeFields;
export const prepare = treePrepare;
/** Nodes of the subtree under id, in pre-order. */
export const under = (tr: Tree, id: string | null): string[] => (id ? [id, ...under(tr, tr.by.get(id)!.left), ...under(tr, tr.by.get(id)!.right)] : []);
/** The longest path through id: down its left side and down its right side, as node ids. */
function pathThrough(tr: Tree, id: string) {
  const deepest = (x: string | null): string[] => { if (!x) return []; const n = tr.by.get(x)!; const a = deepest(n.left), b = deepest(n.right); return [x, ...(a.length >= b.length ? a : b)]; };
  const n = tr.by.get(id)!;
  return [...deepest(n.left), id, ...deepest(n.right)];
}

const everyNode: Approach<Input> = {
  id: "everyNode",
  name: "Measure both heights at every node",
  code: `function diameterOfBinaryTree(root)
    best ← 0
    for each node in the tree
        l, r ← height(node.left), height(node.right)
        best ← max(best, l + r)
    return best
function height(node)  // counts nodes: a leaf is 1
    if node = none
        return 0
    l, r ← height(node.left), height(node.right)
    return 1 + max(l, r)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    const h = (id: string | null): number => { if (!id) return 0; t.op(); const n = tr.by.get(id)!; return 1 + Math.max(h(n.left), h(n.right)); };
    let best = 0, bestAt = tr.root!;
    t.step({ line: 2, array: [], trees: view(tr), vars: { best },
      message: "The longest path between two nodes bends at one highest node. Through a node, it can go down the left side as far as the left subtree is tall, and down the right as far as the right is tall. So try every node as the bend, measuring both heights from scratch." });
    for (const id of under(tr, tr.root)) {
      const n = tr.by.get(id)!;
      const l = h(n.left), r = h(n.right);
      const through = l + r;
      if (through > best) { best = through; bestAt = id; }
      notes[id] = `${through}`;
      const scanned = [...under(tr, n.left), ...under(tr, n.right)];
      t.step({ line: 5, array: [], trees: view(tr, { ...Object.fromEntries(scanned.map((x) => [x, "compare" as Tone])), [id]: "active" }, notes, id), vars: { node: n.val, left: l, right: r, best },
        message: `Through ${n.val}: left height ${l} + right height ${r} = ${through}. ${scanned.length ? `Measuring them walked all ${scanned.length} nodes below (blue).` : "No children."}` });
    }
    const path = pathThrough(tr, bestAt);
    t.step({ line: 6, array: [], trees: view(tr, Object.fromEntries(path.map((x) => [x, "found" as Tone])), notes), vars: { diameter: best }, done: "found",
      message: `The longest path has ${best} edges, bending at ${tr.by.get(bestAt)!.val}. But a node deep in the tree was measured again by every one of its ancestors: O(n²) for a tree shaped like a chain.` });
  },
};

const once: Approach<Input> = {
  id: "once",
  name: "Return the height, track the best",
  code: `function diameterOfBinaryTree(root)
    best ← 0
    function height(node)
        if node = none
            return 0
        left ← height(node.left)
        right ← height(node.right)
        best ← max(best, left + right)  // bend here
        return 1 + max(left, right)
    height(root)
    return best
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, stack: string[] = [];
    let best = 0, bestAt = tr.root!, asked = false;
    const done = () => Object.fromEntries(Object.keys(notes).map((x) => [x, "settled" as Tone]));
    t.step({ line: 2, array: [], trees: view(tr), stack: [], vars: { best },
      message: "Every call already computes its two subtree heights to return its own height. So while they're at hand, check the path bending here, left + right, against the best so far." });
    const go = (id: string | null): number => {
      if (!id) return 0;
      const n = tr.by.get(id)!;
      stack.push(`height(${n.val})`);
      const l = go(n.left), r = go(n.right);
      t.op();
      const before = best;
      if (l + r > best) { best = l + r; bestAt = id; }
      const ret = 1 + Math.max(l, r);
      notes[id] = `h${ret}`;
      const opts = [...new Set([ret, l + r, Math.max(l, r)].map(String))];
      const ask = !asked && n.left && n.right && opts.length > 1 ? (asked = true, { ask: { q: `At ${n.val}: left height ${l}, right height ${r}. What does it return to its parent?`, options: opts, answer: 0 } }) : {};
      t.step({ ...ask, line: best > before ? 8 : 9, array: [], trees: view(tr, { ...done(), [id]: "found" }, notes, id), stack: [...stack], vars: { node: n.val, left: l, right: r, best },
        message: isLeaf(n) ? `${n.val} is a leaf: height 1, and a path bending here has 0 edges.` : `At ${n.val}: a path bending here has ${l} + ${r} = ${l + r} edge${l + r === 1 ? "" : "s"}${best > before ? `, a new best` : `, not more than ${best}`}. Return height 1 + max(${l}, ${r}) = ${ret}.` });
      stack.pop();
      return ret;
    };
    go(tr.root);
    const path = pathThrough(tr, bestAt);
    t.step({ line: 11, array: [], trees: view(tr, Object.fromEntries(path.map((x) => [x, "found" as Tone])), notes), stack: [], vars: { diameter: best }, done: "found",
      message: `The longest path has ${best} edges, bending at ${tr.by.get(bestAt)!.val}${bestAt === tr.root ? "" : ", not the root"}. Each node was visited once: O(n) time, O(h) for the recursion.` });
  },
};

export const approaches = { everyNode, once };

/** A chain leaning left: every ancestor re-measures everything below it. */
export const chain = (n: number): Input => ({ root: Array.from({ length: n }, (_, i) => [i + 1, null]).flat().slice(0, 2 * n - 1) as (number | null)[] });
export const growth = measureGrowth(
  [{ approach: everyNode, slot: 1 }, { approach: once, slot: 3 }],
  chain,
  [4, 8, 16, 32, 64],
);
