import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/**
 * Rebuilding a binary tree from two of its traversals (LeetCode 105, 106, 889). One order gives the roots one by
 * one; the other says where each root splits its range into a left and a right subtree.
 */
export type Kind = "pre-in" | "in-post" | "pre-post";
export type PairInput = { a: number[]; b: number[] };
/** Row labels short enough for a phone. */
const short = (name: string) => name.replace("order", "");
const names: Record<Kind, [string, string]> = { "pre-in": ["preorder", "inorder"], "in-post": ["inorder", "postorder"], "pre-post": ["preorder", "postorder"] };
export const pairFields = (k: Kind): InputField[] => [{ key: "a", label: names[k][0], kind: "numbers" }, { key: "b", label: names[k][1], kind: "numbers" }];

type Built = { root: string | null; nodes: TreeNodeData[] };
/** Rebuilds silently (no steps); null if the two lists can't describe one tree. */
function rebuild(kind: Kind, a: number[], b: number[]): Built | null {
  const nodes: TreeNodeData[] = [];
  const mk = (v: number) => { const n = { id: `v${v}`, val: v, left: null, right: null } as TreeNodeData; nodes.push(n); return n; };
  try {
    if (kind === "pre-in") {
      let next = 0;
      const go = (lo: number, hi: number): TreeNodeData | null => { if (lo > hi) return null; const r = mk(a[next++]); const k = b.indexOf(r.val as number, lo); if (k < lo || k > hi) throw 0; r.left = go(lo, k - 1)?.id ?? null; r.right = go(k + 1, hi)?.id ?? null; return r; };
      const r = go(0, b.length - 1); if (next !== a.length) throw 0; return { root: r?.id ?? null, nodes };
    }
    if (kind === "in-post") {
      let next = b.length - 1;
      const go = (lo: number, hi: number): TreeNodeData | null => { if (lo > hi) return null; const r = mk(b[next--]); const k = a.indexOf(r.val as number, lo); if (k < lo || k > hi) throw 0; r.right = go(k + 1, hi)?.id ?? null; r.left = go(lo, k - 1)?.id ?? null; return r; };
      const r = go(0, a.length - 1); if (next !== -1) throw 0; return { root: r?.id ?? null, nodes };
    }
    let next = 0;
    const go = (lo: number, hi: number): TreeNodeData | null => { if (lo > hi) return null; const r = mk(a[next++]); if (b[hi] !== r.val) throw 0; if (lo === hi) return r; const k = b.indexOf(a[next], lo); if (k < lo || k > hi - 1) throw 0; r.left = go(lo, k)?.id ?? null; r.right = go(k + 1, hi - 1)?.id ?? null; return r; };
    const r = go(0, b.length - 1); if (next !== a.length) throw 0; return { root: r?.id ?? null, nodes };
  } catch { return null; }
}
const order = (t: Built, how: "pre" | "in" | "post") => { const by = new Map(t.nodes.map((n) => [n.id, n])); const out: number[] = []; const go = (id: string | null) => { if (!id) return; const n = by.get(id)!; if (how === "pre") out.push(n.val as number); go(n.left); if (how === "in") out.push(n.val as number); go(n.right); if (how === "post") out.push(n.val as number); }; go(t.root); return out; };

export const pairPrepare = (kind: Kind) => (raw: PairInput): Prepared<PairInput> => {
  const { a, b } = raw;
  if (!a.length || a.length !== b.length) return { error: "Give two lists of the same length, at least one value." };
  if (a.length > 12) return { error: "Use at most 12 values so the tree fits." };
  if (new Set(a).size !== a.length || [...a].sort((x, y) => x - y).join() !== [...b].sort((x, y) => x - y).join()) return { error: "Both lists must hold the same distinct values." };
  const t = rebuild(kind, a, b);
  const [ha, hb] = kind === "pre-in" ? ["pre", "in"] as const : kind === "in-post" ? ["in", "post"] as const : ["pre", "post"] as const;
  if (!t || order(t, ha).join() !== a.join() || order(t, hb).join() !== b.join()) return { error: "These two orders don't describe the same binary tree." };
  return { input: raw };
};

