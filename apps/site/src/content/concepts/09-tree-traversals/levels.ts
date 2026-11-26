import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, type Tree } from "../54-tree-recursion/steps";

/** Level-by-level variants (LeetCode 199, 103, 637, 662, 987). */
export type RootInput = { root: (number | null)[] };
export const levelFields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];
export const levelPrepare = (raw: RootInput): Prepared<RootInput> => {
  if (!raw.root.length || raw.root[0] === null) return { error: "Give at least one node." };
  if (raw.root.filter((x) => x !== null).length > 13) return { error: "Use at most 13 nodes so the tree fits." };
  return { input: raw };
};
const val = (tr: Tree, id: string) => tr.by.get(id)!.val as number;
const kids = (tr: Tree, id: string) => [tr.by.get(id)!.left, tr.by.get(id)!.right].filter(Boolean) as string[];
const view = (tr: Tree, tones: Record<string, Tone>, notes: Record<string, string> = {}, ptr?: string | null): TreeData[] =>
  [{ root: tr.root, nodes: tr.nodes, tones: { ...tones }, notes: { ...notes }, pointers: ptr ? { node: ptr } : {} }];
const byLevel = (tr: Tree) => { const out: string[][] = []; let q = tr.root ? [tr.root] : []; while (q.length) { out.push(q); q = q.flatMap((k) => kids(tr, k)); } return out; };
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0$/, ""));
const res = (title: string, rows: (string | number)[][]) => ({ title, rows: rows.length ? rows : [["none yet"]] });

