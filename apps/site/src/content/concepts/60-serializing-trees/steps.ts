import { type Approach, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { build, treeFields, treePrepare, type TreeInput } from "../54-tree-recursion/steps";
import { bstError } from "../57-binary-search-trees/steps";

/**
 * Writing a tree out as a list of tokens and reading it back (LeetCode 297, 449). Each animation does both halves:
 * the original tree is written out, then a second tree is rebuilt from the tokens alone.
 */
export const serialExample: TreeInput = { root: [5, 3, 8, null, 4, 7] };
export const bstSerialExample: TreeInput = { root: [6, 3, 9, 1, 4, null, 12] };
export const serialFields = treeFields;
export function serialPrepare(raw: TreeInput): Prepared {
  if (raw.root.filter((v) => v !== null).length > 10) return { error: "Use at most 10 nodes so both trees fit." };
  return treePrepare(raw);
}
type Prepared = ReturnType<typeof treePrepare>;
export function bstSerialPrepare(raw: TreeInput): Prepared {
  const e = bstError(raw.root, 10); return e ? { error: e } : { input: raw };
}

type T = Parameters<Approach<TreeInput>["run"]>[1];
const snapT = (root: string | null, nodes: TreeNodeData[], label: string, tones: Record<string, Tone> = {}, ptr?: string | null): TreeData =>
  ({ label, root, nodes: nodes.map((n) => ({ ...n })), tones: { ...tones }, pointers: ptr ? { node: ptr } : {} });

/** Shared drawing for both halves: the original on the left, the rebuilt tree on the right, the tokens below. */
function stage(orig: ReturnType<typeof build>) {
  const rebuilt: TreeNodeData[] = [], rb = new Map<string, TreeNodeData>();
  let rroot: string | null = null;
  const written: Record<string, Tone> = {};
  const make = (v: number, parent: string | null, side: "left" | "right" | null) => {
    const n: TreeNodeData = { id: `r${rebuilt.length}`, val: v, left: null, right: null };
    rebuilt.push(n); rb.set(n.id, n);
    if (!parent) rroot = n.id; else rb.get(parent)![side!] = n.id;
    return n.id;
  };
  const trees = (otones: Record<string, Tone> = {}, optr?: string | null, rtones: Record<string, Tone> = {}, rptr?: string | null): TreeData[] =>
    [snapT(orig.root, orig.nodes, "tree", { ...written, ...otones }, optr), snapT(rroot, rebuilt, "rebuilt", { ...Object.fromEntries(rebuilt.map((n) => [n.id, "settled" as Tone])), ...rtones }, rptr)];
  return { written, make, trees, rebuilt, root: () => rroot };
}
const tokGrid = (tokens: string[], title: string, at?: number, tone: Tone = "active") => ({ title, rows: [tokens.length ? [...tokens] : ["—"]], dense: tokens.length > 11, tones: at !== undefined && at >= 0 ? { [`0,${at}`]: tone } : {} });

/* ---------- Level order with markers ---------- */
export const levels: Approach<TreeInput> = {
  id: "levels",
  name: "Level by level, # for each missing child",
  code: `function serialize(root)
    out, queue ← [], queue of [root]
    while queue not empty
        node ← queue.popFront()
        if node = none
            out.push("#")
        else
            out.push(node.val)
            queue.push(node.left)
            queue.push(node.right)
    return out
function deserialize(vals)
    if vals[0] = "#"
        return none
    root ← new node(vals[0])
    queue, i ← queue of [root], 1
    while queue not empty
        node ← queue.popFront()
        if vals[i] ≠ "#"
            node.left ← new node(vals[i])
            queue.push(node.left)
        if vals[i + 1] ≠ "#"
            node.right ← new node(vals[i + 1])
            queue.push(node.right)
        i += 2
    return root
`,
  run({ root: vals }, t) {
    const tr = build(vals), st = stage(tr), out: string[] = [];
    t.step({ line: 2, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: {},
      message: "Write the tree out level by level, with # wherever a child is missing. The #s are what keep the shape: without them, different trees would write the same values." });
    const q: (string | null)[] = [tr.root];
    while (q.length) {
      const id = q.shift()!;
      t.op();
      if (!id) { out.push("#"); continue; }
      const n = tr.by.get(id)!;
      out.push(String(n.val)); st.written[id] = "visited";
      q.push(n.left, n.right);
      t.step({ line: 8, array: [], trees: st.trees({ [id]: "found" }, id), grid: tokGrid(out, "tokens", out.length - 1), vars: { tokens: out.length },
        message: `Write ${n.val}, then queue its children${n.left || n.right ? "" : ", both missing"}. Missing children become # when their turn comes.` });
    }
    t.step({ line: 11, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length },
      message: `Written: ${out.join(",")}. ${tr.nodes.length} values and ${out.length - tr.nodes.length} #s. Now rebuild a tree from these tokens alone.` });
    if (out[0] === "#") { t.step({ line: 14, array: [], trees: st.trees(), grid: tokGrid(out, "tokens", 0), vars: {}, done: "found", message: "The first token is #: the tree is empty." }); return; }
    const r0 = st.make(Number(out[0]), null, null);
    t.step({ line: 15, array: [], trees: st.trees({}, null, { [r0]: "found" }, r0), grid: tokGrid(out, "tokens", 0), vars: { i: 1 }, message: `The first token, ${out[0]}, is the root.` });
    const rq = [r0];
    let i = 1, asked = 0;
    while (rq.length) {
      const id = rq.shift()!;
      const pv = st.rebuilt.find((n) => n.id === id)!.val;
      const made: string[] = [];
      for (const side of ["left", "right"] as const) {
        t.op();
        if (out[i + (side === "left" ? 0 : 1)] !== "#") { const c = st.make(Number(out[i + (side === "left" ? 0 : 1)]), id, side); rq.push(c); made.push(c); }
      }
      const opts = [`${out[i] === "#" ? "nothing" : out[i]} on the left, ${out[i + 1] === "#" ? "nothing" : out[i + 1]} on the right`, `${out[i + 1] === "#" ? "nothing" : out[i + 1]} on the left, ${out[i] === "#" ? "nothing" : out[i]} on the right`];
      const qz = asked < 2 && opts[0] !== opts[1] ? (asked++, { ask: { q: `The next two tokens are ${out[i]} and ${out[i + 1]}, and ${pv} is at the front of the queue. What does ${pv} get?`, options: opts, answer: 0 } }) : {};
      t.step({ ...qz, line: 25, array: [], trees: st.trees({}, null, Object.fromEntries(made.map((m) => [m, "found" as Tone])), id), grid: { title: "tokens", rows: [out], dense: out.length > 11, tones: { [`0,${i}`]: "active", [`0,${i + 1}`]: "active" } }, vars: { i },
        message: `${pv} takes the next two tokens as its children: ${out[i] === "#" ? "no left child" : `left ${out[i]}`}, ${out[i + 1] === "#" ? "no right child" : `right ${out[i + 1]}`}.${made.length ? " New nodes join the queue to collect their own children later." : ""}` });
      i += 2;
    }
    t.step({ line: 26, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length }, done: "found",
      message: `The rebuilt tree matches the original. Each node is written once and read once: O(n) both ways, with ${out.length} tokens for ${tr.nodes.length} nodes.` });
  },
};

