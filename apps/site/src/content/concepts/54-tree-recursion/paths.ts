import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, isLeaf, type Tree } from "./steps";

/**
 * Root-to-leaf and downward path problems (LeetCode 257, 129, 113, 437, 124). Each pair contrasts redoing work
 * (copying the path at every node, or restarting from every node) with carrying it down or returning it up once.
 */
type T = Parameters<Approach<unknown>["run"]>[1];
export type RootInput = { root: (number | null)[] };
export type TargetInput = { root: (number | null)[]; target: number };
export const rootFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
export const targetFields: InputField[] = [...rootFields, { key: "target", label: "target sum", kind: "number" }];
const sizeErr = (vals: (number | null)[], max = 12) => (!vals.length || vals[0] === null ? "Give at least one node." : vals.filter((v) => v !== null).length > max ? `Use at most ${max} nodes so the tree fits.` : null);
export const rootPrepare = (raw: RootInput): Prepared<RootInput> => { const e = sizeErr(raw.root); return e ? { error: e } : { input: raw }; };
export const digitPrepare = (raw: RootInput): Prepared<RootInput> => { const e = sizeErr(raw.root, 10); if (e) return { error: e }; if (raw.root.some((v) => v !== null && (!Number.isInteger(v) || v < 0 || v > 9))) return { error: "Each node holds one digit, 0 to 9." }; return { input: raw }; };
export const targetPrepare = (raw: TargetInput): Prepared<TargetInput> => { const e = sizeErr(raw.root); if (e) return { error: e }; if (!Number.isInteger(raw.target)) return { error: "Use a whole-number target." }; return { input: raw }; };

const v = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const view = (tr: Tree, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];
const pathTones = (path: string[], extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries(path.map((p) => [p, "side-a" as Tone])), ...extra });
const results = (title: string, rows: string[]) => ({ title, rows: rows.length ? rows.map((r) => [r]) : [["none yet"]] });
/** A chain of n nodes leaning right: one long path, the worst case for copying it at every node. */
export const chain = (n: number, val = (i: number) => (i % 9) + 1): (number | null)[] => { const out: (number | null)[] = [val(0)]; for (let i = 1; i < n; i++) out.push(null, val(i)); return out; };

