import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { build, type Tree } from "../54-tree-recursion/steps";

/* ---------- Shared helpers for binary search tree pages ---------- */

export const snap = (nodes: TreeNodeData[]) => nodes.map((n) => ({ ...n }));
export const num = (n: TreeNodeData) => n.val as number;
/** Every node id in the subtree under `id`. */
export const subtree = (tr: Tree, id: string | null): string[] => (id ? [id, ...subtree(tr, tr.by.get(id)!.left), ...subtree(tr, tr.by.get(id)!.right)] : []);
export const viewOf = (tr: Tree, tones: Record<string, Tone> = {}, ptrs: Record<string, string | null> = {}, notes: Record<string, string> = {}): TreeData[] =>
  [{ root: tr.root, nodes: snap(tr.nodes), tones: { ...tones }, pointers: { ...ptrs }, notes: { ...notes } }];
/** Values in order: left subtree, node, right subtree. */
export const inorderVals = (tr: Tree, id: string | null = tr.root): number[] => (id ? [...inorderVals(tr, tr.by.get(id)!.left), num(tr.by.get(id)!), ...inorderVals(tr, tr.by.get(id)!.right)] : []);

/** Why a level-order list isn't a usable BST here, or null if it is. */
export function bstError(vals: (number | null)[], maxNodes = 15): string | null {
  const real = vals.filter((v) => v !== null);
  if (!real.length || vals[0] === null) return "Give at least one node.";
  if (real.length > maxNodes) return `Use at most ${maxNodes} nodes so the tree fits.`;
  if (real.some((v) => !Number.isInteger(v))) return "Use whole numbers.";
  const tr = build(vals);
  const ok = (id: string | null, lo: number, hi: number): boolean => {
    if (!id) return true;
    const n = tr.by.get(id)!, v = num(n);
    return lo < v && v < hi && ok(n.left, lo, v) && ok(n.right, v, hi);
  };
  if (!ok(tr.root, -Infinity, Infinity)) return "That isn't a binary search tree: every left subtree must hold smaller values and every right subtree bigger ones, with no repeats.";
  return null;
}

/** A balanced BST of the values 1..n (middle as root), written in level order. */
export function balancedLevelOrder(n: number, vals: number[] = Array.from({ length: n }, (_, i) => (i + 1) * 2)): (number | null)[] {
  type N = { v: number; l: N | null; r: N | null };
  const mk = (lo: number, hi: number): N | null => { if (lo > hi) return null; const m = Math.floor((lo + hi) / 2); return { v: vals[m], l: mk(lo, m - 1), r: mk(m + 1, hi) }; };
  const out: (number | null)[] = [], q: (N | null)[] = [mk(0, vals.length - 1)];
  while (q.length) { const x = q.shift()!; out.push(x ? x.v : null); if (x) q.push(x.l, x.r); }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

const dir = (target: number, at: number) => (target < at ? "left" : "right");
const sizeWord = (k: number) => `${k} node${k === 1 ? "" : "s"}`;

/* ---------- Search ---------- */
export type SearchInput = { root: (number | null)[]; val: number };
export const searchExample: SearchInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], val: 7 };
export const searchFields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }, { key: "val", label: "find", kind: "number" }];
export function searchPrepare(raw: SearchInput): Prepared<SearchInput> {
  const e = bstError(raw.root); if (e) return { error: e };
  if (!Number.isInteger(raw.val)) return { error: "Look for a whole number." };
  return { input: raw };
}

