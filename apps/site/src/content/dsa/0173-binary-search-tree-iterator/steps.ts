import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { bstError, inorderVals, num, viewOf } from "../../concepts/57-binary-search-trees/steps";

/** The BST, then the calls made on the iterator, e.g. "next next hasNext next". */
export type Input = { root: (number | null)[]; calls: string };
export const example: Input = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4], calls: "next next hasNext next next next" };
export const fields: InputField[] = [
  { key: "root", label: "BST (level order)", kind: "tree" },
  { key: "calls", label: "calls (next or hasNext)", kind: "raw" },
];
const parseCalls = (s: string) => s.split(/[\s,]+/).filter(Boolean);
export function prepare(raw: Input): Prepared<Input> {
  const e = bstError(raw.root); if (e) return { error: e };
  const calls = parseCalls(raw.calls);
  if (!calls.length || calls.length > 12 || calls.some((c) => c !== "next" && c !== "hasNext")) return { error: 'Use 1 to 12 calls, each "next" or "hasNext".' };
  if (calls.filter((c) => c === "next").length > raw.root.filter((v) => v !== null).length) return { error: "There are more next() calls than values in the tree." };
  return { input: { root: raw.root, calls: calls.join(" ") } };
}
const outGrid = (out: (string | number)[], hl = false) => ({ title: "returned", rows: [out.length ? [...out] : ["—"]], tones: hl && out.length ? { [`0,${out.length - 1}`]: "found" as Tone } : {} });

const flatten: Approach<Input> = {
  id: "flatten",
  name: "Write out every value first",
  code: `class BSTIterator
    constructor(root)
        this.vals ← values of root, in order
        this.i ← 0
    function next()
        this.i += 1
        return this.vals[this.i - 1]
    function hasNext()
        return this.i < length(this.vals)
`,
  run({ root: vals, calls }, t) {
    const tr = build(vals);
    const out: (string | number)[] = [];
    const list = inorderVals(tr);
    t.op(list.length);
    t.step({ line: 3, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "visited" as Tone]))), grid: { title: "this.vals", rows: [list] }, vars: { i: 0, stored: list.length },
      message: `The iterator must hand out the values in order, one per next(). Easiest: read the whole tree in order up front and keep the list: [${list.join(", ")}]. That stores all ${list.length} values before a single call.` });
    let i = 0;
    for (const c of parseCalls(calls)) {
      t.op();
      if (c === "next") { i++; out.push(list[i - 1]); }
      else out.push(i < list.length ? "true" : "false");
      t.step({ line: c === "next" ? 7 : 9, array: [], trees: viewOf(tr, { ...Object.fromEntries(tr.nodes.map((n) => [n.id, (inorderVals(tr).indexOf(num(n)) < i ? "settled" : "visited") as Tone])) }), grid: { title: "this.vals · returned", rows: [list, out.length ? [...out] : ["—"]], tones: { ...(i ? { [`0,${i - 1}`]: c === "next" ? "found" as Tone : "settled" as Tone } : {}), [`1,${out.length - 1}`]: "found" } },
        vars: { i, stored: list.length }, message: c === "next" ? `next(): return vals[${i - 1}] = ${list[i - 1]}. O(1).` : `hasNext(): ${i} < ${list.length}, so ${out[out.length - 1]}.` });
    }
    t.step({ line: 9, array: [], trees: viewOf(tr), grid: outGrid(out), vars: { stored: list.length }, done: "found",
      message: `Returned [${out.join(", ")}]. Every call is O(1), but the list holds all n values the whole time: O(n) extra memory.` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Keep a stack of the left path",
  code: `class BSTIterator
    constructor(root)
        this.stack ← empty stack
        this.pushLeft(root)
    function pushLeft(node)
        while node ≠ none
            this.stack.push(node)
            node ← node.left
    function next()
        node ← this.stack.pop()
        this.pushLeft(node.right)
        return node.val
    function hasNext()
        return this.stack not empty
`,
  run({ root: vals, calls }, t) {
    const tr = build(vals);
    const st: string[] = [], done = new Set<string>(), out: (string | number)[] = [];
    let most = 0, asked = 0;
    const pushLeft = (id: string | null) => { const added: string[] = []; while (id) { t.op(); st.push(id); added.push(id); id = tr.by.get(id)!.left; } most = Math.max(most, st.length); return added; };
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...done].map((k) => [k, "settled" as Tone])), ...Object.fromEntries(st.map((k) => [k, "side-b" as Tone])), ...extra });
    const frames = () => st.map((k) => String(num(tr.by.get(k)!)));
    const v = (k: string) => num(tr.by.get(k)!);
    t.step({ line: 3, array: [], trees: viewOf(tr), stack: [], stackTitle: "stack (top first)", grid: outGrid(out), vars: { "stack size": 0 },
      message: "Instead of storing every value, keep only the nodes still waiting: the path down the left side. The smallest value is always on top." });
    const first = pushLeft(tr.root);
    t.step({ line: 7, array: [], trees: viewOf(tr, tones()), stack: frames(), stackTitle: "stack (top first)", grid: outGrid(out), vars: { "stack size": st.length },
      message: `Push the root and keep going left: ${first.map(v).join(", ")}. The last one pushed, ${v(first[first.length - 1])}, is the smallest value in the tree.` });
    for (const c of parseCalls(calls)) {
      if (c === "hasNext") {
        t.op(); out.push(st.length ? "true" : "false");
        t.step({ line: 14, array: [], trees: viewOf(tr, tones()), stack: frames(), stackTitle: "stack (top first)", grid: outGrid(out, true), vars: { "stack size": st.length },
          message: `hasNext(): the stack ${st.length ? "isn't empty" : "is empty"}, so ${out[out.length - 1]}.` });
        continue;
      }
      const top = st[st.length - 1];
      const others = [...new Set([...tr.nodes.filter((n) => !done.has(n.id) && n.id !== top).map((n) => String(n.val))])];
      const q = asked < 2 && others.length ? (asked++, { ask: { q: `next() is called. Which value comes back?`, options: [String(v(top)), others[others.length - 1]], answer: 0 } }) : {};
      t.op();
      st.pop(); done.add(top); out.push(v(top));
      const right = tr.by.get(top)!.right;
      const added = pushLeft(right);
      t.step({ ...q, line: 12, array: [], trees: viewOf(tr, tones({ [top]: "found" }), { node: top }), stack: frames(), stackTitle: "stack (top first)", grid: outGrid(out, true), vars: { "stack size": st.length },
        message: `next(): pop ${v(top)} and return it.${added.length ? ` It has a right subtree, so push its left path: ${added.map(v).join(", ")}. The smallest of those is now on top.` : " It has no right subtree, so nothing is pushed; the next smallest is already on top."}` });
    }
    t.step({ line: 14, array: [], trees: viewOf(tr, tones()), stack: frames(), stackTitle: "stack (top first)", grid: outGrid(out), vars: { "most on the stack": most }, done: "found",
      message: `Returned [${out.join(", ")}]. The stack never held more than ${most} node${most === 1 ? "" : "s"}, one per level: O(h) memory. One next() can push several nodes, but each node is pushed and popped once overall, so next() is O(1) on average.` });
  },
};

export const approaches = { flatten, stack };