/* ---------- 257 Binary Tree Paths ---------- */
export const pathsExample: RootInput = { root: [5, 3, 8, 1, 4, null, 9] };
export const pathsCopy: Approach<RootInput> = {
  id: "copy", name: "Pass a new string down",
  code: `function binaryTreePaths(root)
    out ← []
    walk(root, "", out)
    return out
function walk(node, path, out)
    if node = none
        return
    path ← path + text(node.val)  // a new string
    if node.left = none and node.right = none
        out.push(path)
    else
        walk(node.left, path + "->", out)
        walk(node.right, path + "->", out)
`,
  run({ root: vals }, t) {
    const tr = build(vals), out: string[] = [];
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: results("paths", out), vars: {}, message: "Each call gets the path so far as a string, adds its own value, and hands a fresh copy to each child. At a leaf, the string is a finished path." });
    const go = (id: string | null, path: string, trail: string[]) => {
      if (!id) return;
      const s = path + v(tr, id);
      t.op(s.length);
      const here = [...trail, id];
      if (isLeaf(tr.by.get(id)!)) { out.push(s); t.step({ line: 10, array: [], trees: view(tr, pathTones(here, { [id]: "found" }), {}, id), grid: results("paths", out), vars: { path: s, copied: s.length }, message: `${v(tr, id)} is a leaf: "${s}" is a finished path. Building it copied ${s.length} characters.` }); return; }
      t.step({ line: 8, array: [], trees: view(tr, pathTones(here, { [id]: "active" }), {}, id), grid: results("paths", out), vars: { path: s, copied: s.length }, message: `Add ${v(tr, id)}: a new string "${s}" (${s.length} characters copied). Each child gets its own copy.` });
      go(tr.by.get(id)!.left, s + "->", here); go(tr.by.get(id)!.right, s + "->", here);
    };
    go(tr.root, "", []);
    t.step({ line: 4, array: [], trees: view(tr, {}), grid: results("paths", out), vars: { paths: out.length }, done: "found", message: `${out.length} path${out.length === 1 ? "" : "s"}. But every node copied the whole path above it: on a long chain that's 1 + 2 + … + n, O(n²) work.` });
  },
};
export const pathsShared: Approach<RootInput> = {
  id: "shared", name: "One shared path, undone on the way back",
  code: `function binaryTreePaths(root)
    out, path ← [], []
    walk(root, path, out)
    return out
function walk(node, path, out)
    if node = none
        return
    path.push(node.val)
    if node.left = none and node.right = none
        out.push(join(path, "->"))
    walk(node.left, path, out)
    walk(node.right, path, out)
    path.pop()  // undo before going back up
`,
  run({ root: vals }, t) {
    const tr = build(vals), out: string[] = [], path: string[] = [];
    let asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: results("paths", out), stack: [], stackTitle: "path (top = last)", vars: {}, message: "Keep one list for the current path. Push a node on the way down, write the path out only at a leaf, and pop the node on the way back up so the list is right for the next branch." });
    const go = (id: string | null) => {
      if (!id) return;
      t.op(); path.push(id);
      const n = tr.by.get(id)!;
      if (isLeaf(n)) {
        const s = path.map((p) => v(tr, p)).join("->"); t.op(path.length); out.push(s);
        t.step({ line: 10, array: [], trees: view(tr, pathTones(path, { [id]: "found" }), {}, id), grid: results("paths", out), stack: path.map((p) => String(v(tr, p))), stackTitle: "path (top = last)", vars: { "path length": path.length }, message: `${n.val} is a leaf: write out "${s}".` });
      } else t.step({ line: 8, array: [], trees: view(tr, pathTones(path, { [id]: "active" }), {}, id), grid: results("paths", out), stack: path.map((p) => String(v(tr, p))), stackTitle: "path (top = last)", vars: { "path length": path.length }, message: `Push ${n.val} and go deeper. Nothing is copied.` });
      go(n.left); go(n.right);
      const opts = [`Pop ${n.val}, so the path ends at ${path.length > 1 ? v(tr, path[path.length - 2]) : "nothing"} again`, `Keep ${n.val} on the path`];
      const q = asked < 2 && !isLeaf(n) ? (asked++, { ask: { q: `Both of ${n.val}'s subtrees are done. What happens to the path?`, options: opts, answer: 0 } }) : {};
      path.pop();
      if (!isLeaf(n)) t.step({ ...q, line: 13, array: [], trees: view(tr, pathTones(path)), grid: results("paths", out), stack: path.map((p) => String(v(tr, p))), stackTitle: "path (top = last)", vars: { "path length": path.length }, message: `Both of ${n.val}'s subtrees are done: pop it, so the path is right for whatever comes next.` });
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: view(tr, {}), grid: results("paths", out), stack: [], stackTitle: "path (top = last)", vars: { paths: out.length }, done: "found", message: `${out.length} path${out.length === 1 ? "" : "s"}. Each node is pushed and popped once, and a path is written out only when it's finished: O(n) plus the size of the answer.` });
  },
};

