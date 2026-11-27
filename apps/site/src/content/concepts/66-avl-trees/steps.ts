import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { bstError, inorderVals } from "../57-binary-search-trees/steps";
import { build } from "../54-tree-recursion/steps";

/**
 * AVL trees: a BST that stores each node's height and rotates whenever a node's two sides differ by 2. Used by the
 * read on rotations and by LeetCode 1382 (Balance a Binary Search Tree).
 */
export type InsertsInput = { vals: number[] };
export const insertsExample: InsertsInput = { vals: [10, 20, 30, 25, 28, 5, 3] };
export const insertsFields: InputField[] = [{ key: "vals", label: "insert, in this order", kind: "numbers" }];
export function insertsPrepare(raw: InsertsInput): Prepared<InsertsInput> {
  if (!raw.vals.length || raw.vals.length > 12) return { error: "Insert 1 to 12 values so the tree fits." };
  if (new Set(raw.vals).size !== raw.vals.length) return { error: "Use distinct values: a BST here holds each value once." };
  return { input: raw };
}
type T = Parameters<Approach<unknown>["run"]>[1];

/** A tree being built: nodes by id, plus each node's height. Snapshots keep each step's drawing fixed. */
class Shape {
  by = new Map<string, TreeNodeData>();
  h = new Map<string, number>();
  root: string | null = null;
  ht = (id: string | null) => (id ? this.h.get(id)! : 0);
  node = (id: string) => this.by.get(id)!;
  v = (id: string) => this.node(id).val as number;
  update(id: string) { const n = this.node(id); this.h.set(id, 1 + Math.max(this.ht(n.left), this.ht(n.right))); }
  bal = (id: string) => this.ht(this.node(id).left) - this.ht(this.node(id).right);
  view(tones: Record<string, Tone> = {}, ptrs: Record<string, string | null> = {}, showBal = false): TreeData[] {
    const notes = Object.fromEntries([...this.by.keys()].map((id) => [id, showBal ? `h${this.ht(id)} ${fmtBal(this.bal(id))}` : `h${this.ht(id)}`]));
    return [{ root: this.root, nodes: [...this.by.values()].map((n) => ({ ...n })), tones: { ...tones }, notes, pointers: ptrs }];
  }
  height = () => this.ht(this.root);
  /** Rotations: the child on the given side rises to the top of the subtree. Returns the new subtree root. */
  rotate(y: string, dir: "right" | "left"): string {
    const Y = this.node(y), up = dir === "right" ? "left" : "right", down = dir === "right" ? "right" : "left";
    const x = Y[up]!, X = this.node(x);
    Y[up] = X[down]; X[down] = y;
    this.update(y); this.update(x);
    return x;
  }
  setChild(parent: string | null, side: "left" | "right" | null, id: string | null) { if (!parent) this.root = id; else this.node(parent)[side!] = id; }
}
const fmtBal = (b: number) => (b > 0 ? `+${b}` : b < 0 ? `−${-b}` : "0");
const tone = (ids: string[], t: Tone) => Object.fromEntries(ids.map((id) => [id, t]));

/* ---------- Plain BST inserts, for comparison ---------- */
export const plainInserts: Approach<InsertsInput> = {
  id: "plain", name: "Plain BST inserts",
  code: `function insert(node, x)  // returns the new root
    if node = none
        return new node(x)
    if x < node.val
        node.left ← insert(node.left, x)
    else
        node.right ← insert(node.right, x)
    return node
`,
  run({ vals }, t) {
    const s = new Shape();
    if (t.record) t.step({ line: 1, array: [], grid: { title: "to insert", rows: [vals] }, trees: s.view(), vars: { height: 0 }, message: "Insert the values one at a time with the ordinary BST rule: smaller goes left, bigger goes right. Nothing ever changes the shape afterwards." });
    vals.forEach((x, k) => {
      const path: string[] = [];
      let id = s.root, parent: string | null = null, side: "left" | "right" | null = null;
      while (id) { t.op(); path.push(id); parent = id; side = x < s.v(id) ? "left" : "right"; id = s.node(id)[side]; }
      t.op();
      const nid = `a${x}`;
      s.by.set(nid, { id: nid, val: x, left: null, right: null }); s.h.set(nid, 1);
      s.setChild(parent, side, nid);
      for (let p = path.length - 1; p >= 0; p--) s.update(path[p]);
      if (t.record) t.step({ line: 3, array: [], grid: { title: "to insert", rows: [vals], tones: { [`0,${k}`]: "active", ...Object.fromEntries(vals.slice(0, k).map((_, j) => [`0,${j}`, "settled" as Tone])) } }, trees: s.view({ ...tone(path, "compare"), [nid]: "found" }, { new: nid }), vars: { inserted: x, "walked past": path.length, height: s.height() },
        message: `${x} walks past ${path.length} node${path.length === 1 ? "" : "s"} and lands at the bottom. Height ${s.height()}.` });
    });
    if (t.record) t.step({ line: 8, array: [], trees: s.view(), vars: { height: s.height(), values: vals.length }, done: s.height() > Math.ceil(Math.log2(vals.length + 1)) + 1 ? "notfound" : "found",
      message: `Height ${s.height()} for ${vals.length} values (the shortest possible is ${Math.ceil(Math.log2(vals.length + 1))}). The shape depends entirely on the order the values arrived in; sorted input gives a chain.` });
  },
};