/* ---------- One walk per level (199, 637) vs one breadth-first walk ---------- */
type Per = "right" | "avg";
const rewalkCode: Record<Per, string> = {
  right: `function rightSideView(root)
    out ← []
    for d ← 0 to height(root) - 1
        out.push(last(root, d))
    return out
function last(node, d)  // rightmost at depth d
    if node = none
        return none
    if d = 0
        return node.val
    r ← last(node.right, d - 1)
    return r ≠ none ? r : last(node.left, d - 1)
`,
  avg: `function averageOfLevels(root)
    out ← []
    for d ← 0 to height(root) - 1
        sum, count ← total(root, d)
        out.push(sum / count)
    return out
function total(node, d)  // sum, count at depth d
    if node = none
        return 0, 0
    if d = 0
        return node.val, 1
    s1, c1 ← total(node.left, d - 1)
    s2, c2 ← total(node.right, d - 1)
    return s1 + s2, c1 + c2
`,
};
const bfsCode: Record<Per, string> = {
  right: `function rightSideView(root)
    out, queue ← [], queue of [root]
    while queue not empty
        size ← length(queue)
        repeat size times
            node ← queue.popFront()
            queue.push(node's children)
        out.push(node.val)  // the last one taken
    return out
`,
  avg: `function averageOfLevels(root)
    out, queue ← [], queue of [root]
    while queue not empty
        size, sum ← length(queue), 0
        repeat size times
            node ← queue.popFront()
            sum += node.val
            queue.push(node's children)
        out.push(sum / size)
    return out
`,
};
export function rewalk(per: Per): Approach<RootInput> {
  return {
    id: "rewalk", name: "One walk down per level", code: rewalkCode[per],
    run({ root: vals }, t) {
      const tr = build(vals), levels = byLevel(tr), out: string[] = [];
      t.op(tr.nodes.length);
      t.step({ line: 3, array: [], trees: view(tr, {}), grid: res(per === "right" ? "seen from the right" : "averages", []), vars: { levels: levels.length },
        message: per === "right" ? "Standing to the right of the tree, you see the rightmost node of each level. The direct way: for each depth, walk down from the root again, trying right before left, and stop at the first node at that depth." : "For each depth, walk down from the root again to add up the values at that depth, then divide by how many there were." });
      levels.forEach((lv, d) => {
        const seen: string[] = [];
        let got: string | null = null, sum = 0, cnt = 0;
        const walk = (id: string | null, k: number) => { t.op(); if (!id || (per === "right" && got)) return; seen.push(id); if (k === 0) { if (per === "right") got = id; else { sum += val(tr, id); cnt++; } return; } if (per === "right") { walk(tr.by.get(id)!.right, k - 1); walk(tr.by.get(id)!.left, k - 1); } else { walk(tr.by.get(id)!.left, k - 1); walk(tr.by.get(id)!.right, k - 1); } };
        walk(tr.root, d);
        out.push(per === "right" ? String(val(tr, got!)) : fmt(sum / cnt));
        t.step({ line: 4, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((s) => [s, "compare" as Tone])), ...(per === "right" ? { [got!]: "found" } : Object.fromEntries(lv.map((s) => [s, "found" as Tone]))) }), grid: res(per === "right" ? "seen from the right" : "averages", [out]), vars: { depth: d, "nodes walked": seen.length },
          message: per === "right" ? `Depth ${d}: walking down again (right first) reaches ${val(tr, got!)} first. That took ${seen.length} node${seen.length === 1 ? "" : "s"}, ${d ? "re-walking the levels above" : "just the root"}.` : `Depth ${d}: walking down again finds ${lv.map((s) => val(tr, s)).join(" + ")} = ${sum} over ${cnt}, so ${fmt(sum / cnt)}. ${d ? "The levels above were walked again." : ""}` });
      });
      t.step({ line: 5, array: [], trees: view(tr, {}), grid: res(per === "right" ? "seen from the right" : "averages", [out]), vars: { levels: levels.length }, done: "found",
        message: `[${out.join(", ")}]. But each depth re-walked every level above it: O(n · h), up to O(n²) for a chain.` });
    },
  };
}
export function levelBfs(per: Per): Approach<RootInput> {
  return {
    id: "bfs", name: "One breadth-first walk, a level at a time", code: bfsCode[per],
    run({ root: vals }, t) {
      const tr = build(vals), out: string[] = [];
      let q = tr.root ? [tr.root] : [], asked = 0;
      const done: string[] = [];
      t.step({ line: 2, array: [], trees: view(tr, {}), grid: res(per === "right" ? "seen from the right" : "averages", []), stack: q.map((k) => String(val(tr, k))).reverse(), stackTitle: "queue (front last)", vars: {},
        message: "Walk level by level with a queue. At the start of each level the queue holds exactly that level, so its length says how many nodes to take before the next level begins." });
      while (q.length) {
        const lv = q, size = lv.length;
        lv.forEach(() => t.op());
        const next = lv.flatMap((k) => kids(tr, k));
        const sum = lv.reduce((s, k) => s + val(tr, k), 0);
        const answer = per === "right" ? String(val(tr, lv[size - 1])) : fmt(sum / size);
        const opts = per === "right" ? [...new Set([answer, String(val(tr, lv[0]))])] : [...new Set([answer, String(sum)])];
        const qz = asked < 2 && opts.length > 1 ? (asked++, { ask: { q: per === "right" ? `This level is ${lv.map((k) => val(tr, k)).join(", ")} (left to right). Which one is seen from the right?` : `This level is ${lv.map((k) => val(tr, k)).join(", ")}. What's its average?`, options: opts, answer: 0 } }) : {};
        out.push(answer); done.push(...lv);
        t.step({ ...qz, line: per === "right" ? 8 : 9, array: [], trees: view(tr, { ...Object.fromEntries(done.map((s) => [s, "settled" as Tone])), ...Object.fromEntries(lv.map((s) => [s, "compare" as Tone])), ...(per === "right" ? { [lv[size - 1]]: "found" } : {}) }), grid: res(per === "right" ? "seen from the right" : "averages", [out]), stack: next.map((k) => String(val(tr, k))).reverse(), stackTitle: "queue (front last)", vars: { size, ...(per === "avg" ? { sum } : {}) },
          message: per === "right" ? `Take all ${size} node${size === 1 ? "" : "s"} of this level, queueing their children. The last one taken, ${answer}, is the one seen from the right.` : `Take all ${size} node${size === 1 ? "" : "s"} of this level, adding them up: ${sum} / ${size} = ${answer}. Their children are queued for the next level.` });
        q = next;
      }
      t.step({ line: per === "right" ? 9 : 10, array: [], trees: view(tr, Object.fromEntries(done.map((s) => [s, "settled" as Tone]))), grid: res(per === "right" ? "seen from the right" : "averages", [out]), stack: [], stackTitle: "queue (front last)", vars: { levels: out.length }, done: "found",
        message: `[${out.join(", ")}]. Every node was queued and taken once: O(n).` });
    },
  };
}