const codes: Record<Kind, [string, string]> = {
  "pre-in": [`function buildTree(preorder, inorder)
    next ← 0  // the next root, in preorder
    return build(0, length(inorder) - 1)
function build(lo, hi)  // a range of inorder
    if lo > hi
        return none
    root ← new node(preorder[next])
    next += 1
    k ← position of root.val in inorder[lo..hi]
    root.left ← build(lo, k - 1)
    root.right ← build(k + 1, hi)
    return root
`, `function buildTree(preorder, inorder)
    at ← empty map  // value → position in inorder
    for each index i, value x in inorder
        at[x] ← i
    next ← 0  // the next root, in preorder
    return build(0, length(inorder) - 1)
function build(lo, hi)  // a range of inorder
    if lo > hi
        return none
    root ← new node(preorder[next])
    next += 1
    k ← at[root.val]
    root.left ← build(lo, k - 1)
    root.right ← build(k + 1, hi)
    return root
`],
  "in-post": [`function buildTree(inorder, postorder)
    next ← length(postorder) - 1  // from the end
    return build(0, length(inorder) - 1)
function build(lo, hi)  // a range of inorder
    if lo > hi
        return none
    root ← new node(postorder[next])
    next -= 1
    k ← position of root.val in inorder[lo..hi]
    root.right ← build(k + 1, hi)  // right first
    root.left ← build(lo, k - 1)
    return root
`, `function buildTree(inorder, postorder)
    at ← empty map  // value → position in inorder
    for each index i, value x in inorder
        at[x] ← i
    next ← length(postorder) - 1  // from the end
    return build(0, length(inorder) - 1)
function build(lo, hi)  // a range of inorder
    if lo > hi
        return none
    root ← new node(postorder[next])
    next -= 1
    k ← at[root.val]
    root.right ← build(k + 1, hi)  // right first
    root.left ← build(lo, k - 1)
    return root
`],
  "pre-post": [`function constructFromPrePost(pre, post)
    next ← 0  // the next root, in pre
    return build(0, length(post) - 1)
function build(lo, hi)  // a range of post
    if lo > hi
        return none
    root ← new node(pre[next])
    next += 1
    if lo = hi
        return root
    k ← position of pre[next] in post[lo..hi]
    root.left ← build(lo, k)  // ends at its root
    root.right ← build(k + 1, hi - 1)
    return root
`, `function constructFromPrePost(pre, post)
    at ← empty map  // value → position in post
    for each index i, value x in post
        at[x] ← i
    next ← 0  // the next root, in pre
    return build(0, length(post) - 1)
function build(lo, hi)  // a range of post
    if lo > hi
        return none
    root ← new node(pre[next])
    next += 1
    if lo = hi
        return root
    k ← at[pre[next]]
    root.left ← build(lo, k)  // ends at its root
    root.right ← build(k + 1, hi - 1)
    return root
`],
};
/** Line numbers per kind and version: [create, split, return-leaf (pre-post only), done]. */
const lines: Record<Kind, [{ make: number; split: number; leaf: number; done: number }, { make: number; split: number; leaf: number; done: number }]> = {
  "pre-in": [{ make: 7, split: 9, leaf: 0, done: 12 }, { make: 10, split: 12, leaf: 0, done: 15 }],
  "in-post": [{ make: 7, split: 9, leaf: 0, done: 12 }, { make: 10, split: 12, leaf: 0, done: 15 }],
  "pre-post": [{ make: 7, split: 11, leaf: 10, done: 14 }, { make: 10, split: 14, leaf: 13, done: 17 }],
};

