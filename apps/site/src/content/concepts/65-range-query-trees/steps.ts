import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/**
 * Range sums under updates (LeetCode 307 and the read on segment and Fenwick trees). The input is a list of values and
 * a list of operations, "sum l r" (add up positions l..r) and "set i v" (change position i to v).
 */
export type Op = { kind: "sum"; l: number; r: number } | { kind: "set"; i: number; v: number };
export type RangeInput = { nums: number[]; ops: string };
export const rangeExample: RangeInput = { nums: [3, 1, 4, 1, 5, 9, 2, 6], ops: "sum 1 5, set 3 7, sum 1 5, sum 4 7" };
export const rangeFields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "ops", label: "then (sum l r / set i v)", kind: "raw" },
];
export function parseOps(text: string, n: number): Op[] | string {
  const out: Op[] = [];
  for (const part of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [w, a, b, extra] = part.split(/\s+/);
    const x = Number(a), y = Number(b);
    if (extra !== undefined || !Number.isInteger(x) || !Number.isInteger(y)) return `"${part}" should be "sum l r" or "set i v" with whole numbers.`;
    if (w === "sum") { if (x < 0 || y >= n || x > y) return `In "${part}", use 0 ≤ l ≤ r ≤ ${n - 1}.`; out.push({ kind: "sum", l: x, r: y }); }
    else if (w === "set") { if (x < 0 || x >= n) return `In "${part}", the position must be 0 to ${n - 1}.`; out.push({ kind: "set", i: x, v: y }); }
    else return `"${part}" should start with sum or set.`;
  }
  return out.length ? out : "Give at least one operation, like: sum 0 2, set 1 5";
}
export function rangePrepare(raw: RangeInput): Prepared<RangeInput> {
  if (raw.nums.length < 2 || raw.nums.length > 8) return { error: "Use 2 to 8 values so the tree fits." };
  const ops = parseOps(raw.ops, raw.nums.length);
  if (typeof ops === "string") return { error: ops };
  if (ops.length > 6) return { error: "Use at most 6 operations." };
  return { input: raw };
}
const opText = (o: Op) => (o.kind === "sum" ? `sum ${o.l} ${o.r}` : `set ${o.i} ${o.v}`);
const ops = (raw: RangeInput) => parseOps(raw.ops, raw.nums.length) as Op[];
const numsGrid = (a: number[], tones: Record<string, Tone> = {}, extra?: { label: string; row: (number | string)[] }) => ({
  title: "nums", rows: extra ? [a, extra.row] : [a], rowLabels: extra ? ["nums", extra.label] : undefined, colLabels: a.map((_, k) => k), tones,
});
const rangeTones = (n: number, l: number, r: number, row = 0): Record<string, Tone> => Object.fromEntries(Array.from({ length: n }, (_, k) => [`${row},${k}`, (k >= l && k <= r ? "side-a" : "idle") as Tone]).filter(([, t]) => t !== "idle"));
const answers = (out: number[]) => `[${out.join(", ")}]`;
type T = Parameters<Approach<RangeInput>["run"]>[1];

/* ---------- Prefix sums: O(1) sums, O(n) updates ---------- */
export const prefixApproach: Approach<RangeInput> = {
  id: "prefix", name: "Prefix sums, rebuilt after each set",
  code: `class NumArray
    constructor(nums)
        pre ← [0] then running totals of nums
    function sumRange(l, r)
        return pre[r + 1] − pre[l]
    function update(i, val)
        diff ← val − nums[i]
        nums[i] ← val
        for k from i + 1 to length(nums)
            pre[k] ← pre[k] + diff
`,
  run(raw, t) {
    const a = [...raw.nums], n = a.length, pre = [0];
    for (const x of a) { t.op(); pre.push(pre[pre.length - 1] + x); }
    const out: number[] = [];
    const g = (tones: Record<string, Tone> = {}) => ({ title: "nums and pre", rows: [[...a, ""], [...pre]], rowLabels: ["nums", "pre"], colLabels: pre.map((_, k) => k), tones });
    if (t.record) t.step({ line: 3, array: [], grid: g(), vars: { answers: "[]" }, message: `pre[k] is the total of the first k values. Any range sum is then one subtraction. Building it takes one pass over the ${n} values.` });
    for (const o of ops(raw)) {
      if (o.kind === "sum") {
        t.op();
        const s = pre[o.r + 1] - pre[o.l];
        out.push(s);
        if (t.record) t.step({ line: 5, array: [], grid: g({ ...rangeTones(n, o.l, o.r), [`1,${o.r + 1}`]: "found", [`1,${o.l}`]: "compare" }), vars: { op: opText(o), answer: s, answers: answers(out) },
          message: `${opText(o)}: pre[${o.r + 1}] − pre[${o.l}] = ${pre[o.r + 1]} − ${pre[o.l]} = ${s}. One step, however long the range.` });
      } else {
        const diff = o.v - a[o.i];
        a[o.i] = o.v;
        for (let k = o.i + 1; k <= n; k++) { t.op(); pre[k] += diff; }
        if (t.record) t.step({ line: 10, array: [], grid: g({ [`0,${o.i}`]: "found", ...Object.fromEntries(Array.from({ length: n - o.i }, (_, j) => [`1,${o.i + 1 + j}`, "active" as Tone])) }), vars: { op: opText(o), diff, "totals fixed": n - o.i, answers: answers(out) },
          message: `${opText(o)}: every total from pre[${o.i + 1}] on includes position ${o.i}, so all ${n - o.i} of them change by ${diff >= 0 ? "+" : ""}${diff}. An early position means fixing almost the whole list: O(n).` });
      }
    }
    if (t.record) t.step({ line: 5, array: [], grid: g(), vars: { answers: answers(out) }, done: "found", message: `Answers: ${answers(out)}. Sums are O(1), but each set is O(n). With many of both, that's slow.` });
  },
};

