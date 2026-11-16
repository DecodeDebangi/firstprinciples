import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

type N = { id: string; val: number | string; kind?: "null" };
const endOf = (tag: string): N => ({ id: `end-${tag}`, val: "none", kind: "null" });

export type Input = { values: number[] };
export const fields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];

/* ---------- Splitting in half ---------- */
export const splitExample: Input = { values: [5, 1, 4, 2, 6, 3] };
export function splitPrepare(raw: Input): Prepared<Input> {
  if (raw.values.length < 2) return { error: "Give at least 2 values, so there's something to split." };
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  return { input: raw };
}

const split: Approach<Input> = {
  id: "split",
  name: "Splitting a list in half",
  code: `function splitHalf(head)
    slow, fast ← head, head.next
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
    second ← slow.next
    slow.next ← none  // cut
    return head, second
`,
  run({ values }, t) {
    const n = values.length;
    const node = (i: number): N => ({ id: `n${i}`, val: values[i] });
    const whole = (ptr: Record<string, number>, tones: Record<number, Tone> = {}): ListRow => ({
      nodes: [...values.map((_, i) => node(i)), endOf("w")], arrows: values.map(() => "right" as const),
      pointers: Object.fromEntries(Object.entries(ptr).map(([k, i]) => [k, i >= n ? "end-w" : `n${i}`])), tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])),
    });
    let slow = 0, fast = 1;
    t.step({ line: 2, array: [], lists: [whole({ slow, fast })], vars: {},
      message: "To split a list you need the node at the end of the first half, because that's where you cut. Fast and slow pointers find it, with one change: fast starts one node ahead, on head.next. That makes slow stop on the first of two middles." });
    while (fast < n && fast + 1 < n) {
      t.op(); slow++; fast += 2;
      t.step({ line: 5, array: [], lists: [whole({ slow, fast }, { [slow]: "active" })], vars: {},
        message: `slow moves to the ${values[slow]}, fast to ${fast < n ? `the ${values[fast]}` : "none"}.` });
    }
    const a = values.slice(0, slow + 1), b = values.slice(slow + 1);
    t.step({ line: 6, array: [], lists: [{ ...whole({ slow, second: slow + 1 }, { [slow]: "found" }), arrows: values.map((_, i) => (i === slow ? null : "right" as const)) }], vars: {},
      message: `fast can't go further, so slow is on the ${values[slow]}: the last node of the first half. second remembers the ${values[slow + 1]}, where the second half starts, before the cut.` });
    t.step({ line: 8, array: [], vars: { "first half": a.length, "second half": b.length }, done: "found",
      lists: [
        { label: "first", nodes: [...a.map((_, i) => node(i)), endOf("a")], arrows: a.map(() => "right" as const), pointers: { head: "n0" }, tones: Object.fromEntries(a.map((_, i) => [`n${i}`, "side-a" as Tone])) },
        { label: "second", nodes: [...b.map((_, k) => node(slow + 1 + k)), endOf("b")], arrows: b.map(() => "right" as const), pointers: { second: `n${slow + 1}` }, tones: Object.fromEntries(b.map((_, k) => [`n${slow + 1 + k}`, "side-b" as Tone])) },
      ],
      message: `slow.next ← none cuts the list in two: ${a.join(" → ")} and ${b.join(" → ")}.${n % 2 ? " With an odd length, the first half gets the extra node." : " Equal halves."} O(n) time, O(1) space.` });
  },
};

/* ---------- Merge sort ---------- */
export const sortExample: Input = { values: [5, 1, 4, 2, 6, 3] };
export function sortPrepare(raw: Input): Prepared<Input> {
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so every piece fits." };
  return { input: raw };
}

const mergeSort: Approach<Input> = {
  id: "merge-sort",
  name: "Merge sort on a linked list",
  code: `function sortList(head)
    if head = none or head.next = none
        return head  // 0 or 1 node: sorted
    first, second ← splitHalf(head)
    first ← sortList(first)
    second ← sortList(second)
    return merge(first, second)
`,
  run({ values }, t) {
    type Piece = { ids: number[]; key: string };
    let pieces: Piece[] = [{ ids: values.map((_, i) => i), key: "p" }];
    let counter = 0;
    const draw = (hl: Record<string, Tone> = {}): ListRow[] => pieces.map((p) => ({
      compact: true, nodes: [...p.ids.map((i) => ({ id: `n${i}`, val: values[i] })), endOf(p.key)], arrows: p.ids.map(() => "right" as const),
      tones: Object.fromEntries(p.ids.map((i) => [`n${i}`, hl[p.key] ?? (p.ids.length === 1 ? "visited" as Tone : undefined)]).filter(([, v]) => v)),
    }));
    const show = (ids: number[]) => ids.map((i) => values[i]).join(" → ");
    t.step({ line: 1, array: [], lists: draw(), vars: { pieces: 1 },
      message: "Merge sort fits linked lists perfectly: split the list in half, sort each half the same way, then merge the two sorted halves. Splitting and merging only change next pointers, so it needs no extra array." });
    if (values.length < 2) {
      t.step({ line: 3, array: [], lists: draw(), vars: {}, done: "found", message: "A single node is already sorted." });
      return;
    }
    let asked = false;
    /** Sorts the piece with this key in place among `pieces`; returns the key of the sorted piece it leaves. */
    const rec = (key: string): string => {
      const idx = pieces.findIndex((p) => p.key === key);
      const p = pieces[idx];
      if (p.ids.length < 2) return key;
      const half = Math.ceil(p.ids.length / 2);
      const a: Piece = { ids: p.ids.slice(0, half), key: `p${++counter}` }, b: Piece = { ids: p.ids.slice(half), key: `p${++counter}` };
      t.op(p.ids.length);
      pieces.splice(idx, 1, a, b);
      t.step({ line: 4, array: [], lists: draw({ [a.key]: "side-a", [b.key]: "side-b" }), vars: { pieces: pieces.length },
        message: `Split ${show(p.ids)} into ${show(a.ids)} and ${show(b.ids)}.` });
      const ka = rec(a.key), kb = rec(b.key);
      const ia = pieces.findIndex((q) => q.key === ka);
      a.ids = pieces[ia].ids; b.ids = pieces.find((q) => q.key === kb)!.ids;
      const merged = [...a.ids, ...b.ids].sort((x, y) => values[x] - values[y] || x - y);
      const m: Piece = { ids: merged, key: `p${++counter}` };
      const options = [show(merged), show([...a.ids, ...b.ids]), show([...b.ids, ...a.ids])].filter((o, i, arr) => arr.indexOf(o) === i);
      const ask = !asked && a.ids.length > 1 && options.length > 1
        ? (asked = true, { ask: { q: `${show(a.ids)} and ${show(b.ids)} are each sorted. Merging takes the smaller front value each time. What's the result?`, options, answer: 0 } }) : {};
      t.op(merged.length);
      pieces.splice(ia, 2, m);
      t.step({ ...ask, line: 7, array: [], lists: draw({ [m.key]: "found" }), vars: { pieces: pieces.length },
        message: `Both halves are sorted (a single node always is). Merge ${show(a.ids)} and ${show(b.ids)} by taking the smaller front node each time: ${show(merged)}.` });
      return m.key;
    };
    rec("p");
    t.step({ line: 7, array: [], lists: draw({ [pieces[0].key]: "settled" }), vars: {}, done: "found",
      message: `Sorted: ${show(pieces[0].ids)} → none. The list was halved about log₂ n times, and each level of merging touches all n nodes: O(n log n) time. The waiting calls take O(log n) stack space.` });
  },
};

export const approaches = { split, mergeSort };