export function buildFrom(kind: Kind, useMap: boolean): Approach<PairInput> {
  const [na, nb] = names[kind];
  const L = lines[kind][useMap ? 1 : 0];
  return {
    id: useMap ? "map" : "scan",
    name: useMap ? "Look positions up in a map" : "Scan for each root",
    code: codes[kind][useMap ? 1 : 0],
    run({ a, b }, t) {
      // "roots" is the list the roots are read from; "split" the list whose ranges are cut.
      const roots = kind === "in-post" ? b : a, split = kind === "in-post" ? a : b;
      const rn = kind === "in-post" ? nb : na, sn = kind === "in-post" ? na : nb;
      const nodes: TreeNodeData[] = [], by = new Map<string, TreeNodeData>();
      let root: string | null = null, next = kind === "in-post" ? roots.length - 1 : 0, asked = 0, toldRight = false;
      const where = new Map<number, number>();
      const view = (extra: Record<string, Tone> = {}, ptr?: string): TreeData[] => [{ root, nodes: nodes.map((n) => ({ ...n })), tones: { ...Object.fromEntries(nodes.map((n) => [n.id, "settled" as Tone])), ...extra }, pointers: ptr ? { node: ptr } : {} }];
      const grid = (lo: number, hi: number, k: number | null, used: number) => ({
        title: `${rn} · ${sn}`, rows: [roots, split], rowLabels: [short(rn), short(sn)], dense: roots.length > 8,
        tones: { ...Object.fromEntries(roots.map((v, j) => [`0,${j}`, (j === used ? "found" : nodes.some((n) => n.val === v) ? "visited" : "") as Tone]).filter(([, x]) => x)),
          ...Object.fromEntries(split.map((_, j) => [`1,${j}`, (j === k ? "found" : j >= lo && j <= hi ? "side-a" : "discard") as Tone])) },
      });
      t.step({ line: 2, array: [], trees: view(), grid: { title: `${rn} · ${sn}`, rows: [roots, split], rowLabels: [short(rn), short(sn)], dense: roots.length > 8 }, vars: {},
        message: kind === "pre-post"
          ? `In pre-order every node comes before its subtrees, so ${rn} lists the roots in the order to build them. In post-order a subtree's root comes last, so the left child's position in ${sn} marks where the left subtree ends.`
          : `${kind === "pre-in" ? "In pre-order every node comes before its subtrees, so reading preorder from the left" : "In post-order every node comes after its subtrees, so reading postorder from the right"} gives the roots in the order to build them. In ${sn}, everything left of a root is in its left subtree and everything right of it in its right subtree.` });
      if (useMap) {
        split.forEach((v, j) => { t.op(); where.set(v, j); });
        t.step({ line: 4, array: [], trees: view(), grid: { title: `${rn} · ${sn}`, rows: [roots, split], rowLabels: [short(rn), short(sn)], dense: roots.length > 8 }, vars: { "map entries": where.size },
          message: `First note where each value sits in ${sn}, so finding a root's position later is one lookup instead of a scan.` });
      }
      const go = (lo: number, hi: number, parent: string | null, side: "left" | "right" | null) => {
        t.op();
        if (lo > hi) return;
        const v = roots[next];
        const used = next;
        next += kind === "in-post" ? -1 : 1;
        const n: TreeNodeData = { id: `v${v}`, val: v, left: null, right: null };
        nodes.push(n); by.set(n.id, n);
        if (!parent) root = n.id; else by.get(parent)![side!] = n.id;
        const opts = [...new Set([v, roots[Math.min(roots.length - 1, used + 1)], roots[Math.max(0, used - 1)], split[lo]].map(String))];
        const q = asked < 3 && opts.length > 1 ? (asked++, { ask: { q: `Building ${sn} positions ${lo} to ${hi} (${split.slice(lo, hi + 1).join(", ")}). Which value is this subtree's root?`, options: opts, answer: 0 } }) : {};
        if (kind === "pre-post" && lo === hi) {
          t.step({ ...q, line: L.leaf, array: [], trees: view({ [n.id]: "found" }, n.id), grid: grid(lo, hi, null, used), vars: { lo, hi, root: v },
            message: `${v} is the next root, and its range holds only itself: a leaf.` });
          return;
        }
        let k: number;
        if (kind === "pre-post") {
          const lv = roots[next];
          if (useMap) { t.op(); k = where.get(lv)!; } else { k = lo; while (split[k] !== lv) { t.op(); k++; } t.op(); }
          t.step({ ...q, line: L.split, array: [], trees: view({ [n.id]: "found" }, n.id), grid: grid(lo, hi, k, used), vars: { lo, hi, root: v, k },
            message: `${v} is the next root in ${rn}. The value after it, ${lv}, must be its left child, and in ${sn} a subtree ends with its root: ${lv} is at ${k}, so positions ${lo}–${k} are the left subtree and ${k + 1}–${hi - 1} the right.${hi - 1 < k + 1 ? " That's nothing on the right." : ""}` });
          go(lo, k, n.id, "left");
          go(k + 1, hi - 1, n.id, "right");
          return;
        }
        if (useMap) { t.op(); k = where.get(v)!; } else { k = lo; while (split[k] !== v) { t.op(); k++; } t.op(); }
        t.step({ ...q, line: L.split, array: [], trees: view({ [n.id]: "found" }, n.id), grid: grid(lo, hi, k, used), vars: { lo, hi, root: v, k },
          message: `${v} is the next root in ${rn}. ${useMap ? `The map says it's at position ${k} of ${sn}` : `Scanning ${sn} from position ${lo} finds it at ${k} after ${k - lo + 1} look${k === lo ? "" : "s"}`}: ${k > lo ? `${split.slice(lo, k).join(", ")} go${k - lo === 1 ? "es" : ""} left` : "nothing goes left"}, ${k < hi ? `${split.slice(k + 1, hi + 1).join(", ")} go${hi - k === 1 ? "es" : ""} right` : "nothing goes right"}.${kind === "in-post" && !toldRight ? (toldRight = true, " Postorder read backwards gives the right subtree's roots first, so build the right side first.") : ""}` });
        if (kind === "in-post") { go(k + 1, hi, n.id, "right"); go(lo, k - 1, n.id, "left"); }
        else { go(lo, k - 1, n.id, "left"); go(k + 1, hi, n.id, "right"); }
      };
      go(0, split.length - 1, null, null);
      t.step({ line: L.done, array: [], trees: view(), grid: { title: `${rn} · ${sn}`, rows: [roots, split], rowLabels: [short(rn), short(sn)], dense: roots.length > 8 }, vars: { nodes: nodes.length }, done: "found",
        message: useMap ? `All ${nodes.length} nodes are placed. Building the map and each node cost O(1) apiece: O(n) time and O(n) memory.` : `All ${nodes.length} nodes are placed. But each root was found by scanning its range, and on a lopsided tree those ranges are long: O(n²).` });
    },
  };
}

export const examples: Record<Kind, PairInput> = {
  "pre-in": { a: [6, 2, 1, 4, 3, 9, 7], b: [1, 2, 3, 4, 6, 7, 9] },
  "in-post": { a: [1, 2, 3, 4, 6, 7, 9], b: [1, 3, 4, 2, 7, 9, 6] },
  "pre-post": { a: [1, 2, 4, 5, 3, 6, 7], b: [4, 5, 2, 6, 7, 3, 1] },
};
/** A chain leaning left, 1 at the top: the worst case for scanning. */
export const chainInput = (kind: Kind, n: number): PairInput => {
  const pre = Array.from({ length: n }, (_, i) => i + 1), ino = [...pre].reverse(), post = [...pre].reverse();
  return kind === "pre-in" ? { a: pre, b: ino } : kind === "in-post" ? { a: ino, b: post } : { a: pre, b: post };
};
