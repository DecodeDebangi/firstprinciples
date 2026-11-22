import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build, isLeaf, view } from "../../concepts/54-tree-recursion/steps";

/** Negative numbers in brackets, so sums read cleanly: 4 + (-2). */
const p = (v: number) => (v < 0 ? `(${v})` : String(v));

export type Input = { root: (number | null)[]; targetSum: number };
export const example: Input = { root: [7, 2, 6, 5, 1, null, 4, 3, null, null, null, 8, -2], targetSum: 15 };
export const fields: InputField[] = [
  { key: "root", label: "root (level order)", kind: "tree" },
  { key: "targetSum", label: "targetSum", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.targetSum)) return { error: "targetSum must be a whole number." };
  return { input: raw };
}

const allPaths: Approach<Input> = {
  id: "allPaths",
  name: "List every root-to-leaf path, then add each up",
  code: `function hasPathSum(root, targetSum)
    paths ← every root-to-leaf path  // copied lists
    for each path in paths
        if sum(path) = targetSum
            return true
    return false
`,
  run({ root: vals, targetSum }, t) {
    const tr = build(vals);
    if (!tr.root) { t.step({ line: 6, array: [], trees: view(tr), vars: { answer: "false" }, done: "notfound", message: "An empty tree has no root-to-leaf paths: return false." }); return; }
    const paths: string[][] = [];
    const walk = (id: string | null, sofar: string[]) => { if (!id) return; const n = tr.by.get(id)!; const q = [...sofar, id]; if (isLeaf(n)) { t.op(q.length); paths.push(q); } walk(n.left, q); walk(n.right, q); };
    walk(tr.root, []);
    t.step({ line: 2, array: [], trees: view(tr), vars: { paths: paths.length, targetSum },
      message: `Collect every path from the root down to a leaf as its own list: ${paths.length} path${paths.length === 1 ? "" : "s"}. Then add each one up and compare with ${targetSum}.` });
    let asked = false;
    const tried: string[] = [];
    for (const path of paths) {
      const vs = path.map((id) => Number(tr.by.get(id)!.val)), s = vs.reduce((a, b) => a + b, 0);
      t.op(path.length);
      const hit = s === targetSum;
      const ask = !asked ? (asked = true, { ask: { q: `The path ${vs.join(" → ")} adds up to what?`, options: [...new Set([s, s - vs[0], s + vs[vs.length - 1]].map(String))], answer: 0 } }) : {};
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: hit ? 5 : 4, array: [], trees: view(tr, { ...Object.fromEntries(tried.map((x) => [x, "visited" as Tone])), ...Object.fromEntries(path.map((x) => [x, (hit ? "found" : "compare") as Tone])) }), vars: { path: vs.join(" → "), sum: s, targetSum },
        message: `${vs.map(p).join(" + ")} = ${s}${hit ? `, which is ${targetSum}: return true.` : `, not ${targetSum}.`}` });
      if (hit) {
        t.step({ line: 5, array: [], trees: view(tr, Object.fromEntries(path.map((x) => [x, "found" as Tone]))), vars: { answer: "true" }, done: "found",
          message: `Found a path. But every path was copied into its own list first, and the paths share their top nodes: up to O(n · h) work and space.` });
        return;
      }
      tried.push(...path);
    }
    t.step({ line: 6, array: [], trees: view(tr, Object.fromEntries(tried.map((x) => [x, "visited" as Tone]))), vars: { answer: "false" }, done: "notfound",
      message: `No path adds up to ${targetSum}: return false. Every path was copied and summed separately, re-adding the shared top nodes each time: up to O(n · h).` });
  },
};

const carry: Approach<Input> = {
  id: "carry",
  name: "Pass the amount still needed down",
  code: `function hasPathSum(node, need)
    if node = none
        return false
    need ← need - node.val
    if node is a leaf
        return need = 0
    return hasPathSum(node.left, need)
        or hasPathSum(node.right, need)
// first call: hasPathSum(root, targetSum)
`,
  run({ root: vals, targetSum }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, stack: string[] = [];
    if (!tr.root) { t.step({ line: 3, array: [], trees: view(tr), vars: { answer: "false" }, done: "notfound", message: "An empty tree has no root-to-leaf paths: return false." }); return; }
    const tones: Record<string, Tone> = {};
    t.step({ line: 9, array: [], trees: view(tr), stack: [], vars: { targetSum },
      message: `Hand each node the amount still needed. It subtracts its own value and passes the rest down. A leaf that's left needing exactly 0 ends a path that adds up to ${targetSum}.` });
    let asked = false, hitLeaf: string | null = null;
    const go = (id: string | null, need: number): boolean => {
      if (!id) return false;
      const n = tr.by.get(id)!;
      t.op();
      const left = need - Number(n.val);
      notes[id] = `${left}`;
      stack.push(`hasPathSum(${n.val}, ${need})`);
      if (isLeaf(n)) {
        const ok = left === 0;
        const ask = !asked ? (asked = true, { ask: { q: `Leaf ${n.val} receives "still need ${need}". Does this path add up to ${targetSum}?`, options: [ok ? "Yes" : "No", ok ? "No" : "Yes"], answer: 0 } }) : {};
        tones[id] = ok ? "found" : "visited";
        t.step({ ...ask, line: 6, array: [], trees: view(tr, { ...tones, [id]: ok ? "found" : "miss" }, notes, id), stack: [...stack], vars: { node: n.val, need, left },
          message: `Leaf ${n.val}: needed ${need}, so ${need} − ${p(Number(n.val))} = ${left} is left. ${ok ? "Exactly 0: this path works. Return true." : "Not 0: this path doesn't work. Return false."}` });
        stack.pop();
        if (ok) hitLeaf = id;
        return ok;
      }
      tones[id] = "visited";
      t.step({ line: 4, array: [], trees: view(tr, { ...tones, [id]: "active" }, notes, id), stack: [...stack], vars: { node: n.val, need, left },
        message: `${n.val} receives "still need ${need}". After itself, ${left} is still needed: pass that down.` });
      const r = go(n.left, left) || go(n.right, left);
      stack.pop();
      return r;
    };
    const ok = go(tr.root, targetSum);
    t.step({ line: ok ? 6 : 8, array: [], trees: view(tr, { ...tones, ...(hitLeaf ? { [hitLeaf]: "found" } : {}) }, notes), stack: [], vars: { answer: ok ? "true" : "false" }, done: ok ? "found" : "notfound",
      message: `${ok ? "A leaf reached exactly 0: return true." : `No leaf reached 0: no path adds up to ${targetSum}.`} Each node subtracts once and nothing is copied: O(n) time, O(h) for the recursion.` });
  },
};

export const approaches = { allPaths, carry };

/** A caterpillar: a long spine with a leaf hanging off each step, so many long paths share their tops. */
export const caterpillar = (n: number): Input => {
  const vals: (number | null)[] = [1];
  for (let k = 1; k < n; k++) vals.push(1, 1, null, null);
  return { root: vals.slice(0, Math.max(1, vals.length - 2)), targetSum: -1 };
};
export const growth = measureGrowth(
  [{ approach: allPaths, slot: 1 }, { approach: carry, slot: 3 }],
  caterpillar,
  [4, 8, 16, 32, 64],
);
