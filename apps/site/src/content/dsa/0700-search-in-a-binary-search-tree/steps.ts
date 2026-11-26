import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, num, search, searchExample, searchFields, searchPrepare, viewOf, type SearchInput } from "../../concepts/57-binary-search-trees/steps";

export type Input = SearchInput;
export const example = searchExample;
export const fields = searchFields;
export const prepare = searchPrepare;

const everyNode: Approach<Input> = {
  id: "every",
  name: "Check every node",
  code: `function searchBST(root, val)
    if root = none or root.val = val
        return root
    found ← searchBST(root.left, val)
    if found ≠ none
        return found
    return searchBST(root.right, val)
`,
  run({ root: vals, val }, t) {
    const tr = build(vals);
    const tones: Record<string, Tone> = {};
    let hit: string | null = null;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { val },
      message: `Ignore the order and search like any binary tree: look at the node, then the whole left subtree, then the whole right subtree.` });
    const go = (id: string | null): string | null => {
      if (!id) return null;
      const n = tr.by.get(id)!;
      t.op();
      if (num(n) === val) { hit = id; return id; }
      tones[id] = "visited";
      t.step({ line: 4, array: [], trees: viewOf(tr, { ...tones, [id]: "compare" }, { node: id }), vars: { val, node: num(n), looked: Object.keys(tones).length },
        message: `${num(n)} isn't ${val}. Search all of its left subtree next, even when ${val} ${val > num(n) ? `is bigger than ${num(n)} and can't be there` : "could be there"}.` });
      return go(n.left) ?? go(n.right);
    };
    go(tr.root);
    t.step({ line: hit ? 3 : 7, array: [], trees: viewOf(tr, hit ? { ...tones, [hit]: "found" } : tones, hit ? { node: hit } : {}), vars: { val, looked: Object.keys(tones).length + (hit ? 1 : 0) }, done: hit ? "found" : "notfound",
      message: hit ? `Found ${val} after looking at ${Object.keys(tones).length + 1} of ${tr.nodes.length} nodes. When the value is missing, every node gets a look: O(n).` : `${val} isn't in the tree, and finding that out took a look at all ${tr.nodes.length} nodes: O(n).` });
  },
};

export const approaches = { every: everyNode, follow: search };

/** A balanced BST of n nodes, searching for a value that isn't there. */
export const growth = measureGrowth(
  [{ approach: everyNode, slot: 1 }, { approach: search, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), val: 2 * n + 1 }),
  [7, 15, 31, 63, 127],
);