/* ---------- Pre-order with markers ---------- */
export const preorder: Approach<TreeInput> = {
  id: "preorder",
  name: "Pre-order, # for each missing child",
  code: `function serialize(node, out)
    if node = none
        out.push("#")
        return
    out.push(node.val)
    serialize(node.left, out)
    serialize(node.right, out)
function deserialize(vals)  // read in order
    v ← take the next value from vals
    if v = "#"
        return none
    node ← new node(v)
    node.left ← deserialize(vals)
    node.right ← deserialize(vals)
    return node
`,
  run({ root: vals }, t) {
    const tr = build(vals), st = stage(tr), out: string[] = [];
    t.step({ line: 1, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: {},
      message: "Write the tree in pre-order (node, left, right), with # for every missing child. Reading it back follows exactly the same path, so no positions are needed." });
    const ser = (id: string | null) => {
      t.op();
      if (!id) { out.push("#"); return; }
      const n = tr.by.get(id)!;
      out.push(String(n.val)); st.written[id] = "visited";
      t.step({ line: 5, array: [], trees: st.trees({ [id]: "found" }, id), grid: tokGrid(out, "tokens", out.length - 1), vars: { tokens: out.length },
        message: `Write ${n.val}, then its whole left subtree, then its right.${!n.left && !n.right ? " Both children are missing: two #s follow." : ""}` });
      ser(n.left); ser(n.right);
    };
    ser(tr.root);
    t.step({ line: 7, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length },
      message: `Written: ${out.join(",")}. Now read it back, one token at a time, in the same order.` });
    let i = 0, asked = 0;
    const de = (parent: string | null, side: "left" | "right" | null) => {
      t.op();
      const v = out[i++];
      const pv = parent ? st.rebuilt.find((n) => n.id === parent)!.val : null;
      if (v === "#") {
        const qz = asked < 3 && parent ? (asked++, { ask: { q: `Building ${pv}'s ${side} child, the next token is #. What happens?`, options: [`${pv} has no ${side} child`, "The tree ends here", "Skip the token"], answer: 0 } }) : {};
        t.step({ ...qz, line: 11, array: [], trees: st.trees({}, null, {}, parent), grid: tokGrid(out, "tokens", i - 1, "discard"), vars: { i },
          message: parent ? `# means ${pv} has no ${side} child. Return none, and the caller moves on.` : "# means the tree is empty." });
        return null;
      }
      const id = st.make(Number(v), parent, side);
      t.step({ line: 12, array: [], trees: st.trees({}, null, { [id]: "found" }, id), grid: tokGrid(out, "tokens", i - 1), vars: { i },
        message: parent ? `${v} becomes ${pv}'s ${side} child. Next, its own left subtree.` : `${v} is the root.` });
      de(id, "left"); de(id, "right");
      return id;
    };
    de(null, null);
    t.step({ line: 15, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length }, done: "found",
      message: `The rebuilt tree matches. Each token is read exactly once: O(n), with ${out.length} tokens for ${tr.nodes.length} nodes.` });
  },
};

