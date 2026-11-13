import { treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

export type Input = { root: (number | null)[] };

/** A binary search tree, so in-order comes out sorted. */
export const example: Input = { root: [6, 2, 9, 1, 4, 7, null, null, null, 3] };

export const fields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length || raw.root[0] === null) return { error: "Give at least one node." };
  if (raw.root.filter((v) => v !== null).length > 15) return { error: "Use at most 15 nodes so the tree fits." };
  return { input: raw };
}

const uniq = (o: string[]) => o.filter((v, i, a) => a.indexOf(v) === i);

/** "Which node is written down next?" with the right node and up to two other unwritten ones. */
function nextAsk(right: TreeNodeData, pending: TreeNodeData[]) {
  const others = pending.filter((n) => n.id !== right.id && n.val !== right.val).slice(0, 2).map((n) => String(n.val));
  const options = uniq([String(right.val), ...others]);
  return options.length > 1 ? { q: "Which node gets written down next?", options, answer: 0 } : undefined;
}

type Order = "pre" | "in" | "post";

const codes: Record<Order, string> = {
  pre: `def preorder(node, out):
    if node is None:
        return
    out.append(node.val)  # before both
    preorder(node.left, out)
    preorder(node.right, out)
`,
  in: `def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.val)  # between
    inorder(node.right, out)
`,
  post: `def postorder(node, out):
    if node is None:
        return
    postorder(node.left, out)
    postorder(node.right, out)
    out.append(node.val)  # after both
`,
};

const recordLine: Record<Order, number> = { pre: 4, in: 5, post: 6 };

const intro: Record<Order, string> = {
  pre: "Depth-first: go as deep as possible down the left, then back up. Pre-order writes a node down the moment it arrives, before either child.",
  in: "The same depth-first walk. In-order writes a node down after its whole left subtree, and before its right one.",
  post: "The same depth-first walk again. Post-order writes a node down only when both of its subtrees are finished.",
};

const outro: Record<Order, (out: (number | string)[]) => string> = {
  pre: (o) => `Pre-order: [${o.join(", ")}]. Every parent comes before its children, which is why it's used to copy or save a tree.`,
  in: (o) => `In-order: [${o.join(", ")}]. Left subtree, node, right subtree. On a binary search tree that's sorted order.`,
  post: (o) => `Post-order: [${o.join(", ")}]. Every node comes after its children, so a node can combine answers its children already returned.`,
};

