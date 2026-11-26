import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, type Tree } from "../54-tree-recursion/steps";

/**
 * Trees as graphs (LeetCode 863, 2385, 1448). With a parent link per node, a tree is an undirected graph: search
 * outward from any node, up as well as down.
 */
export type StartInput = { root: (number | null)[]; start: number; k: number };
export type RootInput = { root: (number | null)[] };
const treeF: InputField = { key: "root", label: "root (level order, distinct values)", kind: "tree" };
export const distFields: InputField[] = [treeF, { key: "start", label: "target", kind: "number" }, { key: "k", label: "k", kind: "number" }];
export const timeFields: InputField[] = [treeF, { key: "start", label: "start", kind: "number" }];
export const rootFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
const baseErr = (vals: (number | null)[]) => { const real = vals.filter((x) => x !== null); if (!real.length || vals[0] === null) return "Give at least one node."; if (real.length > 13) return "Use at most 13 nodes so the tree fits."; if (new Set(real).size !== real.length) return "Values must be distinct, so each value names one node."; return null; };
export function distPrepare(raw: StartInput): Prepared<StartInput> { const e = baseErr(raw.root); if (e) return { error: e }; if (!raw.root.includes(raw.start)) return { error: "The target must be a value in the tree." }; if (!Number.isInteger(raw.k) || raw.k < 0 || raw.k > 12) return { error: "k must be a whole number from 0 to 12." }; return { input: raw }; }
export function timePrepare(raw: StartInput): Prepared<StartInput> { const e = baseErr(raw.root); if (e) return { error: e }; if (!raw.root.includes(raw.start)) return { error: "Start must be a value in the tree." }; return { input: { ...raw, k: 0 } }; }
export function rootPrepare(raw: RootInput): Prepared<RootInput> { const real = raw.root.filter((x) => x !== null); if (!real.length || raw.root[0] === null) return { error: "Give at least one node." }; return real.length > 13 ? { error: "Use at most 13 nodes so the tree fits." } : { input: raw }; }

const v = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const idOf = (tr: Tree, val: number) => tr.nodes.find((n) => n.val === val)!.id;
const view = (tr: Tree, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];
const preorder = (tr: Tree) => { const out: string[] = []; const go = (id: string | null) => { if (!id) return; out.push(id); go(tr.by.get(id)!.left); go(tr.by.get(id)!.right); }; go(tr.root); return out; };
/** Root-to-node path, found by a search from the root (costs one op per node visited). */
const pathTo = (tr: Tree, target: string, op: () => void) => { const path: string[] = []; const go = (id: string | null): boolean => { if (!id) return false; op(); path.push(id); if (id === target || go(tr.by.get(id)!.left) || go(tr.by.get(id)!.right)) return true; path.pop(); return false; }; go(tr.root); return path; };

/* ---------- Distance via root paths (863 and 2385, slow) ---------- */
function pathDistances(mode: "k" | "time"): Approach<StartInput> {
  return {
    id: "paths", name: "Measure each node's distance through their shared ancestor",
    code: mode === "k" ? `function distanceK(root, target, k)
    out ← []
    tp ← path from root to target
    for each node x in the tree
        xp ← path from root to x
        shared ← nodes tp and xp share at the start
        d ← length(tp) + length(xp) - 2 · shared
        if d = k
            out.push(x.val)
    return out
` : `function amountOfTime(root, start)
    best ← 0
    sp ← path from root to start
    for each node x in the tree
        xp ← path from root to x
        shared ← nodes sp and xp share at the start
        d ← length(sp) + length(xp) - 2 · shared
        best ← max(best, d)
    return best
`,
    run({ root: vals, start, k }, t) {
      const tr = build(vals), s = idOf(tr, start), notes: Record<string, string> = {};
      const sp = pathTo(tr, s, () => t.op());
      const out: number[] = [];
      let best = 0;
      t.step({ line: 3, array: [], trees: view(tr, { ...Object.fromEntries(sp.map((x) => [x, "side-a" as Tone])), [s]: "active" }), vars: mode === "k" ? { target: start, k } : { start },
        message: mode === "k" ? `Find every node exactly ${k} edge${k === 1 ? "" : "s"} from ${start}. Without a way to walk up, a distance has to be measured through the root: the path from root to ${start} is ${sp.map((x) => v(tr, x)).join(" → ")}.` : `The infection spreads one edge per minute, up and down. The answer is the distance from ${start} to the farthest node. Without a way up, measure each distance through the root: root to ${start} is ${sp.map((x) => v(tr, x)).join(" → ")}.` });
      for (const x of preorder(tr)) {
        const xp = pathTo(tr, x, () => t.op());
        let shared = 0; while (shared < sp.length && shared < xp.length && sp[shared] === xp[shared]) { t.op(); shared++; }
        const d = sp.length - shared + xp.length - shared;
        notes[x] = String(d);
        if (mode === "k" && d === k) out.push(v(tr, x));
        best = Math.max(best, d);
        const hit = mode === "k" ? d === k : d === best;
        t.step({ line: mode === "k" ? (d === k ? 9 : 8) : 8, array: [], trees: view(tr, { ...Object.fromEntries(xp.map((p) => [p, "compare" as Tone])), [s]: "active", [x]: hit ? "found" : "visited" }, notes, x), vars: mode === "k" ? { node: v(tr, x), distance: d, found: out.join(", ") || "none" } : { node: v(tr, x), distance: d, best },
          message: `${v(tr, x)}: its root path shares ${shared} node${shared === 1 ? "" : "s"} with ${start}'s, so the distance is ${sp.length - shared} up + ${xp.length - shared} down = ${d}.${mode === "k" ? (d === k ? " Exactly k: keep it." : "") : ""} That meant searching from the root again.` });
      }
      t.step({ line: mode === "k" ? 10 : 9, array: [], trees: view(tr, mode === "k" ? Object.fromEntries(tr.nodes.filter((n) => out.includes(n.val as number)).map((n) => [n.id, "found" as Tone])) : {}, notes), vars: mode === "k" ? { answer: out.join(", ") || "none" } : { answer: best }, done: "found",
        message: `${mode === "k" ? `At distance ${k}: ${out.length ? out.join(", ") : "nothing"}.` : `The farthest node is ${best} edge${best === 1 ? "" : "s"} away: ${best} minute${best === 1 ? "" : "s"}.`} But every node needed its own search from the root: O(n · h), up to O(n²).` });
    },
  };
}

