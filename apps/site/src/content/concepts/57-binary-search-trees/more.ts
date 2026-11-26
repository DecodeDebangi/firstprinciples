import { type Approach, type InputField, type Prepared, type Tone, type TreeNodeData } from "@firstprinciples/ui";
import { build, type Tree } from "../54-tree-recursion/steps";
import { bstError, inorderVals, num, subtree, viewOf } from "./steps";

/** More binary search tree techniques (LeetCode 230, 653, 669, 99, 938, 538). */
const tf = (k: string, label: string): InputField => ({ key: k, label, kind: "number" });
const treeF: InputField = { key: "root", label: "BST (level order)", kind: "tree" };
const v = (tr: Tree, id: string) => num(tr.by.get(id)!);
const order = (tr: Tree) => { const out: string[] = []; const go = (id: string | null) => { if (!id) return; go(tr.by.get(id)!.left); out.push(id); go(tr.by.get(id)!.right); }; go(tr.root); return out; };
const settledAll = (tr: Tree, t: Tone = "settled") => Object.fromEntries(tr.nodes.map((n) => [n.id, t]));
const bstOnly = <I extends { root: (number | null)[] }>(extra?: (raw: I) => string | null) => (raw: I): Prepared<I> => { const e = bstError(raw.root, 13) ?? extra?.(raw) ?? null; return e ? { error: e } : { input: raw }; };

/* ---------- 230 Kth Smallest ---------- */
export type KInput = { root: (number | null)[]; k: number };
export const kExample: KInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], k: 3 };
export const kFields = [treeF, tf("k", "k")];
export const kPrepare = bstOnly<KInput>((r) => (!Number.isInteger(r.k) || r.k < 1 || r.k > r.root.filter((x) => x !== null).length ? "k must be from 1 to the number of nodes." : null));
export const kList: Approach<KInput> = {
  id: "list", name: "Write out every value in order",
  code: `function kthSmallest(root, k)
    vals ← values of root, in order
    return vals[k - 1]
`,
  run({ root: vals, k }, t) {
    const tr = build(vals), io = inorderVals(tr);
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { k }, message: `Reading a BST in order gives its values sorted, so the kth smallest is the kth value read. The simple way reads them all first.` });
    io.forEach(() => t.op());
    t.op();
    t.step({ line: 3, array: [], trees: viewOf(tr, { ...settledAll(tr, "visited"), [order(tr)[k - 1]]: "found" }), grid: { title: "in order", rows: [io], tones: { [`0,${k - 1}`]: "found" } }, vars: { k, answer: io[k - 1] }, done: "found",
      message: `In order: [${io.join(", ")}]. The ${k}th is ${io[k - 1]}. But all ${io.length} values were read and stored, even though only the first ${k} matter: O(n).` });
  },
};
export const kStack: Approach<KInput> = {
  id: "stop", name: "Walk in order, stop at the kth",
  code: `function kthSmallest(root, k)
    stack, node ← empty stack, root
    while true
        while node ≠ none
            stack.push(node)
            node ← node.left
        node ← stack.pop()
        k -= 1
        if k = 0
            return node.val
        node ← node.right
`,
  run({ root: vals, k: k0 }, t) {
    const tr = build(vals), st: string[] = [], done: string[] = [];
    let node = tr.root, k = k0, asked = 0;
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries(st.map((s) => [s, "side-b" as Tone])), ...Object.fromEntries(done.map((s) => [s, "visited" as Tone])), ...extra });
    t.step({ line: 2, array: [], trees: viewOf(tr), stack: [], stackTitle: "stack (top first)", vars: { k }, message: `Walk in order with a stack (go left as far as possible, pop, then go right), counting down k. Stop the moment the count reaches 0: nothing after the kth value is ever touched.` });
    for (;;) {
      const pushed: string[] = [];
      while (node) { t.op(); st.push(node); pushed.push(node); node = tr.by.get(node)!.left; }
      if (pushed.length) t.step({ line: 5, array: [], trees: viewOf(tr, tones()), stack: [...st].reverse().map((s) => String(v(tr, s))), stackTitle: "stack (top first)", vars: { k }, message: `Go left as far as possible, pushing ${pushed.map((s) => v(tr, s)).join(", ")}.` });
      const id = st.pop()!; t.op(); k--; done.push(id);
      const q = asked < 2 ? (asked++, { ask: { q: `Pop ${v(tr, id)}. It's value number ${k0 - k} in order. Is it the answer for k = ${k0}?`, options: [k === 0 ? "Yes: stop here" : "No: keep going", k === 0 ? "No: keep going" : "Yes: stop here"], answer: 0 } }) : {};
      if (k === 0) {
        t.step({ ...q, line: 10, array: [], trees: viewOf(tr, tones({ [id]: "found" }), { node: id }), stack: [...st].reverse().map((s) => String(v(tr, s))), stackTitle: "stack (top first)", vars: { k: 0, answer: v(tr, id) }, done: "found",
          message: `Pop ${v(tr, id)}: value number ${k0} in order. Stop. Only ${done.length + st.length} of ${tr.nodes.length} nodes were touched: O(h + k).` });
        return;
      }
      t.step({ ...q, line: 11, array: [], trees: viewOf(tr, tones({ [id]: "compare" }), { node: id }), stack: [...st].reverse().map((s) => String(v(tr, s))), stackTitle: "stack (top first)", vars: { k }, message: `Pop ${v(tr, id)}: value number ${k0 - k}. ${k} to go; move to its right child.` });
      node = tr.by.get(id)!.right;
    }
  },
};