function dfs(order: Order, id: string, name: string): Approach<Input> {
  return {
    id, name, code: codes[order],
    run({ root: vals }, t) {
      const { root, nodes } = treeFromLevelOrder(vals);
      const by = new Map(nodes.map((n) => [n.id, n]));
      const out: (number | string)[] = [];
      const notes: Record<string, string> = {};
      const path: string[] = [];
      const grid = () => ({ title: "written down, in order", rows: [out.length ? [...out] : ["—"]] });
      const tones = (extra: Record<string, Tone> = {}): Record<string, Tone> => {
        const t0: Record<string, Tone> = {};
        for (const p of path) t0[p] = "side-a";
        for (const k of Object.keys(notes)) t0[k] = "settled";
        return { ...t0, ...extra };
      };
      const view = (extra: Record<string, Tone> = {}, at?: string): TreeData[] => [{ root, nodes, tones: tones(extra), notes: { ...notes }, pointers: at ? { node: at } : {} }];
      const frames = () => path.map((p) => `${order === "pre" ? "preorder" : order === "in" ? "inorder" : "postorder"}(${by.get(p)!.val})`);
      // The true order, to ask "which is next?" from the unwritten nodes.
      const truth: TreeNodeData[] = [];
      const walk = (k: string | null) => { if (!k) return; const n = by.get(k)!; if (order === "pre") truth.push(n); walk(n.left); if (order === "in") truth.push(n); walk(n.right); if (order === "post") truth.push(n); };
      walk(root);
      const pending = () => truth.filter((n) => !(n.id in notes));

      t.step({ line: 1, array: [], trees: view(), grid: grid(), stack: [], vars: { written: 0 }, message: intro[order] });
      const record = (n: TreeNodeData) => {
        t.op();
        const ask = nextAsk(n, pending());
        out.push(n.val);
        notes[n.id] = `#${out.length}`;
        const why = order === "pre" ? `${n.val} has just arrived, so write it down first.`
          : order === "in" ? (n.left ? `${n.val}'s left subtree is done, so write ${n.val} down, then go right.` : `${n.val} has no left child, so write it down straight away, then go right.`)
          : (n.left || n.right ? `Both of ${n.val}'s subtrees are done, so now write ${n.val} down.` : `${n.val} is a leaf: nothing below it, so write it down.`);
        t.step({ ...(ask ? { ask } : {}), line: recordLine[order], array: [], trees: view({ [n.id]: "found" }, n.id), grid: grid(), stack: frames(), vars: { node: n.val, written: out.length },
          message: `${why} It's #${out.length}.` });
      };
      const go = (k: string | null) => {
        if (!k) return;
        const n = by.get(k)!;
        path.push(k);
        if (order === "pre") record(n);
        else {
          t.op();
          t.step({ line: 4, array: [], trees: view({ [k]: "active" }, k), grid: grid(), stack: frames(), vars: { node: n.val, written: out.length },
            message: n.left ? `Arrive at ${n.val}. Not yet: first walk its left subtree.` : `Arrive at ${n.val}. It has no left child.` });
        }
        go(n.left);
        if (order === "in") record(n);
        go(n.right);
        if (order === "post") record(n);
        path.pop();
      };
      go(root);
      t.step({ line: recordLine[order], array: [], trees: view(), grid: grid(), stack: [], vars: { written: out.length }, done: "found", message: outro[order](out) });
    },
  };
}

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Breadth-first (level order)",
  code: `from collections import deque
def level_order(root):
    out, queue = [], deque([root])
    while queue:
        node = queue.popleft()  # oldest first
        out.append(node.val)
        for child in (node.left, node.right):
            if child:
                queue.append(child)
    return out
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const out: (number | string)[] = [];
    const notes: Record<string, string> = {};
    const queue: string[] = root ? [root] : [];
    const grid = () => ({ title: "written down, in order", rows: [out.length ? [...out] : ["—"]] });
    const tones = (extra: Record<string, Tone> = {}): Record<string, Tone> => {
      const t0: Record<string, Tone> = {};
      for (const q of queue) t0[q] = "side-b";
      for (const k of Object.keys(notes)) t0[k] = "settled";
      return { ...t0, ...extra };
    };
    const view = (extra: Record<string, Tone> = {}, at?: string): TreeData[] => [{ root, nodes, tones: tones(extra), notes: { ...notes }, pointers: at ? { node: at } : {} }];
    // Shown front last, so the panel's "top" is the front of the queue.
    const frames = () => [...queue].reverse().map((q) => String(by.get(q)!.val));
    t.step({ line: 3, array: [], trees: view(), grid: grid(), stack: frames(), stackTitle: "Queue, front first", vars: { written: 0 },
      message: "Breadth-first: finish each level before starting the next. A queue holds the nodes found but not yet visited, and the oldest leaves first." });
    while (queue.length) {
      t.op();
      const k = queue[0];
      const n = by.get(k)!;
      const rest = queue.slice(1).map((q) => by.get(q)!);
      const ask = nextAsk(n, [...rest, ...nodes.filter((m) => !(m.id in notes) && !queue.includes(m.id))]);
      queue.shift();
      out.push(n.val);
      notes[k] = `#${out.length}`;
      const kids = [n.left, n.right].filter(Boolean) as string[];
      queue.push(...kids);
      t.step({ ...(ask ? { ask } : {}), line: 6, array: [], trees: view({ [k]: "found" }, k), grid: grid(), stack: frames(), stackTitle: "Queue, front first", vars: { node: n.val, written: out.length },
        message: `${n.val} is at the front: take it and write it down (#${out.length}).${kids.length ? ` Its ${kids.length === 2 ? "children" : "child"} ${kids.map((c) => by.get(c)!.val).join(" and ")} ${kids.length === 2 ? "join" : "joins"} the back of the queue.` : " It has no children to add."}` });
    }
    t.step({ line: 10, array: [], trees: view(), grid: grid(), stack: [], stackTitle: "Queue, front first", vars: { written: out.length }, done: "found",
      message: `Level order: [${out.join(", ")}]. Top to bottom, left to right. The queue held at most one level's worth of nodes at a time.` });
  },
};

export const approaches = {
  preorder: dfs("pre", "preorder", "Depth-first: pre-order"),
  inorder: dfs("in", "inorder", "Depth-first: in-order"),
  postorder: dfs("post", "postorder", "Depth-first: post-order"),
  bfs,
};