/* ---------- 103 Zigzag ---------- */
export function zigzag(direct: boolean): Approach<RootInput> {
  return {
    id: direct ? "place" : "reverse",
    name: direct ? "Place each value at the right end" : "Read each level, reverse every other one",
    code: direct ? `function zigzagLevelOrder(root)
    out, queue, toRight ← [], queue of [root], true
    while queue not empty
        size ← length(queue)
        level ← array of size, all 0
        for k ← 0 to size - 1
            node ← queue.popFront()
            at ← toRight ? k : size - 1 - k
            level[at] ← node.val
            queue.push(node's children)
        out.push(level)
        toRight ← not toRight
    return out
` : `function zigzagLevelOrder(root)
    out, queue ← [], queue of [root]
    while queue not empty
        size, level ← length(queue), []
        repeat size times
            node ← queue.popFront()
            level.push(node.val)
            queue.push(node's children)
        if length(out) is odd
            level ← reverse(level)
        out.push(level)
    return out
`,
    run({ root: vals }, t) {
      const tr = build(vals), out: (number | string)[][] = [], done: string[] = [];
      let q = tr.root ? [tr.root] : [], asked = 0;
      t.step({ line: 2, array: [], trees: view(tr, {}), grid: res("levels, zigzag", []), vars: {},
        message: direct ? "Read each level left to right as usual, but write each value straight into its final slot: from the left on even levels, from the right on odd ones. No reversing afterwards." : "Read each level left to right with a queue, then reverse every other level before adding it." });
      while (q.length) {
        const lv = q, rightward = out.length % 2 === 0;
        const vs = lv.map((k) => val(tr, k));
        lv.forEach(() => t.op());
        let level = [...vs];
        if (!rightward) { level = [...vs].reverse(); if (!direct) lv.forEach(() => t.op()); }
        const qz = asked < 2 && vs.length > 1 && vs.join() !== [...vs].reverse().join() ? (asked++, { ask: { q: `Level ${out.length} holds ${vs.join(", ")} from left to right. In which order is it written?`, options: [level.join(", "), (rightward ? [...vs].reverse() : vs).join(", ")], answer: 0 } }) : {};
        out.push(level); done.push(...lv);
        t.step({ ...qz, line: direct ? 11 : 11, array: [], trees: view(tr, { ...Object.fromEntries(done.map((s) => [s, "settled" as Tone])), ...Object.fromEntries(lv.map((s) => [s, "compare" as Tone])) }), grid: res("levels, zigzag", out), vars: { level: out.length - 1, direction: rightward ? "→" : "←" },
          message: rightward ? `Level ${out.length - 1}, left to right: ${level.join(", ")}.` : direct ? `Level ${out.length - 1}, right to left: the k-th node taken goes into slot size − 1 − k, so it's already ${level.join(", ")}.` : `Level ${out.length - 1}: read as ${vs.join(", ")}, then reversed to ${level.join(", ")}.` });
        q = lv.flatMap((k) => kids(tr, k));
      }
      t.step({ line: direct ? 13 : 12, array: [], trees: view(tr, Object.fromEntries(done.map((s) => [s, "settled" as Tone]))), grid: res("levels, zigzag", out), vars: { levels: out.length }, done: "found",
        message: direct ? "Done. Each node is handled once and written straight into place: O(n)." : "Done in O(n): the reversals add one more pass over half the levels, which is still O(n)." });
    },
  };
}

