import { type Approach, type InputField, type Prepared, type Tone, type TreeNodeData } from "@firstprinciples/ui";
import { build, view, type Tree, type TreeInput } from "../54-tree-recursion/steps";

/** Trees from scratch: the parts of a tree, measuring height, and how a level-order list becomes a tree. */
export const treeFields: InputField[] = [{ key: "root", label: "tree (level order)", kind: "tree" }];
export function treePrepare(raw: TreeInput): Prepared<TreeInput> {
  if (!raw.root.length || raw.root[0] === null) return { error: "Start with a value for the root." };
  if (raw.root.filter((x) => x !== null).length > 15) return { error: "Use at most 15 values so the tree fits." };
  return { input: raw };
}
export const partsExample: TreeInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7] };
export const listExample: TreeInput = { root: [3, 9, 20, null, null, 15, 7] };

const all = (tr: Tree, id: string | null): string[] => (id ? [id, ...all(tr, tr.by.get(id)!.left), ...all(tr, tr.by.get(id)!.right)] : []);
const kids = (n: TreeNodeData) => [n.left, n.right].filter((x): x is string => !!x);
const v = (tr: Tree, id: string) => tr.by.get(id)!.val;
const tone = (ids: string[], t: Tone) => Object.fromEntries(ids.map((id) => [id, t]));
const names = (tr: Tree, ids: string[]) => ids.map((id) => v(tr, id)).join(", ");

/* ---------- The parts of a tree ---------- */
export const parts: Approach<TreeInput> = {
  id: "parts", name: "Meet the parts of a tree",
  code: `node  // one box in the tree
    val    // the value it holds
    left   // its left child, or none
    right  // its right child, or none
`,
  run({ root: vals }, t) {
    const tr = build(vals), root = tr.root!, r = tr.by.get(root)!, ids = all(tr, root);
    const leaves = ids.filter((id) => !kids(tr.by.get(id)!).length);
    const inner = ids.filter((id) => kids(tr.by.get(id)!).length);
    // A node two levels down with children, for the subtree and ancestor steps.
    const deep = ids.find((id) => id !== root && kids(tr.by.get(id)!).length) ?? root;
    const deepest = ids.reduce((a, b) => (depthOf(tr, b) > depthOf(tr, a) ? b : a), root);
    t.step({ line: 1, array: [], trees: view(tr), vars: { nodes: ids.length },
      message: `A tree is a set of nodes joined by links. Each node holds a value; here there are ${ids.length} nodes. Trees are drawn upside down: the top is where everything starts.` });
    t.op();
    t.step({ line: 1, array: [], trees: view(tr, { [root]: "found" }, { [root]: "root" }, root), vars: { root: r.val },
      message: `The node at the top is the root (${r.val}). It's the only node with nothing above it, and a program holds on to a tree by holding its root: every other node is reached by following links down from it.` });
    t.op();
    const rk = kids(r);
    t.step({ line: 3, array: [], trees: view(tr, { [root]: "active", ...tone(rk, "found") }, { [root]: "parent", ...Object.fromEntries(rk.map((id) => [id, "child"])) }), vars: { parent: r.val, children: names(tr, rk) },
      message: `The nodes one link below a node are its children, and it's their parent. ${r.val} has ${rk.length === 2 ? `two children, ${names(tr, rk).replace(", ", " and ")}` : rk.length ? `one child, ${names(tr, rk)}` : "no children here, so this tree is just the root"}. Every node except the root has exactly one parent, so there's exactly one way down to each node and no loops.` });
    t.op();
    t.step({ ...(inner.length && names(tr, leaves) !== names(tr, inner) ? { ask: { q: `Which nodes have no children at all?`, options: [names(tr, leaves), names(tr, inner)], answer: 0 } } : {}), line: 4, array: [], trees: view(tr, tone(leaves, "found"), Object.fromEntries(leaves.map((id) => [id, "leaf"]))), vars: { leaves: names(tr, leaves) },
      message: `Nodes with no children are leaves: ${names(tr, leaves)}. Both their left and right are none. ${inner.length ? `The others (${names(tr, inner)}) are sometimes called internal nodes.` : ""}` });
    t.op();
    const sub = all(tr, deep);
    t.step({ line: 2, array: [], trees: view(tr, { ...tone(sub, "side-a"), [deep]: "found" }, { [deep]: "subtree root" }, deep), vars: { subtree: names(tr, sub) },
      message: `A node together with everything below it is a subtree. The subtree at ${v(tr, deep)} is ${names(tr, sub)}. It's a whole tree on its own, with ${v(tr, deep)} as its root. That's why tree code can solve a problem for the whole tree by solving it for each subtree.` });
    t.op();
    const up: string[] = []; for (let p = parentOf(tr, deepest); p; p = parentOf(tr, p)) up.push(p);
    if (up.length) t.step({ line: 2, array: [], trees: view(tr, { ...tone(up, "compare"), [deepest]: "found" }, Object.fromEntries(up.map((id) => [id, "ancestor"]))), vars: { node: v(tr, deepest), ancestors: names(tr, up) },
      message: `Walking up from ${v(tr, deepest)} to the root passes its ancestors: ${names(tr, up)}. In the other direction, everything below a node is its descendants. The path from the root down to a node is always unique.` });
    t.op();
    const lv: Record<string, string> = {}; for (const id of ids) lv[id] = `level ${depthOf(tr, id)}`;
    const H = Math.max(...ids.map((id) => depthOf(tr, id)));
    t.step({ line: 1, array: [], trees: view(tr, {}, lv), vars: { levels: H }, done: "found",
      message: `Nodes the same number of links below the root form a level. The root is level 1, its children level 2, and so on. A node's level is also called its depth. This tree has ${H} level${H === 1 ? "" : "s"}, so its height is ${H}.` });
  },
};
function parentOf(tr: Tree, id: string): string | null { for (const n of tr.nodes) if (n.left === id || n.right === id) return n.id; return null; }
function depthOf(tr: Tree, id: string): number { let d = 1; for (let p = parentOf(tr, id); p; p = parentOf(tr, p)) d++; return d; }