/* ---------- Segment tree ---------- */
type Seg = { id: string; lo: number; hi: number; sum: number; left: Seg | null; right: Seg | null };
function buildSeg(a: number[], lo: number, hi: number, t: T): Seg {
  t.op();
  if (lo === hi) return { id: `s${lo}-${hi}`, lo, hi, sum: a[lo], left: null, right: null };
  const mid = Math.floor((lo + hi) / 2), l = buildSeg(a, lo, mid, t), r = buildSeg(a, mid + 1, hi, t);
  return { id: `s${lo}-${hi}`, lo, hi, sum: l.sum + r.sum, left: l, right: r };
}
const segNodes = (s: Seg | null, out: TreeNodeData[] = []): TreeNodeData[] => { if (s) { out.push({ id: s.id, val: s.sum, left: s.left?.id ?? null, right: s.right?.id ?? null }); segNodes(s.left, out); segNodes(s.right, out); } return out; };
const segNotes = (s: Seg | null, out: Record<string, string> = {}): Record<string, string> => { if (s) { out[s.id] = s.lo === s.hi ? `${s.lo}` : `${s.lo}–${s.hi}`; segNotes(s.left, out); segNotes(s.right, out); } return out; };
export const segApproach: Approach<RangeInput> = {
  id: "segment", name: "Segment tree: totals for halves, quarters, …",
  code: `function build(lo, hi)  // a node for nums[lo..hi]
    node ← new node(lo, hi)
    if lo = hi
        node.sum ← nums[lo]
    else
        mid ← floor((lo + hi) / 2)
        node.left ← build(lo, mid)
        node.right ← build(mid + 1, hi)
        node.sum ← node.left.sum + node.right.sum
    return node
function sumRange(node, l, r)
    if node.hi < l or node.lo > r  // outside
        return 0
    if l ≤ node.lo and node.hi ≤ r  // inside
        return node.sum
    return sumRange(node.left, l, r)
         + sumRange(node.right, l, r)
function update(node, i, val)
    if node.lo = node.hi
        node.sum ← val
        return
    if i ≤ node.left.hi
        update(node.left, i, val)
    else
        update(node.right, i, val)
    node.sum ← node.left.sum + node.right.sum
`,
  run(raw, t) {
    const a = [...raw.nums], n = a.length, root = buildSeg(a, 0, n - 1, t), out: number[] = [];
    let asked = 0;
    const view = (tones: Record<string, Tone>, ptr?: string): TreeData[] => [{ root: root.id, nodes: segNodes(root), tones, notes: segNotes(root), pointers: ptr ? { node: ptr } : {}, layout: "compact" }];
    if (t.record) t.step({ line: 10, array: [], grid: numsGrid(a), trees: view({}), vars: { answers: "[]" },
      message: `Each node holds the total of a stretch of nums (the small label under it). The root covers everything, its children each half, and so on down to single positions. Building it visits each of its ${2 * n - 1} nodes once: O(n).` });
    for (const o of ops(raw)) {
      if (o.kind === "sum") {
        const tones: Record<string, Tone> = {};
        if (t.record) t.step({ line: 11, array: [], grid: numsGrid(a, rangeTones(n, o.l, o.r)), trees: view({}), vars: { op: opText(o), answers: answers(out) }, message: `${opText(o)}: start at the root and find nodes that fit inside ${o.l}–${o.r}.` });
        const q = (s: Seg): number => {
          t.op();
          if (s.hi < o.l || s.lo > o.r) { tones[s.id] = "discard"; if (t.record) t.step({ line: 13, array: [], grid: numsGrid(a, rangeTones(n, o.l, o.r)), trees: view({ ...tones }, s.id), vars: { op: opText(o), node: `${s.lo}–${s.hi}`, answers: answers(out) }, message: `${s.lo}–${s.hi} is outside ${o.l}–${o.r}: it adds 0, and nothing below it is visited.` }); return 0; }
          if (o.l <= s.lo && s.hi <= o.r) {
            const ask = t.record && asked < 2 && s.lo !== s.hi ? (asked++, { ask: { q: `Node ${s.lo}–${s.hi} lies completely inside ${o.l}–${o.r}. What happens?`, options: [`Use its total, ${s.sum}, and stop here`, "Visit its children", "Skip it"], answer: 0 } }) : {};
            tones[s.id] = "found";
            if (t.record) t.step({ ...ask, line: 15, array: [], grid: numsGrid(a, rangeTones(n, o.l, o.r)), trees: view({ ...tones }, s.id), vars: { op: opText(o), node: `${s.lo}–${s.hi}`, adds: s.sum, answers: answers(out) }, message: `${s.lo}–${s.hi} is completely inside: use its total, ${s.sum}, without going further down.` });
            return s.sum;
          }
          tones[s.id] = "compare";
          if (t.record) t.step({ line: 16, array: [], grid: numsGrid(a, rangeTones(n, o.l, o.r)), trees: view({ ...tones }, s.id), vars: { op: opText(o), node: `${s.lo}–${s.hi}`, answers: answers(out) }, message: `${s.lo}–${s.hi} is partly inside: ask both children.` });
          return q(s.left!) + q(s.right!);
        };
        const s = q(root);
        out.push(s);
        const used = Object.entries(tones).filter(([, x]) => x === "found").length;
        if (t.record) t.step({ line: 17, array: [], grid: numsGrid(a, rangeTones(n, o.l, o.r)), trees: view(Object.fromEntries(Object.entries(tones).filter(([, x]) => x === "found"))), vars: { op: opText(o), answer: s, answers: answers(out) },
          message: `${opText(o)} = ${s}, from ${used} stored total${used === 1 ? "" : "s"}. Any range splits into at most about 2 nodes per level: O(log n).` });
      } else {
        const path: Seg[] = [];
        for (let s: Seg | null = root; s; s = s.left && o.i <= s.left.hi ? s.left : s.right) path.push(s);
        a[o.i] = o.v;
        if (t.record) t.step({ line: 18, array: [], grid: numsGrid(a, { [`0,${o.i}`]: "found" }), trees: view(Object.fromEntries(path.map((s) => [s.id, "compare" as Tone]))), vars: { op: opText(o), answers: answers(out) },
          message: `${opText(o)}: only the nodes whose stretch includes position ${o.i} change: one per level, the path from the root down to it.` });
        for (let k = path.length - 1; k >= 0; k--) {
          t.op();
          const s = path[k], old = s.sum;
          s.sum = s.lo === s.hi ? o.v : s.left!.sum + s.right!.sum;
          if (t.record) t.step({ line: s.lo === s.hi ? 20 : 26, array: [], grid: numsGrid(a, { [`0,${o.i}`]: "found" }), trees: view({ ...Object.fromEntries(path.slice(0, k).map((p) => [p.id, "compare" as Tone])), ...Object.fromEntries(path.slice(k + 1).map((p) => [p.id, "settled" as Tone])), [s.id]: "active" }, s.id), vars: { op: opText(o), node: `${s.lo}–${s.hi}`, sum: `${old} → ${s.sum}`, answers: answers(out) },
            message: s.lo === s.hi ? `The leaf for position ${o.i} becomes ${o.v}.` : `${s.lo}–${s.hi} adds up its two children again: ${s.left!.sum} + ${s.right!.sum} = ${s.sum}.` });
        }
      }
    }
    if (t.record) t.step({ line: 17, array: [], grid: numsGrid(a), trees: view({}), vars: { answers: answers(out) }, done: "found", message: `Answers: ${answers(out)}. Both operations walk at most a few nodes per level: O(log n) each.` });
  },
};

