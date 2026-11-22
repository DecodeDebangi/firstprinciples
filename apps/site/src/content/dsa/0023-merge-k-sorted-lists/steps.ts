import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { listsGrid, mergeSteps, parseLists, mergePrepare } from "../../concepts/52-heaps-in-practice/steps";

export type Input = { lists: string };
export const example: Input = { lists: "1 5 8 / 4 6 / 2 3 9 / 7" };
export const fields: InputField[] = [{ key: "lists", label: "sorted lists (split by /)", kind: "raw" }];
export const prepare = (raw: Input): Prepared<Input> => mergePrepare(raw);

const oneByOne: Approach<Input> = {
  id: "oneByOne",
  name: "Merge the lists in one at a time",
  code: `function mergeKLists(lists)
    merged ← empty list
    for each list l in lists
        merged ← mergeTwo(merged, l)
    return merged
function mergeTwo(a, b)
    out ← []
    while a and b both have nodes left
        take the smaller head into out
    append whatever is left of a or b
    return out
`,
  run({ lists }, t) {
    const ls = parseLists(lists);
    let merged: number[] = [];
    const pos = ls.map(() => 0);
    t.step({ line: 2, array: [], grid: listsGrid(ls, pos), vars: { k: ls.length },
      message: `Merge the first list into an empty result, then the second into that, and so on, using the two-list merge each time.` });
    let asked = false;
    ls.forEach((l, i) => {
      const before = merged.length;
      const out: number[] = [];
      let a = 0, b = 0;
      while (a < merged.length && b < l.length) { t.op(); out.push(merged[a] <= l[b] ? merged[a++] : l[b++]); }
      out.push(...merged.slice(a), ...l.slice(b));
      for (let s = 0; s < merged.length - a + l.length - b; s++) t.op();
      const ask = !asked && i > 0 && before > 0 ? (asked = true, { ask: { q: `Merging list ${i} (${l.length} values) into a result of ${before}. How many values does this merge walk over?`, options: [...new Set([String(before + l.length), String(l.length), String(before * l.length)])], answer: 0 } }) : {};
      merged = out;
      pos[i] = l.length;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 4, array: [...merged], tones: Object.fromEntries(merged.map((_, j) => [j, "settled" as Tone])), grid: listsGrid(ls, pos), vars: { list: i, "walked over": before + l.length, merged: merged.length },
        message: before === 0 ? `Merge list ${i} into the empty result: ${l.length === 1 ? "its one value is" : `its ${l.length} values are`} copied over.` : `Merge list ${i} in: the merge walks over all ${before} value${before === 1 ? "" : "s"} merged so far plus ${l.length} new one${l.length === 1 ? "" : "s"}.${i > 0 && before ? " The early values get walked over again in every later merge." : ""}` });
    });
    t.step({ line: 5, array: [...merged], grid: listsGrid(ls, pos), vars: { n: merged.length, k: ls.length }, done: "found",
      message: `Merged. The result is rescanned by every later merge, so with k lists of about n / k values each the total is about k · n / 2: O(k · n).` });
  },
};

const heap: Approach<Input> = {
  id: "heap",
  name: "A min-heap of the k heads",
  code: `function mergeKLists(lists)
    heap ← empty min-heap  // (value, list)
    for each list l in lists
        if l is not empty
            heap.push(l's head)
    out ← []
    while heap not empty
        node ← heap.popMin()
        out.push(node)
        if node.next ≠ none
            heap.push(node.next)
    return out
`,
  run({ lists }, t) {
    mergeSteps(t, parseLists(lists), { push: 5, pop: 9, next: 11, end: 12 },
      "Each list's head is its smallest node, so the next node of the output is the smallest of the k heads. Keep the heads in a min-heap.");
  },
};

export const approaches = { oneByOne, heap };

/** k lists of 2 values each, so n = 2k: one-by-one rescans the growing result k times. */
export const growth = measureGrowth(
  [{ approach: oneByOne, slot: 1 }, { approach: heap, slot: 3 }],
  (k) => ({ lists: Array.from({ length: k }, (_, i) => `${i} ${i + k}`).join(" / ") }),
  [2, 4, 8, 16, 32, 64],
);