/* ---------- Height, bottom-up ---------- */
export const height: Approach<TreeInput> = {
  id: "height", name: "Measure every node's height",
  code: `function height(node)
    if node = none
        return 0
    left ← height(node.left)
    right ← height(node.right)
    return 1 + max(left, right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let asked = 0;
    t.step({ line: 1, array: [], trees: view(tr), vars: {},
      message: "A node's height is the number of nodes on the longest path from it down to a leaf. A leaf has height 1 and a missing child has height 0. You can't know a node's height until you know its children's, so it's measured from the bottom up." });
    const go = (id: string | null): number => {
      t.op();
      if (!id) return 0;
      const n = tr.by.get(id)!;
      const l = go(n.left), r = go(n.right), h = 1 + Math.max(l, r);
      const q = asked < 2 && (n.left || n.right) ? (asked++, { ask: { q: `${n.val}'s children have heights ${l} and ${r}. What is ${n.val}'s height?`, options: [String(h), String(Math.max(l, r)), String(l + r + 1)].filter((x, i, a) => a.indexOf(x) === i), answer: 0 } }) : {};
      notes[id] = `h ${h}`;
      t.step({ ...q, line: 6, array: [], trees: view(tr, { ...tone(Object.keys(notes), "settled"), [id]: "found" }, notes, id), vars: { node: n.val, left: l, right: r, height: h },
        message: !n.left && !n.right ? `${n.val} is a leaf: both sides are 0, so its height is 1.` : `${n.val}: the left side is ${l} tall and the right side ${r}. One more than the taller side: ${h}.` });
      return h;
    };
    const h = go(tr.root);
    t.step({ line: 6, array: [], trees: view(tr, tone(Object.keys(notes), "settled"), notes), vars: { "tree height": h }, done: "found",
      message: `The root's height, ${h}, is the height of the whole tree: its number of levels. Many books count links instead of nodes, which gives one less (${h - 1}). Problems say which they mean.` });
  },
};

