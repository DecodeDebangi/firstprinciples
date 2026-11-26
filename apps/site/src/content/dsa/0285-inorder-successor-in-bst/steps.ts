import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, inorderVals, succExample, succFields, succPrepare, successor, viewOf, type SuccInput } from "../../concepts/57-binary-search-trees/steps";

export type Input = SuccInput;
export const example = succExample;
export const fields = succFields;
export const prepare = succPrepare;

const listAll: Approach<Input> = {
  id: "list",
  name: "Write out the in-order list",
  code: `function inorderSuccessor(root, p)
    vals ← values of root, in order
    for i ← 0 to length(vals) - 2
        if vals[i] = p.val
            return vals[i + 1]
    return none
`,
  run({ root: vals, p }, t) {
    const tr = build(vals);
    const pid = tr.nodes.find((n) => n.val === p)!.id;
    t.step({ line: 2, array: [], trees: viewOf(tr, { [pid]: "active" }), vars: { p },
      message: `The successor is whatever comes right after ${p} when the tree is read in order. So read the whole tree in order, then look for ${p}.` });
    const list = inorderVals(tr);
    t.op(list.length);
    t.step({ line: 2, array: [], grid: { title: "vals, in order", rows: [list] }, trees: viewOf(tr, { ...Object.fromEntries(tr.nodes.map((n) => [n.id, "visited" as Tone])), [pid]: "active" }), vars: { p, "length(vals)": list.length },
      message: `In order: [${list.join(", ")}]. All ${list.length} nodes were read.` });
    const i = list.indexOf(p);
    t.op(i + 1);
    const next = i + 1 < list.length ? list[i + 1] : null;
    t.step({ line: next !== null ? 5 : 6, array: [], grid: { title: "vals, in order", rows: [list], tones: { [`0,${i}`]: "active", ...(next !== null ? { [`0,${i + 1}`]: "found" } : {}) } }, trees: viewOf(tr, { [pid]: "active", ...(next !== null ? { [tr.nodes.find((n) => n.val === next)!.id]: "found" } : {}) }), vars: { p, succ: next ?? "none" },
      done: next !== null ? "found" : "notfound",
      message: next !== null ? `${p} is at position ${i}; right after it comes ${next}, the successor. But finding it meant reading all ${list.length} nodes and storing them: O(n).` : `${p} is last in the list: it has no successor. Return none, after reading all ${list.length} nodes.` });
  },
};

export const approaches = { list: listAll, walk: successor };

/** A balanced BST of n nodes, asking for the successor of its largest value but one. */
export const growth = measureGrowth(
  [{ approach: listAll, slot: 1 }, { approach: successor, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), p: 2 * n - 2 }),
  [7, 15, 31, 63, 127],
);
