import { measureGrowth, treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { root: (number | null)[] };

export const example: Input = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 9] };

export const fields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length) return { error: "Give at least one node." };
  return { input: raw };
}

const fmt = (x: number) => (x === Infinity ? "∞" : x === -Infinity ? "−∞" : String(x));

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Check every subtree against every node",
  code: `function valid(root)
    if root = none
        return true
    if any value under root.left ≥ root.val
        return false
    if any value under root.right ≤ root.val
        return false
    return valid(root.left) and valid(root.right)
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const sub = (id: string | null): string[] => (id ? [id, ...sub(by.get(id)!.left), ...sub(by.get(id)!.right)] : []);
    const ok = new Set<string>();
    t.step({ line: 2, array: [], trees: [{ root, nodes }], vars: { node: null },
      message: "The definition, checked literally: everything in a node's left subtree is smaller, everything in its right subtree is bigger, at every node." });
    const go = (id: string | null): boolean => {
      if (!id) return true;
      const n = by.get(id)!;
      const L = sub(n.left), R = sub(n.right);
      t.op(L.length + R.length);
      const badL = L.find((x) => (by.get(x)!.val as number) >= (n.val as number));
      const badR = R.find((x) => (by.get(x)!.val as number) <= (n.val as number));
      const base: Record<string, Tone> = { ...Object.fromEntries([...ok].map((x) => [x, "settled" as Tone])), ...Object.fromEntries(L.map((x) => [x, "side-a" as Tone])), ...Object.fromEntries(R.map((x) => [x, "side-b" as Tone])) };
      if (badL || badR) {
        const bad = (badL ?? badR)!;
        t.step({ line: badL ? 5 : 7, array: [], trees: [{ root, nodes, tones: { ...base, [id]: "compare", [bad]: "miss" }, pointers: { node: id } }], vars: { node: n.val }, done: "notfound",
          message: badL ? `${by.get(bad)!.val} is in ${n.val}'s left subtree but isn't smaller than ${n.val}. Not a valid BST.` : `${by.get(bad)!.val} is in ${n.val}'s right subtree but isn't bigger than ${n.val}. Not a valid BST.` });
        return false;
      }
      ok.add(id);
      t.step({ line: 8, array: [], trees: [{ root, nodes, tones: { ...base, [id]: "compare" }, pointers: { node: id } }], vars: { node: n.val, checked: L.length + R.length },
        message: `All ${L.length} value${L.length === 1 ? "" : "s"} on the left are below ${n.val} and all ${R.length} on the right are above it. Those subtrees will be re-read for every node inside them.` });
      return go(n.left) && go(n.right);
    };
    if (go(root)) t.step({ line: 8, array: [], trees: [{ root, nodes, tones: Object.fromEntries(nodes.map((n) => [n.id, "settled" as Tone])) }], vars: { node: null }, done: "found",
      message: "Every node passed: it's a valid BST, but values deep in the tree were checked once per ancestor." });
  },
};

const inorder: Approach<Input> = {
  id: "inorder",
  name: "In-order traversal must increase",
  code: `function valid(root)
    prev ← none
    function inorder(node)
        // prev is shared by every call
        if node = none
            return true
        if not inorder(node.left)
            return false
        if prev ≠ none and node.val ≤ prev
            return false
        prev ← node.val
        return inorder(node.right)
    return inorder(root)
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    let prev: number | null = null;
    const seen: string[] = [];
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), ...extra });
    const notes = () => Object.fromEntries(seen.map((x, k) => [x, `#${k + 1}`]));
    t.step({ line: 2, array: [], trees: [{ root, nodes }], vars: { prev: "none" },
      message: "In-order means left subtree, node, right subtree. For a BST that visits the values in increasing order, so just check each value beats the previous one." });
    let failed = false;
    const go = (id: string | null) => {
      if (!id || failed) return;
      const n = by.get(id)!;
      go(n.left);
      if (failed) return;
      t.op();
      const v = n.val as number;
      const okay = prev === null || v > prev;
      const ask = { q: `In order, the previous value was ${prev ?? "nothing"}. The next is ${v}. Still increasing?`, options: ["Yes: keep going", "No: not a valid BST"], answer: okay ? 0 : 1 };
      if (!okay) {
        failed = true;
        t.step({ ask, line: 10, array: [], trees: [{ root, nodes, tones: tones({ [id]: "miss" }), notes: notes(), pointers: { node: id } }], vars: { prev, node: v }, done: "notfound",
          message: `${v} comes after ${prev} in order but isn't bigger. Not a valid BST.` });
        return;
      }
      seen.push(id);
      t.step({ ask, line: 11, array: [], trees: [{ root, nodes, tones: tones({ [id]: "found" }), notes: notes(), pointers: { node: id } }], vars: { prev: v, node: v },
        message: prev === null ? `${v} is the first value in order.` : `${v} > ${prev}. Still increasing.` });
      prev = v;
      go(n.right);
    };
    go(root);
    if (!failed) t.step({ line: 13, array: [], trees: [{ root, nodes, tones: tones(), notes: notes() }], vars: { prev }, done: "found",
      message: "The in-order values only ever increased: it's a valid BST, checked with one visit per node." });
  },
};

