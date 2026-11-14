import { treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone, type TreeNodeData } from "@firstprinciples/ui";

export type Input = { root: (number | null)[] };

export const example: Input = { root: [5, 3, 8, 1, 4, 7, 9] };

export const fields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length) return { error: "Give at least one node." };
  return { input: raw };
}

/** Steps are snapshots, and inverting mutates children, so copy the nodes for every step. */
const snap = (nodes: TreeNodeData[]) => nodes.map((n) => ({ ...n }));

const recursive: Approach<Input> = {
  id: "dfs",
  name: "Recursive: swap, then recurse",
  code: `function invertTree(root)
    if root = none
        return none
    swap root.left and root.right
    invertTree(root.left)
    invertTree(root.right)
    return root
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const done = new Set<string>();
    const stack: string[] = [];
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...done].map((d) => [d, "settled" as Tone])), ...extra });
    t.step({ line: 2, array: [], trees: [{ root, nodes: snap(nodes) }], stack: [], vars: { node: null },
      message: "Mirror the tree: at every node, swap its left and right children. Watch whole subtrees slide across." });
    const go = (id: string | null) => {
      if (!id) return;
      const n = by.get(id)!;
      t.op();
      stack.push(`invert(${n.val})`);
      [n.left, n.right] = [n.right, n.left];
      done.add(id);
      t.step({ line: 4, array: [], trees: [{ root, nodes: snap(nodes), tones: tones({ [id]: "found" }), pointers: { node: id } }], stack: [...stack], vars: { node: n.val },
        message: `Swap ${n.val}'s children. Each subtree moves as a whole; its insides are mirrored when the recursion reaches them.` });
      go(n.left);
      go(n.right);
      stack.pop();
    };
    go(root);
    t.step({ line: 7, array: [], trees: [{ root, nodes: snap(nodes), tones: tones() }], stack: [], vars: { node: null }, done: "found",
      message: `Every node's children have been swapped once: the tree is mirrored. ${nodes.length} swaps for ${nodes.length} nodes.` });
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Iterative with a queue",
  code: `function invertTree(root)
    queue ← root = none ? [] : queue of [root]
    while queue not empty
        node ← queue.popFront()
        swap node.left and node.right
        queue.push(node.left) if it exists
        queue.push(node.right) if it exists
    return root
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const done = new Set<string>();
    const queue = root ? [root] : [];
    const grid = () => ({ title: "queue (front → back)", rows: [queue.length ? queue.map((id) => by.get(id)!.val) : ["empty"]] });
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...done].map((d) => [d, "settled" as Tone])), ...extra });
    t.step({ line: 2, array: [], trees: [{ root, nodes: snap(nodes) }], grid: grid(), vars: { node: null },
      message: "Same swaps without recursion: visit the nodes level by level with a queue, swapping each node's children." });
    while (queue.length) {
      const id = queue.shift()!;
      const n = by.get(id)!;
      t.op();
      [n.left, n.right] = [n.right, n.left];
      done.add(id);
      if (n.left) queue.push(n.left);
      if (n.right) queue.push(n.right);
      t.step({ line: 5, array: [], trees: [{ root, nodes: snap(nodes), tones: tones({ [id]: "found" }), pointers: { node: id } }], grid: grid(), vars: { node: n.val },
        message: `Take ${n.val} from the queue, swap its children, and queue them up.` });
    }
    t.step({ line: 8, array: [], trees: [{ root, nodes: snap(nodes), tones: tones() }], grid: grid(), vars: { node: null }, done: "found",
      message: "The queue is empty: every node has been swapped. The tree is mirrored." });
  },
};

export const approaches = { dfs: recursive, bfs };