/* ---------- Parent links + BFS (863 and 2385, fast) ---------- */
function parentBfs(mode: "k" | "time"): Approach<StartInput> {
  return {
    id: "bfs", name: "Add parent links, then spread out from the start",
    code: mode === "k" ? `function distanceK(root, target, k)
    parent ← map of each node to its parent
    seen, ring ← {target}, [target]
    repeat k times
        next ← []
        for each node x in ring
            for each neighbour y of x
                if y ≠ none and y not in seen
                    seen.add(y)
                    next.push(y)
        ring ← next
    return the values in ring
` : `function amountOfTime(root, start)
    parent ← map of each node to its parent
    seen, ring ← {start}, [start]
    minutes ← -1
    while ring not empty
        minutes += 1
        next ← []
        for each node x in ring
            for each neighbour y of x
                if y ≠ none and y not in seen
                    seen.add(y)
                    next.push(y)
        ring ← next
    return minutes
`,
    run({ root: vals, start, k }, t) {
      const tr = build(vals), s = idOf(tr, start), parent = new Map<string, string | null>(), notes: Record<string, string> = {};
      const walk = (id: string | null, p: string | null) => { if (!id) return; t.op(); parent.set(id, p); walk(tr.by.get(id)!.left, id); walk(tr.by.get(id)!.right, id); };
      walk(tr.root, null);
      t.step({ line: 2, array: [], trees: view(tr, { [s]: "active" }), vars: mode === "k" ? { target: start, k } : { start },
        message: "One walk records each node's parent. Now every node has up to three neighbours (left, right, parent), so the tree is a graph, and a breadth-first search can spread out from any node: ring 1 is one edge away, ring 2 two edges, and so on." });
      const seen = new Set([s]);
      let ring = [s], d = 0, asked = 0;
      notes[s] = "0";
      const tones = () => Object.fromEntries([...seen].map((x) => [x, "visited" as Tone]));
      while (ring.length && (mode === "time" || d < k)) {
        const next: string[] = [];
        for (const x of ring) for (const y of [tr.by.get(x)!.left, tr.by.get(x)!.right, parent.get(x) ?? null]) { t.op(); if (y && !seen.has(y)) { seen.add(y); next.push(y); } }
        if (!next.length) break;
        d++;
        next.forEach((y) => (notes[y] = String(d)));
        const viaUp = next.filter((y) => ring.some((x) => parent.get(x) === y));
        const q = asked < 2 ? (asked++, { ask: { q: `Ring ${d - 1} is ${ring.map((x) => v(tr, x)).join(", ")}. Which nodes form ring ${d}?`, options: [...new Set([next.map((y) => v(tr, y)).join(", "), next.filter((y) => !viaUp.includes(y)).map((y) => v(tr, y)).join(", ") || "none"])], answer: 0 } }) : {};
        t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: mode === "k" ? 11 : 13, array: [], trees: view(tr, { ...tones(), ...Object.fromEntries(ring.map((x) => [x, "side-a" as Tone])), ...Object.fromEntries(next.map((y) => [y, "found" as Tone])), [s]: "active" }, notes), vars: mode === "k" ? { distance: d, ring: next.map((y) => v(tr, y)).join(", ") } : { minute: d, infected: seen.size },
          message: `${mode === "k" ? `Distance ${d}` : `Minute ${d}`}: ${next.map((y) => v(tr, y)).join(", ")}.${viaUp.length ? ` ${viaUp.map((y) => v(tr, y)).join(", ")} ${viaUp.length === 1 ? "was" : "were"} reached by going up, through a parent link.` : ""}` });
        ring = next;
      }
      const ans = mode === "k" ? (d === k ? ring : []) : [];
      t.step({ line: mode === "k" ? 12 : 14, array: [], trees: view(tr, mode === "k" ? { ...tones(), ...Object.fromEntries(ans.map((y) => [y, "found" as Tone])) } : tones(), notes), vars: mode === "k" ? { answer: ans.map((y) => v(tr, y)).join(", ") || "none" } : { answer: d }, done: "found",
        message: mode === "k" ? `${ans.length ? `At distance ${k}: ${ans.map((y) => v(tr, y)).join(", ")}.` : `Nothing is ${k} edges away.`} One walk for the parents and one search: each node is handled once, O(n).` : `The last node is infected after ${d} minute${d === 1 ? "" : "s"}. Each node is handled once: O(n).` });
    },
  };
}
export const distPaths = pathDistances("k"), distBfs = parentBfs("k"), timePaths = pathDistances("time"), timeBfs = parentBfs("time");
export const distExample: StartInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], start: 6, k: 2 };
export const timeExample: StartInput = { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], start: 4, k: 0 };