/* ---------- 129 Sum Root to Leaf Numbers ---------- */
export const digitsExample: RootInput = { root: [2, 7, 3, 1, null, 4, 6] };
export const digitsCollect: Approach<RootInput> = {
  id: "collect", name: "Collect each path, then read it as a number",
  code: `function sumNumbers(root)
    total ← 0
    for each root-to-leaf path p  // its digits
        num ← 0
        for each digit d in p
            num ← num · 10 + d
        total += num
    return total
`,
  run({ root: vals }, t) {
    const tr = build(vals);
    const paths: string[][] = [];
    const walk = (id: string | null, p: string[]) => { if (!id) return; const q = [...p, id]; t.op(q.length); if (isLeaf(tr.by.get(id)!)) paths.push(q); walk(tr.by.get(id)!.left, q); walk(tr.by.get(id)!.right, q); };
    walk(tr.root, []);
    t.step({ line: 3, array: [], trees: view(tr, {}), grid: { title: "root-to-leaf paths", rows: paths.map((p) => p.map((x) => v(tr, x))) }, vars: { paths: paths.length },
      message: `Each root-to-leaf path spells a number. First collect every path as a list of digits (copying the list at each step down): ${paths.length} path${paths.length === 1 ? "" : "s"}.` });
    let total = 0;
    const done: string[] = [];
    for (const p of paths) {
      let num = 0;
      for (const x of p) { t.op(); num = num * 10 + v(tr, x); }
      total += num; done.push(`${num}`);
      t.step({ line: 7, array: [], trees: view(tr, pathTones(p, { [p[p.length - 1]]: "found" })), grid: results("numbers", done), vars: { num, total }, message: `Read ${p.map((x) => v(tr, x)).join(", ")} as the number ${num}. Total ${total}.` });
    }
    t.step({ line: 8, array: [], trees: view(tr, {}), grid: results("numbers", done), vars: { total }, done: "found", message: `The total is ${total}. But every path was copied and then read again digit by digit: O(n · h) work.` });
  },
};
export const digitsCarry: Approach<RootInput> = {
  id: "carry", name: "Carry the number down",
  code: `function sumNumbers(root)
    return walk(root, 0)
function walk(node, num)
    if node = none
        return 0
    num ← num · 10 + node.val
    if node.left = none and node.right = none
        return num
    left ← walk(node.left, num)
    return left + walk(node.right, num)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {}, done: string[] = [];
    let asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: results("numbers", done), vars: {}, message: "Pass the number spelled so far down to each child. A child appends its own digit with num · 10 + digit; a leaf returns the finished number, and every parent adds up what comes back." });
    const go = (id: string | null, num: number, trail: string[]): number => {
      t.op();
      if (!id) return 0;
      const d = v(tr, id), now = num * 10 + d;
      const q = asked < 2 && num > 0 ? (asked++, { ask: { q: `The number so far is ${num}, and this node holds ${d}. What's the number now?`, options: [...new Set([String(now), String(num + d), `${d}${num}`])], answer: 0 } }) : {};
      notes[id] = String(now);
      const here = [...trail, id];
      if (isLeaf(tr.by.get(id)!)) {
        done.push(String(now));
        t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 8, array: [], trees: view(tr, pathTones(here, { [id]: "found" }), notes, id), grid: results("numbers", done), vars: { num: now }, message: `${num} · 10 + ${d} = ${now}. A leaf: return ${now}.` });
        return now;
      }
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 6, array: [], trees: view(tr, pathTones(here, { [id]: "active" }), notes, id), grid: results("numbers", done), vars: { num: now }, message: `${num} · 10 + ${d} = ${now}. Pass ${now} down to the children.` });
      return go(tr.by.get(id)!.left, now, here) + go(tr.by.get(id)!.right, now, here);
    };
    const total = go(tr.root, 0, []);
    t.step({ line: 2, array: [], trees: view(tr, {}, notes), grid: results("numbers", done), vars: { total }, done: "found", message: `Added on the way back up: ${done.join(" + ")} = ${total}. One visit per node, O(1) each: O(n).` });
  },
};

