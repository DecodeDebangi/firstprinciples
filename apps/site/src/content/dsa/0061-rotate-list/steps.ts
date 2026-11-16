import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { values: number[]; k: number };
type P = Input;
export const example: Input = { values: [6, 2, 8, 4, 9], k: 7 };
export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "k", label: "rotate right by k =", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  if (!Number.isInteger(raw.k) || raw.k < 0) return { error: "k must be a whole number, 0 or more." };
  if (raw.k > 20) return { error: "Keep k to 20 or less here, so the slow approach finishes. (The fast one wouldn't care.)" };
  return { input: raw, ...(raw.values.length === 0 ? { note: "An empty list: rotating it changes nothing." } : {}) };
}

type N = { id: string; val: number | string; kind?: "null" };
const END: N = { id: "end", val: "none", kind: "null" };
/** order: node indices from head to tail (ids stay with their nodes, so they slide when the order changes). */
const row = (values: number[], order: number[], pointers: Record<string, number> = {}, tones: Record<number, Tone> = {}, extra: Partial<ListRow> = {}): ListRow => ({
  nodes: [...order.map((i) => ({ id: `n${i}`, val: values[i] })), END], arrows: order.map(() => "right" as const),
  pointers: Object.fromEntries(Object.entries(pointers).map(([p, i]) => [p, i < 0 ? "end" : `n${i}`])),
  tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [`n${i}`, t])), ...extra,
});
const show = (values: number[], order: number[]) => order.map((i) => values[i]).join(" → ") + " → none";
type T = Parameters<Approach<P>["run"]>[1];
const tiny = (t: T, values: number[], k: number) => {
  t.step({ line: 3, array: [], lists: [row(values, values.map((_, i) => i), values.length ? { head: 0 } : {})], vars: { k }, done: "found",
    message: values.length ? "A single node: rotating it by any amount leaves it the same. Return head." : "The list is empty: there's nothing to rotate. Return none." });
};