/* ---------- From a list to a tree ---------- */
export const fromList: Approach<TreeInput> = {
  id: "list", name: "Turn a level-order list into a tree",
  code: `function treeFromList(vals)  // null = no child
    root ← new node(vals[0])
    queue ← [root]
    i ← 1
    while i < length of vals
        p ← take from the front of queue
        if vals[i] ≠ null
            p.left ← new node(vals[i])
            add p.left to queue
        i ← i + 1
        if i < length of vals and vals[i] ≠ null
            p.right ← new node(vals[i])
            add p.right to queue
        i ← i + 1
    return root
`,
  run({ root: vals }, t) {
    const row = vals.map((x) => (x === null ? "null" : x));
    const nodes: TreeNodeData[] = [], by = new Map<string, TreeNodeData>();
    const make = (k: number) => { const n: TreeNodeData = { id: `t${k}`, val: vals[k] as number, left: null, right: null }; nodes.push(n); by.set(n.id, n); return n; };
    const snap = () => nodes.map((n) => ({ ...n }));
    const grid = (i: number, extra: Record<string, Tone> = {}) => ({ title: "the list", rows: [row], colLabels: row.map((_, k) => k), tones: { ...Object.fromEntries(row.map((_, k) => [`0,${k}`, (k < i ? "settled" : "idle") as Tone]).filter(([, x]) => x !== "idle")), ...extra } });
    t.step({ line: 1, array: [], grid: grid(0), trees: [{ root: null, nodes: [] }], vars: {},
      message: "Problems write a tree as one list, level by level, left to right. A null means \"no child here\". Read the list from the start and hand each value to the next empty child spot, filling the tree level by level." });
    const root = make(0), queue = [root.id];
    t.op();
    t.step({ line: 2, array: [], grid: grid(1, { "0,0": "found" }), trees: [{ root: root.id, nodes: snap(), tones: { [root.id]: "found" } }], stack: [String(root.val)], stackTitle: "queue (front last)", vars: { i: 0 },
      message: `The first value, ${root.val}, is the root. It goes in the queue: nodes wait there until their two children have been read.` });
    let i = 1, asked = 0;
    while (i < vals.length && queue.length) {
      const p = by.get(queue.shift()!)!;
      for (const side of ["left", "right"] as const) {
        if (i >= vals.length) break;
        t.op();
        const x = vals[i], made = x !== null ? make(i) : null;
        if (made) { p[side] = made.id; queue.push(made.id); }
        const q = asked < 3 && i >= 3 ? (asked++, { ask: { q: `The next value is ${x === null ? "null" : x}. What happens to ${p.val}'s ${side} spot?`, options: x === null ? [`It stays empty`, `It gets a node`] : [`${x} becomes ${p.val}'s ${side} child`, `It stays empty`], answer: 0 } }) : {};
        t.step({ ...q, line: side === "left" ? (made ? 8 : 7) : (made ? 12 : 11), array: [], grid: grid(i + 1, { [`0,${i}`]: made ? "found" : "discard" }), trees: [{ root: root.id, nodes: snap(), tones: { [p.id]: "active", ...(made ? { [made.id]: "found" } : {}) }, pointers: { [side === "left" ? "L" : "R"]: p.id } }],
          stack: queue.map((id) => String(by.get(id)!.val)).reverse(), stackTitle: "queue (front last)", vars: { i, parent: p.val, side },
          message: made ? `Position ${i} is ${x}: it becomes ${p.val}'s ${side} child, and joins the queue to get its own children later.` : `Position ${i} is null: ${p.val} has no ${side} child. Nothing joins the queue, so a missing node's children are never written in the list.` });
        i++;
      }
    }
    t.step({ line: 15, array: [], grid: grid(vals.length), trees: [{ root: root.id, nodes: snap(), tones: tone(nodes.map((n) => n.id), "settled") }], vars: { nodes: nodes.length }, done: "found",
      message: `The list has run out, so every remaining spot is empty. That's why lists usually stop at the last real value: the nulls after it would say nothing new.` });
  },
};
