import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { build } from "../../concepts/54-tree-recursion/steps";
import { balancedLevelOrder, bstError, inorderVals } from "../../concepts/57-binary-search-trees/steps";

export type Input = { root1: (number | null)[]; root2: (number | null)[] };
export const example: Input = { root1: [5, 2, 8, 1, 3], root2: [6, 4, 9, null, null, 7] };
export const fields: InputField[] = [{ key: "root1", label: "BST 1 (level order)", kind: "tree" }, { key: "root2", label: "BST 2 (level order)", kind: "tree" }];
export function prepare(raw: Input): Prepared<Input> {
  for (const r of [raw.root1, raw.root2]) { const e = bstError(r, 8); if (e) return { error: e }; }
  return { input: raw };
}
const trees = (raw: Input, t1: Record<string, Tone> = {}, t2: Record<string, Tone> = {}) => {
  const a = build(raw.root1), b = build(raw.root2);
  return [{ label: "BST 1", root: a.root, nodes: a.nodes, tones: t1 }, { label: "BST 2", root: b.root, nodes: b.nodes, tones: t2 }];
};

const sortAll: Approach<Input> = {
  id: "sort", name: "Collect everything, then sort",
  code: `function getAllElements(root1, root2)
    out ← every value in root1 and root2
    sort out
    return out
`,
  run(raw, t) {
    // Collected in level order, as a walk that ignores the order would.
    const lv = (vals: (number | null)[]) => vals.filter((x): x is number => x !== null);
    const all = [...lv(raw.root1), ...lv(raw.root2)];
    t.op(all.length);
    if (t.record) t.step({ line: 2, array: [], trees: trees(raw), grid: { title: "collected", rows: [all] }, vars: { values: all.length },
      message: `Gather all ${all.length} values with any walk, ignoring that each tree is already sorted.` });
    const sorted = [...all].sort((x, y) => { t.op(); return x - y; });
    if (t.record) t.step({ line: 3, array: [], trees: trees(raw), grid: { title: "sorted", rows: [sorted], tones: Object.fromEntries(sorted.map((_, k) => [`0,${k}`, "found" as Tone])) }, vars: { out: `[${sorted.join(", ")}]` }, done: "found",
      message: `Sorted: [${sorted.join(", ")}]. The sort costs O((m + n) log(m + n)), though each tree could have given its values in order for free.` });
  },
};

const merge: Approach<Input> = {
  id: "merge", name: "In-order both, then merge",
  code: `function getAllElements(root1, root2)
    a ← in-order values of root1  // sorted
    b ← in-order values of root2  // sorted
    out, i, j ← [], 0, 0
    while i < length(a) or j < length(b)
        takeA ← j = length(b) or
                (i < length(a) and a[i] ≤ b[j])
        if takeA
            out.push(a[i])
            i ← i + 1
        else
            out.push(b[j])
            j ← j + 1
    return out
`,
  run(raw, t) {
    const a = inorderVals(build(raw.root1)), b = inorderVals(build(raw.root2)), out: number[] = [];
    t.op(a.length + b.length);
    const g = (i: number, j: number, hi?: "a" | "b") => ({ title: "merging", rows: [a.length ? a : ["—"], b.length ? b : ["—"], out.length ? [...out] : ["—"]], rowLabels: ["a", "b", "out"],
      tones: { ...Object.fromEntries(a.map((_, k) => [`0,${k}`, (k < i ? "settled" : k === i ? (hi === "a" ? "found" : "compare") : "idle") as Tone])), ...Object.fromEntries(b.map((_, k) => [`1,${k}`, (k < j ? "settled" : k === j ? (hi === "b" ? "found" : "compare") : "idle") as Tone])) } });
    let asked = 0;
    if (t.record) t.step({ line: 3, array: [], trees: trees(raw), grid: g(0, 0), vars: {},
      message: "An in-order walk of each tree gives its values already sorted. Two sorted lists merge in one pass: repeatedly take the smaller of the two front values." });
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      t.op();
      const fromA = j === b.length || (i < a.length && a[i] <= b[j]);
      const ask = t.record && asked < 2 && i < a.length && j < b.length ? (asked++, { ask: { q: `The fronts are ${a[i]} and ${b[j]}. Which goes into out next?`, options: [String(Math.min(a[i], b[j])), String(Math.max(a[i], b[j]))].filter((x, k, arr) => arr.indexOf(x) === k), answer: 0 } }) : {};
      out.push(fromA ? a[i] : b[j]);
      if (t.record) t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: fromA ? 9 : 12, array: [], trees: trees(raw), grid: g(i, j, fromA ? "a" : "b"), vars: { i, j, out: `[${out.join(", ")}]` },
        message: i < a.length && j < b.length ? `${a[i]} vs ${b[j]}: take ${fromA ? a[i] : b[j]} from ${fromA ? "a" : "b"}.` : `${fromA ? "b" : "a"} is used up: take ${fromA ? a[i] : b[j]} from ${fromA ? "a" : "b"}.` });
      if (fromA) i++; else j++;
    }
    if (t.record) t.step({ line: 14, array: [], trees: trees(raw), grid: g(a.length, b.length), vars: { out: `[${out.join(", ")}]` }, done: "found",
      message: `[${out.join(", ")}]. Two walks and one merge, each value handled a fixed number of times: O(m + n).` });
  },
};

export const approaches = { sort: sortAll, merge };
/** Two balanced BSTs of n/2 values each, odd and even numbers, so the merge interleaves them. */
export const growth = measureGrowth(
  [{ approach: sortAll, slot: 1 }, { approach: merge, slot: 3 }],
  (n) => ({ root1: balancedLevelOrder(n / 2, Array.from({ length: n / 2 }, (_, k) => 2 * k + 1)), root2: balancedLevelOrder(n / 2, Array.from({ length: n / 2 }, (_, k) => 2 * k + 2)) }),
  [8, 16, 32, 64, 128, 256],
);