/* ---------- 653 Two Sum IV ---------- */
export type TargetInput = { root: (number | null)[]; target: number };
export const tsExample: TargetInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], target: 14 };
export const tsFields = [treeF, tf("target", "target")];
export const tsPrepare = bstOnly<TargetInput>((r) => (!Number.isInteger(r.target) ? "Use a whole-number target." : null));
export const tsSearch: Approach<TargetInput> = {
  id: "search", name: "For each node, search for its partner",
  code: `function findTarget(root, k)
    for each node x in the tree
        y ← k - x.val
        if y ≠ x.val and search(root, y) ≠ none
            return true
    return false
`,
  run({ root: vals, target }, t) {
    const tr = build(vals);
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { target }, message: `For each value x, the partner it needs is ${target} − x. A BST can search for that in one walk down, so try every node.` });
    for (const id of order(tr)) {
      const x = v(tr, id), y = target - x;
      let at = tr.root; const path: string[] = [];
      while (at && v(tr, at) !== y) { t.op(); path.push(at); at = y < v(tr, at) ? tr.by.get(at)!.left : tr.by.get(at)!.right; }
      t.op();
      const hit = !!at && y !== x;
      t.step({ line: hit ? 5 : 4, array: [], trees: viewOf(tr, { ...Object.fromEntries(path.map((p) => [p, "compare" as Tone])), [id]: "active", ...(at ? { [at]: hit ? "found" : "miss" } : {}) }, { node: id }), vars: { x, "partner y": y },
        message: hit ? `${x} needs ${y}, and the search down from the root finds it. ${x} + ${y} = ${target}: return true.` : `${x} needs ${y}. ${y === x ? `That's ${x} itself, which can't be used twice.` : `Searching for ${y} walks ${path.length} node${path.length === 1 ? "" : "s"} and doesn't find it.`}` });
      if (hit) { t.step({ line: 5, array: [], trees: viewOf(tr, { [id]: "found", [at!]: "found" }), vars: { answer: "true" }, done: "found", message: `Found ${x} + ${y} = ${target}. In the worst case every node runs a search: O(n · h).` }); return; }
    }
    t.step({ line: 6, array: [], trees: viewOf(tr), vars: { answer: "false" }, done: "notfound", message: `No pair adds up to ${target}. Every node ran its own search down the tree: O(n · h).` });
  },
};
export const tsPointers: Approach<TargetInput> = {
  id: "pointers", name: "In-order list, then two pointers",
  code: `function findTarget(root, k)
    vals ← values of root, in order  // sorted
    lo, hi ← 0, length(vals) - 1
    while lo < hi
        s ← vals[lo] + vals[hi]
        if s = k
            return true
        if s < k
            lo += 1
        else
            hi -= 1
    return false
`,
  run({ root: vals, target }, t) {
    const tr = build(vals), io = inorderVals(tr);
    io.forEach(() => t.op());
    let lo = 0, hi = io.length - 1, asked = 0;
    t.step({ line: 3, array: io, pointers: io.length > 1 ? { lo, hi } : { lo }, trees: viewOf(tr, settledAll(tr, "visited")), vars: { target },
      message: `Read the tree in order: [${io.join(", ")}], already sorted. Now it's the two-pointer pair search: start at both ends; too small moves lo up, too big moves hi down.` });
    while (lo < hi) {
      t.op();
      const s = io[lo] + io[hi];
      const q = asked < 2 && s !== target ? (asked++, { ask: { q: `${io[lo]} + ${io[hi]} = ${s}, and the target is ${target}. Which pointer moves?`, options: [s < target ? "lo moves right: the sum is too small" : "hi moves left: the sum is too big", s < target ? "hi moves left" : "lo moves right"], answer: 0 } }) : {};
      if (s === target) { t.step({ line: 7, array: io, pointers: { lo, hi }, tones: { [lo]: "found", [hi]: "found" }, trees: viewOf(tr, settledAll(tr, "visited")), vars: { sum: s, answer: "true" }, done: "found", message: `${io[lo]} + ${io[hi]} = ${target}: return true. One in-order read plus one pass of the pointers: O(n).` }); return; }
      t.step({ ...q, line: s < target ? 9 : 11, array: io, pointers: { lo, hi }, tones: { [lo]: "compare", [hi]: "compare" }, badge: { at: s < target ? lo : hi, text: `${s} ${s < target ? "<" : ">"} ${target}` }, trees: viewOf(tr, settledAll(tr, "visited")), vars: { sum: s },
        message: s < target ? `${s} < ${target}: ${io[lo]} is too small to pair with anything left, so move lo right.` : `${s} > ${target}: ${io[hi]} is too big to pair with anything left, so move hi left.` });
      if (s < target) lo++; else hi--;
    }
    t.step({ line: 12, array: io, trees: viewOf(tr, settledAll(tr, "visited")), vars: { answer: "false" }, done: "notfound", message: `The pointers met: no pair adds up to ${target}. O(n) time and O(n) for the list.` });
  },
};

