import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build, view } from "../../concepts/54-tree-recursion/steps";

export type Input = { root: (number | null)[]; p: number; q: number };
export const example: Input = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], p: 1, q: 7 };
export const fields: InputField[] = [
  { key: "root", label: "root (level order, distinct values)", kind: "tree" },
  { key: "p", label: "p", kind: "number" },
  { key: "q", label: "q", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const vals = raw.root.filter((v) => v !== null);
  if (!vals.length) return { error: "Give at least one node." };
  if (new Set(vals).size !== vals.length) return { error: "Node values must be distinct, so p and q name one node each." };
  if (!vals.includes(raw.p) || !vals.includes(raw.q)) return { error: "p and q must both be values in the tree." };
  if (raw.p === raw.q) return { error: "Pick two different nodes for p and q." };
  return { input: raw };
}

const paths: Approach<Input> = {
  id: "paths",
  name: "Find both root-to-node paths, compare them",
  code: `function lowestCommonAncestor(root, p, q)
    pathP ← path from root to p  // search the tree
    pathQ ← path from root to q  // search again
    i ← 0
    while pathP[i + 1] = pathQ[i + 1]
        i += 1  // still on both paths
    return pathP[i]
`,
  run({ root: vals, p, q }, t) {
    const tr = build(vals);
    const find = (target: number) => {
      const searched: string[] = [];
      const go = (id: string | null, path: string[]): string[] | null => { if (!id) return null; t.op(); searched.push(id); const n = tr.by.get(id)!; const pp = [...path, id]; if (n.val === target) return pp; return go(n.left, pp) ?? go(n.right, pp); };
      return { path: go(tr.root, [])!, searched };
    };
    const label = (ps: string[]) => ps.map((id) => tr.by.get(id)!.val).join(" → ");
    t.step({ line: 2, array: [], trees: view(tr), vars: { p, q },
      message: `The ancestors of a node are exactly the nodes on its path from the root. So find the path to ${p} and the path to ${q}; the last node they share is the lowest common ancestor.` });
    const A = find(p);
    t.step({ line: 2, array: [], trees: view(tr, { ...Object.fromEntries(A.searched.map((x) => [x, "compare" as Tone])), ...Object.fromEntries(A.path.map((x) => [x, "side-a" as Tone])) }), vars: { pathP: label(A.path) },
      message: `Searching for ${p} visited ${A.searched.length} node${A.searched.length === 1 ? "" : "s"} (blue). Its path: ${label(A.path)}.` });
    const B = find(q);
    t.step({ line: 3, array: [], trees: view(tr, { ...Object.fromEntries(B.searched.map((x) => [x, "compare" as Tone])), ...Object.fromEntries(A.path.map((x) => [x, "side-a" as Tone])), ...Object.fromEntries(B.path.map((x) => [x, (A.path.includes(x) ? "found" : "side-b") as Tone])) }), vars: { pathP: label(A.path), pathQ: label(B.path) },
      message: `A second search for ${q} visited ${B.searched.length} node${B.searched.length === 1 ? "" : "s"}. Its path: ${label(B.path)}. The two paths share their first stretch (green).` });
    let i = 0;
    while (i + 1 < A.path.length && i + 1 < B.path.length && A.path[i + 1] === B.path[i + 1]) { t.op(); i++; }
    t.op();
    const lca = A.path[i];
    t.step({ ask: { q: `Path to ${p}: ${label(A.path)}. Path to ${q}: ${label(B.path)}. Which is the last node on both?`, options: [...new Set([lca, A.path[0], A.path.at(-1)!, B.path.at(-1)!].map((x) => String(tr.by.get(x)!.val)))], answer: 0 },
      line: 7, array: [], trees: view(tr, { ...Object.fromEntries(A.path.map((x) => [x, "side-a" as Tone])), ...Object.fromEntries(B.path.map((x) => [x, "side-b" as Tone])), [lca]: "found" }), vars: { answer: tr.by.get(lca)!.val }, done: "found",
      message: `The paths agree up to ${tr.by.get(lca)!.val}, then split: ${tr.by.get(lca)!.val} is the lowest common ancestor. Two searches and a walk along both paths: O(n) time, plus O(h) to store the paths.` });
  },
};

const onePass: Approach<Input> = {
  id: "onePass",
  name: "One pass: report what's found below",
  code: `function lowestCommonAncestor(node, p, q)
    if node = none or node = p or node = q
        return node
    left ← lowestCommonAncestor(node.left, p, q)
    right ← lowestCommonAncestor(node.right, p, q)
    if left ≠ none and right ≠ none
        return node  // p and q on different sides
    return left if left ≠ none, else right
`,
  run({ root: vals, p, q }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, tones: Record<string, Tone> = {}, stack: string[] = [], waitIds: string[] = [];
    t.step({ line: 2, array: [], trees: view(tr), stack: [], vars: { p, q },
      message: `Each call reports up what it found in its subtree: ${p} or ${q} if it found one, the answer if it found both, or nothing. The first node to hear about both from different sides is the answer.` });
    let asked = false;
    const go = (id: string | null): string | null => {
      if (!id) return null;
      const n = tr.by.get(id)!;
      t.op();
      if (n.val === p || n.val === q) {
        notes[id] = "found"; tones[id] = "found";
        t.step({ line: 3, array: [], trees: view(tr, { ...tones }, notes, id), stack: [...stack, `lca(${n.val})`], vars: { node: n.val },
          message: `${n.val} is one of the two targets: report it up straight away, without searching below. If the other target is below it, ${n.val} is the answer anyway.` });
        return id;
      }
      stack.push(`lca(${n.val})`);
      // Show the call waiting on its children, so the call stack fills one call at a time.
      const waitTones = (): Record<string, Tone> => Object.fromEntries(stack.slice(0, -1).map((_, k) => [waitIds[k], "compare" as Tone]));
      waitIds.push(id);
      if (n.left || n.right) {
        const first = (n.left ?? n.right)!, fv = tr.by.get(first)!.val;
        t.step({ line: n.left ? 4 : 5, array: [], trees: view(tr, { ...{ ...tones }, ...waitTones(), [id]: "active" }, notes, id), stack: [...stack], vars: { node: n.val },
          message: `${stack.length === 1 ? `lca(${n.val}) is called. It needs its children's answers before it can return, so it waits on the call stack and calls` : `lca(${n.val}) is called and has to wait too: it calls`} lca(${fv}) for its ${n.left ? "left" : "right"} side${n.left ? "" : " (its left side is empty)"}.` });
      }
      const l = go(n.left);
      if (n.left && n.right) t.step({ line: 5, array: [], trees: view(tr, { ...{ ...tones }, ...waitTones(), [id]: "active" }, notes, id), stack: [...stack], vars: { node: n.val, left: (l ? String(tr.by.get(l)!.val) : "nothing") },
        message: `Back in lca(${n.val}): its left side answered ${(l ? String(tr.by.get(l)!.val) : "nothing")}. Now it calls lca(${tr.by.get(n.right)!.val}) for its right side.` });
      const r = go(n.right);
      const ret = l && r ? id : l ?? r;
      const nm = (x: string | null) => (x ? String(tr.by.get(x)!.val) : "nothing");
      const both = !!(l && r);
      notes[id] = ret ? nm(ret) : "—";
      tones[id] = both ? "found" : ret ? "side-a" : "visited";
      const ask = !asked && (l || r) ? (asked = true, { ask: { q: `At ${n.val}: the left side reports ${nm(l)}, the right side ${nm(r)}. What does ${n.val} report up?`, options: [...new Set([nm(ret), String(n.val), "nothing"])], answer: 0 } }) : {};
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: both ? 7 : 8, array: [], trees: view(tr, { ...tones, [id]: both ? "found" : "active" }, notes, id), stack: [...stack], vars: { node: n.val, left: nm(l), right: nm(r) },
        message: both ? `At ${n.val}: one target was found on each side, so ${n.val} is the lowest node above both. Report ${n.val}.` : ret ? `At ${n.val}: only one side found something (${nm(ret)}). Pass it up.` : `At ${n.val}: neither side found anything. Report nothing.` });
      stack.pop();
      waitIds.pop();
      return ret;
    };
    const ans = go(tr.root)!;
    t.step({ line: 8, array: [], trees: view(tr, { ...tones, [ans]: "found" }, notes), stack: [], vars: { answer: tr.by.get(ans)!.val }, done: "found",
      message: `The root's report is the answer: ${tr.by.get(ans)!.val}. One walk, each node visited at most once, no paths stored: O(n) time, O(h) for the recursion.` });
  },
};

export const approaches = { paths, onePass };