/* ---------- BST: pre-order without markers, rebuilt with bounds ---------- */
export const compact: Approach<TreeInput> = {
  id: "compact",
  name: "BST: pre-order with no markers",
  code: `function serialize(node, out)
    if node ≠ none
        out.push(node.val)
        serialize(node.left, out)
        serialize(node.right, out)
function deserialize(vals, lo, hi)  // −∞ to ∞
    if no values left
        return none
    v ← the next value in vals
    if v < lo or v > hi
        return none  // it belongs higher up
    take v out of vals
    node ← new node(v)
    node.left ← deserialize(vals, lo, v)
    node.right ← deserialize(vals, v, hi)
    return node
`,
  run({ root: vals }, t) {
    const tr = build(vals), st = stage(tr), out: string[] = [];
    t.step({ line: 1, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: {},
      message: "In a BST the order rule already says where each value goes, so no # markers are needed: write the values in pre-order, and read them back with the range each subtree's values must fall in." });
    const ser = (id: string | null) => { if (!id) return; t.op(); const n = tr.by.get(id)!; out.push(String(n.val)); st.written[id] = "visited";
      t.step({ line: 3, array: [], trees: st.trees({ [id]: "found" }, id), grid: tokGrid(out, "tokens", out.length - 1), vars: { tokens: out.length }, message: `Write ${n.val}.` }); ser(n.left); ser(n.right); };
    ser(tr.root);
    let i = 0, asked = 0;
    const fmt = (x: number) => (x === Infinity ? "∞" : x === -Infinity ? "−∞" : String(x));
    t.step({ line: 6, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length },
      message: `Written: ${out.join(",")}, just ${out.length} values. The first is the root; every later value goes in the first open spot whose range allows it.` });
    const de = (lo: number, hi: number, parent: string | null, side: "left" | "right" | null) => {
      t.op();
      if (i >= out.length) return null;
      const v = Number(out[i]);
      const pv = parent ? st.rebuilt.find((n) => n.id === parent)!.val : null;
      if (v < lo || v > hi) {
        const qz = asked < 3 && parent ? (asked++, { ask: { q: `Building ${pv}'s ${side} child, whose values must be between ${fmt(lo)} and ${fmt(hi)}. The next value is ${v}. What happens?`, options: [`${v} doesn't fit: ${pv} has no ${side} child`, `${v} becomes ${pv}'s ${side} child`], answer: 0 } }) : {};
        t.step({ ...qz, line: 11, array: [], trees: st.trees({}, null, {}, parent), grid: tokGrid(out, "tokens", i, "miss"), vars: { lo: fmt(lo), hi: fmt(hi), next: v },
          message: `${pv}'s ${side} subtree only holds values between ${fmt(lo)} and ${fmt(hi)}, and ${v} isn't one: it belongs further up. ${pv} has no ${side} child${side === "left" ? "" : " here"}.` });
        return null;
      }
      i++;
      const id = st.make(v, parent, side);
      t.step({ line: 13, array: [], trees: st.trees({}, null, { [id]: "found" }, id), grid: tokGrid(out, "tokens", i - 1, "found"), vars: { lo: fmt(lo), hi: fmt(hi), next: v },
        message: parent ? `${v} is between ${fmt(lo)} and ${fmt(hi)}: it's ${pv}'s ${side} child.` : `${v} is the root.` });
      de(lo, v, id, "left"); de(v, hi, id, "right");
      return id;
    };
    de(-Infinity, Infinity, null, null);
    t.step({ line: 16, array: [], trees: st.trees(), grid: tokGrid(out, "tokens"), vars: { tokens: out.length }, done: "found",
      message: `The rebuilt tree matches, from ${out.length} tokens instead of ${2 * out.length + 1}. Each value is placed once, and each failed range check ends one call: O(n).` });
  },
};