/* ---------- 669 Trim ---------- */
export type RangeInput = { root: (number | null)[]; low: number; high: number };
export const trimExample: RangeInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], low: 4, high: 10 };
export const rangeFields = [treeF, tf("low", "low"), tf("high", "high")];
export const rangePrepare = bstOnly<RangeInput>((r) => (!Number.isInteger(r.low) || !Number.isInteger(r.high) || r.low > r.high ? "Use whole numbers with low ≤ high." : null));
const preorderIds = (tr: Tree) => { const out: string[] = []; const go = (id: string | null) => { if (!id) return; out.push(id); go(tr.by.get(id)!.left); go(tr.by.get(id)!.right); }; go(tr.root); return out; };
export const trimInsert: Approach<RangeInput> = {
  id: "reinsert", name: "Insert the kept values into a new tree",
  code: `function trimBST(root, low, high)
    fresh ← none
    for each node x of root, in pre-order
        if low ≤ x.val ≤ high
            fresh ← insertIntoBST(fresh, x.val)
    return fresh
`,
  run({ root: vals, low, high }, t) {
    const tr = build(vals), out: TreeNodeData[] = [], by = new Map<string, TreeNodeData>();
    let froot: string | null = null;
    const fresh = (extra: Record<string, Tone> = {}) => ({ label: "trimmed", root: froot, nodes: out.map((n) => ({ ...n })), tones: { ...Object.fromEntries(out.map((n) => [n.id, "settled" as Tone])), ...extra } });
    t.step({ line: 2, array: [], trees: [viewOf(tr)[0], fresh()], vars: { low, high },
      message: `Keep the values from ${low} to ${high}. Inserting them into an empty tree in pre-order (parents before children) rebuilds exactly the same shape, minus the removed nodes.` });
    for (const id of preorderIds(tr)) {
      const x = v(tr, id); t.op();
      if (x < low || x > high) { t.step({ line: 4, array: [], trees: [viewOf(tr, { [id]: "miss" }, { node: id })[0], fresh()], vars: { x }, message: `${x} is outside ${low}–${high}: skip it.` }); continue; }
      let at = froot, parent: string | null = null;
      while (at) { t.op(); parent = at; at = x < num(by.get(at)!) ? by.get(at)!.left : by.get(at)!.right; }
      const n: TreeNodeData = { id: `f${id}`, val: x, left: null, right: null }; out.push(n); by.set(n.id, n);
      if (!parent) froot = n.id; else if (x < num(by.get(parent)!)) by.get(parent)!.left = n.id; else by.get(parent)!.right = n.id;
      t.step({ line: 5, array: [], trees: [viewOf(tr, { [id]: "found" }, { node: id })[0], fresh({ [n.id]: "found" })], vars: { x }, message: `${x} is kept: insert it into the new tree, walking down from its root.` });
    }
    t.step({ line: 6, array: [], trees: [viewOf(tr)[0], fresh()], vars: { kept: out.length }, done: "found", message: `${out.length} values kept. But each insert walked down the new tree: O(n · h), O(n²) for a chain.` });
  },
};
export const trimRec: Approach<RangeInput> = {
  id: "trim", name: "Trim recursively, skipping whole subtrees",
  code: `function trimBST(node, low, high)
    if node = none
        return none
    if node.val < low  // and so is its left
        return trimBST(node.right, low, high)
    if node.val > high  // and so is its right
        return trimBST(node.left, low, high)
    node.left ← trimBST(node.left, low, high)
    node.right ← trimBST(node.right, low, high)
    return node
`,
  run({ root: vals, low, high }, t) {
    const tr = build(vals), gone: Record<string, Tone> = {};
    let asked = 0;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { low, high }, message: `The order does most of the work. A node below ${low} takes its whole left subtree with it (all smaller still), so only its right subtree can survive; a node above ${high} likewise keeps only its left.` });
    const go = (id: string | null, attach: (to: string | null) => void) => {
      t.op();
      if (!id) { attach(null); return; }
      const n = tr.by.get(id)!, x = num(n);
      const kind = x < low ? "low" : x > high ? "high" : "keep";
      const q = asked < 3 ? (asked++, { ask: { q: `This node holds ${x}, and the range is ${low}–${high}. What happens?`, options: ["It's too small: drop it and its left subtree, keep trimming its right", "It's too big: drop it and its right subtree, keep trimming its left", "It stays; trim both of its subtrees"], answer: kind === "low" ? 0 : kind === "high" ? 1 : 2 } }) : {};
      if (kind !== "keep") {
        const dropped = [id, ...subtree(tr, kind === "low" ? n.left : n.right)];
        dropped.forEach((d) => (gone[d] = "discard"));
        const next = kind === "low" ? n.right : n.left;
        t.step({ ...q, line: kind === "low" ? 5 : 7, array: [], trees: viewOf(tr, { ...gone, ...(next ? { [next]: "active" } : {}) }, { node: id }), vars: { x },
          message: kind === "low" ? `${x} < ${low}: ${x} and its left subtree are all too small. Drop ${dropped.length === 1 ? "it" : `those ${dropped.length} nodes`} without looking inside, and put the trimmed right subtree in ${x}'s place.` : `${x} > ${high}: ${x} and its right subtree are all too big. Drop ${dropped.length === 1 ? "it" : `those ${dropped.length} nodes`} without looking inside, and put the trimmed left subtree in ${x}'s place.` });
        go(next, attach);
        return;
      }
      t.step({ ...q, line: 8, array: [], trees: viewOf(tr, { ...gone, [id]: "found" }, { node: id }), vars: { x }, message: `${x} is in range: it stays. Trim its left subtree, then its right.` });
      attach(id);
      go(n.left, (c) => (n.left = c));
      go(n.right, (c) => (n.right = c));
    };
    go(tr.root, (c) => (tr.root = c));
    const keep = new Set(subtree(tr, tr.root));
    tr.nodes = tr.nodes.filter((n) => keep.has(n.id));
    t.step({ line: 10, array: [], trees: viewOf(tr, settledAll(tr)), vars: { kept: tr.nodes.length }, done: "found", message: `Trimmed: ${tr.nodes.length} nodes left, same shape as before minus the removed ones. Each node is looked at once at most, and dropped subtrees are skipped entirely: O(n).` });
  },
};

