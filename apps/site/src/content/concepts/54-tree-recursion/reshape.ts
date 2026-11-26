import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { build, type Tree } from "./steps";

/** Reshaping a tree in place (LeetCode 114, 116, 117). Both approaches are O(n) time; they differ in extra memory. */
export type RootInput = { root: (number | null)[] };
export const rootFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
export function anyPrepare(raw: RootInput): Prepared<RootInput> { const real = raw.root.filter((x) => x !== null); if (!real.length || raw.root[0] === null) return { error: "Give at least one node." }; return real.length > 13 ? { error: "Use at most 13 nodes so the tree fits." } : { input: raw }; }
export function perfectPrepare(raw: RootInput): Prepared<RootInput> {
  const n = raw.root.length;
  if (![1, 3, 7, 15].includes(n) || raw.root.some((x) => x === null)) return { error: "Give a perfect tree: 1, 3, 7 or 15 values, no nulls (every level full)." };
  return { input: raw };
}
const snap = (nodes: TreeNodeData[]) => nodes.map((n) => ({ ...n }));
const v = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const view = (tr: Tree, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData[] =>
  [{ root: tr.root, nodes: snap(tr.nodes), tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];

/* ---------- 114 Flatten ---------- */
export const flatExample: RootInput = { root: [1, 2, 5, 3, 4, null, 6] };
const preIds = (tr: Tree) => { const out: string[] = []; const go = (id: string | null) => { if (!id) return; out.push(id); go(tr.by.get(id)!.left); go(tr.by.get(id)!.right); }; go(tr.root); return out; };
export const flatList: Approach<RootInput> = {
  id: "list", name: "Write out the nodes in pre-order, then relink",
  code: `function flatten(root)
    nodes ← the nodes of root, in pre-order
    for i ← 0 to length(nodes) - 2
        nodes[i].left ← none
        nodes[i].right ← nodes[i + 1]
`,
  run({ root: vals }, t) {
    const tr = build(vals), nodes = preIds(tr);
    nodes.forEach(() => t.op());
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: { title: "nodes, in pre-order", rows: [nodes.map((n) => v(tr, n))] }, vars: { stored: nodes.length },
      message: `The flattened list must follow pre-order (node, left subtree, right subtree), going down right pointers only. The simple way: write out the nodes in that order first: ${nodes.map((n) => v(tr, n)).join(", ")}.` });
    for (let i = 0; i < nodes.length - 1; i++) {
      t.op();
      const n = tr.by.get(nodes[i])!;
      n.left = null; n.right = nodes[i + 1];
      t.step({ line: 5, array: [], trees: view(tr, { [nodes[i]]: "found", [nodes[i + 1]]: "compare" }, {}, nodes[i]), grid: { title: "nodes, in pre-order", rows: [nodes.map((x) => v(tr, x))], tones: { [`0,${i}`]: "found", [`0,${i + 1}`]: "compare" } }, vars: { i },
        message: `${v(tr, nodes[i])}: no left child, and its right child is the next node in the list, ${v(tr, nodes[i + 1])}.` });
    }
    t.step({ line: 5, array: [], trees: view(tr, Object.fromEntries(nodes.map((n) => [n, "settled" as Tone]))), vars: { stored: nodes.length }, done: "found",
      message: `Flattened: ${nodes.map((n) => v(tr, n)).join(" → ")}. O(n) time, but the list of nodes costs O(n) extra memory.` });
  },
};
export const flatInPlace: Approach<RootInput> = {
  id: "inPlace", name: "Splice each left subtree in, in place",
  code: `function flatten(root)
    node ← root
    while node ≠ none
        if node.left ≠ none
            last ← rightmost node of node.left
            last.right ← node.right
            node.right ← node.left
            node.left ← none
        node ← node.right
`,
  run({ root: vals }, t) {
    const tr = build(vals), done: string[] = [];
    let id = tr.root, asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: {}, message: "In pre-order, a node's whole left subtree comes before its right subtree, and the left subtree's last node is its rightmost one. So hang the right subtree under that rightmost node, then move the left subtree over to the right." });
    while (id) {
      t.op();
      const n = tr.by.get(id)!;
      if (n.left) {
        let last = n.left; const path = [last];
        while (tr.by.get(last)!.right) { t.op(); last = tr.by.get(last)!.right!; path.push(last); }
        const q = asked < 2 ? (asked++, { ask: { q: `${n.val} has a left subtree. Where does its right subtree${n.right ? ` (starting at ${v(tr, n.right)})` : ""} go?`, options: [`Under ${v(tr, last)}, the rightmost node of the left subtree`, `Under ${v(tr, n.left)}, the left child`], answer: 0 } }) : {};
        const qq = q.ask && q.ask.options[0] !== q.ask.options[1] ? q : {};
        tr.by.get(last)!.right = n.right; n.right = n.left; n.left = null;
        t.step({ ...qq, line: 8, array: [], trees: view(tr, { ...Object.fromEntries(done.map((d) => [d, "settled" as Tone])), ...Object.fromEntries(path.map((p) => [p, "compare" as Tone])), [id]: "found" }, {}, id), vars: { node: n.val, rightmost: v(tr, last) },
          message: `${n.val}: the rightmost node of its left subtree is ${v(tr, last)}. Hang ${n.val}'s old right subtree under ${v(tr, last)}, then move the left subtree over to the right. Nothing is stored.` });
      }
      done.push(id);
      id = n.right;
    }
    t.step({ line: 9, array: [], trees: view(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "settled" as Tone]))), vars: {}, done: "found",
      message: "Flattened in place. Each node is the current node once, and each rightmost search walks edges that are never walked again by another search: O(n) time and O(1) extra memory." });
  },
};

