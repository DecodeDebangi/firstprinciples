import { measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

export type Input = { preorder: number[] };
export const example: Input = { preorder: [8, 5, 1, 7, 10, 12] };
export const fields: InputField[] = [{ key: "preorder", label: "preorder", kind: "numbers" }];
/** Inserting in the given order builds the only BST that could have this pre-order; check it really does. */
function insertAll(pre: number[]) {
  const nodes: TreeNodeData[] = [], by = new Map<string, TreeNodeData>(); let root: string | null = null;
  for (const x of pre) { const n: TreeNodeData = { id: `t${x}`, val: x, left: null, right: null }; nodes.push(n); by.set(n.id, n); if (!root) { root = n.id; continue; } let c = root; for (;;) { const s = x < (by.get(c)!.val as number) ? "left" : "right"; const nx = by.get(c)![s]; if (!nx) { by.get(c)![s] = n.id; break; } c = nx; } }
  const out: number[] = []; const w = (id: string | null) => { if (!id) return; out.push(by.get(id)!.val as number); w(by.get(id)!.left); w(by.get(id)!.right); }; w(root);
  return out;
}
export function prepare(raw: Input): Prepared<Input> {
  const p = raw.preorder;
  if (!p.length || p.length > 12) return { error: "Use 1 to 12 values so the tree fits." };
  if (new Set(p).size !== p.length) return { error: "Use distinct values." };
  if (insertAll(p).join() !== p.join()) return { error: "That isn't the pre-order of any binary search tree: after a node, all its smaller values must come before its bigger ones." };
  return { input: raw };
}
class Grow {
  nodes: TreeNodeData[] = []; by = new Map<string, TreeNodeData>(); root: string | null = null;
  view(tones: Record<string, Tone> = {}, ptrs: Record<string, string | null> = {}): TreeData[] { return [{ root: this.root, nodes: this.nodes.map((n) => ({ ...n })), tones, pointers: ptrs }]; }
  make(v: number) { const n: TreeNodeData = { id: `t${v}`, val: v, left: null, right: null }; this.nodes.push(n); this.by.set(n.id, n); return n.id; }
}
const row = (p: number[], i: number, extra: Record<string, Tone> = {}) => ({ title: "preorder", rows: [p], tones: { ...Object.fromEntries(p.slice(0, i).map((_, k) => [`0,${k}`, "settled" as Tone])), ...extra } });

const inserts: Approach<Input> = {
  id: "insert", name: "Insert the values one by one",
  code: `function bstFromPreorder(pre)
    root ← none
    for each x in pre
        root ← insert(root, x)  // walk down, attach
    return root
`,
  run({ preorder: p }, t) {
    const g = new Grow();
    if (t.record) t.step({ line: 2, array: [], grid: row(p, 0), trees: g.view(), vars: {}, message: "Pre-order lists every node before anything below it. So inserting the values in that order into a BST puts each one exactly where it was." });
    p.forEach((x, k) => {
      const id = g.make(x), path: string[] = [];
      if (!g.root) g.root = id;
      else { let c = g.root; for (;;) { t.op(); path.push(c); const s = x < (g.by.get(c)!.val as number) ? "left" : "right"; const nx = g.by.get(c)![s]; if (!nx) { g.by.get(c)![s] = id; break; } c = nx; } }
      t.op();
      if (t.record) t.step({ line: 4, array: [], grid: row(p, k, { [`0,${k}`]: "active" }), trees: g.view({ ...Object.fromEntries(path.map((c) => [c, "compare" as Tone])), [id]: "found" }), vars: { x, "walked past": path.length },
        message: k === 0 ? `${x} comes first in pre-order: it's the root.` : `Insert ${x}: walk down past ${path.length} node${path.length === 1 ? "" : "s"} to the empty spot.` });
    });
    if (t.record) t.step({ line: 5, array: [], grid: row(p, p.length), trees: g.view(Object.fromEntries(g.nodes.map((n) => [n.id, "settled" as Tone]))), vars: { nodes: p.length }, done: "found",
      message: "Done. Each insert walks from the root, so a tall tree (like an increasing pre-order, which is a chain) makes this O(n²)." });
  },
};

const bounds: Approach<Input> = {
  id: "bounds", name: "One pass, with an upper bound",
  code: `function bstFromPreorder(pre)
    i ← 0
    return build(infinity)
function build(bound)  // takes values below bound
    if i = length(pre) or pre[i] > bound
        return none
    node ← new node(pre[i])
    i ← i + 1
    node.left ← build(node.val)
    node.right ← build(bound)
    return node
`,
  run({ preorder: p }, t) {
    const g = new Grow();
    let i = 0, asked = 0;
    if (t.record) t.step({ line: 3, array: [], grid: row(p, 0), trees: g.view(), vars: { i: 0 },
      message: "Read the list once, front to back. Each call builds a subtree from the next values, as long as they're below its bound: a left subtree takes values below its parent, a right subtree values below its parent's own bound." });
    const go = (bound: number, parent: string | null, side: "left" | "right" | null): string | null => {
      t.op();
      if (i === p.length) return null;
      if (p[i] > bound) {
        if (t.record && parent) t.step({ line: 6, array: [], grid: row(p, i, { [`0,${i}`]: "compare" }), trees: g.view({ [parent]: "active" }, { here: parent }), vars: { i, next: p[i], bound: bound === Infinity ? "∞" : bound },
          message: `${p[i]} is bigger than ${bound}, so it can't go in ${g.by.get(parent)!.val}'s ${side} subtree: that side stays empty.` });
        return null;
      }
      const ask = t.record && asked < 2 && parent ? (asked++, { ask: { q: `The next value is ${p[i]}, and the bound here is ${bound === Infinity ? "∞" : bound}. Does it become ${g.by.get(parent)!.val}'s ${side} child?`, options: ["Yes: it's below the bound", "No: that side stays empty"], answer: 0 } }) : {};
      const id = g.make(p[i]);
      if (!parent) g.root = id; else g.by.get(parent)![side!] = id;
      if (t.record) t.step({ ...ask, line: 7, array: [], grid: row(p, i, { [`0,${i}`]: "found" }), trees: g.view({ [id]: "found" }), vars: { i, bound: bound === Infinity ? "∞" : bound },
        message: parent ? `${p[i]} is below ${bound === Infinity ? "∞" : bound}: it becomes ${g.by.get(parent)!.val}'s ${side} child. Its own left subtree may only take values below ${p[i]}.` : `${p[i]} comes first: it's the root. Its left subtree takes values below ${p[i]}, its right subtree everything else.` });
      i++;
      go(p[i - 1], id, "left");
      go(bound, id, "right");
      return id;
    };
    go(Infinity, null, null);
    if (t.record) t.step({ line: 11, array: [], grid: row(p, p.length), trees: g.view(Object.fromEntries(g.nodes.map((n) => [n.id, "settled" as Tone]))), vars: { nodes: p.length }, done: "found",
      message: "Done in one pass: each value was read once and placed without walking down from the root. O(n)." });
  },
};

export const approaches = { insert: inserts, bounds };
/** An increasing pre-order: a chain, the worst case for inserting one by one. */
export const growth = measureGrowth(
  [{ approach: inserts, slot: 1 }, { approach: bounds, slot: 3 }],
  (n) => ({ preorder: Array.from({ length: n }, (_, k) => k + 1) }),
  [8, 16, 32, 64, 128, 256],
);
