import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, type Tree } from "../54-tree-recursion/steps";

/** DP on trees (LeetCode 337, 968, 687, 979): each node returns a small summary of its subtree. */
export type RootInput = { root: (number | null)[] };
export const rootFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
const sizeErr = (vals: (number | null)[], max: number) => (!vals.length || vals[0] === null ? "Give at least one node." : vals.filter((x) => x !== null).length > max ? `Use at most ${max} nodes so the tree fits.` : null);
export const prepareUpTo = (max: number, extra?: (raw: RootInput) => string | null) => (raw: RootInput): Prepared<RootInput> => { const e = sizeErr(raw.root, max) ?? extra?.(raw) ?? null; return e ? { error: e } : { input: raw }; };
const v = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const kidsOf = (tr: Tree, id: string) => [tr.by.get(id)!.left, tr.by.get(id)!.right].filter(Boolean) as string[];
const sub = (tr: Tree, id: string | null): string[] => (id ? [id, ...sub(tr, tr.by.get(id)!.left), ...sub(tr, tr.by.get(id)!.right)] : []);
const all = (tr: Tree) => sub(tr, tr.root);
const view = (tr: Tree, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];
/** A chain of n nodes going right, with the given values. */
export const chainOf = (vals: number[]): (number | null)[] => { const out: (number | null)[] = [vals[0]]; for (let i = 1; i < vals.length; i++) out.push(null, vals[i]); return out; };

/* ---------- 337 House Robber III ---------- */
export const robExample: RootInput = { root: [2, 5, 3, 1, 6, null, 4] };
export const robPlain: Approach<RootInput> = {
  id: "plain", name: "Rob or skip, recomputing below",
  code: `function rob(node)
    if node = none
        return 0
    take ← node.val  // robbed: children skipped
    for each child c of node
        take += rob(c.left) + rob(c.right)
    skip ← rob(node.left) + rob(node.right)
    return max(take, skip)
`,
  run({ root: vals }, t) {
    const tr = build(vals), calls: Record<string, number> = {}, notes: Record<string, string> = {};
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: {}, message: "Two houses joined by an edge can't both be robbed. At each node, either rob it (then skip its children, so use its grandchildren's best) or skip it (use its children's best), and take the larger." });
    const go = (id: string | null): number => {
      t.op(); if (!id) return 0;
      calls[id] = (calls[id] ?? 0) + 1; notes[id] = `×${calls[id]}`;
      const n = tr.by.get(id)!;
      const gk = [...(n.left ? kidsOf(tr, n.left) : []), ...(n.right ? kidsOf(tr, n.right) : [])];
      const take = v(tr, id) + gk.reduce((s, g) => s + go(g), 0);
      const skip = go(n.left) + go(n.right);
      const best = Math.max(take, skip);
      if (t.record && calls[id] <= 2) t.step({ line: 8, array: [], trees: view(tr, { [id]: calls[id] > 1 ? "miss" : "active" }, notes, id), vars: { node: v(tr, id), take, skip, best },
        message: `rob(${v(tr, id)}): rob it for ${take}, or skip it for ${skip}. Best ${best}.${calls[id] > 1 ? ` This is call number ${calls[id]} for ${v(tr, id)}: the same answer worked out again.` : ""}` });
      return best;
    };
    const ans = go(tr.root);
    const repeats = Object.values(calls).reduce((s, c) => s + c - 1, 0);
    t.step({ line: 8, array: [], trees: view(tr, Object.fromEntries(Object.entries(calls).map(([k, c]) => [k, (c > 1 ? "miss" : "settled") as Tone])), notes), vars: { answer: ans, "repeated calls": repeats }, done: "found",
      message: `The best is ${ans}. But a grandchild is asked for its answer both by its grandparent and by its parent, so ${repeats} call${repeats === 1 ? " was" : "s were"} repeated (×2 and more on the tree). On a long chain the repeats grow exponentially.` });
  },
};
export const robPair: Approach<RootInput> = {
  id: "pair", name: "Return two answers: robbed and skipped",
  code: `function rob(root)
    return max(both(root))
function both(node)  // (best if robbed, if not)
    if node = none
        return (0, 0)
    lr, ls ← both(node.left)
    rr, rs ← both(node.right)
    robbed ← node.val + ls + rs
    skipped ← max(lr, ls) + max(rr, rs)
    return (robbed, skipped)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, done: string[] = [];
    let asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: {}, message: "Have each node return two numbers at once: the best for its subtree if it's robbed, and if it isn't. A parent then has everything it needs from its children, and nothing is asked twice." });
    const go = (id: string | null): [number, number] => {
      t.op(); if (!id) return [0, 0];
      const n = tr.by.get(id)!;
      const [lr, ls] = go(n.left), [rr, rs] = go(n.right);
      const robbed = v(tr, id) + ls + rs, skipped = Math.max(lr, ls) + Math.max(rr, rs);
      const q = asked < 2 && (n.left || n.right) ? (asked++, { ask: { q: `${v(tr, id)}'s children report (robbed, skipped) as ${n.left ? `(${lr}, ${ls})` : "nothing"} and ${n.right ? `(${rr}, ${rs})` : "nothing"}. If ${v(tr, id)} is robbed, what's the best?`, options: [...new Set([String(robbed), String(v(tr, id) + Math.max(lr, ls) + Math.max(rr, rs)), String(v(tr, id))])], answer: 0 } }) : {};
      notes[id] = `${robbed}/${skipped}`; done.push(id);
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 10, array: [], trees: view(tr, { ...Object.fromEntries(done.map((d) => [d, "settled" as Tone])), [id]: "found" }, notes, id), vars: { node: v(tr, id), robbed, skipped },
        message: `${v(tr, id)}: robbed means its children aren't, so ${v(tr, id)} + ${ls} + ${rs} = ${robbed}. Skipped means each child can do whichever is better: ${Math.max(lr, ls)} + ${Math.max(rr, rs)} = ${skipped}. Report ${robbed}/${skipped}.` });
      return [robbed, skipped];
    };
    const [r, s] = go(tr.root);
    t.step({ line: 2, array: [], trees: view(tr, Object.fromEntries(done.map((d) => [d, "settled" as Tone])), notes), vars: { answer: Math.max(r, s) }, done: "found", message: `The root reports ${r}/${s}, so the best is ${Math.max(r, s)}. One visit per node: O(n).` });
  },
};

