import { treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

export type T = Parameters<Approach<unknown>["run"]>[1];
export type TreeInput = { root: (number | null)[] };
export const treeFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
export function treePrepare(raw: TreeInput): Prepared<TreeInput> {
  if (!raw.root.length) return { error: "Give at least one node." };
  return { input: raw };
}
export type Tree = { root: string | null; nodes: TreeNodeData[]; by: Map<string, TreeNodeData> };
export function build(vals: (number | null)[]): Tree {
  const { root, nodes } = treeFromLevelOrder(vals);
  return { root, nodes, by: new Map(nodes.map((n) => [n.id, n])) };
}
export const view = (tr: Tree, tones: Record<string, Tone> = {}, notes: Record<string, string> = {}, ptr?: string, label?: string): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones, notes: { ...notes }, pointers: ptr ? { node: ptr } : {}, ...(label ? { label } : {}) }];
export const isLeaf = (n: TreeNodeData) => !n.left && !n.right;

/* ---------- Up: each call returns an answer for its subtree ---------- */

export const upExample: TreeInput = { root: [5, 3, 8, 1, 4, null, 2] };
const sumUp: Approach<TreeInput> = {
  id: "up",
  name: "Return a value up: subtree sums",
  code: `function subtreeSum(node)
    if node = none
        return 0
    left ← subtreeSum(node.left)
    right ← subtreeSum(node.right)
    return node.val + left + right
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, stack: string[] = [];
    const done = () => Object.fromEntries(Object.keys(notes).map((id) => [id, "settled" as Tone]));
    t.step({ line: 2, array: [], trees: view(tr), stack: [], vars: {},
      message: "Each call answers a question about its own subtree, here \"what do your values add up to?\", using the answers its two children send back. A missing child answers 0." });
    let asked = false;
    const go = (id: string | null): number => {
      if (!id) return 0;
      const n = tr.by.get(id)!;
      stack.push(`sum(${n.val})`);
      const l = go(n.left), r = go(n.right);
      t.op();
      const s = Number(n.val) + l + r;
      const opts = [...new Set([s, l + r, n.val].map(String))];
      const ask = !asked && n.left && n.right && opts.length > 1 ? (asked = true, { ask: { q: `At ${n.val}: the left subtree sends back ${l} and the right ${r}. What does ${n.val} return?`, options: opts, answer: 0 } }) : {};
      notes[id] = `sum ${s}`;
      t.step({ ...ask, line: 6, array: [], trees: view(tr, { ...done(), [id]: "found" }, notes, id), stack: [...stack], vars: { node: n.val, left: l, right: r },
        message: isLeaf(n) ? `${n.val} is a leaf: both children answer 0, so it returns ${n.val}.` : `At ${n.val}: left sends ${l}, right sends ${r}. Return ${n.val} + ${l} + ${r} = ${s}.` });
      stack.pop();
      return s;
    };
    const ans = go(tr.root);
    t.step({ line: 6, array: [], trees: view(tr, done(), notes), stack: [], vars: { total: ans }, done: "found",
      message: `The root returns ${ans}. Every node was answered once, after its children: a post-order walk, O(n).` });
  },
};

/* ---------- Down: each call receives something from its parent ---------- */

export const downExample: TreeInput = { root: [5, 3, 8, 1, 4, null, 2] };
const sumDown: Approach<TreeInput> = {
  id: "down",
  name: "Pass a value down: sums from the root",
  code: `function pathSums(node, above)
    if node = none
        return
    total ← above + node.val
    write total next to node
    pathSums(node.left, total)
    pathSums(node.right, total)
// first call: pathSums(root, 0)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, stack: string[] = [];
    const done = () => Object.fromEntries(Object.keys(notes).map((id) => [id, "settled" as Tone]));
    t.step({ line: 8, array: [], trees: view(tr), stack: [], vars: {},
      message: "Now the information flows the other way: each call receives the sum of the path above it, adds its own value and hands the new total to its children. The root starts with 0." });
    let asked = false;
    const go = (id: string | null, above: number) => {
      if (!id) return;
      const n = tr.by.get(id)!;
      t.op();
      const total = above + Number(n.val);
      stack.push(`pathSums(${n.val}, ${above})`);
      const opts = [...new Set([total, n.val, above].map(String))];
      const ask = !asked && above && opts.length > 1 ? (asked = true, { ask: { q: `${n.val} receives ${above} from its parent. What does it hand to its children?`, options: opts, answer: 0 } }) : {};
      notes[id] = `${total}`;
      t.step({ ...ask, line: 5, array: [], trees: view(tr, { ...done(), [id]: "found" }, notes, id), stack: [...stack], vars: { node: n.val, above, total },
        message: `${n.val} receives ${above}: the path from the root down to it adds up to ${above} + ${n.val} = ${total}.${isLeaf(n) ? " It's a leaf, so that's one whole root-to-leaf path." : ` Pass ${total} down.`}` });
      go(n.left, total); go(n.right, total);
      stack.pop();
    };
    go(tr.root, 0);
    t.step({ line: 8, array: [], trees: view(tr, done(), notes), stack: [], vars: {}, done: "found",
      message: "Every node knows the sum of its path from the root, worked out before its children: a pre-order walk, O(n)." });
  },
};

export const upApproaches = { up: sumUp };
export const downApproaches = { down: sumDown };