/* ---------- AVL inserts ---------- */
export const avlCode = `function insert(node, x)  // returns the new root
    if node = none
        return new node(x)
    if x < node.val
        node.left ← insert(node.left, x)
    else
        node.right ← insert(node.right, x)
    update(node)  // height ← 1 + taller child
    b ← height(node.left) − height(node.right)
    if b > 1 and x < node.left.val  // left-left
        return rotateRight(node)
    if b < −1 and x > node.right.val  // right-right
        return rotateLeft(node)
    if b > 1  // left-right
        node.left ← rotateLeft(node.left)
        return rotateRight(node)
    if b < −1  // right-left
        node.right ← rotateRight(node.right)
        return rotateLeft(node)
    return node
function rotateRight(y)  // y's left child rises
    x ← y.left
    y.left ← x.right
    x.right ← y
    update(y)
    update(x)
    return x
// rotateLeft is the mirror image
`;
/** Inserts x into an AVL tree, recording steps if asked. Shared by the read and by LeetCode 1382. */
function avlInsert(s: Shape, x: number, t: T, rec: boolean, asked: { n: number }, extra: () => Record<string, unknown> = () => ({})) {
  const path: string[] = [], sides: ("left" | "right")[] = [];
  let id = s.root;
  while (id) { t.op(); path.push(id); const side = x < s.v(id) ? "left" : "right"; sides.push(side); id = s.node(id)[side]; }
  t.op();
  const nid = `a${x}`;
  s.by.set(nid, { id: nid, val: x, left: null, right: null }); s.h.set(nid, 1);
  s.setChild(path.length ? path[path.length - 1] : null, path.length ? sides[sides.length - 1] : null, nid);
  // Walk back up, updating heights, until a node's balance reaches ±2 (or the root is passed).
  let p = path.length - 1;
  for (; p >= 0; p--) { t.op(); s.update(path[p]); if (Math.abs(s.bal(path[p])) > 1) break; }
  if (rec) t.step({ ...extra(), line: p >= 0 ? 9 : 3, array: [], trees: s.view({ ...tone(path, "compare"), [nid]: "found" }, { new: nid }, true), vars: { inserted: x, height: s.height() },
    message: !path.length ? `${x} becomes the root.` : p < 0
      ? `${x} goes in at the bottom, as in any BST. Back up the path, heights are updated and every balance is still −1, 0 or +1: nothing to fix.`
      : `${x} goes in at the bottom, as in any BST. Walking back up, the heights grow until ${s.v(path[p])}, whose balance is now ${fmtBal(s.bal(path[p]))}.` });
  if (p >= 0) {
    const z = path[p];
    const b = s.bal(z);
    const parent = p > 0 ? path[p - 1] : null, pside = p > 0 ? sides[p - 1] : null;
    const childSide = b > 0 ? "left" : "right", c = s.node(z)[childSide]!;
    const straight = b > 0 ? x < s.v(c) : x > s.v(c);
    const kind = b > 0 ? (straight ? "left-left" : "left-right") : (straight ? "right-right" : "right-left");
    const fix = straight ? `rotate ${b > 0 ? "right" : "left"} at ${s.v(z)}` : `rotate ${b > 0 ? "left" : "right"} at ${s.v(c)}, then ${b > 0 ? "right" : "left"} at ${s.v(z)}`;
    const opts = [`Rotate ${b > 0 ? "right" : "left"} at ${s.v(z)}`, `Rotate ${b > 0 ? "left" : "right"} at ${s.v(c)}, then ${b > 0 ? "right" : "left"} at ${s.v(z)}`, "Nothing: it's still fine"];
    const ask = rec && asked.n < 3 ? (asked.n++, { ask: { q: `${s.v(z)} has balance ${fmtBal(b)}: its ${childSide} side is 2 taller, and ${x} went ${straight ? "the same way again" : "the other way"} below ${s.v(c)}. What fixes it?`, options: opts, answer: straight ? 0 : 1 } }) : {};
    if (rec) t.step({ ...extra(), ...ask, line: straight ? (b > 0 ? 10 : 12) : (b > 0 ? 14 : 17), array: [], trees: s.view({ [z]: "miss", [c]: "active", [nid]: "found" }, { z, child: c }, true), vars: { node: s.v(z), balance: fmtBal(b), case: kind },
      message: `${s.v(z)} is unbalanced: balance ${fmtBal(b)}. Its ${childSide} child is ${s.v(c)}, and ${x} went ${straight ? `${childSide} again below it: the ${kind} case. One rotation fixes it: ${fix}.` : `${childSide === "left" ? "right" : "left"} below it: the ${kind} case. A single rotation would just move the problem across, so first straighten the bend: ${fix}.`}` });
    let top = z;
    if (!straight) {
      const g = s.node(c)[childSide === "left" ? "right" : "left"]!;
      const nc = s.rotate(c, b > 0 ? "left" : "right");
      t.op();
      s.node(z)[childSide] = nc;
      if (rec) t.step({ ...extra(), line: b > 0 ? 15 : 18, array: [], trees: s.view({ [z]: "miss", [g]: "active", [c]: "side-b" }, { z }, true), vars: { node: s.v(z), case: kind },
        message: `Rotate ${b > 0 ? "left" : "right"} at ${s.v(c)}: ${s.v(g)} rises above it. Now the bend is straight, the ${b > 0 ? "left-left" : "right-right"} case.` });
    }
    top = s.rotate(z, b > 0 ? "right" : "left");
    t.op();
    s.setChild(parent, pside, top);
    if (rec) t.step({ ...extra(), line: straight ? (b > 0 ? 11 : 13) : (b > 0 ? 16 : 19), array: [], trees: s.view({ [top]: "found", [z]: "side-b" }, { top }, true), vars: { "new subtree root": s.v(top), height: s.height() },
      message: `Rotate ${b > 0 ? "right" : "left"} at ${s.v(z)}: ${s.v(top)} rises and ${s.v(z)} becomes its ${b > 0 ? "right" : "left"} child, while the order left to right is unchanged. This subtree is back to its height before the insert, so nothing above it needs fixing.` });
  }
}
export const avlInserts: Approach<InsertsInput> = {
  id: "avl", name: "AVL inserts: rotate when a side gets 2 taller",
  code: avlCode,
  run({ vals }, t) {
    const s = new Shape(), asked = { n: 0 };
    let k = 0;
    const g = () => ({ grid: { title: "to insert", rows: [vals], tones: { [`0,${k}`]: "active" as Tone, ...Object.fromEntries(vals.slice(0, k).map((_, j) => [`0,${j}`, "settled" as Tone])) } } });
    if (t.record) t.step({ line: 1, array: [], grid: { title: "to insert", rows: [vals] }, trees: s.view(), vars: { height: 0 },
      message: "An AVL tree inserts like any BST, then walks back up checking each node's balance: left height minus right height. Under each node: its height, then its balance. The rule is that every balance stays −1, 0 or +1." });
    for (; k < vals.length; k++) avlInsert(s, vals[k], t, t.record, asked, g);
    if (t.record) t.step({ line: 20, array: [], trees: s.view({}, {}, true), vars: { height: s.height(), values: vals.length }, done: "found",
      message: `Height ${s.height()} for ${vals.length} values (the shortest possible is ${Math.ceil(Math.log2(vals.length + 1))}). Each insert walks one path and does at most two rotations: O(log n), whatever order the values arrive in.` });
  },
};

