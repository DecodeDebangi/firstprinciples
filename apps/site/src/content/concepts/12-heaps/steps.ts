import { heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [7, 4, 9, 2, 5, 1] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers so the tree fits." };
  return { input: raw };
}

type Item = { id: string; val: number };

/** Draws the heap as a tree and as its array, with the same tones on both (keyed by array index). */
function views(a: Item[], tones: Record<number, Tone>) {
  const byId: Record<string, Tone> = {};
  for (const [i, tone] of Object.entries(tones)) if (a[+i]) byId[a[+i].id] = tone;
  const trees: TreeData[] = [{ ...heapTree(a), tones: byId }];
  const grid = { title: "the same heap as an array", rows: [a.length ? a.map((x) => x.val) : ["—"]], colLabels: a.map((_, i) => i), tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [`0,${i}`, t])) };
  return { array: [] as number[], trees, grid };
}

const push: Approach<Input> = {
  id: "push",
  name: "Push: add a leaf, swap it up",
  code: `function push(heap, x)
  heap.push(x)  // new leaf at the end
  i ← length(heap) - 1
  while i > 0
    parent ← floor((i - 1) / 2)
    if heap[parent] ≤ heap[i]
      break  // order restored
    swap heap[i] and heap[parent]
    i ← parent
`,
  run({ nums }, t) {
    const a: Item[] = [];
    t.step({ line: 1, ...views(a, {}), vars: { size: 0 },
      message: "A min-heap is a complete binary tree where every parent is ≤ its children, so the smallest value is at the top. It's stored as a plain array: the children of index i are at 2i + 1 and 2i + 2. Push each number in turn." });
    nums.forEach((x, k) => {
      a.push({ id: `n${k}`, val: x });
      let i = a.length - 1;
      t.step({ line: 2, ...views(a, { [i]: "active" }), vars: { x, i },
        message: `Push ${x}: it goes at the end of the array, the next free leaf, so the tree stays complete.${i ? ` Its parent is index ${(i - 1) >> 1}.` : " It's the only item, so it's the top."}` });
      while (i > 0) {
        const p = (i - 1) >> 1;
        t.op();
        const [cv, pv] = [a[i].val, a[p].val];
        const ask = { q: `${cv} at index ${i}, parent ${pv} at index ${p}. What happens?`, options: ["Swap: the child is smaller", "Stop: the parent is smaller or equal"], answer: pv <= cv ? 1 : 0 };
        if (pv <= cv) {
          t.step({ ask, line: 7, ...views(a, { [i]: "settled", [p]: "compare" }), vars: { x, i, parent: p },
            message: `Parent ${pv} ≤ ${cv}: the order holds. Stop.` });
          break;
        }
        [a[i], a[p]] = [a[p], a[i]];
        t.step({ ask, line: 8, ...views(a, { [p]: "active", [i]: "compare" }), vars: { x, i: p, parent: p },
          message: `${cv} < parent ${pv}: swap them. ${cv} moves up to index ${p}.${p === 0 ? " It's the new top." : ""}` });
        i = p;
      }
    });
    t.step({ line: 9, ...views(a, a.length ? { 0: "found" } : {}), vars: { size: a.length, top: a[0]?.val }, done: "found",
      message: `Done: the smallest value, ${a[0].val}, is on top. Each push swaps at most once per level, and a complete tree of n items has about log₂ n levels: O(log n) per push.` });
  },
};