export const search: Approach<SearchInput> = {
  id: "follow",
  name: "Follow the order: one path down",
  code: `function searchBST(root, val)
    node ← root
    while node ≠ none and node.val ≠ val
        if val < node.val
            node ← node.left
        else
            node ← node.right
    return node
`,
  run({ root: vals, val }, t) {
    const tr = build(vals);
    const tones: Record<string, Tone> = {};
    let id = tr.root, asked = 0, ruled = 0;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { val, node: tr.root ? num(tr.by.get(tr.root)!) : "none" },
      message: `Look for ${val}. Everything left of a node is smaller and everything right of it is bigger, so each comparison picks one side and rules out the other.` });
    while (id) {
      const n = tr.by.get(id)!, v = num(n);
      t.op();
      if (v === val) {
        t.step({ line: 8, array: [], trees: viewOf(tr, { ...tones, [id]: "found" }, { node: id }), vars: { val, node: v, "nodes ruled out": ruled }, done: "found",
          message: `Found ${val}, after looking at ${Object.keys(tones).filter((k) => tones[k] === "visited").length + 1} of ${tr.nodes.length} nodes. A search only walks one path: O(h), where h is the tree's height.` });
        return;
      }
      const d = dir(val, v), next = d === "left" ? n.left : n.right, other = d === "left" ? n.right : n.left;
      const q = asked < 2 ? (asked++, { ask: { q: `Looking for ${val}, and this node holds ${v}. Which way?`, options: [`Left: ${val} < ${v}`, `Right: ${val} > ${v}`], answer: val < v ? 0 : 1 } }) : {};
      tones[id] = "visited";
      const out = subtree(tr, other);
      out.forEach((k) => (tones[k] = "discard"));
      ruled += out.length;
      t.step({ ...q, line: d === "left" ? 5 : 7, array: [], trees: viewOf(tr, { ...tones, ...(next ? { [next]: "compare" } : {}) }, { node: next }), vars: { val, node: next ? num(tr.by.get(next)!) : "none", "nodes ruled out": ruled },
        message: `${val} ${val < v ? "<" : ">"} ${v}, so it can only be on the ${d}.${out.length ? ` The ${sizeWord(out.length)} on the ${d === "left" ? "right" : "left"} ${out.length === 1 ? "is" : "are"} ruled out without a look.` : ""}${next ? "" : ` There's nothing on the ${d}.`}` });
      id = next;
    }
    t.step({ line: 8, array: [], trees: viewOf(tr, tones), vars: { val, node: "none" }, done: "notfound",
      message: `The path ran out: ${val} isn't in the tree. Return none. Still only one path walked: O(h).` });
  },
};

/* ---------- Insert ---------- */
export type InsertInput = { root: (number | null)[]; val: number };
export const insertExample: InsertInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], val: 5 };
export const insertFields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }, { key: "val", label: "insert", kind: "number" }];
export function insertPrepare(raw: InsertInput): Prepared<InsertInput> {
  const e = bstError(raw.root, 14); if (e) return { error: e };
  if (!Number.isInteger(raw.val)) return { error: "Insert a whole number." };
  if (raw.root.includes(raw.val)) return { error: `${raw.val} is already in the tree; insert a new value.` };
  return { input: raw };
}

/** Walks down to the empty spot and attaches a new node, recording a step per level. Shared by both insert versions. */
function insertWalk(tr: Tree, val: number, t: Parameters<Approach<InsertInput>["run"]>[1], lines: { left: number; right: number; attach: (side: "left" | "right" | "root") => number }) {
  const tones: Record<string, Tone> = {};
  let id = tr.root, parent: string | null = null, asked = 0;
  while (id) {
    const n = tr.by.get(id)!, v = num(n);
    t.op();
    const d = dir(val, v), next = d === "left" ? n.left : n.right;
    const q = asked < 2 ? (asked++, { ask: { q: `Inserting ${val}, at ${v}. Which way?`, options: [`Left: ${val} < ${v}`, `Right: ${val} > ${v}`], answer: val < v ? 0 : 1 } }) : {};
    tones[id] = "visited";
    t.step({ ...q, line: d === "left" ? lines.left : lines.right, array: [], trees: viewOf(tr, { ...tones, ...(next ? { [next]: "compare" } : {}) }, { node: next ?? id }), vars: { val, at: v },
      message: `${val} ${val < v ? "<" : ">"} ${v}: go ${d}.${next ? "" : ` ${v} has no ${d} child: that empty spot is where ${val} belongs.`}` });
    parent = id; id = next;
  }
  const nid = `n${tr.nodes.length}-${val}`;
  const node: TreeNodeData = { id: nid, val, left: null, right: null };
  tr.nodes.push(node); tr.by.set(nid, node);
  if (!parent) tr.root = nid;
  else if (val < num(tr.by.get(parent)!)) tr.by.get(parent)!.left = nid; else tr.by.get(parent)!.right = nid;
  const side = !parent ? "root" : val < num(tr.by.get(parent)!) ? "left" : "right";
  t.step({ line: lines.attach(side), array: [], trees: viewOf(tr, { ...tones, [nid]: "found" }, { node: nid }), vars: { val, parent: parent ? num(tr.by.get(parent)!) : "none" },
    message: parent ? `Attach ${val} as ${num(tr.by.get(parent)!)}'s ${val < num(tr.by.get(parent)!) ? "left" : "right"} child. Nothing else moves: the new node is always a leaf.` : `The tree was empty, so ${val} becomes the root.` });
}