/* ---------- 99 Recover ---------- */
export type RootInput = { root: (number | null)[] };
export const recoverExample: RootInput = { root: [6, 12, 9, 1, 4, null, 3] };
export const recoverFields = [{ key: "root", label: "tree (level order, two values swapped)", kind: "tree" } as InputField];
export function recoverPrepare(raw: RootInput): Prepared<RootInput> {
  const real = raw.root.filter((x) => x !== null) as number[];
  if (!real.length || raw.root[0] === null) return { error: "Give at least two nodes." };
  if (real.length > 13) return { error: "Use at most 13 nodes so the tree fits." };
  if (new Set(real).size !== real.length) return { error: "Values must be distinct." };
  const io = inorderVals(build(raw.root)), sorted = [...io].sort((a, b) => a - b);
  if (io.filter((x, i) => x !== sorted[i]).length !== 2) return { error: "Exactly two values must be swapped from a valid BST." };
  return { input: raw };
}
export const recoverSort: Approach<RootInput> = {
  id: "sort", name: "Sort the in-order values and compare",
  code: `function recoverTree(root)
    vals ← values of root, in order
    good ← sorted copy of vals
    for each index i, value x in vals
        if x ≠ good[i]
            mark the node holding x
    swap the values of the two marked nodes
`,
  run({ root: vals }, t) {
    const tr = build(vals), ids = order(tr), io = ids.map((i) => v(tr, i));
    io.forEach(() => t.op());
    // Counted as a general comparison sort costs, n · ⌈log₂ n⌉: JavaScript's own sort is unusually quick on
    // nearly sorted input like this, which would hide the O(n log n) the approach costs in general.
    const good = [...io].sort((a, b) => a - b);
    t.op(io.length * Math.max(1, Math.ceil(Math.log2(io.length))));
    t.step({ line: 3, array: [], trees: viewOf(tr), grid: { title: "in order · sorted", rows: [io, good], rowLabels: ["now", "sorted"] }, vars: {},
      message: `In a correct BST the in-order values are sorted. Two values were swapped, so compare the in-order list with a sorted copy: the two positions that differ hold the culprits.` });
    const bad = io.map((x, i) => (x !== good[i] ? i : -1)).filter((i) => i >= 0);
    bad.forEach(() => t.op());
    t.step({ line: 6, array: [], trees: viewOf(tr, Object.fromEntries(bad.map((i) => [ids[i], "miss" as Tone]))), grid: { title: "in order · sorted", rows: [io, good], rowLabels: ["now", "sorted"], tones: Object.fromEntries(bad.flatMap((i) => [[`0,${i}`, "miss" as Tone], [`1,${i}`, "found" as Tone]])) }, vars: { swapped: `${io[bad[0]]} and ${io[bad[1]]}` },
      message: `Positions ${bad.join(" and ")} differ: ${io[bad[0]]} and ${io[bad[1]]} are in each other's places.` });
    const [a, b] = bad.map((i) => tr.by.get(ids[i])!);
    [a.val, b.val] = [b.val, a.val];
    t.step({ line: 7, array: [], trees: viewOf(tr, { [a.id]: "found", [b.id]: "found" }), vars: {}, done: "found", message: `Swap them back. Fixed, but sorting cost O(n log n) and the two lists O(n) memory.` });
  },
};
export const recoverWalk: Approach<RootInput> = {
  id: "walk", name: "One in-order walk, spotting the drops",
  code: `function recoverTree(root)
    first, second, prev ← none, none, none
    for each node x of root, in order
        if prev ≠ none and prev.val > x.val
            if first = none
                first ← prev
            second ← x
        prev ← x
    swap first.val and second.val
`,
  run({ root: vals }, t) {
    const tr = build(vals), ids = order(tr);
    let prev: string | null = null, first: string | null = null, second: string | null = null, asked = 0;
    const seen: string[] = [];
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries(seen.map((s) => [s, "visited" as Tone])), ...(first ? { [first]: "miss" as Tone } : {}), ...(second ? { [second]: "miss" as Tone } : {}), ...extra });
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { first: "none", second: "none" },
      message: `Read in order, a correct BST only goes up. A swap causes a drop, where a value is smaller than the one before it: once if the two swapped values were neighbours in order, otherwise twice. The first drop's bigger value and the last drop's smaller value are the culprits.` });
    for (const id of ids) {
      t.op(); seen.push(id);
      const x = v(tr, id), drop = prev !== null && v(tr, prev) > x;
      const q = asked < 2 && prev !== null ? (asked++, { ask: { q: `In order, ${v(tr, prev)} is followed by ${x}. Is that a drop?`, options: [drop ? `Yes: ${v(tr, prev)} > ${x}` : `No: ${v(tr, prev)} < ${x}`, drop ? "No" : "Yes"], answer: 0 } }) : {};
      if (drop) { if (!first) first = prev; second = id; }
      t.step({ ...q, line: drop ? 7 : 8, array: [], trees: viewOf(tr, tones({ [id]: drop ? "miss" : "active" }), { node: id }), vars: { prev: prev ? v(tr, prev) : "none", x, first: first ? v(tr, first) : "none", second: second ? v(tr, second) : "none" },
        message: drop ? `${v(tr, prev!)} > ${x}: a drop. ${first === prev ? `The bigger side, ${v(tr, prev!)}, is the first culprit; ${x} is the second for now.` : `${x} becomes the second culprit.`}` : prev ? `${v(tr, prev)} < ${x}: still going up.` : `Start at ${x}, the leftmost node.` });
      prev = id;
    }
    const a = tr.by.get(first!)!, b = tr.by.get(second!)!;
    [a.val, b.val] = [b.val, a.val];
    t.step({ line: 9, array: [], trees: viewOf(tr, { [a.id]: "found", [b.id]: "found" }), vars: { first: num(b), second: num(a) }, done: "found",
      message: `Swap ${num(b)} and ${num(a)} back. One in-order walk, no list and no sort: O(n) time and O(h) for the walk.` });
  },
};