const bounds: Approach<Input> = {
  id: "bounds",
  name: "Pass down allowed ranges",
  code: `function valid(root, lo, hi)  // start: -∞, ∞
    if root = none
        return true
    if not (lo < root.val and root.val < hi)
        return false
    return valid(root.left, lo, root.val)
            and valid(root.right, root.val, hi)
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const notes: Record<string, string> = {};
    const ok = new Set<string>();
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...ok].map((x) => [x, "settled" as Tone])), ...extra });
    t.step({ line: 1, array: [], trees: [{ root, nodes }], vars: { lo: "−∞", hi: "∞" },
      message: "Every node inherits a range from its ancestors: going left caps the maximum, going right raises the minimum. Each node only checks its own range." });
    let failed = false;
    const go = (id: string | null, lo: number, hi: number) => {
      if (!id || failed) return;
      const n = by.get(id)!;
      const v = n.val as number;
      t.op();
      notes[id] = `(${fmt(lo)}, ${fmt(hi)})`;
      const inside = lo < v && v < hi;
      const ask = { q: `${v} must be inside (${fmt(lo)}, ${fmt(hi)}). Is it?`, options: ["Yes: check its children with tighter ranges", "No: return false"], answer: inside ? 0 : 1 };
      if (!inside) {
        failed = true;
        t.step({ ask, line: 5, array: [], trees: [{ root, nodes, tones: tones({ [id]: "miss" }), notes: { ...notes }, pointers: { node: id } }], vars: { lo: fmt(lo), hi: fmt(hi), node: v }, done: "notfound",
          message: `${v} is outside (${fmt(lo)}, ${fmt(hi)}): some ancestor needs it to be ${v <= lo ? `bigger than ${fmt(lo)}` : `smaller than ${fmt(hi)}`}. Not a valid BST.` });
        return;
      }
      ok.add(id);
      t.step({ ask, line: 6, array: [], trees: [{ root, nodes, tones: tones({ [id]: "found" }), notes: { ...notes }, pointers: { node: id } }], vars: { lo: fmt(lo), hi: fmt(hi), node: v },
        message: `${v} is inside (${fmt(lo)}, ${fmt(hi)}). Its left child must stay below ${v}, its right child above ${v}.` });
      go(n.left, lo, v);
      go(n.right, v, hi);
    };
    go(root, -Infinity, Infinity);
    if (!failed) t.step({ line: 7, array: [], trees: [{ root, nodes, tones: tones(), notes: { ...notes } }], vars: { lo: "−∞", hi: "∞" }, done: "found",
      message: "Every node sat inside its range: it's a valid BST, one check per node." });
  },
};

export const approaches = { brute: bruteForce, inorder, bounds };

/** Worst case for the brute force: a valid BST shaped like a chain. */
const worstCase = (n: number): Input => ({ root: Array.from({ length: n }, (_, i) => [i, null]).flat().slice(0, 2 * n - 1) as (number | null)[] });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: bounds, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