/* ---------- 1448 Count Good Nodes ---------- */
export const goodExample: RootInput = { root: [5, 3, 7, 6, 1, 4, 9, null, null, 2] };
export const goodPaths: Approach<RootInput> = {
  id: "paths", name: "Check each node's whole root path",
  code: `function goodNodes(root)
    count ← 0
    for each node x in the tree
        path ← path from root to x
        if no value on path is bigger than x.val
            count += 1
    return count
`,
  run({ root: vals }, t) {
    const tr = build(vals), tones: Record<string, Tone> = {};
    let count = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { count }, message: "A node is good if nothing on the path from the root down to it is bigger than it. The direct way: for each node, find its root path and check every value on it." });
    for (const x of preorder(tr)) {
      const p = pathTo(tr, x, () => t.op());
      p.forEach(() => t.op());
      const top = Math.max(...p.map((q) => v(tr, q))), good = top <= v(tr, x);
      if (good) count++;
      tones[x] = good ? "found" : "miss";
      t.step({ line: good ? 6 : 5, array: [], trees: view(tr, { ...tones, ...Object.fromEntries(p.slice(0, -1).map((q) => [q, "compare" as Tone])) }, {}, x), vars: { node: v(tr, x), "path max": top, count },
        message: good ? `${v(tr, x)}: nothing above it is bigger (the largest is ${top}). Good.` : `${v(tr, x)}: ${top} above it is bigger. Not good.` });
    }
    t.step({ line: 7, array: [], trees: view(tr, tones), vars: { count }, done: "found", message: `${count} good node${count === 1 ? "" : "s"}. But each node re-read its whole path from the root: O(n · h).` });
  },
};
export const goodDown: Approach<RootInput> = {
  id: "down", name: "Pass the largest value so far down",
  code: `function goodNodes(root)
    return count(root, -∞)
function count(node, most)  // most: largest above
    if node = none
        return 0
    good ← 1 if node.val ≥ most, else 0
    most ← max(most, node.val)
    return good + count(node.left, most)
        + count(node.right, most)
`,
  run({ root: vals }, t) {
    const tr = build(vals), tones: Record<string, Tone> = {}, notes: Record<string, string> = {};
    let count = 0, asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { count }, message: "The only thing a node needs from its path is the largest value above it. So pass that one number down: top-down recursion, with no walking back up." });
    const go = (id: string | null, most: number) => {
      t.op(); if (!id) return;
      const x = v(tr, id), good = x >= most;
      const q = asked < 3 ? (asked++, { ask: { q: `The largest value above this node is ${most === -Infinity ? "−∞ (it's the root)" : most}, and it holds ${x}. Is it good?`, options: [good ? `Yes: ${x} ≥ ${most === -Infinity ? "−∞" : most}` : `No: ${most} > ${x}`, good ? "No" : "Yes"], answer: 0 } }) : {};
      if (good) count++;
      tones[id] = good ? "found" : "miss";
      const m2 = Math.max(most, x); notes[id] = `max ${m2}`;
      t.step({ ...q, line: 6, array: [], trees: view(tr, { ...tones }, notes, id), vars: { node: x, "largest above": most === -Infinity ? "−∞" : most, count },
        message: `${x} against the largest above, ${most === -Infinity ? "nothing" : most}: ${good ? "good" : "not good"}. Pass max(${most === -Infinity ? "−∞" : most}, ${x}) = ${m2} down to its children.` });
      go(tr.by.get(id)!.left, m2); go(tr.by.get(id)!.right, m2);
    };
    go(tr.root, -Infinity);
    t.step({ line: 2, array: [], trees: view(tr, tones, notes), vars: { count }, done: "found", message: `${count} good node${count === 1 ? "" : "s"}. One visit per node, O(1) each: O(n).` });
  },
};
/** A chain of n nodes going right. */
export const chainOf = (vals: number[]): (number | null)[] => { const out: (number | null)[] = [vals[0]]; for (let i = 1; i < vals.length; i++) out.push(null, vals[i]); return out; };