/* ---------- 938 Range Sum ---------- */
export const rangeSumExample: RangeInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], low: 5, high: 9 };
export const rangeAll: Approach<RangeInput> = {
  id: "all", name: "Visit every node",
  code: `function rangeSumBST(node, low, high)
    if node = none
        return 0
    here ← node.val if low ≤ node.val ≤ high, else 0
    return here + rangeSumBST(node.left, low, high)
        + rangeSumBST(node.right, low, high)
`,
  run({ root: vals, low, high }, t) {
    const tr = build(vals), tones: Record<string, Tone> = {};
    let sum = 0;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { low, high, sum }, message: `Add up the values from ${low} to ${high}. Visiting every node works on any tree.` });
    for (const id of preorderIds(tr)) { t.op(); const x = v(tr, id), inR = x >= low && x <= high; if (inR) sum += x; tones[id] = inR ? "found" : "visited";
      t.step({ line: 4, array: [], trees: viewOf(tr, { ...tones }, { node: id }), vars: { x, sum }, message: inR ? `${x} is in range: add it. Sum ${sum}.` : `${x} is outside the range: add nothing, but still visit its children.` }); }
    t.step({ line: 5, array: [], trees: viewOf(tr, tones), vars: { sum }, done: "found", message: `The sum is ${sum}, after visiting all ${tr.nodes.length} nodes: O(n).` });
  },
};
export const rangePrune: Approach<RangeInput> = {
  id: "prune", name: "Skip the subtrees the order rules out",
  code: `function rangeSumBST(node, low, high)
    if node = none
        return 0
    if node.val < low  // so is its left subtree
        return rangeSumBST(node.right, low, high)
    if node.val > high  // so is its right subtree
        return rangeSumBST(node.left, low, high)
    left ← rangeSumBST(node.left, low, high)
    right ← rangeSumBST(node.right, low, high)
    return node.val + left + right
`,
  run({ root: vals, low, high }, t) {
    const tr = build(vals), tones: Record<string, Tone> = {};
    let sum = 0, asked = 0;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { low, high, sum }, message: `In a BST, a node below ${low} has only smaller values on its left, so that whole subtree can be skipped; a node above ${high} likewise rules out its right.` });
    const go = (id: string | null) => {
      t.op(); if (!id) return;
      const n = tr.by.get(id)!, x = num(n), kind = x < low ? "low" : x > high ? "high" : "in";
      const q = asked < 3 ? (asked++, { ask: { q: `This node holds ${x}; the range is ${low}–${high}. Which subtrees still need visiting?`, options: ["Only the right one", "Only the left one", "Both"], answer: kind === "low" ? 0 : kind === "high" ? 1 : 2 } }) : {};
      if (kind === "in") sum += x;
      const skipped = kind === "low" ? subtree(tr, n.left) : kind === "high" ? subtree(tr, n.right) : [];
      skipped.forEach((s) => (tones[s] = "discard"));
      tones[id] = kind === "in" ? "found" : "visited";
      t.step({ ...q, line: kind === "low" ? 5 : kind === "high" ? 7 : 8, array: [], trees: viewOf(tr, { ...tones }, { node: id }), vars: { x, sum },
        message: kind === "in" ? `${x} is in range: add it (sum ${sum}) and visit both sides.` : `${x} ${kind === "low" ? `< ${low}: its left subtree is even smaller` : `> ${high}: its right subtree is even bigger`}${skipped.length ? `, so ${skipped.length} node${skipped.length === 1 ? " is" : "s are"} skipped unseen` : ""}.` });
      if (kind === "low") go(n.right);
      else if (kind === "high") go(n.left);
      else { go(n.left); go(n.right); }
    };
    go(tr.root);
    const visited = Object.values(tones).filter((x) => x !== "discard").length;
    t.step({ line: 10, array: [], trees: viewOf(tr, tones), vars: { sum }, done: "found", message: `The sum is ${sum}, after visiting ${visited} of ${tr.nodes.length} nodes. O(h + m), where m is how many values are in range.` });
  },
};

