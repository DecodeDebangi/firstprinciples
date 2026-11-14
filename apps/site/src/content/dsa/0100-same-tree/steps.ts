import { measureGrowth, treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { p: (number | null)[]; q: (number | null)[] };

export const example: Input = { p: [6, 2, 9, 1, 4], q: [6, 2, 9, 1, 5] };

export const fields: InputField[] = [
  { key: "p", label: "p (level order)", kind: "tree" },
  { key: "q", label: "q (level order)", kind: "tree" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.p.length || !raw.q.length) return { error: "Give at least one node in each tree." };
  return { input: raw };
}

const recursive: Approach<Input> = {
  id: "dfs",
  name: "Compare node by node",
  code: `function same(p, q)
    if p = none and q = none
        return true
    if p = none or q = none or p.val ≠ q.val
        return false
    return same(p.left, q.left) and same(p.right, q.right)
`,
  run({ p: pv, q: qv }, t) {
    const P = treeFromLevelOrder(pv), Q = treeFromLevelOrder(qv);
    const pb = new Map(P.nodes.map((n) => [n.id, n])), qb = new Map(Q.nodes.map((n) => [n.id, n]));
    const tp: Record<string, Tone> = {}, tq: Record<string, Tone> = {};
    const view = (extraP: Record<string, Tone> = {}, extraQ: Record<string, Tone> = {}): TreeData[] => [
      { label: "p", root: P.root, nodes: P.nodes, tones: { ...tp, ...extraP } },
      { label: "q", root: Q.root, nodes: Q.nodes, tones: { ...tq, ...extraQ } },
    ];
    t.step({ line: 2, array: [], trees: view(), vars: { p: null, q: null },
      message: "Walk both trees in step: same value at each pair of positions, and the same shape (a missing child must be missing in both)." });
    let failed = false;
    const go = (a: string | null, b: string | null): boolean => {
      if (failed) return false;
      t.op();
      if (!a && !b) return true;
      const na = a ? pb.get(a)! : null, nb = b ? qb.get(b)! : null;
      const same = !!na && !!nb && na.val === nb.val;
      const ask = { q: `p has ${na ? na.val : "nothing"}, q has ${nb ? nb.val : "nothing"} here. What happens?`,
        options: ["They match: compare their children", "They differ: return false"], answer: same ? 0 : 1 };
      if (!same) {
        failed = true;
        t.step({ ask, line: 5, array: [], trees: view(a ? { [a]: "miss" } : {}, b ? { [b]: "miss" } : {}), vars: { p: na?.val ?? "none", q: nb?.val ?? "none" }, done: "notfound",
          message: !na || !nb ? `One tree has a node here and the other doesn't. Different shapes: return false.` : `${na.val} ≠ ${nb.val}. Return false.` });
        return false;
      }
      tp[a!] = "settled"; tq[b!] = "settled";
      t.step({ ask, line: 6, array: [], trees: view({ [a!]: "found" }, { [b!]: "found" }), vars: { p: na!.val, q: nb!.val },
        message: `Both have ${na!.val}. Now compare the left children, then the right children.` });
      return go(na!.left, nb!.left) && go(na!.right, nb!.right);
    };
    const ok = go(P.root, Q.root);
    if (ok) t.step({ line: 6, array: [], trees: view(), vars: { p: null, q: null }, done: "found",
      message: "Every pair matched, including where both trees had no child. The trees are the same." });
  },
};

const serialize: Approach<Input> = {
  id: "serialize",
  name: "Serialize both, compare",
  code: `function same(p, q)
    function walk(node, out)
        if node = none
            out.push("#")
            return
        out.push(node.val)
        walk(node.left, out)
        walk(node.right, out)
    a, b ← [], []
    walk(p, a); walk(q, b)
    return a = b
`,
  run({ p: pv, q: qv }, t) {
    const P = treeFromLevelOrder(pv), Q = treeFromLevelOrder(qv);
    const pb = new Map(P.nodes.map((n) => [n.id, n])), qb = new Map(Q.nodes.map((n) => [n.id, n]));
    const walk = (by: typeof pb, id: string | null, out: string[]) => {
      t.op();
      if (!id) { out.push("#"); return; }
      const n = by.get(id)!;
      out.push(String(n.val));
      walk(by, n.left, out);
      walk(by, n.right, out);
    };
    const all = (nodes: { id: string }[]) => Object.fromEntries(nodes.map((n) => [n.id, "compare" as Tone]));
    const trees = (tp: Record<string, Tone> = {}, tq: Record<string, Tone> = {}): TreeData[] => [
      { label: "p", root: P.root, nodes: P.nodes, tones: tp }, { label: "q", root: Q.root, nodes: Q.nodes, tones: tq }];
    t.step({ line: 9, array: [], trees: trees(), vars: {},
      message: "Write each tree out in full, with # for every missing child, then compare the two lists. Simple, but it always walks both trees to the end." });
    const a: string[] = [], b: string[] = [];
    walk(pb, P.root, a);
    t.step({ line: 10, array: [], trees: trees(all(P.nodes)), grid: { title: "a = walk(p)", rows: [a] }, vars: { "length(a)": a.length }, message: `p written out: ${a.join(" ")}.` });
    walk(qb, Q.root, b);
    t.step({ line: 10, array: [], trees: trees(all(P.nodes), all(Q.nodes)), grid: { title: "a = walk(p) · b = walk(q)", rows: [a, b] }, vars: { "length(a)": a.length, "length(b)": b.length },
      message: `q written out: ${b.join(" ")}.` });
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) { t.op(); k++; }
    t.op();
    const same = a.length === b.length && k === a.length;
    const tones: Record<string, Tone> = same ? {} : { [`0,${k}`]: "miss", [`1,${k}`]: "miss" };
    t.step({ line: 11, array: [], trees: trees(all(P.nodes), all(Q.nodes)), grid: { title: "a = walk(p) · b = walk(q)", rows: [a, b], tones }, vars: { "length(a)": a.length, "length(b)": b.length },
      done: same ? "found" : "notfound",
      message: same ? "The two lists are identical, so the trees are the same." : `The lists first differ at position ${k} ("${a[k] ?? "end"}" vs "${b[k] ?? "end"}"). Not the same, but we only learned that after writing out both trees.` });
  },
};

export const approaches = { dfs: recursive, serialize };

/** Two identical complete trees of n nodes: nothing stops early. */
const worstCase = (n: number): Input => { const v = Array.from({ length: n }, (_, i) => i); return { p: v, q: [...v] }; };

export const growth = measureGrowth(
  [
    { approach: serialize, slot: 1 },
    { approach: recursive, slot: 2 },
  ],
  worstCase,
  [7, 15, 31, 63, 127],
);
