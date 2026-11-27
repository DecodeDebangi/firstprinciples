import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/**
 * N-ary trees (LeetCode 589, 590, 429): a node has any number of children. The input is LeetCode's list for them: the
 * root, then for each node in level order its children, each group ended by a null, e.g. [1, null, 2, 3, null, 4].
 */
export type NaryInput = { root: (number | null)[] };
export const naryExample: NaryInput = { root: [1, null, 2, 3, 4, null, 5, 6, null, 7, null, 8, 9, 10] };
export const naryFields: InputField[] = [{ key: "root", label: "tree (children groups end with null)", kind: "tree" }];
export type Nary = { root: string | null; nodes: TreeNodeData[]; by: Map<string, TreeNodeData> };

/** Reads the list: the root, a null, then each node's children in level order, each group closed by a null. */
export function parseNary(vals: (number | null)[]): Nary | string {
  if (!vals.length) return { root: null, nodes: [], by: new Map() };
  if (vals[0] === null) return "The list must start with the root's value.";
  if (vals.length > 1 && vals[1] !== null) return "After the root comes a null, then the root's children.";
  const nodes: TreeNodeData[] = [];
  const make = (k: number) => { const n: TreeNodeData = { id: `n${k}`, val: vals[k] as number, left: null, right: null, kids: [] }; nodes.push(n); return n; };
  const queue = [make(0)];
  let i = 2;
  while (i < vals.length) {
    const p = queue.shift();
    if (!p) return "There are more groups of children than nodes to give them to.";
    while (i < vals.length && vals[i] !== null) { const c = make(i); p.kids!.push(c.id); queue.push(c); i++; }
    i++; // the null closing this group
  }
  return { root: nodes[0].id, nodes, by: new Map(nodes.map((n) => [n.id, n])) };
}
export function naryPrepare(raw: NaryInput): Prepared<NaryInput> {
  const tr = parseNary(raw.root);
  if (typeof tr === "string") return { error: tr };
  if (!tr.root) return { error: "Give at least the root." };
  if (tr.nodes.length > 14) return { error: "Use at most 14 nodes so the tree fits." };
  return { input: raw };
}
const tree = (raw: NaryInput) => parseNary(raw.root) as Nary;
const val = (tr: Nary, id: string) => tr.by.get(id)!.val as number;
const kids = (tr: Nary, id: string) => tr.by.get(id)!.kids ?? [];
const view = (tr: Nary, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {}, layout: "compact" }];
const list = (a: (number | string)[]) => `[${a.join(", ")}]`;
const settled = (ids: string[]) => Object.fromEntries(ids.map((k) => [k, "settled" as Tone]));

/* ---------- Pre-order and post-order, recursively ---------- */
export function naryRecursive(order: "pre" | "post"): Approach<NaryInput> {
  const pre = order === "pre";
  return {
    id: "recursive", name: "Recursive",
    code: pre ? `function preorder(root)
    out ← []
    visit(root)
    return out
function visit(node)
    if node = none
        return
    out.push(node.val)  // the node first
    for each child c of node, left to right
        visit(c)
` : `function postorder(root)
    out ← []
    visit(root)
    return out
function visit(node)
    if node = none
        return
    for each child c of node, left to right
        visit(c)
    out.push(node.val)  // the node last
`,
    run(raw, t) {
      const tr = tree(raw), out: number[] = [], done: string[] = [], calls: string[] = [];
      let asked = 0;
      t.step({ line: 3, array: [], trees: view(tr, {}), stack: [], stackTitle: "calls waiting", vars: { out: "[]" },
        message: pre ? "Same as a binary tree's pre-order, but a node can have any number of children: write the node down, then visit each child's subtree in turn, left to right." : "Same as a binary tree's post-order, but with any number of children: visit each child's subtree in turn, left to right, and write the node down only after all of them." });
      const go = (id: string) => {
        t.op();
        calls.push(String(val(tr, id)));
        if (pre) {
          out.push(val(tr, id)); done.push(id);
          t.step({ line: 8, array: [], trees: view(tr, { ...settled(done), [id]: "found" }, {}, id), stack: [...calls], stackTitle: "calls waiting", vars: { node: val(tr, id), out: list(out) },
            message: `Visit ${val(tr, id)}: write it down first.${kids(tr, id).length ? ` Then its ${kids(tr, id).length} child${kids(tr, id).length === 1 ? "" : "ren"}, ${kids(tr, id).map((k) => val(tr, k)).join(", ")}, one at a time.` : " It has no children."}` });
        } else if (kids(tr, id).length) {
          t.step({ line: 9, array: [], trees: view(tr, { ...settled(done), [id]: "active" }, {}, id), stack: [...calls], stackTitle: "calls waiting", vars: { node: val(tr, id), out: list(out) },
            message: `At ${val(tr, id)}: not yet. First its children ${kids(tr, id).map((k) => val(tr, k)).join(", ")}, each subtree in full.` });
        }
        for (const c of kids(tr, id)) go(c);
        if (!pre) {
          const ask = asked < 2 && kids(tr, id).length ? (asked++, { ask: { q: `All of ${val(tr, id)}'s children are written. What comes next?`, options: [`Write ${val(tr, id)}`, `Visit ${val(tr, id)}'s first child again`, "Move to the next level"], answer: 0 } }) : {};
          out.push(val(tr, id)); done.push(id);
          t.step({ ...ask, line: 10, array: [], trees: view(tr, { ...settled(done), [id]: "found" }, {}, id), stack: [...calls], stackTitle: "calls waiting", vars: { node: val(tr, id), out: list(out) },
            message: kids(tr, id).length ? `Every child of ${val(tr, id)} is done: now write ${val(tr, id)}.` : `${val(tr, id)} has no children: write it.` });
        }
        calls.pop();
      };
      if (tr.root) go(tr.root);
      t.step({ line: 4, array: [], trees: view(tr, settled(done)), stack: [], stackTitle: "calls waiting", vars: { out: list(out) }, done: "found",
        message: `${pre ? "Pre-order" : "Post-order"}: ${list(out)}. Each node is visited once: O(n). The waiting calls go as deep as the tree: O(h) memory.` });
    },
  };
}