/** n values in increasing order: the worst case for a plain BST. */
export const sortedInserts = (n: number): InsertsInput => ({ vals: Array.from({ length: n }, (_, i) => i + 1) });

/* ---------- Balance a BST (LeetCode 1382) ---------- */
export type BstInput = { root: (number | null)[] };
export const bstExample: BstInput = { root: [1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7] };
export const bstFields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }];
export function bstPrepare(raw: BstInput): Prepared<BstInput> {
  const e = bstError(raw.root, 12); if (e) return { error: e };
  if (raw.root.filter((x) => x !== null).length < 1) return { error: "Give at least one node." };
  return { input: raw };
}
const listVals = (raw: BstInput, t: T) => { const tr = build(raw.root); const v = inorderVals(tr); t.op(v.length); return { tr, v }; };
export const rebalanceAvl: Approach<BstInput> = {
  id: "avl", name: "Re-insert every value into an AVL tree",
  code: avlCode,
  run(raw, t) {
    const { tr, v } = listVals(raw, t), s = new Shape(), asked = { n: 0 };
    if (t.record) t.step({ line: 1, array: [], trees: [{ label: "given", root: tr.root, nodes: tr.nodes }], vars: { values: v.length },
      message: `One way: start an empty AVL tree and insert the ${v.length} values one by one. It rotates whenever a side gets 2 taller, so it ends balanced.` });
    for (const x of v) avlInsert(s, x, t, t.record, asked);
    if (t.record) t.step({ line: 20, array: [], trees: s.view({}, {}, true), vars: { height: s.height() }, done: "found",
      message: `Balanced, height ${s.height()}. But each of the n inserts walks a path of O(log n): O(n log n), and it needs the rotation code.` });
  },
};
export const rebalanceMiddle: Approach<BstInput> = {
  id: "middle", name: "List the values in order, rebuild from the middle",
  code: `function balanceBST(root)
    vals ← in-order values of root  // sorted
    return build(0, length(vals) − 1)
function build(lo, hi)
    if lo > hi
        return none
    mid ← floor((lo + hi) / 2)
    node ← new node(vals[mid])
    node.left ← build(lo, mid − 1)
    node.right ← build(mid + 1, hi)
    return node
`,
  run(raw, t) {
    const { tr, v } = listVals(raw, t), s = new Shape();
    let asked = 0;
    if (t.record) t.step({ line: 2, array: [], grid: { title: "in-order values", rows: [v] }, trees: [{ label: "given", root: tr.root, nodes: tr.nodes }], vars: { values: v.length },
      message: `A BST's in-order walk lists its values sorted. With the sorted list in hand, the middle value becomes the root, each half builds its side the same way, and the result is as short as possible.` });
    const go = (lo: number, hi: number, parent: string | null, side: "left" | "right" | null) => {
      t.op();
      if (lo > hi) return;
      const mid = Math.floor((lo + hi) / 2), id = `a${v[mid]}`;
      s.by.set(id, { id, val: v[mid], left: null, right: null }); s.h.set(id, 1);
      s.setChild(parent, side, id);
      const opts = [...new Set([v[mid], v[lo], v[hi]].map(String))];
      const ask = t.record && asked < 2 && opts.length > 1 ? (asked++, { ask: { q: `Building from ${v.slice(lo, hi + 1).join(", ")}: which value becomes this subtree's root?`, options: opts, answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 8, array: [], grid: { title: "in-order values", rows: [v], tones: Object.fromEntries(v.map((_, k) => [`0,${k}`, (k < lo || k > hi ? "discard" : k === mid ? "found" : "side-a") as Tone])) }, trees: [{ root: s.root, nodes: [...s.by.values()].map((n) => ({ ...n })), tones: { [id]: "found" } }], vars: { lo, hi, mid },
        message: `Positions ${lo} to ${hi}: the middle value ${v[mid]} becomes ${parent ? `${s.v(parent)}'s ${side} child` : "the root"}.` });
      go(lo, mid - 1, id, "left");
      go(mid + 1, hi, id, "right");
    };
    go(0, v.length - 1, null, null);
    const fix = (id: string | null): number => { if (!id) return 0; const h = 1 + Math.max(fix(s.node(id).left), fix(s.node(id).right)); s.h.set(id, h); return h; };
    fix(s.root);
    if (t.record) t.step({ line: 3, array: [], trees: s.view({}, {}, true), vars: { height: s.height() }, done: "found",
      message: `Balanced, height ${s.height()}. One walk to list the values and one node made per value: O(n), with no rotations.` });
  },
};
/** A chain of n values going right: the most unbalanced BST. */
export const rightChain = (n: number): BstInput => { const out: (number | null)[] = [1]; for (let i = 2; i <= n; i++) out.push(null, i); return { root: out }; };
