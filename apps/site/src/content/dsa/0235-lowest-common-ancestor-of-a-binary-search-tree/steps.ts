import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, bstError, num, subtree, viewOf } from "../../concepts/57-binary-search-trees/steps";
import { approaches as general } from "../0236-lowest-common-ancestor-of-a-binary-tree/steps";

export type Input = { root: (number | null)[]; p: number; q: number };
export const example: Input = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], p: 4, q: 7 };
export const fields: InputField[] = [
  { key: "root", label: "BST (level order)", kind: "tree" },
  { key: "p", label: "p", kind: "number" },
  { key: "q", label: "q", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const e = bstError(raw.root); if (e) return { error: e };
  if (!raw.root.includes(raw.p) || !raw.root.includes(raw.q)) return { error: "p and q must both be values in the tree." };
  if (raw.p === raw.q) return { error: "Pick two different nodes for p and q." };
  return { input: raw };
}

const split: Approach<Input> = {
  id: "split",
  name: "Walk down to the split point",
  code: `function lowestCommonAncestor(root, p, q)
    lo, hi ← min(p.val, q.val), max(p.val, q.val)
    node ← root
    while node ≠ none
        if hi < node.val
            node ← node.left
        else if lo > node.val
            node ← node.right
        else
            return node  // lo ≤ node.val ≤ hi
    return none
`,
  run({ root: vals, p, q }, t) {
    const tr = build(vals);
    const lo = Math.min(p, q), hi = Math.max(p, q);
    const ids = tr.nodes.filter((n) => n.val === p || n.val === q).map((n) => n.id);
    const mark = Object.fromEntries(ids.map((k) => [k, "active" as Tone]));
    const tones: Record<string, Tone> = {};
    let id = tr.root, asked = 0;
    t.step({ line: 3, array: [], trees: viewOf(tr, mark), vars: { lo, hi },
      message: `p and q are ${p} and ${q}. While both are smaller than a node, both are in its left subtree, and while both are bigger, both are on its right. The first node they don't both pass on the same side is their lowest common ancestor.` });
    while (id) {
      const n = tr.by.get(id)!, v = num(n);
      t.op();
      const where = hi < v ? "left" : lo > v ? "right" : "here";
      const qz = asked < 3 ? (asked++, { ask: { q: `p and q are ${lo} and ${hi}, and this node holds ${v}. What happens?`, options: [`Both are smaller: go left`, `Both are bigger: go right`, `They split here: ${v} is the answer`], answer: where === "left" ? 0 : where === "right" ? 1 : 2 } }) : {};
      if (where === "here") {
        t.step({ ...qz, line: 10, array: [], trees: viewOf(tr, { ...tones, ...mark, [id]: "found" }, { node: id }), vars: { lo, hi, node: v }, done: "found",
          message: `${lo} ≤ ${v} ≤ ${hi}: ${v === lo || v === hi ? `${v} is one of the two nodes itself, and the other is below it` : `${lo} is on ${v}'s left and ${hi} on its right`}, so ${v} is the lowest common ancestor. Only ${Object.values(tones).filter((x) => x === "visited").length + 1} of ${tr.nodes.length} nodes were looked at.` });
        return;
      }
      tones[id] = "visited";
      const other = where === "left" ? n.right : n.left;
      subtree(tr, other).forEach((k) => (tones[k] = "discard"));
      const next = where === "left" ? n.left : n.right;
      t.step({ ...qz, line: where === "left" ? 6 : 8, array: [], trees: viewOf(tr, { ...tones, ...mark }, { node: next }), vars: { lo, hi, node: v },
        message: where === "left" ? `${hi} < ${v}: both are smaller, so both are in ${v}'s left subtree. Go left.` : `${lo} > ${v}: both are bigger, so both are in ${v}'s right subtree. Go right.` });
      id = next;
    }
  },
};

export const approaches = { onePass: general.onePass as Approach<Input>, split };

/** A balanced BST of n nodes; p and q are the two largest values, deep on the right. */
export const growth = measureGrowth(
  [{ approach: general.onePass as Approach<Input>, slot: 1 }, { approach: split, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), p: 2 * n, q: 2 * n - 2 }),
  [7, 15, 31, 63, 127],
);