/* ---------- 116 / 117 Next pointers ---------- */
export const perfectExample: RootInput = { root: [1, 2, 3, 4, 5, 6, 7] };
export const anyExample: RootInput = { root: [1, 2, 3, 4, 5, null, 7, 8] };
const noteNext = (tr: Tree, next: Map<string, string | null>) => Object.fromEntries([...next.entries()].map(([k, n]) => [k, n ? `→${v(tr, n)}` : "→∅"]));
export const nextBfs: Approach<RootInput> = {
  id: "queue", name: "Level by level with a queue",
  code: `function connect(root)
    queue ← queue of [root]
    while queue not empty
        size, prev ← length(queue), none
        repeat size times
            node ← queue.popFront()
            if prev ≠ none
                prev.next ← node
            prev ← node
            queue.push(node's children)
    return root
`,
  run({ root: vals }, t) {
    const tr = build(vals), next = new Map<string, string | null>();
    let q = tr.root ? [tr.root] : [], most = q.length;
    t.step({ line: 2, array: [], trees: view(tr, {}), stack: q.map((x) => String(v(tr, x))).reverse(), stackTitle: "queue (front last)", vars: {},
      message: "Each node's next pointer should point to the node to its right on the same level (or nothing at the end). A level-by-level walk with a queue meets the nodes of each level left to right: link each one to the one before it." });
    while (q.length) {
      const lv = q;
      lv.forEach((x, i) => { t.op(); next.set(x, lv[i + 1] ?? null); });
      q = lv.flatMap((x) => [tr.by.get(x)!.left, tr.by.get(x)!.right].filter(Boolean) as string[]);
      most = Math.max(most, q.length);
      t.step({ line: 8, array: [], trees: view(tr, Object.fromEntries(lv.map((x) => [x, "found" as Tone])), noteNext(tr, next)), stack: q.map((x) => String(v(tr, x))).reverse(), stackTitle: "queue (front last)", vars: { level: lv.map((x) => v(tr, x)).join(" → "), "queue holds": q.length },
        message: `Level ${lv.map((x) => v(tr, x)).join(", ")}: link each to the next, and ${lv.map((x) => v(tr, x)).at(-1)} to nothing. Their children wait in the queue.` });
    }
    t.step({ line: 11, array: [], trees: view(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "settled" as Tone])), noteNext(tr, next)), vars: { "most in the queue": most }, done: "found",
      message: `Every level is linked. O(n) time, but the queue held up to ${most} nodes: O(w) extra memory, the width of the widest level.` });
  },
};
function levelAbove(general: boolean): Approach<RootInput> {
  return {
    id: "links", name: general ? "Walk each level by its next links, building the level below" : "Walk each level by its next links",
    code: general ? `function connect(root)
    head ← root  // leftmost node of the level
    while head ≠ none
        dummy ← new node(0)  // placeholder head
        tail, node ← dummy, head
        while node ≠ none
            for each child c of node, left first
                tail.next ← c
                tail ← c
            node ← node.next
        head ← dummy.next
    return root
` : `function connect(root)
    leftmost ← root
    while leftmost ≠ none and leftmost.left ≠ none
        node ← leftmost
        while node ≠ none
            node.left.next ← node.right
            if node.next ≠ none
                node.right.next ← node.next.left
            node ← node.next
        leftmost ← leftmost.left
    return root
`,
    run({ root: vals }, t) {
      const tr = build(vals), next = new Map<string, string | null>();
      if (tr.root) next.set(tr.root, null);
      let head = tr.root, asked = 0;
      t.step({ line: 2, array: [], trees: view(tr, {}, noteNext(tr, next)), vars: {},
        message: general ? "Once a level is linked, it's a linked list: walk it with next pointers and no queue. While walking it, link its children into the level below, using a placeholder head so the first child has something to attach to." : "Once a level is linked, walk it with next pointers instead of a queue. In a perfect tree each node's left child links to its right child, and its right child links to the left child of the node's next." });
      while (head && (general || tr.by.get(head)!.left)) {
        const row: string[] = [];
        let node: string | null = head;
        while (node) { t.op(); row.push(node); node = next.get(node) ?? null; }
        const kids = row.flatMap((x) => [tr.by.get(x)!.left, tr.by.get(x)!.right].filter(Boolean) as string[]);
        if (!kids.length) break;
        kids.forEach((c, i) => { t.op(); next.set(c, kids[i + 1] ?? null); });
        const last = row[row.length - 1], firstRight = tr.by.get(row[0])!.right;
        const q = general ? (asked < 2 && kids.length > 1 ? (asked++, { ask: { q: `Walking ${row.map((x) => v(tr, x)).join(" → ")}, their children get linked in order. Which one becomes the head of the level below?`, options: [String(v(tr, kids[0])), String(v(tr, kids[kids.length - 1]))], answer: 0 } }) : {}) : asked < 2 && row.length > 1 && firstRight ? (asked++, { ask: { q: `${v(tr, row[0])}'s right child is ${v(tr, firstRight)}, and ${v(tr, row[0])}.next is ${v(tr, row[1])}. Where does ${v(tr, firstRight)}.next point?`, options: [String(v(tr, tr.by.get(row[1])!.left!)), String(v(tr, tr.by.get(row[0])!.left!))], answer: 0 } }) : {};
        t.step({ ...q, line: general ? 10 : 9, array: [], trees: view(tr, { ...Object.fromEntries(row.map((x) => [x, "side-a" as Tone])), ...Object.fromEntries(kids.map((c) => [c, "found" as Tone])) }, noteNext(tr, next)), vars: { "walking": row.map((x) => v(tr, x)).join(" → "), linked: kids.map((c) => v(tr, c)).join(" → ") },
          message: `Walk ${row.map((x) => v(tr, x)).join(" → ")} by its next pointers, linking their children in order: ${kids.map((c) => v(tr, c)).join(" → ")}.${!general && row.length > 1 ? " A right child reaches across to the next node's left child." : ""}${last ? "" : ""}` });
        head = kids[0];
      }
      t.step({ line: general ? 12 : 11, array: [], trees: view(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "settled" as Tone])), noteNext(tr, next)), vars: {}, done: "found",
        message: "Every level is linked. Each node is visited a constant number of times, O(n) time, and nothing is stored beyond a few pointers: O(1) extra memory." });
    },
  };
}
export const nextPerfect = levelAbove(false), nextGeneral = levelAbove(true);
