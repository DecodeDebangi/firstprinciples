import { Heap, heapTree, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

type T = Parameters<Approach<unknown>["run"]>[1];

/* ---------- Merging k sorted lists with a heap of their heads ---------- */

export type ListsInput = { lists: string };
export const mergeExample: ListsInput = { lists: "2 6 9 / 1 7 / 3 4 8" };
export const mergeFields: InputField[] = [{ key: "lists", label: "sorted lists (split by /)", kind: "raw" }];
export const parseLists = (s: string) => s.split("/").map((r) => r.trim().split(/[\s,]+/).filter(Boolean).map(Number));
export function mergePrepare(raw: ListsInput): Prepared<ListsInput> {
  const ls = parseLists(raw.lists);
  if (ls.length < 1 || ls.length > 4) return { error: "Use 1 to 4 lists, split by /." };
  if (ls.flat().some((v) => !Number.isInteger(v) || Math.abs(v) > 99)) return { error: "Use whole numbers from -99 to 99." };
  if (ls.flat().length > 12) return { error: "Use at most 12 numbers in all, so the animation stays short." };
  const sorted = ls.map((l) => [...l].sort((a, b) => a - b));
  const changed = sorted.some((l, i) => l.some((v, j) => v !== ls[i][j]));
  return { input: { lists: sorted.map((l) => l.join(" ")).join(" / ") }, note: changed ? "Each list must be sorted, so your values were sorted first." : undefined };
}
type Head = { id: string; val: number; list: number; idx: number };
/** The lists as grid rows: taken values grey, current heads highlighted. */
export function listsGrid(ls: number[][], pos: number[], hot = -1) {
  const tones: Record<string, Tone> = {};
  ls.forEach((l, r) => l.forEach((_, c) => { if (c < pos[r]) tones[`${r},${c}`] = "visited"; else if (c === pos[r]) tones[`${r},${c}`] = r === hot ? "found" : "compare"; }));
  return { title: "lists", rows: ls.map((l) => (l.length ? l : ["—"])), rowLabels: ls.map((_, i) => `list ${i}`), tones };
}
/** Merge with a min-heap of heads; steps point at the given lines. */
export function mergeSteps(t: T, ls: number[][], L: { push: number; pop: number; next: number; end: number }, intro: string) {
  const H = new Heap<Head>((a, b) => a.val < b.val || (a.val === b.val && a.list < b.list), () => t.op());
  const pos = ls.map(() => 0), out: number[] = [];
  const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ ...heapTree(H.items.map((h) => ({ id: h.id, val: h.val }))), tones, label: "heap of heads" }];
  ls.forEach((l, i) => { if (l.length) H.push({ id: `h${i}-0`, val: l[0], list: i, idx: 0 }); });
  t.step({ line: L.push, array: [], trees: view(), grid: listsGrid(ls, pos), vars: { heads: H.size }, message: intro });
  let asked = false;
  while (H.size) {
    const heads = H.items.map((h) => h.val);
    const ask = !asked && H.size > 1 ? (asked = true, { ask: { q: `The heads are ${heads.join(", ")}. Which value comes out next?`, options: [...new Set([Math.min(...heads), Math.max(...heads), heads[heads.length - 1]].map(String))], answer: 0 } }) : {};
    const top = H.pop()!;
    out.push(top.val);
    pos[top.list]++;
    const nx = ls[top.list][top.idx + 1];
    if (nx !== undefined) H.push({ id: `h${top.list}-${top.idx + 1}`, val: nx, list: top.list, idx: top.idx + 1 });
    t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: nx !== undefined ? L.next : L.pop, array: [...out], tones: { [out.length - 1]: "found" }, trees: view(nx !== undefined ? { [`h${top.list}-${top.idx + 1}`]: "active" } : {}), grid: listsGrid(ls, pos, nx !== undefined ? top.list : -1), vars: { taken: top.val, from: `list ${top.list}`, heap: H.size },
      message: `Pop the smallest head, ${top.val}, from list ${top.list}, and append it.${nx !== undefined ? ` List ${top.list}'s next value, ${nx}, joins the heap.` : ` List ${top.list} is used up, so the heap shrinks.`}` });
  }
  t.step({ line: L.end, array: [...out], trees: view(), grid: listsGrid(ls, pos), vars: { n: out.length, k: ls.length }, done: "found",
    message: `All ${out.length} values merged in order. The heap never held more than ${ls.length} heads, so each value cost O(log k): O(n log k) in all.` });
  return out;
}

const merge: Approach<ListsInput> = {
  id: "merge",
  name: "Merge k sorted lists with a heap",
  code: `function mergeK(lists)
    heap ← empty min-heap  // (value, list, index)
    for each index i, list l in lists
        if l is not empty
            heap.push((l[0], i, 0))
    out ← []
    while heap not empty
        v, i, j ← heap.popMin()
        out.push(v)
        if j + 1 < length(lists[i])
            heap.push((lists[i][j + 1], i, j + 1))
    return out
`,
  run({ lists }, t) {
    mergeSteps(t, parseLists(lists), { push: 5, pop: 9, next: 11, end: 12 },
      "Every list's first value is its smallest, so the next value of the merged output is the smallest of the k heads. Put the heads in a min-heap.");
  },
};
export const mergeApproaches = { merge };

/* ---------- A running median with two heaps ---------- */