const oneAtATime: Approach<P> = {
  id: "one-at-a-time",
  name: "Move the last node to the front, k times",
  code: `function rotateRight(head, k)
    if head = none or head.next = none
        return head
    repeat k times
        prev ← head
        while prev.next.next ≠ none
            prev ← prev.next
        last ← prev.next
        prev.next ← none
        last.next ← head
        head ← last
    return head
`,
  run({ values, k }, t) {
    const n = values.length;
    if (n < 2) { tiny(t, values, k); return; }
    let order = values.map((_, i) => i);
    t.step({ line: 4, array: [], lists: [row(values, order, { head: order[0] })], vars: { k },
      message: `Rotating right by 1 means the last node moves to the front. So do that ${k} time${k === 1 ? "" : "s"}. Each time, walk to the second-to-last node, because that's the one whose next must become none.` });
    for (let r = 1; r <= k; r++) {
      for (let s = 0; s < n - 1; s++) t.op();
      const prev = order[n - 2], last = order[n - 1];
      t.step({ line: 8, array: [], lists: [row(values, order, { head: order[0], prev, last }, { [prev]: "active", [last]: "compare" })], vars: { round: r },
        message: `Round ${r} of ${k}: walk ${n - 2} step${n - 2 === 1 ? "" : "s"} to the ${values[prev]}, the second-to-last node. The last node is the ${values[last]}.` });
      order = [last, ...order.slice(0, n - 1)];
      t.step({ line: 11, array: [], lists: [row(values, order, { head: last }, { [last]: "found" })], vars: { round: r },
        message: `Cut the ${values[last]} off the end and put it in front: ${show(values, order)}.${r === n ? ` That's ${n} rounds, and the list is back where it started.` : ""}` });
    }
    t.step({ line: 12, array: [], lists: [row(values, order, { head: order[0] }, Object.fromEntries(order.map((i) => [i, "settled" as Tone])))], vars: { k }, done: "found",
      message: `Return head: ${show(values, order)}. Each round walks the whole list, so it's O(n · k)${k >= n ? `, and ${k - (k % n)} of these ${k} rounds just went full circle for nothing` : ""}.` });
  },
};

const ring: Approach<P> = {
  id: "ring",
  name: "Close it into a ring, cut in the right place (optimal)",
  code: `function rotateRight(head, k)
    if head = none or head.next = none
        return head
    n ← 1
    tail ← head
    while tail.next ≠ none
        tail ← tail.next
        n += 1
    k ← k % n
    if k = 0 then return head
    tail.next ← head  // close the ring
    newTail ← head
    repeat n - k - 1 times
        newTail ← newTail.next
    newHead ← newTail.next
    newTail.next ← none
    return newHead
`,
  run({ values, k: k0 }, t) {
    const n = values.length;
    if (n < 2) { tiny(t, values, k0); return; }
    const order = values.map((_, i) => i);
    let tail = 0;
    t.step({ line: 5, array: [], lists: [row(values, order, { head: 0, tail })], vars: { n: 1, k: k0 },
      message: "Rotating by k really means: the last k nodes move to the front, in the same order. First walk to the tail, counting nodes." });
    while (tail < n - 1) {
      t.op(); tail++;
      t.step({ line: 8, array: [], lists: [row(values, order, { head: 0, tail }, { [tail]: "active" })], vars: { n: tail + 1, k: k0 },
        message: `tail moves to the ${values[tail]}: n = ${tail + 1}.${tail === n - 1 ? " tail.next is none, so this is the last node." : ""}` });
    }
    const k = k0 % n;
    t.op();
    const wrong = [n - k, k0 + n, k + 1, k + 2].filter((x, i, a) => x !== k && a.indexOf(x) === i).slice(0, 2);
    t.step({ ask: { q: `n is ${n} and k is ${k0}. Rotating by ${k0} is the same as rotating by…`, options: [`${k} (${k0} % ${n})`, ...wrong.map(String)], answer: 0 },
      line: 9, array: [], lists: [row(values, order, { head: 0, tail })], vars: { n, k },
      message: k0 >= n ? `Rotating by ${n} brings every node back where it started, so only the remainder matters: ${k0} % ${n} = ${k}.` : `${k0} is less than n, so k stays ${k}.` });
    if (k === 0) {
      t.step({ line: 10, array: [], lists: [row(values, order, { head: 0 }, Object.fromEntries(order.map((i) => [i, "settled" as Tone])))], vars: { n, k }, done: "found",
        message: `k is 0: the rotation lands exactly where it started. Return head unchanged.` });
      return;
    }
    const ringRow = (pointers: Record<string, number>, tones: Record<number, Tone> = {}) => ({ ...row(values, order, pointers, tones), nodes: order.map((i) => ({ id: `n${i}`, val: values[i] })), arrows: order.slice(1).map(() => "right" as const), skips: [{ from: `n${n - 1}`, to: "n0" }] });
    t.step({ line: 11, array: [], lists: [ringRow({ head: 0, tail })], vars: { n, k },
      message: `Point the tail back at the head, closing the list into a ring. Now "rotating" is just choosing where to cut it: the new head is the ${values[n - k]}, ${k} node${k === 1 ? "" : "s"} from the end.` });
    let nt = 0;
    t.step({ line: 12, array: [], lists: [ringRow({ newTail: nt }, { [nt]: "active" })], vars: { n, k, steps: n - k - 1 },
      message: `The node just before the new head becomes the new tail. It's n − k − 1 = ${n - k - 1} step${n - k - 1 === 1 ? "" : "s"} from the head.` });
    for (let s = 0; s < n - k - 1; s++) {
      t.op(); nt++;
      t.step({ line: 14, array: [], lists: [ringRow({ newTail: nt }, { [nt]: "active" })], vars: { n, k, steps: n - k - 1 }, message: `Step ${s + 1} of ${n - k - 1}: newTail moves to the ${values[nt]}.` });
    }
    const nh = nt + 1;
    t.step({ line: 15, array: [], lists: [ringRow({ newTail: nt, newHead: nh }, { [nt]: "active", [nh]: "found" })], vars: { n, k },
      message: `newHead is the node after it, the ${values[nh]}. Cut the ring between them.` });
    const out = [...order.slice(nh), ...order.slice(0, nh)];
    t.step({ line: 17, array: [], lists: [row(values, out, { newHead: nh }, Object.fromEntries(out.map((i) => [i, "settled" as Tone])))], vars: { n, k }, done: "found",
      message: `newTail.next ← none, and return newHead: ${show(values, out)}. One walk to count, at most one more to the cut: O(n), whatever k is.` });
  },
};

export const approaches = { oneAtATime, ring };

/** k = n: the slow approach does n full rounds (and ends where it started); the ring version does almost nothing extra. */
export const growth = measureGrowth(
  [{ approach: oneAtATime, slot: 1 }, { approach: ring, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => i), k: Math.max(1, n - 1) }),
  [4, 8, 16, 24, 32],
);
