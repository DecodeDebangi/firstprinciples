import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../54-tree-recursion/steps";
import { bstError, num, viewOf } from "../57-binary-search-trees/steps";

/** Floor and ceiling in a BST: the largest value ≤ x and the smallest value ≥ x, each found on one path down. */
export type Input = { root: (number | null)[]; x: number };
export const example: Input = { root: [20, 10, 30, 5, 15, 25, 40, null, null, 12, 18], x: 17 };
export const fields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }, { key: "x", label: "x", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> { const e = bstError(raw.root); return e ? { error: e } : { input: raw }; }

function bound(kind: "floor" | "ceiling"): Approach<Input> {
  const fl = kind === "floor";
  return {
    id: kind, name: fl ? "Floor: the largest value ≤ x" : "Ceiling: the smallest value ≥ x",
    code: fl ? `function floor(root, x)  // largest value ≤ x
    best ← none
    node ← root
    while node ≠ none
        if node.val = x
            return x
        if node.val < x
            best ← node.val  // a candidate
            node ← node.right  // try bigger
        else
            node ← node.left
    return best
` : `function ceiling(root, x)  // smallest value ≥ x
    best ← none
    node ← root
    while node ≠ none
        if node.val = x
            return x
        if node.val > x
            best ← node.val  // a candidate
            node ← node.left  // try smaller
        else
            node ← node.right
    return best
`,
    run({ root: vals, x }, t) {
      const tr = build(vals), tones: Record<string, Tone> = {};
      let id = tr.root, best: string | null = null, asked = 0;
      t.step({ line: 3, array: [], trees: viewOf(tr), vars: { x, best: "none" },
        message: fl ? `Find the largest value that is ≤ ${x}. Walk down as if searching for ${x}. Every value smaller than ${x} on the way is a candidate, and a better one can only be to its right.` : `Find the smallest value that is ≥ ${x}. Walk down as if searching for ${x}. Every value bigger than ${x} on the way is a candidate, and a better one can only be to its left.` });
      while (id) {
        t.op();
        const n = tr.by.get(id)!, v = num(n);
        if (v === x) { t.step({ line: 6, array: [], trees: viewOf(tr, { ...tones, [id]: "found" }, { node: id }), vars: { x, node: v }, done: "found", message: `${v} is exactly ${x}: that's the answer.` }); return; }
        const cand = fl ? v < x : v > x;
        const ask = asked < 2 ? (asked++, { ask: { q: `${v} is ${v < x ? "smaller" : "bigger"} than ${x}. What happens?`, options: fl ? [`It's a candidate; go right for a bigger one`, `Go left: it's too big`] : [`It's a candidate; go left for a smaller one`, `Go right: it's too small`], answer: cand ? 0 : 1 } }) : {};
        if (cand) { if (best) tones[best] = "visited"; best = id; tones[id] = "side-a"; } else tones[id] = "discard";
        const next = fl ? (cand ? n.right : n.left) : (cand ? n.left : n.right);
        t.step({ ...ask, line: cand ? 9 : 11, array: [], trees: viewOf(tr, { ...tones, ...(best ? { [best]: "found" } : {}) }, { node: next, ...(best ? { best } : {}) }), vars: { x, node: v, best: best ? num(tr.by.get(best)!) : "none" },
          message: cand ? `${v} is ${fl ? "below" : "above"} ${x}: the best candidate so far. Anything ${fl ? "bigger" : "smaller"} that still qualifies is in its ${fl ? "right" : "left"} subtree.` : `${v} is ${fl ? "above" : "below"} ${x}, so it can't be the answer, and neither can anything to its ${fl ? "right" : "left"}. Go ${fl ? "left" : "right"}.` });
        id = next;
      }
      t.step({ line: 12, array: [], trees: viewOf(tr, best ? { [best]: "found" } : {}), vars: { x, answer: best ? num(tr.by.get(best)!) : "none" }, done: best ? "found" : "notfound",
        message: best ? `The path ends. The ${kind} of ${x} is ${num(tr.by.get(best)!)}, the last candidate. One path down: O(h).` : `The path ends with no candidate: nothing in the tree is ${fl ? "≤" : "≥"} ${x}.` });
    },
  };
}
export const approaches = { floor: bound("floor"), ceiling: bound("ceiling") };