/* ---------- Fenwick tree ---------- */
export const lowbit = (k: number) => k & -k;
export const fenwickApproach: Approach<RangeInput> = {
  id: "fenwick", name: "Fenwick tree: totals in one list",
  code: `// tree[k] holds the total of the lowbit(k) values
// ending at position k (positions count from 1)
function lowbit(k)  // last 1 bit: lowbit(12) = 4
    return k & −k
function prefix(k)  // total of the first k values
    total ← 0
    while k > 0
        total ← total + tree[k]
        k ← k − lowbit(k)
    return total
function add(k, diff)  // position k grows by diff
    while k ≤ n
        tree[k] ← tree[k] + diff
        k ← k + lowbit(k)
function sumRange(l, r)
    return prefix(r + 1) − prefix(l)
function update(i, val)
    add(i + 1, val − nums[i])
    nums[i] ← val
`,
  run(raw, t) {
    const a = [...raw.nums], n = a.length, tree = Array(n + 1).fill(0), out: number[] = [];
    const add = (k: number, d: number) => { for (; k <= n; k += lowbit(k)) { t.op(); tree[k] += d; } };
    a.forEach((x, i) => add(i + 1, x));
    const cover = (k: number) => (lowbit(k) === 1 ? `${k}` : `${k - lowbit(k) + 1}–${k}`);
    const g = (tones: Record<string, Tone> = {}) => ({ title: "positions from 1", rows: [a, tree.slice(1), tree.slice(1).map((_, j) => cover(j + 1))], rowLabels: ["nums", "tree", "covers"], colLabels: a.map((_, k) => k + 1), tones });
    let asked = 0;
    if (t.record) t.step({ line: 1, array: [], grid: g(), vars: { answers: "[]" },
      message: "One list, no tree drawing needed. tree[k] holds the total of a stretch that ends at position k and is lowbit(k) long: the value of k's last 1 bit. Odd positions hold 1 value, multiples of 2 hold 2, of 4 hold 4, and so on (the covers row)." });
    const prefix = (k: number, label: string) => {
      let total = 0;
      const seen: number[] = [];
      for (; k > 0; k -= lowbit(k)) {
        t.op(); total += tree[k]; seen.push(k);
        const ask = t.record && asked < 2 && k - lowbit(k) > 0 && lowbit(k) > 1 ? (asked++, { ask: { q: `tree[${k}] covers ${cover(k)}. Which position does the walk jump to next?`, options: [String(k - lowbit(k)), String(k - 1), String(k + lowbit(k))], answer: 0 } }) : {};
        if (t.record) t.step({ ...ask, line: 9, array: [], grid: g(Object.fromEntries(seen.map((s) => [`1,${s - 1}`, (s === k ? "active" : "found") as Tone]))), vars: { [label]: total, k },
          message: `Add tree[${k}] = ${tree[k]} (positions ${cover(k)}). Total so far ${total}. Jump to ${k - lowbit(k)}, just before that stretch.` });
      }
      return total;
    };
    for (const o of ops(raw)) {
      if (o.kind === "sum") {
        if (t.record) t.step({ line: 16, array: [], grid: g(rangeTones(n, o.l, o.r)), vars: { op: opText(o), answers: answers(out) }, message: `${opText(o)}: the total of the first ${o.r + 1} values minus the total of the first ${o.l}.` });
        const big = prefix(o.r + 1, `prefix(${o.r + 1})`), small = prefix(o.l, `prefix(${o.l})`);
        out.push(big - small);
        if (t.record) t.step({ line: 16, array: [], grid: g(rangeTones(n, o.l, o.r)), vars: { op: opText(o), answer: big - small, answers: answers(out) },
          message: `${big} − ${small} = ${big - small}. Each jump removes one 1 bit from k, so a prefix takes at most log₂ n jumps.` });
      } else {
        const d = o.v - a[o.i];
        a[o.i] = o.v;
        const hit: number[] = [];
        for (let k = o.i + 1; k <= n; k += lowbit(k)) {
          t.op(); tree[k] += d; hit.push(k);
          if (t.record) t.step({ line: 13, array: [], grid: g({ [`0,${o.i}`]: "found", ...Object.fromEntries(hit.map((s) => [`1,${s - 1}`, (s === k ? "active" : "settled") as Tone])) }), vars: { op: opText(o), diff: d, k, answers: answers(out) },
            message: `tree[${k}] covers ${cover(k)}, which includes position ${o.i + 1}: add ${d}. Next is ${k + lowbit(k)}, the next stretch that reaches back over it.` });
        }
      }
    }
    if (t.record) t.step({ line: 16, array: [], grid: g(), vars: { answers: answers(out) }, done: "found", message: `Answers: ${answers(out)}. Same O(log n) per operation as a segment tree, in a plain list of n numbers and a few lines of code.` });
  },
};

/** n values and n operations, alternating set and sum, positions spread out. */
export const growthInput = (n: number): RangeInput => ({
  nums: Array.from({ length: n }, (_, k) => (k * 7) % 10),
  ops: Array.from({ length: n }, (_, k) => (k % 2 ? `sum ${(k * 3) % (n / 2)} ${n / 2 + ((k * 5) % (n / 2))}` : `set ${(k * 11) % n} ${k % 9}`)).join(", "),
});
export const rangeApproaches = { prefix: prefixApproach, segment: segApproach, fenwick: fenwickApproach };