/* ---------- 968 Binary Tree Cameras ---------- */
export const camExample: RootInput = { root: [0, 0, null, 0, null, 0, 0, null, null, 0] };
const covers = (tr: Tree, cams: Set<string>) => all(tr).every((id) => cams.has(id) || kidsOf(tr, id).some((k) => cams.has(k)) || tr.nodes.some((p) => cams.has(p.id) && kidsOf(tr, p.id).includes(id)));
export const camBrute: Approach<RootInput> = {
  id: "subsets", name: "Try every set of cameras, smallest first",
  code: `function minCameraCover(root)
    for k ← 1 to n
        for each set of k nodes
            if cameras there watch every node
                return k
`,
  run({ root: vals }, t) {
    const tr = build(vals), ids = all(tr), n = ids.length;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { nodes: n }, message: "A camera watches its own node, its parent and its children. The literal way: try 1 camera in every possible place, then every pair, and so on, until some set watches every node." });
    for (let k = 1; k <= n; k++) {
      let tried = 0, hit: string[] | null = null;
      const pick = (start: number, chosen: string[]) => { if (hit) return; if (chosen.length === k) { tried++; t.op(n); if (covers(tr, new Set(chosen))) hit = [...chosen]; return; } for (let i = start; i < n && !hit; i++) pick(i + 1, [...chosen, ids[i]]); };
      pick(0, []);
      if (hit) { t.step({ line: 5, array: [], trees: view(tr, Object.fromEntries(ids.map((d) => [d, ((hit as string[]).includes(d) ? "found" : "settled") as Tone]))), vars: { cameras: k, "sets tried": tried }, done: "found",
        message: `With ${k} camera${k === 1 ? "" : "s"}, after trying ${tried} set${tried === 1 ? "" : "s"} of that size, this one watches every node. Each size can mean up to C(n, k) sets: exponential.` }); return; }
      t.step({ line: 4, array: [], trees: view(tr, {}), vars: { cameras: k, "sets tried": tried }, message: `All ${tried} ways to place ${k} camera${k === 1 ? "" : "s"} leave some node unwatched. Try ${k + 1}.` });
    }
  },
};
export const camGreedy: Approach<RootInput> = {
  id: "states", name: "Bottom-up: each node reports needs, camera or covered",
  code: `function minCameraCover(root)
    cams ← 0
    if state(root) = "needs"
        cams += 1
    return cams
function state(node)
    if node = none
        return "covered"
    l, r ← state(node.left), state(node.right)
    if l = "needs" or r = "needs"
        cams += 1
        return "camera"
    if l = "camera" or r = "camera"
        return "covered"
    return "needs"
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, tones: Record<string, Tone> = {};
    let cams = 0, asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { cameras: 0 }, message: "Work from the leaves up. A leaf should never hold a camera: its parent can watch it and more. So each node reports one of three states: it needs watching, it has a camera, or it's already covered. A node with a needy child must hold a camera." });
    const go = (id: string | null): string => {
      t.op(); if (!id) return "covered";
      const n = tr.by.get(id)!;
      const l = go(n.left), r = go(n.right);
      const s = l === "needs" || r === "needs" ? "camera" : l === "camera" || r === "camera" ? "covered" : "needs";
      const q = asked < 3 && (n.left || n.right) ? (asked++, { ask: { q: `This node's children report: ${n.left ? l : "none (counts as covered)"} and ${n.right ? r : "none (counts as covered)"}. What does it report?`, options: ["camera: it must watch a needy child", "covered: a child's camera watches it", "needs: nothing watches it yet"], answer: s === "camera" ? 0 : s === "covered" ? 1 : 2 } }) : {};
      if (s === "camera") cams++;
      notes[id] = s; tones[id] = s === "camera" ? "found" : s === "covered" ? "settled" : "miss";
      t.step({ ...q, line: s === "camera" ? 12 : s === "covered" ? 14 : 15, array: [], trees: view(tr, { ...tones }, notes, id), vars: { cameras: cams },
        message: s === "camera" ? `A child needs watching, so put a camera here (${cams} so far). It also covers this node's parent.` : s === "covered" ? "A child has a camera, so this node is watched. Report covered." : `${n.left || n.right ? "Its children are covered but nothing watches this node" : "A leaf: nothing below watches it, and a camera here would be wasted"}. Report needs: its parent will take care of it.` });
      return s;
    };
    if (go(tr.root) === "needs") { cams++; tones[tr.root!] = "found"; notes[tr.root!] = "camera";
      t.step({ line: 4, array: [], trees: view(tr, tones, notes), vars: { cameras: cams }, message: `The root still needs watching and has no parent: give it a camera.` }); }
    // By the end every node is watched: show cameras green and everything else as settled.
    const final = Object.fromEntries(all(tr).map((id) => [id, (tones[id] === "found" ? "found" : "settled") as Tone]));
    t.step({ line: 5, array: [], trees: view(tr, final, notes), vars: { cameras: cams }, done: "found", message: `${cams} camera${cams === 1 ? "" : "s"} (green) watch every node. One bottom-up walk: O(n).` });
  },
};