/* ---------- 662 Maximum width ---------- */
export const widthPrepare = (raw: RootInput): Prepared<RootInput> => {
  const r = levelPrepare(raw); if ("error" in r) return r;
  const tr = build(raw.root); return byLevel(tr).length > 6 ? { error: "Use a tree at most 6 levels deep, so every position fits." } : r;
};
export const widthSlots: Approach<RootInput> = {
  id: "slots", name: "Fill in every missing position",
  code: `function widthOfBinaryTree(root)
    best, level ← 0, [root]
    while level has a real node
        trim the none slots off both ends
        best ← max(best, length(level))
        next ← []
        for each slot in level  // none: 2 nones
            next.push(slot.left, slot.right)
        level ← next
    return best
`,
  run({ root: vals }, t) {
    const tr = build(vals);
    let level: (string | null)[] = [tr.root], best = 0, d = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}), grid: res("this level, missing positions as ·", []), vars: { best },
      message: "The width of a level counts every position between its leftmost and rightmost nodes, including empty ones. The literal way: keep an empty slot for every missing node, so positions stay lined up." });
    while (level.some(Boolean)) {
      let a = 0, b = level.length - 1;
      while (!level[a]) a++; while (!level[b]) b--;
      level = level.slice(a, b + 1);
      level.forEach(() => t.op());
      best = Math.max(best, level.length);
      t.step({ line: 5, array: [], trees: view(tr, Object.fromEntries(level.filter(Boolean).map((k) => [k!, "compare" as Tone]))), grid: res("this level, missing positions as ·", [level.map((k) => (k ? val(tr, k) : "·"))]), vars: { depth: d, width: level.length, best, slots: level.length },
        message: `Depth ${d}: ${level.length} position${level.length === 1 ? "" : "s"} from the leftmost node to the rightmost, ${level.filter((k) => !k).length} of them empty. Best width so far ${best}.` });
      level = level.flatMap((k) => (k ? [tr.by.get(k)!.left, tr.by.get(k)!.right] : [null, null]));
      d++;
    }
    t.step({ line: 10, array: [], trees: view(tr, {}), grid: res("best width", [[best]]), vars: { best }, done: "found",
      message: `The widest level spans ${best} positions. But empty slots double with every level: a sparse tree h levels deep can need up to 2^h slots.` });
  },
};
export const widthNumbers: Approach<RootInput> = {
  id: "numbers", name: "Number the positions",
  code: `function widthOfBinaryTree(root)
    best, queue ← 0, queue of [(root, 0)]
    while queue not empty
        first ← the front node's position
        size ← length(queue)
        repeat size times
            node, i ← queue.popFront()
            last ← i
            if node.left ≠ none
                queue.push((node.left, 2 · i))
            if node.right ≠ none
                queue.push((node.right, 2 · i + 1))
        best ← max(best, last - first + 1)
    return best
`,
  run({ root: vals }, t) {
    const tr = build(vals), pos: Record<string, string> = {};
    let q: [string, number][] = tr.root ? [[tr.root, 0]] : [], best = 0, d = 0, asked = 0;
    t.step({ line: 2, array: [], trees: view(tr, {}, {}), vars: { best },
      message: "Give every position a number, as if the tree were full: the root is 0, and a node at position i has children at 2i and 2i + 1. A level's width is then last − first + 1, with no empty slots stored." });
    while (q.length) {
      const first = q[0][1], last = q[q.length - 1][1];
      q.forEach(([k, i]) => { t.op(); pos[k] = `#${i}`; });
      const w = last - first + 1;
      const qz = asked < 2 && q.length > 1 ? (asked++, { ask: { q: `This level's leftmost node is at position ${first} and its rightmost at ${last}. How wide is it?`, options: [...new Set([String(w), String(q.length), String(last - first)])], answer: 0 } }) : {};
      best = Math.max(best, w);
      t.step({ ...(qz.ask && qz.ask.options.length > 1 ? qz : {}), line: 13, array: [], trees: view(tr, Object.fromEntries(q.map(([k]) => [k, "compare" as Tone])), pos), vars: { depth: d, first, last, width: w, best },
        message: `Depth ${d}: positions ${q.map(([, i]) => i).join(", ")}. Width ${last} − ${first} + 1 = ${w}${q.length < w ? `, though only ${q.length} node${q.length === 1 ? " is" : "s are"} real` : ""}. Best ${best}.` });
      q = q.flatMap(([k, i]) => { const n = tr.by.get(k)!; return [...(n.left ? [[n.left, 2 * i] as [string, number]] : []), ...(n.right ? [[n.right, 2 * i + 1] as [string, number]] : [])]; });
      d++;
    }
    t.step({ line: 14, array: [], trees: view(tr, {}, pos), vars: { best }, done: "found",
      message: `The widest level spans ${best} positions. Each real node was queued once: O(n). (In code with fixed-size integers, renumber each level from its first position so the numbers don't overflow on deep trees.)` });
  },
};
/** Two long legs from the root, one going left and one going right, `depth` levels deep: the widest gap for its size. */
export const legs = (depth: number): (number | null)[] => {
  const out: (number | null)[] = [1, 2, 3];
  for (let d = 2, k = 4; d < depth; d++, k += 2) out.push(k, null, null, k + 1);
  return out;
};