/* ---------- Pre-order and post-order with a stack ---------- */
export function naryStack(order: "pre" | "post"): Approach<NaryInput> {
  const pre = order === "pre";
  return {
    id: "stack", name: pre ? "Iterative, with a stack" : "Iterative: mirrored pre-order, reversed",
    code: pre ? `function preorder(root)
    out, stack ← [], empty stack
    if root ≠ none
        stack.push(root)
    while stack not empty
        node ← stack.pop()
        out.push(node.val)
        for each child c of node, right to left
            stack.push(c)  // leftmost ends on top
    return out
` : `function postorder(root)
    out, stack ← [], empty stack
    if root ≠ none
        stack.push(root)
    while stack not empty
        node ← stack.pop()
        out.push(node.val)
        for each child c of node, left to right
            stack.push(c)  // rightmost ends on top
    return reverse(out)
`,
    run(raw, t) {
      const tr = tree(raw), out: number[] = [], done: string[] = [];
      const stack = tr.root ? [tr.root] : [];
      let asked = 0;
      const frames = () => stack.map((k) => String(val(tr, k)));
      t.step({ line: 4, array: [], trees: view(tr, {}), stack: frames(), stackTitle: "stack (top last)", vars: { out: "[]" },
        message: pre ? "Replace the waiting calls with a stack of nodes still to visit. Pop a node, write it, and push its children so the leftmost child is on top: it's popped next, just as recursion would visit it next." : "Post-order is hard to do directly with a stack, but its reverse is easy: node first, then children right to left. Build that (a pre-order that pushes children left to right), then reverse it." });
      while (stack.length) {
        t.op();
        const id = stack.pop()!;
        out.push(val(tr, id)); done.push(id);
        const ks = kids(tr, id), pushed = pre ? [...ks].reverse() : ks;
        const ask = asked < 2 && ks.length > 1 && val(tr, ks[0]) !== val(tr, ks[ks.length - 1]) ? (asked++, { ask: { q: `${val(tr, id)} is written. Its children ${ks.map((k) => val(tr, k)).join(", ")} go on the stack. Which one ends up on top?`, options: pre ? [String(val(tr, ks[0])), String(val(tr, ks[ks.length - 1]))] : [String(val(tr, ks[ks.length - 1])), String(val(tr, ks[0]))], answer: 0 } }) : {};
        for (const c of pushed) { t.op(); stack.push(c); }
        t.step({ ...ask, line: 9, array: [], trees: view(tr, { ...settled(done), ...Object.fromEntries(stack.map((k) => [k, "side-b" as Tone])), [id]: "found" }, {}, id), stack: frames(), stackTitle: "stack (top last)", vars: { node: val(tr, id), out: list(out) },
          message: `Pop ${val(tr, id)} and write it.${ks.length ? ` Push ${pushed.map((k) => val(tr, k)).join(", ")} in that order, so ${val(tr, pushed[pushed.length - 1])} is on top.` : " No children to push."}` });
      }
      const final = pre ? out : [...out].reverse();
      t.step({ line: 10, array: [], trees: view(tr, settled(done)), stack: [], stackTitle: "stack (top last)", vars: { ...(pre ? {} : { built: list(out) }), out: list(final) }, done: "found",
        message: pre ? `Pre-order: ${list(final)}. Each node is pushed and popped once: O(n), with the stack holding at most O(n) nodes.` : `Built ${list(out)}: each node before its children, children right to left. Reversed, every node comes after all its children, and children run left to right: post-order, ${list(final)}. O(n).` });
    },
  };
}