export const insertRecursive: Approach<InsertInput> = {
  id: "recursive",
  name: "Recursive: go down to the empty spot",
  code: `function insertIntoBST(root, val)
    if root = none
        return new node(val)
    if val < root.val
        root.left ← insertIntoBST(root.left, val)
    else
        root.right ← insertIntoBST(root.right, val)
    return root
`,
  run({ root: vals, val }, t) {
    const tr = build(vals);
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { val },
      message: `Insert ${val}. Search for it as if it were there: where the search falls off the tree is the only spot that keeps the order.` });
    insertWalk(tr, val, t, { left: 5, right: 7, attach: () => 3 });
    t.step({ line: 8, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, (num(n) === val ? "found" : "settled") as Tone]))), vars: { val }, done: "found",
      message: `Each call hands its (possibly new) subtree back to its parent. One path down: O(h) time, and O(h) for the calls waiting on the way back up.` });
  },
};

export const insertLoop: Approach<InsertInput> = {
  id: "iterative",
  name: "Loop: remember the parent",
  code: `function insertIntoBST(root, val)
    parent, node ← none, root
    while node ≠ none
        parent ← node
        if val < node.val
            node ← node.left
        else
            node ← node.right
    if parent = none
        return new node(val)
    if val < parent.val
        parent.left ← new node(val)
    else
        parent.right ← new node(val)
    return root
`,
  run({ root: vals, val }, t) {
    const tr = build(vals);
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { val },
      message: `The same path down without recursion. Keep the last real node as parent: when node falls off the tree, parent is where ${val} hangs.` });
    insertWalk(tr, val, t, { left: 6, right: 8, attach: (sd) => (sd === "root" ? 10 : sd === "left" ? 12 : 14) });
    t.step({ line: 15, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, (num(n) === val ? "found" : "settled") as Tone]))), vars: { val }, done: "found",
      message: `Done: O(h) time like the recursive version, but only O(1) extra memory, because no calls wait on a stack.` });
  },
};

/* ---------- Delete ---------- */
export type DeleteInput = { root: (number | null)[]; key: number };
export const deleteExample: DeleteInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], key: 3 };
export const deleteFields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }, { key: "key", label: "delete", kind: "number" }];
export function deletePrepare(raw: DeleteInput): Prepared<DeleteInput> {
  const e = bstError(raw.root); if (e) return { error: e };
  if (!Number.isInteger(raw.key)) return { error: "Delete a whole number." };
  return { input: raw };
}