/* ---------- 113 Path Sum II ---------- */
export const sum2Example: TargetInput = { root: [6, 3, 8, 2, 1, null, -3, null, null, 2], target: 11 };
export const sum2Copy: Approach<TargetInput> = {
  id: "copy", name: "Copy the path at every node",
  code: `function pathSum(root, target)
    out ← []
    walk(root, [], 0, target, out)
    return out
function walk(node, path, sum, target, out)
    if node = none
        return
    path ← path + [node.val]  // a new list
    sum += node.val
    if node is a leaf and sum = target
        out.push(path)
    walk(node.left, path, sum, target, out)
    walk(node.right, path, sum, target, out)
`,
  run({ root: vals, target }, t) {
    const tr = build(vals), out: string[] = [];
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: results("paths that add up", out), vars: { target }, message: `Find every root-to-leaf path adding up to ${target}. The simple way: each call makes its own copy of the path with its value added.` });
    const go = (id: string | null, path: string[], sum: number) => {
      if (!id) return;
      const p = [...path, id]; t.op(p.length);
      const s = sum + v(tr, id), leaf = isLeaf(tr.by.get(id)!);
      if (leaf && s === target) out.push(p.map((x) => v(tr, x)).join(", "));
      t.step({ line: leaf ? 11 : 9, array: [], trees: view(tr, pathTones(p, { [id]: leaf && s === target ? "found" : leaf ? "miss" : "active" }), {}, id), grid: results("paths that add up", out), vars: { sum: s, copied: p.length },
        message: `Copy the path and add ${v(tr, id)}: sum ${s}, ${p.length} value${p.length === 1 ? "" : "s"} copied.${leaf ? (s === target ? ` A leaf, and ${s} = ${target}: keep this path.` : ` A leaf, but ${s} ≠ ${target}.`) : ""}` });
      go(tr.by.get(id)!.left, p, s); go(tr.by.get(id)!.right, p, s);
    };
    go(tr.root, [], 0);
    t.step({ line: 4, array: [], trees: view(tr, {}), grid: results("paths that add up", out), vars: { found: out.length }, done: out.length ? "found" : "notfound", message: `${out.length} path${out.length === 1 ? "" : "s"} found. Every node copied the path above it: O(n · h), O(n²) on a long chain.` });
  },
};
export const sum2Shared: Approach<TargetInput> = {
  id: "shared", name: "One shared path, copied only when it matches",
  code: `function pathSum(root, target)
    out, path ← [], []
    walk(root, target, path, out)
    return out
function walk(node, remain, path, out)
    if node = none
        return
    path.push(node.val)
    remain -= node.val
    if node is a leaf and remain = 0
        out.push(copy(path))
    walk(node.left, remain, path, out)
    walk(node.right, remain, path, out)
    path.pop()  // undo before going back up
`,
  run({ root: vals, target }, t) {
    const tr = build(vals), out: string[] = [], path: string[] = [];
    let asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: results("paths that add up", out), stack: [], stackTitle: "path (top = last)", vars: { target }, message: `Keep one path and pass down how much is still needed. Only a matching leaf copies the path; every node pops itself on the way back up.` });
    const go = (id: string | null, remain: number) => {
      if (!id) return;
      t.op(); path.push(id);
      const n = tr.by.get(id)!, r = remain - v(tr, id), leaf = isLeaf(n);
      const q = asked < 3 && leaf ? (asked++, { ask: { q: `Leaf ${n.val}: ${remain} was still needed before it. Does this path add up to ${target}?`, options: [r === 0 ? `Yes: ${remain} − ${n.val} = 0` : `No: ${remain} − ${n.val} = ${r}`, r === 0 ? "No" : "Yes"], answer: 0 } }) : {};
      if (leaf && r === 0) { t.op(path.length); out.push(path.map((x) => v(tr, x)).join(", ")); }
      t.step({ ...q, line: leaf ? 11 : 9, array: [], trees: view(tr, pathTones(path, { [id]: leaf && r === 0 ? "found" : leaf ? "miss" : "active" }), {}, id), grid: results("paths that add up", out), stack: path.map((x) => String(v(tr, x))), stackTitle: "path (top = last)", vars: { "still needed": r },
        message: `Push ${n.val}: ${remain} − ${n.val} = ${r} still needed.${leaf ? (r === 0 ? " A leaf with nothing left: copy this path into the answer." : " A leaf, but the sum is off.") : ""}` });
      go(n.left, r); go(n.right, r);
      path.pop();
    };
    go(tr.root, target);
    t.step({ line: 4, array: [], trees: view(tr, {}), grid: results("paths that add up", out), stack: [], stackTitle: "path (top = last)", vars: { found: out.length }, done: out.length ? "found" : "notfound", message: `${out.length} path${out.length === 1 ? "" : "s"} found. Each node is pushed and popped once; only matching paths are copied: O(n) plus the answer's size.` });
  },
};

