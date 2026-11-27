import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, bstError, num, viewOf } from "../../concepts/57-binary-search-trees/steps";

export type Input = { root: (number | null)[] };
export const example: Input = { root: [40, 20, 70, 10, 30, 60, 90, null, null, 25] };
export const fields: InputField[] = [{ key: "root", label: "BST (level order)", kind: "tree" }];
export function prepare(raw: Input): Prepared<Input> {
  const e = bstError(raw.root); if (e) return { error: e };
  if (raw.root.filter((x) => x !== null).length < 2) return { error: "Give at least two nodes, so there's a pair to compare." };
  return { input: raw };
}

const pairs: Approach<Input> = {
  id: "pairs", name: "Compare every pair",
  code: `function getMinimumDifference(root)
    vals ← every value in the tree
    best ← infinity
    for each pair a, b in vals
        best ← min(best, abs(a − b))
    return best
`,
  run({ root: vals }, t) {
    const tr = build(vals), ids = tr.nodes.map((n) => n.id);
    let best = Infinity, bestPair: [string, string] = [ids[0], ids[1]];
    if (t.record) t.step({ line: 2, array: [], trees: viewOf(tr), vars: { best: "∞" }, message: "The direct way ignores the order: compare every value with every other and keep the smallest gap." });
    ids.forEach((a, i) => {
      for (let j = i + 1; j < ids.length; j++) { t.op(); const d = Math.abs(num(tr.by.get(a)!) - num(tr.by.get(ids[j])!)); if (d < best) { best = d; bestPair = [a, ids[j]]; } }
      if (t.record && i < ids.length - 1) t.step({ line: 5, array: [], trees: viewOf(tr, { ...Object.fromEntries(ids.slice(i + 1).map((x) => [x, "compare" as Tone])), [a]: "active", [bestPair[0]]: "found", [bestPair[1]]: "found" }), vars: { node: num(tr.by.get(a)!), compared: ids.length - 1 - i, best },
        message: `Compare ${num(tr.by.get(a)!)} with the ${ids.length - 1 - i} value${ids.length - 1 - i === 1 ? "" : "s"} after it. Smallest gap so far: ${best}, between ${num(tr.by.get(bestPair[0])!)} and ${num(tr.by.get(bestPair[1])!)}.` });
    });
    if (t.record) t.step({ line: 6, array: [], trees: viewOf(tr, { [bestPair[0]]: "found", [bestPair[1]]: "found" }), vars: { answer: best }, done: "found",
      message: `The smallest gap is ${best}. Every pair was compared: n(n − 1)/2 comparisons, O(n²).` });
  },
};

const inorder: Approach<Input> = {
  id: "inorder", name: "In-order walk, comparing neighbours",
  code: `function getMinimumDifference(root)
    prev, best ← none, infinity
    visit(root)
    return best
function visit(node)  // in-order: smallest first
    if node = none
        return
    visit(node.left)
    if prev ≠ none
        best ← min(best, node.val − prev)
    prev ← node.val
    visit(node.right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), seen: string[] = [];
    let prev: string | null = null, best = Infinity, bestPair: [string, string] | null = null, asked = 0;
    if (t.record) t.step({ line: 3, array: [], trees: viewOf(tr), vars: { prev: "none", best: "∞" },
      message: "An in-order walk of a BST visits the values smallest first. The two closest values are always next to each other in that order, so compare each value only with the one just before it." });
    const go = (id: string | null) => {
      if (!id) return;
      const n = tr.by.get(id)!;
      go(n.left);
      t.op();
      const v = num(n), before = best;
      if (prev) { const d = v - num(tr.by.get(prev)!); if (d < best) { best = d; bestPair = [prev, id]; } }
      const p = prev ? num(tr.by.get(prev)!) : null;
      const ask = t.record && p !== null && asked < 2 ? (asked++, { ask: { q: `In-order, ${v} comes right after ${p}. The best gap so far is ${before === Infinity ? "∞" : before}. What is best now?`, options: [...new Set([String(Math.min(before, v - p)), String(v - p + 1), before === Infinity ? "∞" : String(before + 1)])], answer: 0 } }) : {};
      seen.push(id);
      if (t.record) t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: p === null ? 11 : 10, array: [], trees: viewOf(tr, { ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), ...(prev ? { [prev]: "compare" } : {}), [id]: "found" }, { node: id }), vars: { prev: p ?? "none", node: v, best: best === Infinity ? "∞" : best },
        message: p === null ? `The walk reaches ${v} first: it's the smallest value, with nothing before it to compare.` : `${v} comes right after ${p}: gap ${v - p}.${best < before ? " A new smallest gap." : ` Not smaller than ${before}.`}` });
      prev = id;
      go(n.right);
    };
    go(tr.root);
    if (t.record) t.step({ line: 4, array: [], trees: viewOf(tr, bestPair ? { [bestPair[0]]: "found", [bestPair[1]]: "found" } : {}), vars: { answer: best }, done: "found",
      message: `The smallest gap is ${best}. One walk, each value compared once with its neighbour: O(n) time, and O(h) for the recursion.` });
  },
};

export const approaches = { pairs, inorder };
/** A balanced BST of n values. */
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: inorder, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n) }),
  [7, 15, 31, 63, 127],
);
