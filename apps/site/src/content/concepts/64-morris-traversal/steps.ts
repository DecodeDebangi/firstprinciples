import { measureGrowth, type Approach, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, treeFields, treePrepare, type Tree, type TreeInput } from "../54-tree-recursion/steps";
import { iterative } from "../09-tree-traversals/iterative";

/**
 * Morris traversal: in-order with O(1) extra memory. Before going left, it borrows the right pointer of the node
 * that comes just before the current one (the rightmost node of its left side) to leave a way back, then removes
 * it on the way back up. The tree is left exactly as it was found.
 */
export const fields = treeFields;
export const prepare = treePrepare;
export const example: TreeInput = { root: [6, 2, 9, 1, 4, 7, null, null, null, 3] };

const tone = (ids: string[], t: Tone) => Object.fromEntries(ids.map((id) => [id, t]));

export const morris: Approach<TreeInput> = {
  id: "morris", name: "Morris: borrow empty right pointers as a way back",
  code: `function morrisInorder(root)
    out, cur ← [], root
    while cur ≠ none
        if cur.left = none
            out.push(cur.val)
            cur ← cur.right
        else
            pre ← lastBefore(cur)
            if pre.right = none  // first time here
                pre.right ← cur  // a way back
                cur ← cur.left
            else  // came back along the thread
                pre.right ← none  // undo it
                out.push(cur.val)
                cur ← cur.right
    return out
function lastBefore(cur)  // rightmost on the left
    pre ← cur.left
    while pre.right ≠ none and pre.right ≠ cur
        pre ← pre.right
    return pre
`,
  run({ root: vals }, t) {
    const tr: Tree = build(vals), out: number[] = [], written: string[] = [];
    // Threads live beside the tree, so the drawing keeps its shape; `right` below means "real child or thread".
    const thread = new Map<string, string>();
    const right = (id: string) => thread.get(id) ?? tr.by.get(id)!.right;
    let maxThreads = 0, asked = 0;
    const show = (extra: Record<string, Tone>, ptrs: Record<string, string | null>): TreeData[] => [{ root: tr.root, nodes: tr.nodes, tones: { ...tone(written, "settled"), ...extra }, pointers: ptrs, threads: [...thread.entries()] }];
    const rec = (s: Parameters<typeof t.step>[0]) => { if (t.record) t.step(s); };
    rec({ line: 2, array: [], trees: show({}, {}), vars: { out: "[]", threads: 0 },
      message: "In-order needs to come back up to a node after finishing its left side. Recursion and the stack version remember the way back in memory. Morris remembers it in the tree itself: the last node before cur in order always has an empty right pointer, so it can borrow that." });
    let cur = tr.root;
    while (cur) {
      t.op();
      const c = tr.by.get(cur)!;
      if (!c.left) {
        out.push(c.val as number); written.push(cur);
        rec({ line: 5, array: [], trees: show({ [cur]: "found" }, { cur }), vars: { cur: c.val, out: `[${out.join(", ")}]`, threads: thread.size },
          message: `${c.val} has no left side, so nothing comes before it: write it down. Then go right${right(cur) && thread.has(cur) ? `, which is a borrowed pointer back up to ${tr.by.get(right(cur)!)!.val}` : ""}.` });
        cur = right(cur);
        continue;
      }
      let pre = c.left;
      const path = [pre];
      while (right(pre) && right(pre) !== cur) { t.op(); pre = right(pre)!; path.push(pre); }
      const p = tr.by.get(pre)!;
      if (!thread.has(pre)) {
        const q = asked < 2 ? (asked++, { ask: { q: `${p.val} is the last node before ${c.val} in order, and its right pointer is empty. What does Morris do?`, options: [`Point ${p.val}'s right at ${c.val}, then go left`, `Write ${c.val} down`, `Push ${c.val} on a stack`], answer: 0 } }) : {};
        thread.set(pre, cur); maxThreads = Math.max(maxThreads, thread.size);
        rec({ ...q, line: 10, array: [], trees: show({ ...tone(path, "compare"), [pre]: "active", [cur]: "found" }, { cur, pre }), vars: { cur: c.val, pre: p.val, threads: thread.size },
          message: `First time at ${c.val}. Its left side ends at ${p.val} (go left once, then right as far as possible). ${p.val}'s right pointer is empty, so point it at ${c.val}: after finishing the left side, the walk will follow it back here. Now go left.` });
        cur = c.left;
      } else {
        const q = asked < 3 ? (asked++, { ask: { q: `Back at ${c.val}: ${p.val}'s right already points here. What does that mean?`, options: [`${c.val}'s left side is finished: undo the pointer and write ${c.val}`, `Go left again`, `The tree has a loop and the walk must stop`], answer: 0 } }) : {};
        thread.delete(pre);
        out.push(c.val as number); written.push(cur);
        rec({ ...q, line: 14, array: [], trees: show({ [pre]: "discard", [cur]: "found" }, { cur, pre }), vars: { cur: c.val, pre: p.val, out: `[${out.join(", ")}]`, threads: thread.size },
          message: `Found ${p.val}'s right already pointing at ${c.val}: the walk has come back, so ${c.val}'s left side is done. Remove the borrowed pointer, write ${c.val} down, and go right${thread.has(cur) ? `, which is itself a borrowed pointer up to ${tr.by.get(thread.get(cur)!)!.val}` : ""}.` });
        cur = right(cur);
      }
    }
    rec({ line: 16, array: [], trees: show({}, {}), vars: { out: `[${out.join(", ")}]`, "most threads at once": maxThreads }, done: "found",
      message: `In order: ${out.join(", ")}. Every borrowed pointer was removed, so the tree is back as it was. Extra memory: a couple of variables, O(1). Each edge is walked at most a few times, so it's still O(n).` });
  },
};

export const withStack = iterative("in");
export const approaches = { stack: withStack, morris };

/** A chain going left: the stack version holds the whole chain at once, Morris holds two pointers. */
export const leftChain = (n: number) => { const out: (number | null)[] = [n]; for (let i = n - 1; i >= 1; i--) out.push(i, null); while (out[out.length - 1] === null) out.pop(); return out; };