/* ---------- 437 Path Sum III ---------- */
export const sum3Example: TargetInput = { root: [3, 1, 5, 2, null, -1, 4, 3], target: 6 };
export const sum3Every: Approach<TargetInput> = {
  id: "every", name: "Start a downward walk from every node",
  code: `function pathSum(root, target)
    if root = none
        return 0
    return from(root, target)
        + pathSum(root.left, target)
        + pathSum(root.right, target)
function from(node, remain)  // paths starting here
    if node = none
        return 0
    remain -= node.val
    count ← 1 if remain = 0, else 0
    return count + from(node.left, remain)
        + from(node.right, remain)
`,
  run({ root: vals, target }, t) {
    const tr = build(vals);
    let count = 0;
    const counted: Record<string, string> = {};
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { target, count }, message: `Count downward paths (they can start and end anywhere, but only go down) adding up to ${target}. The direct way: from every node, walk down every path that starts there.` });
    const starts: string[] = [];
    const all = (id: string | null) => { if (!id) return; starts.push(id); all(tr.by.get(id)!.left); all(tr.by.get(id)!.right); };
    all(tr.root);
    for (const s of starts) {
      let here = 0;
      const seen: string[] = [], hits: string[] = [];
      const walk = (id: string | null, remain: number) => { if (!id) return; t.op(); seen.push(id); const r = remain - v(tr, id); if (r === 0) { here++; hits.push(id); } walk(tr.by.get(id)!.left, r); walk(tr.by.get(id)!.right, r); };
      walk(s, target);
      count += here;
      if (here) counted[s] = `+${here}`;
      t.step({ line: 11, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((x) => [x, "compare" as Tone])), ...Object.fromEntries(hits.map((x) => [x, "found" as Tone])), [s]: "active" }, counted, s), vars: { start: v(tr, s), "nodes walked": seen.length, count },
        message: `Starting at ${v(tr, s)}: walk all ${seen.length} node${seen.length === 1 ? "" : "s"} below it. ${here ? `${here} path${here === 1 ? " ends" : "s end"} at exactly ${target} (green).` : `None add up to ${target}.`}` });
    }
    t.step({ line: 4, array: [], trees: view(tr, {}, counted), vars: { count }, done: "found", message: `${count} path${count === 1 ? "" : "s"}. Every node was walked again from each of its ancestors: O(n · h), O(n²) on a chain.` });
  },
};
export const sum3Prefix: Approach<TargetInput> = {
  id: "prefix", name: "Running sums from the root, counted in a map",
  code: `function pathSum(root, target)
    seen ← map with 0 → 1  // running sums above
    return walk(root, 0, target, seen)
function walk(node, sum, target, seen)
    if node = none
        return 0
    sum += node.val
    count ← (seen[sum - target] or 0)
    seen[sum] ← (seen[sum] or 0) + 1
    count += walk(node.left, sum, target, seen)
    count += walk(node.right, sum, target, seen)
    seen[sum] -= 1  // undo before going back up
    return count
`,
  run({ root: vals, target }, t) {
    const tr = build(vals), seen = new Map<number, number>([[0, 1]]), notes: Record<string, string> = {}, path: string[] = [];
    let total = 0, asked = 0;
    const map = (hl?: number) => ({ title: "seen: running sum → times on this path", entries: [...seen.entries()].filter(([, c]) => c > 0).map(([k, c]) => [String(k), String(c)] as [string, string]), ...(hl !== undefined ? { highlight: String(hl) } : {}) });
    t.step({ line: 2, array: [], trees: view(tr, {}), map: map(), vars: { target, count: 0 },
      message: `Keep the running sum from the root. A downward path ending here adds up to ${target} exactly when some node above had a running sum of (this sum − ${target}): the path is everything after that node. So count how often each running sum appears on the current path.` });
    const go = (id: string | null, sum: number): number => {
      t.op();
      if (!id) return 0;
      const s = sum + v(tr, id); path.push(id);
      const need = s - target, c = seen.get(need) ?? 0;
      const q = asked < 3 ? (asked++, { ask: { q: `The running sum here is ${s}, so a path ending here needs an earlier running sum of ${s} − ${target} = ${need}. The map holds ${[...seen.entries()].filter(([, k]) => k > 0).map(([k]) => k).join(", ")}. How many paths end here?`, options: [...new Set([String(c), String(c + 1), "0"])], answer: 0 } }) : {};
      seen.set(s, (seen.get(s) ?? 0) + 1);
      notes[id] = `sum ${s}`;
      total += c;
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 8, array: [], trees: view(tr, pathTones(path, { [id]: c ? "found" : "active" }), notes, id), map: map(need), vars: { sum: s, "looking for": need, count: total },
        message: `${v(tr, id)} brings the running sum to ${s}. ${c ? `${need} appeared ${c} time${c === 1 ? "" : "s"} above, so ${c} path${c === 1 ? " ends" : "s end"} here.` : `${need} never appeared above: no path ends here.`} Record ${s}.` });
      const r = c + go(tr.by.get(id)!.left, s) + go(tr.by.get(id)!.right, s);
      seen.set(s, seen.get(s)! - 1);
      path.pop();
      return r;
    };
    const count = go(tr.root, 0);
    t.step({ line: 13, array: [], trees: view(tr, {}, notes), map: map(), vars: { count }, done: "found", message: `${count} path${count === 1 ? "" : "s"}. Each node does one lookup and one update, then undoes it on the way back up: O(n).` });
  },
};

