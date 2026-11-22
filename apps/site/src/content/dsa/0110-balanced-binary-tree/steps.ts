import { measureGrowth, type Approach, type Tone } from "@firstprinciples/ui";
import { build, isLeaf, treeFields, treePrepare, view, type TreeInput } from "../../concepts/54-tree-recursion/steps";
import { under } from "../0543-diameter-of-binary-tree/steps";

export type Input = TreeInput;
export const example: Input = { root: [5, 2, 8, 1, 4, 7, 9, null, null, 3, null, null, null, null, 10, null, null, null, 11] };
export const fields = treeFields;
export const prepare = treePrepare;

const topDown: Approach<Input> = {
  id: "topDown",
  name: "Check each node, measuring heights from scratch",
  code: `function isBalanced(node)
    if node = none
        return true
    l, r ← height(node.left), height(node.right)
    if abs(l - r) > 1
        return false
    if not isBalanced(node.left)
        return false
    return isBalanced(node.right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    const h = (id: string | null): number => { if (!id) return 0; t.op(); const n = tr.by.get(id)!; return 1 + Math.max(h(n.left), h(n.right)); };
    const ok = new Set<string>();
    t.step({ line: 2, array: [], trees: view(tr), vars: {},
      message: "A tree is balanced when, at every node, the two subtree heights differ by at most 1. Check the root, then check each subtree the same way, measuring heights from scratch each time." });
    let bad: string | null = null, asked = false;
    const go = (id: string | null): boolean => {
      if (!id) return true;
      const n = tr.by.get(id)!;
      const l = h(n.left), r = h(n.right), fine = Math.abs(l - r) <= 1;
      notes[id] = `${l}|${r}`;
      const scanned = [...under(tr, n.left), ...under(tr, n.right)];
      const ask = !asked && !isLeaf(n) && id !== tr.root ? (asked = true, { ask: { q: `At ${n.val}: left height ${l}, right height ${r}. Is it balanced here?`, options: [fine ? "Yes" : "No", fine ? "No" : "Yes"], answer: 0 } }) : {};
      t.step({ ...ask, line: fine ? 7 : 6, array: [], trees: view(tr, { ...Object.fromEntries([...ok].map((x) => [x, "settled" as Tone])), ...Object.fromEntries(scanned.map((x) => [x, "compare" as Tone])), [id]: fine ? "active" : "miss" }, notes, id), vars: { node: n.val, left: l, right: r },
        message: isLeaf(n) ? `${n.val} is a leaf: both heights are 0, fine.` : `At ${n.val}: heights ${l} and ${r}, measured by walking ${scanned.length === 1 ? "the 1 node" : `all ${scanned.length} nodes`} below (blue). ${fine ? `They differ by ${Math.abs(l - r)}: fine here. Now check each subtree.` : `They differ by ${Math.abs(l - r)}: not balanced.`}` });
      if (!fine) { bad = id; return false; }
      ok.add(id);
      return go(n.left) && go(n.right);
    };
    const res = go(tr.root);
    t.step({ line: res ? 9 : 6, array: [], trees: view(tr, { ...Object.fromEntries([...ok].map((x) => [x, "settled" as Tone])), ...(bad ? { [bad]: "miss" } : {}) }, notes), vars: { balanced: res ? "true" : "false" }, done: res ? "found" : "notfound",
      message: `${res ? "Every node passed: balanced." : `Node ${tr.by.get(bad!)!.val} fails, so the tree is not balanced.`} But each check re-measures everything below it, so nodes are walked once per ancestor: O(n log n) for a balanced tree.` });
  },
};

const bottomUp: Approach<Input> = {
  id: "bottomUp",
  name: "Return the height, or −1 for unbalanced",
  code: `function isBalanced(root)
    return check(root) ≠ -1
function check(node)  // height, or -1 if unbalanced
    if node = none
        return 0
    l ← check(node.left)
    r ← check(node.right)
    if l = -1 or r = -1 or abs(l - r) > 1
        return -1  // pass the bad news up
    return 1 + max(l, r)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, stack: string[] = [];
    let asked = false;
    const tones: Record<string, Tone> = {};
    t.step({ line: 2, array: [], trees: view(tr), stack: [], vars: {},
      message: "Compute heights bottom-up, once. Each call returns its height, or −1 to mean \"something at or below me is unbalanced\". A −1 from either child is passed straight up." });
    const go = (id: string | null): number => {
      if (!id) return 0;
      const n = tr.by.get(id)!;
      stack.push(`check(${n.val})`);
      const l = go(n.left), r = go(n.right);
      t.op();
      const childBad = l === -1 || r === -1, gap = !childBad && Math.abs(l - r) > 1;
      const ret = childBad || gap ? -1 : 1 + Math.max(l, r);
      notes[id] = ret === -1 ? "−1" : `h${ret}`;
      tones[id] = ret === -1 ? "miss" : "settled";
      const opts = ["−1", String(1 + Math.max(l, r))];
      const ask = !asked && gap ? (asked = true, { ask: { q: `At ${n.val}: left height ${l}, right height ${r}. What does it return?`, options: opts, answer: 0 } }) : {};
      t.step({ ...ask, line: ret === -1 ? 9 : 10, array: [], trees: view(tr, { ...tones, [id]: ret === -1 ? "miss" : "found" }, notes, id), stack: [...stack], vars: { node: n.val, left: l, right: r, returns: ret },
        message: childBad ? `At ${n.val}: a child returned −1, so pass −1 up without comparing anything.` : gap ? `At ${n.val}: heights ${l} and ${r} differ by ${Math.abs(l - r)}. Unbalanced: return −1.` : isLeaf(n) ? `${n.val} is a leaf: height 1.` : `At ${n.val}: heights ${l} and ${r} differ by at most 1. Return height ${ret}.` });
      stack.pop();
      return ret;
    };
    const res = go(tr.root) !== -1;
    t.step({ line: 2, array: [], trees: view(tr, tones, notes), stack: [], vars: { balanced: res ? "true" : "false" }, done: res ? "found" : "notfound",
      message: `The root returned ${res ? "a height" : "−1"}: ${res ? "balanced" : "not balanced"}. Every node was visited once: O(n) time, O(h) for the recursion.` });
  },
};

export const approaches = { topDown, bottomUp };

/** A perfect tree of n nodes: balanced everywhere, so the top-down check visits everything, re-measuring at every level. */
export const growth = measureGrowth(
  [{ approach: topDown, slot: 1 }, { approach: bottomUp, slot: 3 }],
  (n) => ({ root: Array.from({ length: n }, (_, i) => i + 1) }),
  [7, 15, 31, 63, 127],
);