/* ---------- 687 Longest Univalue Path ---------- */
export const uniExample: RootInput = { root: [5, 4, 5, 4, 4, null, 5, null, null, null, 4] };
export const uniEvery: Approach<RootInput> = {
  id: "every", name: "Measure both arms from every node",
  code: `function longestUnivaluePath(root)
    best ← 0
    for each node x in the tree
        both ← arm(x.left, x.val)
        both += arm(x.right, x.val)
        best ← max(best, both)
    return best
function arm(node, v)  // longest run of v down
    if node = none or node.val ≠ v
        return 0
    l, r ← arm(node.left, v), arm(node.right, v)
    return 1 + max(l, r)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let best = 0, at = "";
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { best }, message: "Find the longest path (counted in edges) where every node has the same value. Every such path has a top node; from each node, measure how far its value continues down each side." });
    for (const id of all(tr)) {
      const seen: string[] = [];
      const arm = (k: string | null, x: number): number => { t.op(); if (!k || v(tr, k) !== x) return 0; seen.push(k); return 1 + Math.max(arm(tr.by.get(k)!.left, x), arm(tr.by.get(k)!.right, x)); };
      const both = arm(tr.by.get(id)!.left, v(tr, id)) + arm(tr.by.get(id)!.right, v(tr, id));
      if (both > best) { best = both; at = id; }
      notes[id] = String(both);
      t.step({ line: 6, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((s) => [s, "compare" as Tone])), [id]: "active" }, notes, id), vars: { top: v(tr, id), path: both, best },
        message: `Top ${v(tr, id)}: same-value arms of total length ${both}. Measuring them walked ${seen.length} node${seen.length === 1 ? "" : "s"} again.` });
    }
    t.step({ line: 7, array: [], trees: view(tr, at ? { [at]: "found" } : {}, notes), vars: { best }, done: "found", message: `The longest is ${best} edge${best === 1 ? "" : "s"}. But arms were re-measured from every node above them: O(n²) for a chain of equal values.` });
  },
};
export const uniOnce: Approach<RootInput> = {
  id: "once", name: "Return one arm, track the best path",
  code: `function longestUnivaluePath(root)
    best ← 0
    arm(root)
    return best
function arm(node)  // longest same-value path down
    if node = none
        return 0
    l, r ← arm(node.left), arm(node.right)
    l ← l + 1 if node.left matches node, else 0
    r ← r + 1 if node.right matches node, else 0
    best ← max(best, l + r)
    return max(l, r)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let best = 0, at = "", asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { best }, message: "One bottom-up walk, like Diameter of Binary Tree. Each node returns the longest same-value arm going down from it, which only continues into a child with the same value. On the way, check the path that bends here, using both arms." });
    const go = (id: string | null): number => {
      t.op(); if (!id) return 0;
      const n = tr.by.get(id)!;
      const l0 = go(n.left), r0 = go(n.right);
      const l = n.left && v(tr, n.left) === v(tr, id) ? l0 + 1 : 0, r = n.right && v(tr, n.right) === v(tr, id) ? r0 + 1 : 0;
      const q = asked < 2 && (n.left || n.right) ? (asked++, { ask: { q: `Node ${v(tr, id)}: its left child ${n.left ? `holds ${v(tr, n.left)} and returned ${l0}` : "is missing"}; its right child ${n.right ? `holds ${v(tr, n.right)} and returned ${r0}` : "is missing"}. What does ${v(tr, id)} return?`, options: [...new Set([String(Math.max(l, r)), String(l + r), String(Math.max(l0, r0) + 1)])], answer: 0 } }) : {};
      if (l + r > best) { best = l + r; at = id; }
      notes[id] = `↑${Math.max(l, r)}`;
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 12, array: [], trees: view(tr, { [id]: at === id ? "found" : "active" }, notes, id), vars: { left: l, right: r, best },
        message: `At ${v(tr, id)}: left arm ${l}${n.left && v(tr, n.left) !== v(tr, id) ? ` (${v(tr, n.left)} ≠ ${v(tr, id)}, so the arm stops)` : ""}, right arm ${r}${n.right && v(tr, n.right) !== v(tr, id) ? ` (${v(tr, n.right)} ≠ ${v(tr, id)})` : ""}. A path bending here has ${l + r} edge${l + r === 1 ? "" : "s"}. Return the longer arm, ${Math.max(l, r)}.` });
      return Math.max(l, r);
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: view(tr, at ? { [at]: "found" } : {}, notes), vars: { best }, done: "found", message: `The longest same-value path has ${best} edge${best === 1 ? "" : "s"}. One visit per node: O(n).` });
  },
};