/* ---------- Level order ---------- */
export const naryBfs: Approach<NaryInput> = {
  id: "bfs", name: "Breadth-first, one level at a time",
  code: `function levelOrder(root)
    out ← []
    if root = none
        return out
    queue ← [root]
    while queue not empty
        level ← []
        repeat length(queue) times
            node ← take from the front of queue
            level.push(node.val)
            add each child of node to queue
        out.push(level)
    return out
`,
  run(raw, t) {
    const tr = tree(raw), out: number[][] = [], done: string[] = [];
    let q = tr.root ? [tr.root] : [], asked = 0;
    const fmt = () => list(out.map((l) => list(l)));
    t.step({ line: 5, array: [], trees: view(tr, {}), stack: q.map((k) => String(val(tr, k))).reverse(), stackTitle: "queue (front last)", vars: { out: "[]" },
      message: "A queue hands out nodes in the order they were found. At the start of each round, the queue holds exactly one level, so take that many nodes, and queue up their children for the next round." });
    while (q.length) {
      const level: number[] = [], next: string[] = [];
      const ask = asked < 1 && q.length > 1 ? (asked++, { ask: { q: `The queue holds ${q.map((k) => val(tr, k)).join(", ")}. How many nodes does this round take?`, options: [String(q.length), "1", String(q.length + 1)], answer: 0 } }) : {};
      for (const id of q) { t.op(); level.push(val(tr, id)); done.push(id); for (const c of kids(tr, id)) { t.op(); next.push(c); } }
      out.push(level);
      t.step({ ...ask, line: 12, array: [], trees: view(tr, { ...settled(done), ...Object.fromEntries(q.map((k) => [k, "found" as Tone])), ...Object.fromEntries(next.map((k) => [k, "side-b" as Tone])) }), stack: next.map((k) => String(val(tr, k))).reverse(), stackTitle: "queue (front last)", vars: { level: list(level), out: fmt() },
        message: `This round takes ${q.length} node${q.length === 1 ? "" : "s"}: ${level.join(", ")}. ${q.length === 1 ? "Its" : "Their"} children${next.length ? `, ${next.map((k) => val(tr, k)).join(", ")},` : " (none)"} wait in the queue for the next round.` });
      q = next;
    }
    t.step({ line: 13, array: [], trees: view(tr, settled(done)), stack: [], stackTitle: "queue (front last)", vars: { out: fmt() }, done: "found",
      message: `${out.length} level${out.length === 1 ? "" : "s"}: ${fmt()}. Each node enters and leaves the queue once: O(n). The queue holds up to one whole level.` });
  },
};
export const naryDfsLevels: Approach<NaryInput> = {
  id: "dfs", name: "Depth-first, filing each node by its depth",
  code: `function levelOrder(root)
    out ← []
    visit(root, 0)
    return out
function visit(node, depth)
    if node = none
        return
    if depth = length(out)
        out.push([])  // first node on this level
    out[depth].push(node.val)
    for each child c of node
        visit(c, depth + 1)
`,
  run(raw, t) {
    const tr = tree(raw), out: number[][] = [], done: string[] = [];
    const fmt = () => list(out.map((l) => list(l)));
    let asked = 0;
    t.step({ line: 3, array: [], trees: view(tr, {}), vars: { out: "[]" },
      message: "Level order doesn't need a breadth-first walk. Any walk works if each node is filed under its depth: a depth-first walk still meets each level's nodes left to right, because it visits children left to right." });
    const go = (id: string, d: number) => {
      t.op();
      const first = d === out.length;
      const ask = asked < 2 && d > 0 ? (asked++, { ask: { q: `${val(tr, id)} is at depth ${d}, and out has ${out.length} level${out.length === 1 ? "" : "s"} so far. What happens?`, options: first ? [`Start a new level and put ${val(tr, id)} in it`, `Add ${val(tr, id)} to level ${d - 1}`] : [`Add ${val(tr, id)} to the end of level ${d}`, "Start a new level"], answer: 0 } }) : {};
      if (first) out.push([]);
      out[d].push(val(tr, id)); done.push(id);
      t.step({ ...ask, line: first ? 9 : 10, array: [], trees: view(tr, { ...settled(done), [id]: "found" }, { [id]: `depth ${d}` }, id), vars: { node: val(tr, id), depth: d, out: fmt() },
        message: first ? `${val(tr, id)} is the first node seen at depth ${d}: start level ${d} with it.` : `${val(tr, id)} is at depth ${d}: add it to the end of level ${d}.` });
      for (const c of kids(tr, id)) go(c, d + 1);
    };
    if (tr.root) go(tr.root, 0);
    t.step({ line: 4, array: [], trees: view(tr, settled(done)), vars: { out: fmt() }, done: "found",
      message: `${fmt()}, the same as breadth-first. Each node is visited once: O(n). Memory is the recursion, as deep as the tree, instead of a queue as wide as a level.` });
  },
};
