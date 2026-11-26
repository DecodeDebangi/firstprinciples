import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, deleteExample, deleteFields, deletePrepare, inorderVals, remove, viewOf, type DeleteInput } from "../../concepts/57-binary-search-trees/steps";

export type Input = DeleteInput;
export const example = deleteExample;
export const fields = deleteFields;
export const prepare = deletePrepare;

const rebuild: Approach<Input> = {
  id: "rebuild",
  name: "Rebuild without the key",
  code: `function deleteNode(root, key)
    vals ← values of root, in order  // sorted
    remove key from vals
    return build(vals, 0, length(vals) - 1)
function build(vals, lo, hi)
    if lo > hi
        return none
    mid ← floor((lo + hi) / 2)
    node ← new node(vals[mid])
    node.left ← build(vals, lo, mid - 1)
    node.right ← build(vals, mid + 1, hi)
    return node
`,
  run({ root: vals, key }, t) {
    const tr = build(vals);
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { key },
      message: `Avoid the tricky cases entirely: write out every value, drop ${key}, and build a fresh tree from what's left.` });
    const sorted = inorderVals(tr);
    t.op(sorted.length);
    t.step({ line: 2, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, "visited" as Tone]))), grid: { title: "vals (in order)", rows: [sorted] }, vars: { key, "length(vals)": sorted.length },
      message: `Read the tree in order: [${sorted.join(", ")}]. That's every node, ${sorted.length} of them, even though only one is changing.` });
    const at = sorted.indexOf(key);
    const rest = sorted.filter((v) => v !== key);
    t.step({ line: 3, array: [], trees: viewOf(tr, Object.fromEntries(tr.nodes.map((n) => [n.id, (n.val === key ? "miss" : "visited") as Tone]))), grid: { title: "vals (in order)", rows: [sorted], tones: at >= 0 ? { [`0,${at}`]: "miss" } : {} }, vars: { key, "length(vals)": rest.length },
      message: at >= 0 ? `Remove ${key} from the list.` : `${key} isn't in the list, so nothing is removed.` });
    t.op(rest.length);
    const fresh = build(balancedLevelOrder(rest.length, rest));
    t.step({ line: 12, array: [], trees: viewOf(fresh, Object.fromEntries(fresh.nodes.map((n) => [n.id, "settled" as Tone]))), grid: { title: "vals", rows: [rest.length ? rest : ["empty"]] }, vars: { key, nodes: rest.length }, done: at >= 0 ? "found" : "notfound",
      message: `Build a new tree with the middle value as the root, then the same for each half. It's a valid BST, and balanced, but making it read and rebuilt all ${rest.length} nodes: O(n) time and O(n) extra memory.` });
  },
};

export const approaches = { rebuild, walk: remove };

/** A balanced BST of n nodes, deleting its largest value. */
export const growth = measureGrowth(
  [{ approach: rebuild, slot: 1 }, { approach: remove, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), key: 2 * n }),
  [7, 15, 31, 63, 127],
);