export type StreamInput = { nums: number[] };
export const medianExample: StreamInput = { nums: [5, 8, 2, 1, 9, 6] };
export const medianFields: InputField[] = [{ key: "nums", label: "numbers arriving", kind: "numbers" }];
export function medianPrepare(raw: StreamInput): Prepared<StreamInput> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Use 1 to 9 numbers." };
  return { input: raw };
}
export const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
/** Add each number to two heaps and report the median after each; steps point at the given lines. */
export function medianSteps(t: T, nums: number[], L: { low: number; high: number; toHigh: number; toLow: number; odd: number; even: number; end: number }) {
  type I = { id: string; val: number };
  const low = new Heap<I>((a, b) => a.val > b.val, () => t.op()), high = new Heap<I>((a, b) => a.val < b.val, () => t.op());
  const view = (tones: Record<string, Tone> = {}): TreeData[] => [
    { ...heapTree(low.items), tones, label: "smaller half (max-heap)" },
    { ...heapTree(high.items), tones, label: "larger half (min-heap)" },
  ];
  const outs: string[] = [];
  const grid = (fresh = false) => ({ title: "medians", rows: [outs.length ? [...outs] : ["—"]], tones: fresh && outs.length ? { [`0,${outs.length - 1}`]: "found" as Tone } : {} });
  let asked = false;
  nums.forEach((x, i) => {
    const item = { id: `m${i}`, val: x };
    const top0 = low.peek()?.val;
    const goesLow = top0 === undefined || x <= top0;
    (goesLow ? low : high).push(item);
    t.step({ line: goesLow ? L.low : L.high, array: [...nums], pointers: { x: i }, tones: { [i]: "active" }, trees: view({ [item.id]: "active" }), grid: grid(), vars: { x, smaller: low.size, larger: high.size },
      message: top0 === undefined ? `${x} is the first number: it goes in the smaller half.` : goesLow ? `${x} ≤ ${top0}, the smaller half's top: it goes in the smaller half.` : `${x} > ${top0}, the smaller half's top: it goes in the larger half.` });
    let moved: I | null = null, toHigh = false;
    if (low.size > high.size + 1) { moved = low.pop()!; high.push(moved); toHigh = true; }
    else if (high.size > low.size) { moved = high.pop()!; low.push(moved); }
    if (moved) t.step({ line: toHigh ? L.toHigh : L.toLow, array: [...nums], pointers: { x: i }, tones: { [i]: "active" }, trees: view({ [moved.id]: "compare" }), grid: grid(), vars: { x, smaller: low.size, larger: high.size },
      message: `The halves are uneven, so move ${moved.val} across: now the smaller half has ${low.size} and the larger ${high.size}. The smaller half may hold one extra.` });
    const even = low.size === high.size;
    const med = even ? (low.peek()!.val + high.peek()!.val) / 2 : low.peek()!.val;
    const tops = [low.peek()!.val, high.peek()?.val].filter((v) => v !== undefined) as number[];
    const ask = !asked && even && i > 0 ? (asked = true, { ask: { q: `The tops are ${tops.join(" and ")}, and the halves are the same size. What's the median?`, options: [...new Set([fmt(med), String(tops[0]), String(tops[1] ?? tops[0] + 1)])], answer: 0 } }) : {};
    outs.push(fmt(med));
    t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), array: [...nums], pointers: { x: i }, tones: { [i]: "settled" }, trees: view(Object.fromEntries([low.peek()!.id, ...(high.size ? [high.peek()!.id] : [])].map((id) => [id, "found" as Tone]))), grid: grid(true), vars: { median: fmt(med) }, line: even ? L.even : L.odd,
      message: even ? `Even count: the median is the average of the two tops, (${low.peek()!.val} + ${high.peek()!.val}) / 2 = ${fmt(med)}.` : `Odd count: the median is the smaller half's top, ${med}.` });
  });
  t.step({ line: L.end, array: [...nums], trees: view(), grid: grid(), vars: { count: nums.length }, done: "found",
    message: `Each number cost a push and at most one move between heaps, O(log n) each; reading the median is O(1).` });
  return outs;
}

const median: Approach<StreamInput> = {
  id: "median",
  name: "Running median with two heaps",
  code: `low ← empty max-heap  // the smaller half
high ← empty min-heap  // the larger half
function add(x)
    if low is empty or x ≤ low.max()
        low.push(x)
    else
        high.push(x)
    if length(low) > length(high) + 1
        high.push(low.popMax())  // rebalance
    if length(high) > length(low)
        low.push(high.popMin())
function median()
    if length(low) > length(high)
        return low.max()
    return (low.max() + high.min()) / 2
`,
  run({ nums }, t) {
    t.step({ line: 1, array: [...nums], trees: [{ root: null, nodes: [], label: "smaller half (max-heap)" }, { root: null, nodes: [], label: "larger half (min-heap)" }], grid: { title: "medians", rows: [["—"]] }, vars: {},
      message: "Split the numbers seen so far into a smaller half and a larger half. A max-heap holds the smaller half, so its top is that half's biggest; a min-heap holds the larger half, so its top is that half's smallest. The median sits at those tops." });
    medianSteps(t, nums, { low: 5, high: 7, toHigh: 9, toLow: 11, odd: 14, even: 15, end: 13 });
  },
};
export const medianApproaches = { median };