/* ---------- 538 Greater Tree ---------- */
export const greaterExample: RootInput = { root: [6, 3, 9, 1, 4, 8, 12] };
export const greaterFields = [treeF];
export const greaterPrepare = bstOnly<RootInput>();
export const greaterEach: Approach<RootInput> = {
  id: "each", name: "Add up the bigger values for each node",
  code: `function convertBST(root)
    old ← values of root  // before any change
    for each node x in the tree
        x.val ← sum of the old values ≥ x.val
    return root
`,
  run({ root: vals }, t) {
    const tr = build(vals), old = tr.nodes.map((n) => num(n)), notes: Record<string, string> = {};
    const done: string[] = [];
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: {}, message: "Replace each value with itself plus every bigger value in the tree. The direct way: for each node, add up all values at least as big as it." });
    for (const id of order(tr)) {
      const x = num(tr.by.get(id)!);
      old.forEach(() => t.op());
      const s = old.filter((y) => y >= x).reduce((a, b) => a + b, 0);
      notes[id] = String(s); done.push(id);
      t.step({ line: 4, array: [], trees: viewOf(tr, { ...Object.fromEntries(done.map((d) => [d, "settled" as Tone])), [id]: "found" }, { node: id }, notes), vars: { x, "new value": s },
        message: `${x}: add up ${old.filter((y) => y >= x).join(" + ")} = ${s}. That reads all ${old.length} values again.` });
    }
    tr.nodes.forEach((n) => (n.val = Number(notes[n.id])));
    t.step({ line: 5, array: [], trees: viewOf(tr, settledAll(tr)), vars: {}, done: "found", message: `Converted. But every node read every value: O(n²).` });
  },
};
export const greaterReverse: Approach<RootInput> = {
  id: "reverse", name: "Reverse in-order with a running total",
  code: `function convertBST(root)
    total ← 0
    walk(root)
    return root
function walk(node)  // right, node, left
    if node = none
        return
    walk(node.right)
    total += node.val
    node.val ← total
    walk(node.left)
`,
  run({ root: vals }, t) {
    const tr = build(vals), done: string[] = [];
    let total = 0, asked = 0;
    t.step({ line: 2, array: [], trees: viewOf(tr), vars: { total }, message: "Visit the nodes from biggest to smallest: right subtree, node, left subtree (in-order backwards). A running total then always holds the sum of everything bigger, so each node just adds itself and takes the total." });
    const go = (id: string | null) => {
      t.op(); if (!id) return;
      const n = tr.by.get(id)!;
      go(n.right);
      const x = num(n);
      const q = asked < 2 ? (asked++, { ask: { q: `The running total is ${total} and this node holds ${x}. What's its new value?`, options: [...new Set([String(total + x), String(total), String(x)])], answer: 0 } }) : {};
      total += x; n.val = total; done.push(id);
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 10, array: [], trees: viewOf(tr, { ...Object.fromEntries(done.map((d) => [d, "settled" as Tone])), [id]: "found" }, { node: id }), vars: { old: x, total },
        message: `Everything bigger than ${x} has been added already. Add ${x}: the total is ${total}, which becomes its new value.` });
      go(n.left);
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: viewOf(tr, settledAll(tr)), vars: { total }, done: "found", message: `Converted in one walk: each node is visited once, O(n).` });
  },
};
/** A balanced BST of n nodes. */
export { balancedLevelOrder } from "./steps";
/** A chain of n values going right: 1, 2, …, n. */
export const rightChainBST = (n: number): (number | null)[] => { const out: (number | null)[] = [1]; for (let i = 2; i <= n; i++) out.push(null, i); return out; };