export const remove: Approach<DeleteInput> = {
  id: "walk",
  name: "Find it, then fix the hole",
  code: `function deleteNode(root, key)
    if root = none
        return none
    if key < root.val
        root.left ← deleteNode(root.left, key)
    else if key > root.val
        root.right ← deleteNode(root.right, key)
    else
        if root.left = none
            return root.right
        if root.right = none
            return root.left
        s ← smallest node in root.right
        root.val ← s.val
        root.right ← deleteNode(root.right, s.val)
    return root
`,
  run({ root: vals, key }, t) {
    const tr = build(vals);
    const tones: Record<string, Tone> = {};
    let asked = 0;
    const kidsWord = (n: TreeNodeData) => (n.left && n.right ? "two children" : n.left ? "only a left child" : n.right ? "only a right child" : "no children");
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { key },
      message: `Delete ${key}. First find it, exactly like a search. Then the hole it leaves must be filled so the order still holds.` });
    /** Mirrors deleteNode: returns the id of the subtree root that replaces `id`. */
    const del = (id: string | null, k: number, quiet = false): string | null => {
      if (!id) {
        if (!quiet) t.step({ line: 3, array: [], trees: viewOf(tr, tones), vars: { key: k }, message: `The search fell off the tree: ${k} isn't there, so nothing changes.` });
        return null;
      }
      const n = tr.by.get(id)!, v = num(n);
      t.op();
      if (k !== v) {
        const d = dir(k, v);
        const q = !quiet && asked < 2 ? (asked++, { ask: { q: `Looking for ${k} to delete, at ${v}. Which way?`, options: [`Left: ${k} < ${v}`, `Right: ${k} > ${v}`], answer: k < v ? 0 : 1 } }) : {};
        tones[id] = "visited";
        t.step({ ...q, line: d === "left" ? 5 : 7, array: [], trees: viewOf(tr, tones, { node: id }), vars: { key: k, at: v }, message: `${k} ${k < v ? "<" : ">"} ${v}: go ${d}.` });
        if (d === "left") n.left = del(n.left, k, quiet); else n.right = del(n.right, k, quiet);
        return id;
      }
      const opts = [n.left && n.right ? "Its smallest bigger value takes its place" : !n.left && !n.right ? "Nothing: it simply goes" : `Its ${n.left ? "left" : "right"} child moves up into its place`,
        "Its parent takes its place", ...(n.left && n.right ? [] : ["Its smallest bigger value takes its place"])].filter((o, i, a) => a.indexOf(o) === i);
      const q = asked < 4 ? (asked++, { ask: { q: `${v} has ${kidsWord(n)}. What fills its place?`, options: opts, answer: 0 } }) : {};
      if (!n.left || !n.right) {
        const child = n.left ?? n.right;
        tr.nodes = tr.nodes.filter((x) => x.id !== id); tr.by.delete(id);
        if (tr.root === id) tr.root = child;
        t.step({ ...q, line: n.left ? 12 : 10, array: [], trees: viewOf(tr, { ...tones, ...(child ? { [child]: "found" } : {}) }, { node: child }), vars: { key: k },
          message: child ? `${v} has ${kidsWord(n)}, so that whole subtree moves up into its place. Everything in it was already on the correct side of ${v}'s parent.` : `${v} is a leaf: just remove it.` });
        return child;
      }
      // Two children: copy in the successor's value, then delete the successor from the right subtree.
      const path: string[] = [];
      let s = n.right!;
      path.push(s);
      while (tr.by.get(s)!.left) { t.op(); s = tr.by.get(s)!.left!; path.push(s); }
      const sv = num(tr.by.get(s)!);
      t.step({ ...q, line: 13, array: [], trees: viewOf(tr, { ...tones, [id]: "miss", ...Object.fromEntries(path.map((p) => [p, "compare" as Tone])), [s]: "found" }, { node: s }), vars: { key: k, successor: sv },
        message: `${v} has two children. Its replacement must be bigger than everything on its left and smaller than everything on its right: the smallest value in its right subtree. Go right once, then left as far as possible: ${sv}.` });
      n.val = sv;
      t.step({ line: 14, array: [], trees: viewOf(tr, { ...tones, [id]: "found", [s]: "miss" }, { node: id }), vars: { key: k, successor: sv },
        message: `Copy ${sv} up into ${v}'s place. Now ${sv} appears twice; delete the old ${sv} from the right subtree. It has no left child, so that's the easy case.` });
      n.right = del(n.right, sv, true);
      t.step({ line: 15, array: [], trees: viewOf(tr, { ...tones, [id]: "found" }, { node: id }), vars: { key: k, successor: sv },
        message: `The old ${sv} is gone${tr.by.get(id)!.right ? "" : ""}. The tree has one node fewer and is still in order.` });
      return id;
    };
    tr.root = del(tr.root, key);
    if (tr.nodes.length !== vals.filter((x) => x !== null).length || !vals.includes(key)) {
      t.step({ line: 16, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "settled" as Tone]))), vars: { key }, done: vals.includes(key) ? "found" : "notfound",
        message: vals.includes(key) ? `${key} is deleted and the order still holds: [${inorderVals(tr).join(", ")}] reading left to right. One path down, plus at most one more to the successor: O(h).` : `${key} wasn't in the tree, so it's unchanged. The search cost one path: O(h).` });
    }
  },
};

