import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, type Tree } from "./steps";

/** Comparing subtrees (LeetCode 572, 652): checking shapes directly, or naming each distinct subtree with an id. */
export type PairInput = { root: (number | null)[]; sub: (number | null)[] };
export type RootInput = { root: (number | null)[] };
export const pairFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }, { key: "sub", label: "subRoot (level order)", kind: "tree" }];
export const rootFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
const cnt = (vals: (number | null)[]) => vals.filter((x) => x !== null).length;
export function pairPrepare(raw: PairInput): Prepared<PairInput> {
  if (!cnt(raw.root) || raw.root[0] === null || !cnt(raw.sub) || raw.sub[0] === null) return { error: "Give at least one node in each tree." };
  if (cnt(raw.root) > 12 || cnt(raw.sub) > 6) return { error: "Use at most 12 nodes in root and 6 in subRoot so both fit." };
  return { input: raw };
}
export function rootPrepare(raw: RootInput): Prepared<RootInput> { if (!cnt(raw.root) || raw.root[0] === null) return { error: "Give at least one node." }; return cnt(raw.root) > 13 ? { error: "Use at most 13 nodes so the tree fits." } : { input: raw }; }

const v = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const sub = (tr: Tree, id: string | null): string[] => (id ? [id, ...sub(tr, tr.by.get(id)!.left), ...sub(tr, tr.by.get(id)!.right)] : []);
const tv = (tr: Tree, label: string, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData => ({ label, root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} });
const rename = (tr: Tree, prefix: string): Tree => { const map = new Map(tr.nodes.map((n) => [n.id, prefix + n.id])); const nodes = tr.nodes.map((n) => ({ ...n, id: map.get(n.id)!, left: n.left ? map.get(n.left)! : null, right: n.right ? map.get(n.right)! : null })); return { root: tr.root ? map.get(tr.root)! : null, nodes, by: new Map(nodes.map((n) => [n.id, n])) }; };

/** Gives each subtree an id: equal ids exactly when the subtrees match in shape and values. */
function idOf(tr: Tree, id: string | null, table: Map<string, number>, ids: Record<string, number>, op: () => void): number {
  if (!id) return 0;
  const n = tr.by.get(id)!;
  const l = idOf(tr, n.left, table, ids, op), r = idOf(tr, n.right, table, ids, op);
  op();
  const key = `${l},${n.val},${r}`;
  if (!table.has(key)) table.set(key, table.size + 1);
  ids[id] = table.get(key)!;
  return ids[id];
}

