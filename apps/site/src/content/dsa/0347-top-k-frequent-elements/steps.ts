import { Heap, heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { nums: number[]; k: number };

export const example: Input = { nums: [4, 1, 4, 2, 3, 4, 2, 1, 4, 2], k: 2 };

export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "k", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers so everything fits." };
  const distinct = new Set(raw.nums).size;
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > distinct) return { error: `k must be from 1 to ${distinct}, the number of distinct values.` };
  return { input: raw };
}

/** Count with a hash map. One op per number. Returns counts in first-seen order, like Python's Counter. */
function countAll(nums: number[], t: { op(): void }) {
  const count = new Map<number, number>();
  for (const x of nums) { t.op(); count.set(x, (count.get(x) ?? 0) + 1); }
  return count;
}
const mapPanel = (count: Map<number, number>, hl?: number) => ({ title: "count", entries: [...count].map(([x, c]) => [String(x), `×${c}`] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
const outGrid = (out: number[]) => ({ title: "answer", rows: [out.length ? [...out] : ["—"]] });

const sortApproach: Approach<Input> = {
  id: "sort",
  name: "Count, then sort",
  code: `// count: value → how often it appears
function topKFrequent(nums, k)
    count ← how often each value appears in nums
    byFreq ← values by count, highest first
    return the first k of byFreq
`,
  run({ nums, k }, t) {
    const count = new Map<number, number>();
    t.step({ line: 3, array: nums, map: mapPanel(count), grid: outGrid([]), vars: { k }, message: "First count how often each number appears, with a hash map." });
    nums.forEach((x, i) => {
      t.op();
      count.set(x, (count.get(x) ?? 0) + 1);
      t.step({ line: 3, array: nums, pointers: { i }, tones: { [i]: "active" }, map: mapPanel(count, x), grid: outGrid([]), vars: { k, x },
        message: `${x}: seen ${count.get(x)} time${count.get(x) === 1 ? "" : "s"} so far.` });
    });
    const order = [...count.keys()].sort((p, q) => { t.op(); return count.get(q)! - count.get(p)!; });
    const out = order.slice(0, k);
    const labels = order.map((x) => `×${count.get(x)}`);
    t.step({ line: 4, array: order, labels, tones: Object.fromEntries(order.map((_, j) => [j, j < k ? "found" : "discard"])) as Record<number, Tone>, range: [0, k - 1], map: mapPanel(count), grid: outGrid([]), vars: { k, distinct: order.length },
      message: `Sort the ${order.length} distinct values by count, most frequent first. The first ${k} are the answer.` });
    t.step({ line: 5, array: order, labels, tones: Object.fromEntries(order.map((_, j) => [j, j < k ? "settled" : "discard"])) as Record<number, Tone>, map: mapPanel(count), grid: outGrid(out), vars: { k }, done: "found",
      message: `[${out.join(", ")}]. Counting is O(n); sorting the m distinct values is O(m log m), which is O(n log n) when most values are different.` });
  },
};

const heapApproach: Approach<Input> = {
  id: "heap",
  name: "Count, then a heap of size k",
  code: `// heap: a min-heap, smallest item on top
// count: value → how often it appears
function topKFrequent(nums, k)
    count ← how often each value appears in nums
    heap ← empty min-heap  // (count, value)
    for each (x, c) in count
        heap.push((c, x))
        if length(heap) > k
            heap.popMin()
    return the value of every pair left in heap
`,
  run({ nums, k }, t) {
    const count = countAll(nums, t);
    type E = { id: string; val: number; c: number };
    const H = new Heap<E>((p, q) => p.c < q.c || (p.c === q.c && p.val < q.val), () => t.op());
    const view = (tones: Record<string, Tone> = {}): TreeData[] => {
      const tr = heapTree(H.items);
      return [{ ...tr, tones, notes: Object.fromEntries(H.items.map((e) => [e.id, `×${e.c}`])) }];
    };
    t.step({ line: 4, array: [], trees: view(), map: mapPanel(count), grid: outGrid([]), vars: { k },
      message: `Count first (O(n)). Then keep the ${k} most frequent values in a min-heap ordered by count, so the least frequent of them sits on top, ready to be dropped.` });
    for (const [x, c] of count) {
      const e = { id: `e${x}`, val: x, c };
      H.push(e);
      t.step({ line: 7, array: [], trees: view({ [e.id]: "active" }), map: mapPanel(count, x), grid: outGrid([]), vars: { k, value: x, count: c, size: H.size },
        message: `Push ${x} (×${c}).` });
      if (H.size > k) {
        const least = H.items.reduce((m, y) => (y.c < m.c || (y.c === m.c && y.val < m.val) ? y : m));
        const most = H.items.reduce((m, y) => (y.c > m.c ? y : m));
        const ask = { q: `The heap holds ${H.size} values, one more than k = ${k}. Which one goes?`, options: [...new Set([`${least.val}, seen ${least.c} time${least.c === 1 ? "" : "s"}`, `${most.val}, seen ${most.c} time${most.c === 1 ? "" : "s"}`, `${x}, the newest`])], answer: 0 };
        const gone = H.pop()!;
        t.step({ ...(ask.options.length > 1 ? { ask } : {}), line: 9, array: [], trees: view(H.size ? { [H.items[0].id]: "compare" } : {}), map: mapPanel(count), grid: outGrid([]), vars: { k, dropped: gone.val, size: H.size },
          message: `Too many: pop the top, ${gone.val} (×${gone.c}). At least ${k} values appear as often or more, so it can't be in the answer.` });
      }
    }
    const out = H.items.map((e) => e.val);
    t.step({ line: 10, array: [], trees: view(Object.fromEntries(H.items.map((e) => [e.id, "settled" as Tone]))), map: mapPanel(count), grid: outGrid(out), vars: { k }, done: "found",
      message: `[${out.join(", ")}] (any order is fine). Counting is O(n); each of the m distinct values costs O(log k) on a heap of size k: O(n + m log k).` });
  },
};

const bucket: Approach<Input> = {
  id: "bucket",
  name: "Count, then buckets by frequency",
  code: `// count: value → how often it appears
function topKFrequent(nums, k)
    count ← how often each value appears in nums
    buckets ← length(nums) + 1 empty lists
    for each (x, c) in count
        buckets[c].push(x)  // index = how often
    out ← empty list
    for c ← length(nums) down to 1
        for each x in buckets[c]
            out.push(x)
            if length(out) = k
                return out
`,
  run({ nums, k }, t) {
    const count = countAll(nums, t);
    const n = nums.length;
    const buckets: number[][] = Array.from({ length: n + 1 }, () => []);
    const cells = () => buckets.map((b) => (b.length ? b.join(",") : "·"));
    const labels = buckets.map((_, c) => `×${c}`);
    const out: number[] = [];
    t.step({ line: 4, array: cells(), labels, map: mapPanel(count), grid: outGrid(out), vars: { k },
      message: `Count first (O(n)). A count can't be more than ${n}, so make ${n + 1} buckets, one per possible count. No sorting needed.` });
    for (const [x, c] of count) {
      t.op();
      const opts = [...new Set([`Bucket ${c}`, `Bucket ${x}`, `Bucket ${n - c}`])];
      buckets[c].push(x);
      t.step({ ...(opts.length > 1 ? { ask: { q: `${x} appears ${c} time${c === 1 ? "" : "s"}. Which bucket does it go in?`, options: opts, answer: 0 } } : {}),
        line: 6, array: cells(), labels, pointers: { c }, tones: { [c]: "active" }, map: mapPanel(count, x), grid: outGrid(out), vars: { k, value: x, count: c },
        message: `${x} appears ${c} time${c === 1 ? "" : "s"}: it goes in bucket ${c}. The bucket's index is the count.` });
    }
    const seen: Record<number, Tone> = {};
    for (let c = n; c >= 1; c--) {
      t.op();
      if (!buckets[c].length) { seen[c] = "discard"; continue; }
      for (const x of buckets[c]) {
        out.push(x);
        const doneNow = out.length === k;
        t.step({ line: doneNow ? 12 : 10, array: cells(), labels, pointers: { c }, tones: { ...seen, [c]: "found" }, map: mapPanel(count, x), grid: outGrid(out), vars: { k, c, taken: out.length },
          message: `Walking down from the biggest count: bucket ${c} holds ${x}. Take it.${doneNow ? ` That's ${k}: done.` : ""}` });
        if (doneNow) {
          t.step({ line: 12, array: cells(), labels, tones: { ...seen, [c]: "settled" }, map: mapPanel(count), grid: outGrid(out), vars: { k }, done: "found",
            message: `[${out.join(", ")}]. Counting, filling the buckets and walking them are each O(n): O(n) overall, with no sorting at all.` });
          return;
        }
      }
      seen[c] = "settled";
    }
  },
};

export const approaches = { sort: sortApproach, heap: heapApproach, bucket };

const sizes = [16, 32, 64, 96, 128, 192, 256];
/** Mostly distinct values (a third appear twice), so there are many counts to sort; k = 3. */
function mostlyDistinct(n: number) {
  const out: number[] = [];
  for (let v = 0; out.length < n; v++) {
    const times = ((v * 2654435761) >>> 0) % 3 === 0 ? 2 : 1;
    for (let j = 0; j < times && out.length < n; j++) out.push(v);
  }
  return out;
}
export const growth = measureGrowth([{ approach: sortApproach, slot: 1 }, { approach: heapApproach, slot: 2 }, { approach: bucket, slot: 3 }],
  (n) => ({ nums: mostlyDistinct(n), k: 3 }), sizes);
