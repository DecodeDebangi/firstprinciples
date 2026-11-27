import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build, view, type Tree } from "../../concepts/54-tree-recursion/steps";

/** A complete binary tree, written level by level. Complete means no gaps, so the list has no nulls. */
export type Input = { root: (number | null)[] };
export const example: Input = { root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
export const fields: InputField[] = [{ key: "root", label: "complete tree (level order)", kind: "tree" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length) return { error: "Give at least one node." };
  if (raw.root.some((x) => x === null)) return { error: "A complete tree has no gaps, so its list has no nulls. Remove them." };
  if (raw.root.length > 15) return { error: "Use at most 15 nodes so the tree fits." };
  return { input: raw };
}

const all = (tr: Tree, id: string | null): string[] => (id ? [id, ...all(tr, tr.by.get(id)!.left), ...all(tr, tr.by.get(id)!.right)] : []);
const tone = (ids: string[], t: Tone) => Object.fromEntries(ids.map((id) => [id, t]));

const countAll: Approach<Input> = {
  id: "all", name: "Count every node",
  code: `function countNodes(node)
    if node = none
        return 0
    return 1 + countNodes(node.left)
             + countNodes(node.right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), seen: string[] = [];
    if (t.record) t.step({ line: 1, array: [], trees: view(tr), vars: { counted: 0 }, message: "The plain way works for any tree: visit every node and add 1 for each." });
    const go = (id: string | null): number => {
      t.op();
      if (!id) return 0;
      seen.push(id);
      if (t.record) t.step({ line: 4, array: [], trees: view(tr, { ...tone(seen, "settled"), [id]: "found" }, {}, id), vars: { node: tr.by.get(id)!.val, counted: seen.length }, message: `Count ${tr.by.get(id)!.val}: ${seen.length} so far.` });
      return 1 + go(tr.by.get(id)!.left) + go(tr.by.get(id)!.right);
    };
    const n = go(tr.root);
    if (t.record) t.step({ line: 4, array: [], trees: view(tr, tone(seen, "settled")), vars: { answer: n }, done: "found",
      message: `${n} nodes. Every node was visited: O(n). This never used the fact that the tree is complete.` });
  },
};

const countFast: Approach<Input> = {
  id: "fast", name: "Spot perfect subtrees by their two edges",
  code: `function countNodes(node)
    if node = none
        return 0
    l ← nodes on the all-left path from node
    r ← nodes on the all-right path from node
    if l = r  // every level full: perfect
        return 2^l − 1
    return 1 + countNodes(node.left)
             + countNodes(node.right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), done: Record<string, Tone> = {}, notes: Record<string, string> = {};
    let asked = 0;
    if (t.record) t.step({ line: 1, array: [], trees: view(tr), vars: {},
      message: "In a complete tree every level is full except maybe the last, which fills from the left. So walk down the left edge and the right edge of a subtree: if they're equally long, every level of it is full, and its size is known without counting." });
    const go = (id: string | null): number => {
      t.op();
      if (!id) return 0;
      const n = tr.by.get(id)!;
      const L: string[] = [], R: string[] = [];
      for (let x: string | null = id; x; x = tr.by.get(x)!.left) { t.op(); L.push(x); }
      for (let x: string | null = id; x; x = tr.by.get(x)!.right) { t.op(); R.push(x); }
      const l = L.length, r = R.length;
      if (t.record) t.step({ line: 5, array: [], trees: view(tr, { ...done, ...tone(L, "side-a"), ...tone(R, "compare"), [id]: "active" }, notes, id), vars: { node: n.val, l, r },
        message: `From ${n.val}, going only left passes ${l} node${l === 1 ? "" : "s"}; going only right passes ${r}.` });
      if (l === r) {
        const size = 2 ** l - 1, sub = all(tr, id);
        const q = t.record && asked < 2 && l > 1 ? (asked++, { ask: { q: `Both edges from ${n.val} are ${l} long. How many nodes are in its subtree?`, options: [String(size), String(2 ** l), String(l * l + 1)], answer: 0 } }) : {};
        Object.assign(done, tone(sub, "found")); notes[id] = `${size}`;
        if (t.record) t.step({ ...q, line: 7, array: [], trees: view(tr, { ...done }, notes, id), vars: { node: n.val, l, r, size },
          message: l === 1 ? `Equal: ${n.val} is a leaf, so its subtree is just 1 node.` : `Equal, so the subtree at ${n.val} is perfect: its ${l} full levels hold 1 + 2 + … = 2^${l} − 1 = ${size} nodes, counted without visiting them.` });
        return size;
      }
      const q = t.record && asked < 2 ? (asked++, { ask: { q: `From ${n.val} the left edge is ${l} long but the right edge only ${r}. What now?`, options: ["Count 1 for it, then ask each child", "Return 2^" + l + " − 1", "Count the left side only"], answer: 0 } }) : {};
      done[id] = "settled"; notes[id] = "+1";
      if (t.record) t.step({ ...q, line: 8, array: [], trees: view(tr, { ...done }, notes, id), vars: { node: n.val, l, r },
        message: `Different, so the last level stops somewhere inside this subtree. Count ${n.val} itself and ask both children. At most one of them can be imperfect.` });
      return 1 + go(n.left) + go(n.right);
    };
    const total = go(tr.root);
    if (t.record) t.step({ line: 8, array: [], trees: view(tr, { ...done }, notes), vars: { answer: total }, done: "found",
      message: `${total} nodes. Only one path down the tree was split; every other subtree was perfect and counted by a formula. About log n levels, each with two edge walks of log n: O(log² n).` });
  },
};

export const approaches = { all: countAll, fast: countFast };

/** Complete trees whose last level is half full: one side is perfect, the other isn't, at every level. */
export const growth = measureGrowth(
  [{ approach: countAll, slot: 1 }, { approach: countFast, slot: 3 }],
  (n) => ({ root: Array.from({ length: n }, (_, k) => k + 1) }),
  [12, 24, 48, 96, 192, 384],
);