/* ---------- 124 Binary Tree Maximum Path Sum ---------- */
export const maxExample: RootInput = { root: [2, -6, 5, 3, 4, -1, 7] };
export const maxEvery: Approach<RootInput> = {
  id: "every", name: "Try every node as the top of the path",
  code: `function maxPathSum(root)
    best ← −∞
    for each node x in the tree
        left ← max(0, down(x.left))
        right ← max(0, down(x.right))
        best ← max(best, x.val + left + right)
    return best
function down(node)  // best path down from node
    if node = none
        return 0
    deeper ← max(down(node.left), down(node.right))
    return node.val + max(0, deeper)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let best = -Infinity, bestAt = "";
    const ids: string[] = []; const all = (id: string | null) => { if (!id) return; ids.push(id); all(tr.by.get(id)!.left); all(tr.by.get(id)!.right); }; all(tr.root);
    const down = (id: string | null, seen: string[]): number => { t.op(); if (!id) return 0; seen.push(id); const n = tr.by.get(id)!; return v(tr, id) + Math.max(0, down(n.left, seen), down(n.right, seen)); };
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { best: "−∞" }, message: "Every path has one highest node where it bends. Try each node as that top: add its value to the best path going down its left side and its right side (skipping a side that would only subtract)." });
    for (const x of ids) {
      const seen: string[] = [];
      const n = tr.by.get(x)!;
      const l = Math.max(0, down(n.left, seen)), r = Math.max(0, down(n.right, seen)), here = v(tr, x) + l + r;
      if (here > best) { best = here; bestAt = x; }
      notes[x] = String(here);
      t.step({ line: 6, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((s) => [s, "compare" as Tone])), [x]: "active" }, notes, x), vars: { top: v(tr, x), left: l, right: r, best },
        message: `Top ${v(tr, x)}: best down the left ${l}, down the right ${r}, so ${v(tr, x)} + ${l} + ${r} = ${here}. Measuring both sides re-walked ${seen.length} node${seen.length === 1 ? "" : "s"}.` });
    }
    t.step({ line: 7, array: [], trees: view(tr, { [bestAt]: "found" }, notes), vars: { best }, done: "found", message: `The best path sum is ${best}, bending at ${v(tr, bestAt)}. But every node's subtrees were measured again from scratch: O(n²) on a chain.` });
  },
};
export const maxOnce: Approach<RootInput> = {
  id: "once", name: "Return the best one-sided gain, track the best bend",
  code: `function maxPathSum(root)
    best ← −∞
    gain(root)
    return best
function gain(node)  // best path down from node
    if node = none
        return 0
    left ← max(0, gain(node.left))
    right ← max(0, gain(node.right))
    best ← max(best, node.val + left + right)
    return node.val + max(left, right)
`,
  run({ root: vals }, t) {
    const tr = build(vals), notes: Record<string, string> = {};
    let best = -Infinity, bestAt = "", asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), vars: { best: "−∞" }, message: "One bottom-up walk. Each call returns the best path going down from its node (it can only continue down one side). On the way, it also checks the path that bends here, using both sides, against the best so far." });
    const go = (id: string | null): number => {
      t.op();
      if (!id) return 0;
      const n = tr.by.get(id)!;
      const l = Math.max(0, go(n.left)), r = Math.max(0, go(n.right));
      const bend = v(tr, id) + l + r, ret = v(tr, id) + Math.max(l, r);
      const q = asked < 2 && (n.left || n.right) ? (asked++, { ask: { q: `Node ${n.val} gets ${l} from the left and ${r} from the right. What does it return to its parent?`, options: [...new Set([String(ret), String(bend), String(v(tr, id))])], answer: 0 } }) : {};
      if (bend > best) { best = bend; bestAt = id; }
      notes[id] = `↑${ret}`;
      t.step({ ...(q.ask && q.ask.options.length > 1 ? q : {}), line: 11, array: [], trees: view(tr, { [id]: bend === best && bestAt === id ? "found" : "active" }, notes, id), vars: { left: l, right: r, "bend here": bend, best },
        message: `At ${n.val}: the path bending here is ${n.val} + ${l} + ${r} = ${bend}${bestAt === id ? ", the best so far" : ""}. Its parent can only use one side, so return ${n.val} + max(${l}, ${r}) = ${ret}.${l === 0 && r === 0 && (n.left || n.right) ? " (A side worth less than 0 counts as 0: the path just doesn't go there.)" : ""}` });
      return ret;
    };
    go(tr.root);
    t.step({ line: 4, array: [], trees: view(tr, { [bestAt]: "found" }, notes), vars: { best }, done: "found", message: `The best path sum is ${best}, bending at ${v(tr, bestAt)}. Each node was visited once: O(n).` });
  },
};