/* ---------- 572 Subtree of Another Tree ---------- */
export const pairExample: PairInput = { root: [3, 4, 5, 1, 2, 4, null, null, null, null, null, 1, 2], sub: [4, 1, 2] };
export const subCompare: Approach<PairInput> = {
  id: "compare", name: "Compare subRoot against every node",
  code: `function isSubtree(root, sub)
    for each node x in root
        if same(x, sub)
            return true
    return false
function same(a, b)
    if a = none or b = none
        return a = b
    return a.val = b.val and same(a.left, b.left)
        and same(a.right, b.right)
`,
  run({ root: rv, sub: sv }, t) {
    const R = rename(build(rv), "r"), S = rename(build(sv), "s");
    const trees = (rt: Record<string, Tone> = {}, st: Record<string, Tone> = {}, ptr?: string) => [tv(R, "root", rt, {}, ptr), tv(S, "subRoot", st)];
    t.step({ line: 2, array: [], trees: trees(), vars: {}, message: "Is subRoot an exact copy of some node's whole subtree? The direct way: at every node of root, compare the two trees node by node." });
    for (const x of sub(R, R.root)) {
      const seen: string[] = [];
      const same = (a: string | null, b: string | null): boolean => { t.op(); if (!a || !b) return a === b; seen.push(a); return R.by.get(a)!.val === S.by.get(b)!.val && same(R.by.get(a)!.left, S.by.get(b)!.left) && same(R.by.get(a)!.right, S.by.get(b)!.right); };
      const ok = same(x, S.root);
      t.step({ line: ok ? 4 : 3, array: [], trees: trees({ ...Object.fromEntries(seen.map((s) => [s, (ok ? "found" : "compare") as Tone])), [x]: ok ? "found" : "active" }, ok ? Object.fromEntries(S.nodes.map((n) => [n.id, "found" as Tone])) : {}, x), vars: { at: v(R, x), compared: seen.length },
        message: ok ? `The subtree at ${v(R, x)} matches subRoot node for node. Return true.` : `At ${v(R, x)}: compared ${seen.length} node${seen.length === 1 ? "" : "s"} before finding a difference.` });
      if (ok) { t.step({ line: 4, array: [], trees: trees({ [x]: "found" }, Object.fromEntries(S.nodes.map((n) => [n.id, "found" as Tone]))), vars: { answer: "true" }, done: "found", message: `Found. In the worst case every node of root starts a comparison of up to every node of subRoot: O(m · n).` }); return; }
    }
    t.step({ line: 5, array: [], trees: trees(), vars: { answer: "false" }, done: "notfound", message: "No node's subtree matches: return false. That took up to one comparison of subRoot per node of root: O(m · n)." });
  },
};
export const subIds: Approach<PairInput> = {
  id: "ids", name: "Give every subtree an id, then compare ids",
  code: `function isSubtree(root, sub)
    ids ← empty map  // (left, value, right) → id
    want ← name(sub, ids)
    return name(root, ids) shows want somewhere
function name(node, ids)  // 0 for none
    if node = none
        return 0
    key ← (name(node.left, ids), node.val,
           name(node.right, ids))
    if key not in ids
        ids[key] ← size of ids + 1
    return ids[key]
`,
  run({ root: rv, sub: sv }, t) {
    const R = rename(build(rv), "r"), S = rename(build(sv), "s"), table = new Map<string, number>(), rIds: Record<string, number> = {}, sIds: Record<string, number> = {};
    const notes = (ids: Record<string, number>) => Object.fromEntries(Object.entries(ids).map(([k, x]) => [k, `#${x}`]));
    let asked = 0;
    t.step({ line: 2, array: [], trees: [tv(R, "root", {}), tv(S, "subRoot", {})], vars: {}, message: "Name every distinct subtree with a number. A subtree's name depends only on its left child's name, its value and its right child's name, so two subtrees get the same name exactly when they match. Then one lookup per node replaces a whole comparison." });
    const want = idOf(S, S.root, table, sIds, () => t.op());
    t.step({ line: 3, array: [], trees: [tv(R, "root", {}), tv(S, "subRoot", Object.fromEntries(S.nodes.map((n) => [n.id, "settled" as Tone])), notes(sIds))], map: { title: "ids: (left, value, right) → id", entries: [...table.entries()].map(([k, x]) => [`(${k})`, `#${x}`] as [string, string]) }, vars: { "subRoot is": `#${want}` },
      message: `Name subRoot's subtrees bottom-up: subRoot itself is #${want}.` });
    let found: string | null = null;
    const walk = (id: string | null): number => {
      if (!id) return 0;
      const n = R.by.get(id)!;
      const l = walk(n.left), r = walk(n.right);
      t.op();
      const key = `${l},${n.val},${r}`, had = table.has(key);
      if (!had) table.set(key, table.size + 1);
      rIds[id] = table.get(key)!;
      const q = asked < 2 ? (asked++, { ask: { q: `Node ${n.val}: its left subtree is #${l}, its right #${r}. The key (${key}) is ${had ? "already" : "not yet"} in the table. Does this subtree match subRoot (#${want})?`, options: [rIds[id] === want ? "Yes: same id" : "No: a different id", rIds[id] === want ? "No" : "Yes"], answer: 0 } }) : {};
      if (rIds[id] === want && !found) found = id;
      t.step({ ...q, line: 12, array: [], trees: [tv(R, "root", { ...Object.fromEntries(Object.keys(rIds).map((k) => [k, "settled" as Tone])), [id]: rIds[id] === want ? "found" : "active" }, notes(rIds), id), tv(S, "subRoot", {}, notes(sIds))], map: { title: "ids: (left, value, right) → id", entries: [...table.entries()].map(([k, x]) => [`(${k})`, `#${x}`] as [string, string]), highlight: `(${key})` }, vars: { node: n.val, id: `#${rIds[id]}` },
        message: `${n.val} with children #${l} and #${r}: key (${key}) ${had ? `is already #${rIds[id]}` : `is new: #${rIds[id]}`}.${rIds[id] === want ? " That's subRoot's id: a match." : ""}` });
      return rIds[id];
    };
    walk(R.root);
    t.step({ line: 4, array: [], trees: [tv(R, "root", found ? Object.fromEntries(sub(R, found).map((s) => [s, "found" as Tone])) : {}, notes(rIds)), tv(S, "subRoot", {}, notes(sIds))], vars: { answer: found ? "true" : "false" }, done: found ? "found" : "notfound",
      message: `${found ? `The subtree at ${v(R, found)} has subRoot's id: return true.` : "No subtree has subRoot's id: return false."} Each node was named once with one map lookup: O(m + n).` });
  },
};

/* ---------- 652 Find Duplicate Subtrees ---------- */
export const dupExample: RootInput = { root: [1, 2, 3, 4, null, 2, 4, null, null, 4] };
const ser = (tr: Tree, id: string | null): string => (id ? `(${ser(tr, tr.by.get(id)!.left)} ${tr.by.get(id)!.val} ${ser(tr, tr.by.get(id)!.right)})` : "#");
export const dupStrings: Approach<RootInput> = {
  id: "strings", name: "Write every subtree out in full",
  code: `function findDuplicateSubtrees(root)
    count ← empty map  // subtree as text → times
    out ← []
    for each node x in root
        s ← x's whole subtree, written out
        count[s] ← (count[s] or 0) + 1
        if count[s] = 2
            out.push(x)
    return out
`,
  run({ root: vals }, t) {
    const tr = build(vals), count = new Map<string, number>(), out: string[] = [], notes: Record<string, string> = {};
    t.step({ line: 2, array: [], trees: [tv(tr, "tree", {})], vars: {}, message: "Two subtrees are duplicates if they have the same shape and values. The direct way: write each subtree out in full as text, and count how often each text appears." });
    for (const x of sub(tr, tr.root)) {
      const s = ser(tr, x), size = sub(tr, x).length;
      t.op(size);
      count.set(s, (count.get(s) ?? 0) + 1);
      if (count.get(s) === 2) out.push(x);
      notes[x] = `×${count.get(s)}`;
      t.step({ line: count.get(s) === 2 ? 8 : 6, array: [], trees: [tv(tr, "tree", { ...Object.fromEntries(sub(tr, x).map((k) => [k, "compare" as Tone])), [x]: count.get(s)! > 1 ? "found" : "active" }, notes, x)], vars: { "written out": s, "characters": s.length },
        message: `The subtree at ${v(tr, x)} is ${s}, written out in full (${size} node${size === 1 ? "" : "s"}). ${count.get(s) === 2 ? "Seen before: a duplicate." : count.get(s)! > 2 ? "Seen before, already reported." : "First time seen."}` });
    }
    t.step({ line: 9, array: [], trees: [tv(tr, "tree", Object.fromEntries(out.map((x) => [x, "found" as Tone])), notes)], vars: { duplicates: out.map((x) => ser(tr, x)).join("  ") || "none" }, done: "found",
      message: `${out.length} kind${out.length === 1 ? "" : "s"} of duplicate. But each node wrote out its whole subtree: O(n²) characters on a chain.` });
  },
};
export const dupIds: Approach<RootInput> = {
  id: "ids", name: "Name each subtree with an id",
  code: `function findDuplicateSubtrees(root)
    ids, seen, out ← empty map, empty map, []
    name(root)
    return out
function name(node)  // 0 for none
    if node = none
        return 0
    key ← (name(node.left), node.val,
           name(node.right))
    if key not in ids
        ids[key] ← size of ids + 1
    id ← ids[key]
    seen[id] ← (seen[id] or 0) + 1
    if seen[id] = 2
        out.push(node)
    return id
`,
  run({ root: vals }, t) {
    const tr = build(vals), table = new Map<string, number>(), seen = new Map<number, number>(), ids: Record<string, number> = {}, out: string[] = [];
    let asked = 0;
    t.step({ line: 2, array: [], trees: [tv(tr, "tree", {})], vars: {}, message: "Name each subtree with a small number, built from its children's numbers and its value. Equal subtrees get equal numbers, and building a name costs one lookup, not a whole write-out." });
    const go = (id: string | null): number => {
      if (!id) return 0;
      const n = tr.by.get(id)!;
      const l = go(n.left), r = go(n.right);
      t.op();
      const key = `${l},${n.val},${r}`;
      if (!table.has(key)) table.set(key, table.size + 1);
      const x = table.get(key)!; ids[id] = x;
      seen.set(x, (seen.get(x) ?? 0) + 1);
      const q = asked < 2 && seen.get(x)! >= 2 ? (asked++, { ask: { q: `Node ${n.val} gets id #${x}, which has now been seen ${seen.get(x)} times. Is it added to the answer?`, options: [seen.get(x) === 2 ? "Yes: this is its second time" : "No: it was added the second time", seen.get(x) === 2 ? "No" : "Yes"], answer: 0 } }) : {};
      if (seen.get(x) === 2) out.push(id);
      t.step({ ...q, line: seen.get(x) === 2 ? 15 : 13, array: [], trees: [tv(tr, "tree", { ...Object.fromEntries(Object.keys(ids).map((k) => [k, "settled" as Tone])), [id]: seen.get(x)! >= 2 ? "found" : "active" }, Object.fromEntries(Object.entries(ids).map(([k, y]) => [k, `#${y}`])), id)], map: { title: "ids: (left, value, right) → id", entries: [...table.entries()].map(([k, y]) => [`(${k})`, `#${y} ×${seen.get(y) ?? 0}`] as [string, string]), highlight: `(${key})` }, vars: { node: n.val, id: `#${x}` },
        message: `${n.val} with children #${l} and #${r}: id #${x}, seen ${seen.get(x)} time${seen.get(x) === 1 ? "" : "s"}.${seen.get(x) === 2 ? " Second time: report it." : ""}` });
      return x;
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: [tv(tr, "tree", Object.fromEntries(out.map((x) => [x, "found" as Tone])), Object.fromEntries(Object.entries(ids).map(([k, y]) => [k, `#${y}`])))], vars: { duplicates: out.map((x) => ser(tr, x)).join("  ") || "none" }, done: "found",
      message: `${out.length} kind${out.length === 1 ? "" : "s"} of duplicate. One lookup per node: O(n).` });
  },
};
/** A chain of n nodes going left, all holding 1: every subtree is a shorter chain. */
export const leftChain = (n: number): (number | null)[] => { const out: (number | null)[] = [1]; for (let i = 1; i < n; i++) out.push(1, null); while (out[out.length - 1] === null) out.pop(); return out; };