/* ---------- In-order successor ---------- */
export type SuccInput = { root: (number | null)[]; p: number };
export const succExample: SuccInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], p: 7 };
export const succFields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }, { key: "p", label: "p (a value in the tree)", kind: "number" }];
export function succPrepare(raw: SuccInput): Prepared<SuccInput> {
  const e = bstError(raw.root); if (e) return { error: e };
  if (!raw.root.includes(raw.p)) return { error: `p must be one of the tree's values.` };
  return { input: raw };
}

export const successor: Approach<SuccInput> = {
  id: "walk",
  name: "Walk down, keep the last left turn",
  code: `function inorderSuccessor(root, p)
    succ ← none
    node ← root
    while node ≠ none
        if p.val < node.val
            succ ← node  // a candidate
            node ← node.left
        else
            node ← node.right
    return succ
`,
  run({ root: vals, p }, t) {
    const tr = build(vals);
    const tones: Record<string, Tone> = {};
    let id = tr.root, succ: string | null = null, asked = 0;
    const pid = tr.nodes.find((n) => num(n) === p)!.id;
    const notes = () => (succ ? { [succ]: "succ" } : {});
    t.step({ line: 2, array: [], trees: viewOf(tr, { [pid]: "active" }), vars: { p, succ: "none" },
      message: `The in-order successor of ${p} is the smallest value bigger than ${p}. Walk down from the root: every time ${p} is smaller and you turn left, that node is bigger than ${p}, so it's the best candidate so far.` });
    while (id) {
      const n = tr.by.get(id)!, v = num(n);
      t.op();
      const left = p < v;
      const q = asked < 2 ? (asked++, { ask: { q: `p = ${p}, at ${v}. What happens?`, options: [`${v} is bigger: it's a candidate, go left`, `${v} isn't bigger: go right`], answer: left ? 0 : 1 } }) : {};
      if (left) succ = id;
      tones[id] = left ? "side-b" : "visited";
      const next = left ? n.left : n.right;
      t.step({ ...q, line: left ? 7 : 9, array: [], trees: viewOf(tr, { ...tones, [pid]: "active", ...(next ? { [next]: "compare" } : {}) }, { node: next }, notes()), vars: { p, at: v, succ: succ ? num(tr.by.get(succ)!) : "none" },
        message: left ? `${p} < ${v}: ${v} is bigger than p, and ${succ && succ !== id ? "" : ""}it's the smallest such value seen so far, so it's the best candidate. Go left to look for something smaller that's still bigger than ${p}.` : `${p} ≥ ${v}: ${v} isn't bigger than p, so the answer is to the right.` });
      id = next;
    }
    t.step({ line: 10, array: [], trees: viewOf(tr, { ...(succ ? { [succ]: "found" } : {}), [pid]: "active" }, {}, notes()), vars: { p, succ: succ ? num(tr.by.get(succ)!) : "none" }, done: succ ? "found" : "notfound",
      message: succ ? `The successor of ${p} is ${num(tr.by.get(succ)!)}: the last node where the walk turned left. One path: O(h).` : `${p} is the largest value: it has no successor. Return none.` });
  },
};

export const searchApproaches = { follow: search };
export const insertApproaches = { recursive: insertRecursive };
export const deleteApproaches = { walk: remove };
export const succApproaches = { walk: successor };