/* ---------- 987 Vertical order ---------- */
type Item = { id: string; col: number; row: number };
const items = (tr: Tree) => { const out: Item[] = []; const go = (id: string | null, row: number, col: number) => { if (!id) return; out.push({ id, col, row }); go(tr.by.get(id)!.left, row + 1, col - 1); go(tr.by.get(id)!.right, row + 1, col + 1); }; go(tr.root, 0, 0); return out; };
export const verticalPerColumn: Approach<RootInput> = {
  id: "perColumn", name: "One full walk per column",
  code: `function verticalTraversal(root)
    lo, hi ← smallest and largest column
    out ← []
    for c ← lo to hi
        here ← every (row, value) in column c
        sort here by row, then value
        out.push(the values of here)
    return out
`,
  run({ root: vals }, t) {
    const tr = build(vals), all = items(tr), notes = Object.fromEntries(all.map((x) => [x.id, `col ${x.col}`]));
    all.forEach(() => t.op());
    const lo = Math.min(...all.map((x) => x.col)), hi = Math.max(...all.map((x) => x.col)), out: (number | string)[][] = [];
    t.step({ line: 2, array: [], trees: view(tr, {}, notes), grid: res("columns, left to right", []), vars: { lo, hi },
      message: `The root is in column 0; a left child is one column left of its parent, a right child one column right. List each column top to bottom (ties in the same row go smallest first). Columns run from ${lo} to ${hi}.` });
    for (let c = lo; c <= hi; c++) {
      all.forEach(() => t.op());
      const here = all.filter((x) => x.col === c).sort((a, b) => { t.op(); return a.row - b.row || val(tr, a.id) - val(tr, b.id); });
      out.push(here.map((x) => val(tr, x.id)));
      t.step({ line: 7, array: [], trees: view(tr, Object.fromEntries(all.map((x) => [x.id, (x.col === c ? "found" : "compare") as Tone])), notes), grid: res("columns, left to right", out), vars: { column: c, "nodes walked": all.length },
        message: `Column ${c}: walk all ${all.length} nodes to find ${here.map((x) => val(tr, x.id)).join(", ")}. Every column repeats the whole walk.` });
    }
    t.step({ line: 8, array: [], trees: view(tr, {}, notes), grid: res("columns, left to right", out), vars: { columns: out.length }, done: "found",
      message: `Done, but with ${out.length} columns each walking all ${all.length} nodes: O(n · w), O(n²) for a tree that leans to one side.` });
  },
};
export const verticalSort: Approach<RootInput> = {
  id: "sortOnce", name: "One walk, then one sort",
  code: `function verticalTraversal(root)
    items ← []
    walk(root, 0, 0, items)  // row 0, column 0
    sort items by column, then row, then value
    return the values, grouped by column
function walk(node, row, col, items)
    if node = none
        return
    items.push((col, row, node.val))
    walk(node.left, row + 1, col - 1, items)
    walk(node.right, row + 1, col + 1, items)
`,
  run({ root: vals }, t) {
    const tr = build(vals), all = items(tr), notes: Record<string, string> = {};
    let asked = 0;
    t.step({ line: 3, array: [], trees: view(tr, {}), grid: res("(column, row, value)", []), vars: {},
      message: "Walk the tree once, recording each node's column and row. Then one sort by column, then row, then value puts every node in its final order." });
    const seen: string[] = [];
    for (const x of all) {
      t.op(); seen.push(x.id); notes[x.id] = `${x.col},${x.row}`;
      const n = tr.by.get(x.id)!;
      const par = all.find((p) => tr.by.get(p.id)!.left === x.id || tr.by.get(p.id)!.right === x.id);
      const qz = asked < 2 && par ? (asked++, { ask: { q: `${n.val} is the ${tr.by.get(par.id)!.left === x.id ? "left" : "right"} child of ${val(tr, par.id)}, which is in column ${par.col}. Which column is ${n.val} in?`, options: [String(x.col), String(tr.by.get(par.id)!.left === x.id ? par.col + 1 : par.col - 1)], answer: 0 } }) : {};
      t.step({ ...qz, line: 9, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((s) => [s, "settled" as Tone])), [x.id]: "found" }, notes, x.id), grid: res("(column, row, value)", seen.map((s) => { const y = all.find((z) => z.id === s)!; return [`(${y.col}, ${y.row}, ${val(tr, s)})`]; })), vars: { col: x.col, row: x.row },
        message: par ? `${n.val} is ${tr.by.get(par.id)!.left === x.id ? "left" : "right"} of ${val(tr, par.id)}: column ${x.col}, row ${x.row}.` : `The root ${n.val}: column 0, row 0.` });
    }
    const sorted = [...all].sort((a, b) => { t.op(); return a.col - b.col || a.row - b.row || val(tr, a.id) - val(tr, b.id); });
    const groups: (number | string)[][] = [];
    let last: number | null = null;
    for (const x of sorted) { if (x.col !== last) { groups.push([]); last = x.col; } groups[groups.length - 1].push(val(tr, x.id)); }
    t.step({ line: 5, array: [], trees: view(tr, {}, notes), grid: res("columns, left to right", groups), vars: { columns: groups.length }, done: "found",
      message: `Sort once and group by column: ${groups.map((g) => `[${g.join(", ")}]`).join(" ")}. One walk is O(n), and the sort is O(n log n).` });
  },
};
/** A chain leaning right: every node in its own column. */
export const rightChain = (n: number): (number | null)[] => { const out: (number | null)[] = [1]; for (let i = 1; i < n; i++) out.push(null, i + 1); return out; };
