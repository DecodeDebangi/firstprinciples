import { Heap, heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

/** Points as "x y" pairs split by "/". */
export type Input = { points: string; k: number };
export const example: Input = { points: "3 1 / -1 2 / 4 -3 / 0 1 / -2 -2 / 2 0", k: 3 };
export const fields: InputField[] = [
  { key: "points", label: "points (x y, split by /)", kind: "raw" },
  { key: "k", label: "k", kind: "number" },
];
export const parsePoints = (s: string) => s.split("/").map((p) => p.trim().split(/[\s,]+/).filter(Boolean).map(Number));
export function prepare(raw: Input): Prepared<Input> {
  const ps = parsePoints(raw.points);
  if (ps.length < 1 || ps.length > 8) return { error: "Use 1 to 8 points, split by /." };
  if (ps.some((p) => p.length !== 2 || p.some((v) => !Number.isInteger(v) || Math.abs(v) > 20))) return { error: "Each point is two whole numbers from -20 to 20, like 3 -1." };
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > ps.length) return { error: `k must be from 1 to ${ps.length}, the number of points.` };
  return { input: { points: ps.map((p) => p.join(" ")).join(" / "), k: raw.k } };
}
const label = (p: number[]) => `(${p[0]}, ${p[1]})`;
const d2 = (p: number[]) => p[0] * p[0] + p[1] * p[1];
const pointsGrid = (ps: number[][], tones: Record<string, Tone> = {}) => ({ title: "points: x, y and d² = x² + y²", rows: [ps.map((p) => p[0]), ps.map((p) => p[1]), ps.map(d2)], rowLabels: ["x", "y", "d²"], tones });
const col = (i: number, tn: Tone) => ({ [`0,${i}`]: tn, [`1,${i}`]: tn, [`2,${i}`]: tn });
const answerText = (ps: number[][]) => ps.map(label).join(" ");

const sortAll: Approach<Input> = {
  id: "sort",
  name: "Sort every point by distance",
  code: `function kClosest(points, k)
    sort points by x² + y²  // smallest first
    return the first k points
`,
  run({ points, k }, t) {
    const ps = parsePoints(points);
    t.step({ line: 2, array: [], grid: pointsGrid(ps), vars: { k },
      message: `A point's distance from (0, 0) is √(x² + y²). Comparing x² + y² gives the same order without the square root. Sort every point by it.` });
    const order = ps.map((_, i) => i).sort((a, b) => { t.op(); return d2(ps[a]) - d2(ps[b]) || a - b; });
    const sorted = order.map((i) => ps[i]);
    t.step({ line: 3, array: [], grid: pointsGrid(sorted, Object.assign({}, ...sorted.map((_, i) => col(i, i < k ? "found" : "discard")))), vars: { k, answer: answerText(sorted.slice(0, k)) }, done: "found",
      message: `The first ${k} after sorting are the closest. But every point was put in order to keep only ${k}: O(n log n).` });
  },
};

const heap: Approach<Input> = {
  id: "heap",
  name: "Max-heap of the k closest",
  code: `function kClosest(points, k)
    heap ← empty max-heap  // by x² + y²
    for each point p in points
        heap.push(p)
        if length(heap) > k
            heap.popMax()  // the farthest goes
    return every point in heap
`,
  run({ points, k }, t) {
    const ps = parsePoints(points);
    type I = { id: string; val: number; i: number };
    const H = new Heap<I>((a, b) => a.val > b.val || (a.val === b.val && a.i > b.i), () => t.op());
    const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ ...heapTree(H.items), notes: Object.fromEntries(H.items.map((x) => [x.id, label(ps[x.i])])), tones, label: `the ${k} closest so far (x² + y²)` }];
    const kept = () => Object.assign({}, ...H.items.map((x) => col(x.i, "settled")));
    t.step({ line: 2, array: [], grid: pointsGrid(ps), trees: view(), vars: { k },
      message: `Keep the ${k} closest points seen so far in a max-heap ordered by x² + y². Its top is the farthest of them: the one to drop when a closer point arrives.` });
    let asked = false;
    ps.forEach((p, i) => {
      const it = { id: `p${i}`, val: d2(p), i };
      H.push(it);
      if (H.size <= k) {
        t.step({ line: 4, array: [], grid: pointsGrid(ps, { ...kept(), ...col(i, "active") }), trees: view({ [it.id]: "active" }), vars: { point: label(p), "x² + y²": d2(p), size: H.size },
          message: `Push ${label(p)}, at squared distance ${d2(p)}. The heap holds ${H.size} of ${k}.` });
        return;
      }
      const far = H.items[0];
      const vals = H.items.map((x) => x.val);
      const ask = !asked ? (asked = true, { ask: { q: `The heap now holds points at squared distances ${vals.join(", ")}. Which distance is popped?`, options: [...new Set([String(far.val), String(Math.min(...vals)), String(it.val)])], answer: 0 } }) : {};
      const gone = H.pop()!;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 6, array: [], grid: pointsGrid(ps, { ...kept(), ...col(gone.i, "discard"), ...col(i, gone.i === i ? "discard" : "active") }), trees: view({ [H.items[0].id]: "compare" }), vars: { point: label(p), dropped: label(ps[gone.i]), size: H.size },
        message: gone.i === i ? `Push ${label(p)}, then pop the farthest: ${label(p)} itself, at ${d2(p)}. It's farther than all ${k} kept.` : `Push ${label(p)}, then pop the farthest, ${label(ps[gone.i])} at ${gone.val}: ${k} points are closer, so it's out for good.` });
    });
    const res = H.items.map((x) => ps[x.i]);
    t.step({ line: 7, array: [], grid: pointsGrid(ps, kept()), trees: view(), vars: { answer: answerText(res) }, done: "found",
      message: `The heap holds the ${k} closest points (in no particular order, which the problem allows). Each point cost O(log k): O(n log k), with O(k) extra space.` });
  },
};

export const approaches = { sort: sortAll, heap };

/** Points on a spiral with k = 2. */
export const growth = measureGrowth(
  [{ approach: sortAll, slot: 1 }, { approach: heap, slot: 3 }],
  (n) => ({ points: Array.from({ length: n }, (_, i) => `${(i * 7) % 41 - 20} ${(i * 13) % 41 - 20}`).join(" / "), k: 2 }),
  [8, 16, 32, 64, 128, 256],
);