const pop: Approach<Input> = {
  id: "pop",
  name: "Pop: move the last leaf up, swap it down",
  code: `function pop(heap)
  top ← heap[0]
  heap[0] ← heap.last()  // last leaf to top
  heap.pop()
  i, n ← 0, length(heap)
  while true
    small ← i
    for each c in [2 * i + 1, 2 * i + 2]
      if c < n and heap[c] < heap[small]
        small ← c
    if small = i
      return top  // order restored
    swap heap[i] and heap[small]
    i ← small
`,
  run({ nums }, t) {
    // Start from a valid heap, built quietly (the heapify animation shows how).
    const a: Item[] = nums.map((v, k) => ({ id: `n${k}`, val: v }));
    for (let s = (a.length >> 1) - 1; s >= 0; s--) {
      let i = s;
      for (;;) { let m = i; for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && a[c].val < a[m].val) m = c; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; }
    }
    const out: number[] = [];
    const outGrid = () => ({ title: "popped, in order", rows: [out.length ? [...out] : ["—"]] });
    const popped = () => (out.length ? out.join(", ") : "none");
    t.step({ line: 1, ...views(a, { 0: "found" }), vars: { size: a.length },
      message: `A valid min-heap: the smallest, ${a[0].val}, is on top. Pop it again and again and watch the values come out in sorted order.` });
    while (a.length) {
      const top = a[0];
      const last = a.pop()!;
      out.push(top.val);
      if (!a.length) {
        t.op();
        t.step({ line: 12, ...views(a, {}), vars: { popped: popped() },
          message: `Pop ${top.val}: it was the last one. Popped in order: [${out.join(", ")}].` });
        break;
      }
      a[0] = last;
      t.step({ line: 3, ...views(a, { 0: "active" }), vars: { popped: popped(), size: a.length },
        message: `Pop ${top.val}. To keep the tree complete, the last leaf, ${last.val}, moves into the empty top. Now it has to sink to its place.` });
      let i = 0;
      for (;;) {
        let m = i;
        const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < a.length);
        for (const c of kids) { t.op(); if (a[c].val < a[m].val) m = c; }
        if (!kids.length) {
          t.step({ line: 12, ...views(a, { [i]: "settled" }), vars: { popped: popped(), i },
            message: `${a[i].val} is now a leaf: nothing below it. Done.` });
          break;
        }
        const smallKid = kids.reduce((b, c) => (a[c].val < a[b].val ? c : b));
        const opts = [...new Set([`Swap with ${a[smallKid].val}, the smaller child`, ...(kids.length > 1 ? [`Swap with ${a[kids.find((c) => c !== smallKid)!].val}, the larger child`] : []), "Stop: it's ≤ its children"])];
        const answer = m === i ? opts.indexOf("Stop: it's ≤ its children") : 0;
        const kidTones = Object.fromEntries(kids.map((c) => [c, "compare" as Tone]));
        if (m === i) {
          t.step({ ask: { q: `${a[i].val} at index ${i}; its children are ${kids.map((c) => a[c].val).join(" and ")}. What happens?`, options: opts, answer },
            line: 12, ...views(a, { ...kidTones, [i]: "settled" }), vars: { popped: popped(), i },
            message: `${a[i].val} ≤ ${kids.map((c) => a[c].val).join(" and ")}: the order holds. Stop.` });
          break;
        }
        const [iv, mv] = [a[i].val, a[m].val];
        const sibling = kids.find((c) => c !== m);
        [a[i], a[m]] = [a[m], a[i]];
        t.step({ ask: { q: `${iv} at index ${i}; its children are ${kids.map((c) => (c === m ? mv : a[c].val)).join(" and ")}. What happens?`, options: opts, answer },
          line: 13, ...views(a, { [i]: "active", [m]: "compare", ...(sibling !== undefined ? { [sibling]: "settled" } : {}) }), vars: { popped: popped(), i: m },
          message: `Swap ${iv} with its smaller child, ${mv}.${sibling !== undefined ? ` (Swapping with the larger one would put a bigger value above ${mv}.)` : ""}` });
        i = m;
      }
    }
    t.step({ line: 12, ...views(a, {}), grid: outGrid(), vars: { popped: out.length }, done: "found",
      message: `Popped [${out.join(", ")}]: sorted. Each pop sinks one value at most log₂ n levels, so n pops are O(n log n). That's heapsort.` });
  },
};

const heapify: Approach<Input> = {
  id: "heapify",
  name: "Heapify: build from the bottom up",
  code: `function heapify(a)
  for i ← floor(length(a) / 2) - 1 down to 0
    siftDown(a, i)  // the loop from pop()
`,
  run({ nums }, t) {
    const a: Item[] = nums.map((v, k) => ({ id: `n${k}`, val: v }));
    const done: Record<number, Tone> = {};
    for (let i = a.length >> 1; i < a.length; i++) done[i] = "settled";
    t.step({ line: 1, ...views(a, done), vars: { n: a.length },
      message: `Start with the numbers as they are. The second half of the array (indices ${a.length >> 1} and up) are leaves: each is already a valid one-item heap. Fix the parents from the last one up to the root.` });
    for (let s = (a.length >> 1) - 1; s >= 0; s--) {
      let i = s;
      t.step({ line: 2, ...views(a, { ...done, [s]: "active" }), vars: { i: s },
        message: `Index ${s} (${a[s].val}): both its subtrees are already heaps. Sink ${a[s].val} into place.` });
      for (;;) {
        let m = i;
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length) { t.op(); if (a[c].val < a[m].val) m = c; }
        if (m === i) break;
        const [iv, mv] = [a[i].val, a[m].val];
        [a[i], a[m]] = [a[m], a[i]];
        t.step({ line: 3, ...views(a, { ...done, [i]: "compare", [m]: "active" }), vars: { i: s, at: m },
          message: `${iv} > its smaller child ${mv}: swap. ${iv} sinks to index ${m}.` });
        i = m;
      }
      done[s] = "settled";
    }
    t.step({ line: 3, ...views(a, { ...done, 0: "found" }), vars: { n: a.length, top: a[0].val }, done: "found",
      message: `A valid heap, top ${a[0].val}. Most nodes are near the bottom and sink only a level or two; adding it up gives O(n), cheaper than n pushes at O(log n) each.` });
  },
};

export const approaches = { push, pop, heapify };

const sizes = [8, 16, 32, 64, 128, 256];
/** Decreasing input: every push swaps all the way to the top. */
export const growth = measureGrowth([{ approach: push, slot: 1 }, { approach: heapify, slot: 2 }], (n) => ({ nums: Array.from({ length: n }, (_, i) => n - i) }), sizes);
