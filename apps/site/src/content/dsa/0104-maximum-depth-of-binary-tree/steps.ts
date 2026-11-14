import { treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { root: (number | null)[] };

export const example: Input = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7] };

export const fields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length) return { error: "Give at least one node." };
  return { input: raw };
}

const recursive: Approach<Input> = {
  id: "dfs",
  name: "Recursive (depth-first)",
  code: `function maxDepth(root)
  if root = none
    return 0
  left ← maxDepth(root.left)
  right ← maxDepth(root.right)
  return 1 + max(left, right)
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const notes: Record<string, string> = {};
    const stack: string[] = [];
    const view = (tones: Record<string, Tone>, ptr?: string): TreeData[] => [{ root, nodes, tones, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];
    const settled = () => Object.fromEntries(Object.keys(notes).map((id) => [id, "settled" as Tone]));
    t.step({ line: 2, array: [], trees: view({}), stack: [], vars: { depth: null },
      message: "A tree's depth is 1 (the root) plus the depth of its deeper subtree. Ask each subtree, then combine." });
    const go = (id: string | null): number => {
      if (!id) return 0;
      const n = by.get(id)!;
      t.op();
      stack.push(`maxDepth(${n.val})`);
      t.step({ line: 4, array: [], trees: view({ ...settled(), [id]: "active" }, id), stack: [...stack], vars: { node: n.val },
        message: `At ${n.val}: first find the depth of its left subtree.` });
      const l = go(n.left);
      const r = go(n.right);
      const d = 1 + Math.max(l, r);
      notes[id] = `depth ${d}`;
      const opts = [...new Set([1 + Math.max(l, r), Math.max(l, r), l + r + 1, 1 + Math.min(l, r)])].slice(0, 3);
      t.step({ ask: { q: `At ${n.val}: the left subtree has depth ${l}, the right has depth ${r}. What does ${n.val} return?`, options: opts.map(String), answer: opts.indexOf(d) },
        line: 6, array: [], trees: view({ ...settled(), [id]: "found" }, id), stack: [...stack], vars: { node: n.val, left: l, right: r },
        message: `Left depth ${l}, right depth ${r}. ${n.val} returns 1 + max(${l}, ${r}) = ${d}.` });
      stack.pop();
      return d;
    };
    const ans = go(root);
    t.step({ line: 6, array: [], trees: view(settled()), stack: [], vars: { depth: ans }, done: "found",
      message: `The root returns ${ans}: the tree is ${ans} level${ans === 1 ? "" : "s"} deep. Every node was visited once.` });
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Level by level (breadth-first)",
  code: `function maxDepth(root)
  if root = none
    return 0
  depth, queue ← 0, queue of [root]
  while queue not empty
    depth += 1
    repeat length(queue) times
      node ← queue.popFront()
      queue.push(node.left) if it exists
      queue.push(node.right) if it exists
  return depth
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const done = new Set<string>();
    const notes: Record<string, string> = {};
    let queue = root ? [root] : [];
    let depth = 0;
    const grid = (q: string[]) => ({ title: "queue (front → back)", rows: [q.length ? q.map((id) => by.get(id)!.val) : ["empty"]] });
    t.step({ line: 4, array: [], trees: [{ root, nodes }], grid: grid(queue), vars: { depth },
      message: "Count levels instead: process the tree one level at a time with a queue. The number of levels is the depth." });
    while (queue.length) {
      depth++;
      const level = queue;
      const next: string[] = [];
      for (const id of level) {
        t.op();
        const n = by.get(id)!;
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
        done.add(id);
        notes[id] = `level ${depth}`;
      }
      t.step({ line: 6, array: [], trees: [{ root, nodes, notes: { ...notes }, tones: Object.fromEntries([...done].map((id) => [id, level.includes(id) ? "compare" : "settled"] as const)) }],
        grid: grid(next), vars: { depth },
        message: `Level ${depth}: ${level.map((id) => by.get(id)!.val).join(", ")}. Their children (${next.length}) form the next level.` });
      queue = next;
    }
    t.step({ line: 11, array: [], trees: [{ root, nodes, notes: { ...notes }, tones: Object.fromEntries([...done].map((id) => [id, "settled" as Tone])) }], grid: grid([]),
      vars: { depth }, done: "found", message: `The queue is empty after ${depth} level${depth === 1 ? "" : "s"}, so the depth is ${depth}.` });
  },
};

export const approaches = { dfs: recursive, bfs };