/* ---------- 979 Distribute Coins ---------- */
export const coinExample: RootInput = { root: [1, 0, 0, 3, null, 0, 2] };
export const coinPrepare = prepareUpTo(12, (r) => { const real = r.root.filter((x) => x !== null) as number[]; return real.some((x) => !Number.isInteger(x) || x < 0) ? "Coins are whole numbers, 0 or more." : real.reduce((a, b) => a + b, 0) !== real.length ? `The coins must add up to the number of nodes (${real.length}).` : null; });
export const coinEach: Approach<RootInput> = {
  id: "each", name: "Count the coins below every edge",
  code: `function distributeCoins(root)
    moves ← 0
    for each node x except the root
        extra ← coins under x - nodes under x
        moves += abs(extra)  // cross x's edge
    return moves
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let moves = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { moves }, message: "Each node must end with exactly one coin, and a move sends one coin across one edge. Look at the edge above a node: if its subtree has more coins than nodes, the extra must cross that edge going up; if fewer, the shortfall must come down. Either way, that many moves." });
    for (const id of all(tr).slice(1)) {
      const s = sub(tr, id); s.forEach(() => t.op());
      const extra = s.reduce((a, k) => a + v(tr, k), 0) - s.length;
      moves += Math.abs(extra); notes[id] = extra > 0 ? `+${extra}` : String(extra);
      t.step({ line: 5, array: [], trees: view(tr, { ...Object.fromEntries(s.map((k) => [k, "compare" as Tone])), [id]: "active" }, notes, id), vars: { extra, moves },
        message: `Below the edge above ${id === tr.root ? "the root" : `this node (${v(tr, id)} coins)`}: ${s.reduce((a, k) => a + v(tr, k), 0)} coins for ${s.length} node${s.length === 1 ? "" : "s"}, so ${Math.abs(extra)} coin${Math.abs(extra) === 1 ? "" : "s"} cross${Math.abs(extra) === 1 ? "es" : ""} it ${extra > 0 ? "going up" : extra < 0 ? "coming down" : "(none)"}. Counting meant re-reading ${s.length} node${s.length === 1 ? "" : "s"}.` });
    }
    t.step({ line: 6, array: [], trees: view(tr, {}, notes), vars: { moves }, done: "found", message: `${moves} moves. But each subtree was counted from scratch for every edge above it: O(n²) on a chain.` });
  },
};
export const coinOnce: Approach<RootInput> = {
  id: "once", name: "Each node reports its excess upward",
  code: `function distributeCoins(root)
    moves ← 0
    excess(root)
    return moves
function excess(node)  // coins to send up (or pull)
    if node = none
        return 0
    l, r ← excess(node.left), excess(node.right)
    moves += abs(l) + abs(r)
    return node.val + l + r - 1
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let moves = 0, asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { moves }, message: "Bottom-up, each node reports its subtree's excess: its coins plus its children's excess, minus the one coin it keeps. Whatever a child reports, positive or negative, crosses that child's edge, so add its size to the moves." });
    const go = (id: string | null): number => {
      t.op(); if (!id) return 0;
      const n = tr.by.get(id)!;
      const l = go(n.left), r = go(n.right), e = v(tr, id) + l + r - 1;
      const q = asked < 2 && (n.left || n.right) ? (asked++, { ask: { q: `${v(tr, id)} coin${v(tr, id) === 1 ? "" : "s"} here; the children report excess ${n.left ? l : 0} and ${n.right ? r : 0}. What does this node report?`, options: [...new Set([String(e), String(v(tr, id) + l + r), String(e + 2)])], answer: 0 } }) : {};
      moves += Math.abs(l) + Math.abs(r);
      notes[id] = e > 0 ? `+${e}` : String(e);
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 10, array: [], trees: view(tr, { [id]: "found" }, notes, id), vars: { excess: e, moves },
        message: `${v(tr, id)} coin${v(tr, id) === 1 ? "" : "s"} + ${l} + ${r} from the children − 1 to keep = ${e}. ${Math.abs(l) + Math.abs(r)} coin${Math.abs(l) + Math.abs(r) === 1 ? "" : "s"} crossed its children's edges: ${moves} moves so far.` });
      return e;
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: view(tr, {}, notes), vars: { moves }, done: "found", message: `${moves} moves. The root reports 0, as it must: every coin found a home. One visit per node: O(n).` });
  },
};
