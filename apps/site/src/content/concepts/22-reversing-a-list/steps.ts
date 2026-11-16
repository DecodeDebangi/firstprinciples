import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END = (id = "end"): N => ({ id, val: "none", kind: "null" });

/* ---------- The walk, drawn as two lists ---------- */
export type Input = { values: number[] };
export const example: Input = { values: [3, 8, 5, 2] };
export const fields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  return { input: raw };
}

const twoLists: Approach<Input> = {
  id: "two-lists",
  name: "One node at a time, from one list to the other",
  code: `function reverse(head)
    prev ← none
    curr ← head
    while curr ≠ none
        nxt ← curr.next
        curr.next ← prev
        prev ← curr
        curr ← nxt
    return prev
`,
  run({ values }, t) {
    const n = values.length;
    const node = (i: number): N => ({ id: `n${i}`, val: values[i] });
    /** done = how many nodes have moved to the reversed list. */
    const draw = (done: number, ptr: Record<string, "rev" | "todo">, lift?: number): ListRow[] => {
      const rev = Array.from({ length: done }, (_, k) => done - 1 - k); // newest first
      const todo = Array.from({ length: n - done }, (_, k) => done + k);
      const at = (which: "rev" | "todo") => { const arr = which === "rev" ? rev : todo; return arr.length ? `n${arr[0]}` : which === "rev" ? "end-r" : "end-t"; };
      const pick = (which: "rev" | "todo") => Object.fromEntries(Object.entries(ptr).filter(([, w]) => w === which).map(([k, w]) => [k, at(w)]));
      return [
        { label: "reversed", nodes: [...rev.map(node), END("end-r")], arrows: rev.map(() => "right" as const), pointers: pick("rev"), tones: Object.fromEntries(rev.map((i) => [`n${i}`, (i === lift ? "found" : "settled") as Tone])) },
        { label: "still to do", nodes: [...todo.map(node), END("end-t")], arrows: todo.map(() => "right" as const), pointers: pick("todo") },
      ];
    };
    t.step({ line: 3, array: [], lists: draw(0, { prev: "rev", curr: "todo" }), vars: {},
      message: "Think of it as two lists. prev is the head of the part already reversed (empty, so none). curr is the head of the part still to do (the whole list). Each round moves one node from the front of the second list to the front of the first." });
    for (let i = 0; i < n; i++) {
      t.op();
      t.step({ ...(i === 0 ? { ask: { q: `curr is on the ${values[0]}. Why save nxt ← curr.next before anything else?`, options: ["The next line points curr.next at prev, and then the rest of the list is unreachable", "To count the nodes", "It isn't needed"], answer: 0 } } : {}),
        line: 6, array: [], lists: draw(i + 1, { curr: "rev", nxt: "todo" }, i), vars: {},
        message: `Save nxt (the ${i + 1 < n ? values[i + 1] : "none"}), then point the ${values[i]} at prev${i ? `, the ${values[i - 1]}` : ", which is none"}. The ${values[i]} has moved to the front of the reversed list.` });
      t.step({ line: 8, array: [], lists: draw(i + 1, { prev: "rev", curr: "todo" }), vars: {},
        message: i + 1 < n ? `prev ← curr and curr ← nxt: both lists have new heads. The reversed list is ${Array.from({ length: i + 1 }, (_, k) => values[i - k]).join(" → ")} → none.` : "curr is none: the second list is empty, so the first one is the whole list, reversed." });
    }
    t.step({ line: 9, array: [], lists: draw(n, { prev: "rev" }), vars: {}, done: "found",
      message: `Return prev: ${[...values].reverse().join(" → ")} → none. Each node was moved once: O(n) time, three pointers: O(1) space.` });
  },
};

/* ---------- The order trap ---------- */
const wrongOrder: Approach<Input> = {
  id: "wrong-order",
  name: "The trap: flipping before saving",
  code: `function reverse(head)  // broken
    prev ← none
    curr ← head
    while curr ≠ none
        curr.next ← prev  // flipped first...
        prev ← curr
        curr ← curr.next  // ...so this is prev
    return prev
`,
  run({ values }, t) {
    const n = values.length;
    const rows = (flipped: boolean, ptr: Record<string, string>) => [{
      nodes: [...values.map((v, i) => ({ id: `n${i}`, val: v })), END()], arrows: values.map((_, i) => (flipped && i === 0 ? null : "right" as const)),
      pointers: ptr, tones: flipped ? Object.fromEntries(values.slice(1).map((_, i) => [`n${i + 1}`, "discard" as Tone])) : {},
      ...(flipped ? { skips: [{ from: "n0", to: "end", tone: "miss" as const }] } : {}),
    }] as ListRow[];
    t.step({ line: 3, array: [], lists: rows(false, { curr: "n0" }), vars: {},
      message: "Same idea, but without saving curr.next first. Watch what happens to the rest of the list." });
    t.op();
    t.step({ line: 5, array: [], lists: rows(true, { curr: "n0" }), vars: {},
      message: n > 1 ? `curr.next ← prev points the ${values[0]} at none. That arrow was the only way to reach the ${values[1]}, and nothing else points to it. The other ${n - 1} node${n === 2 ? " is" : "s are"} now unreachable.` : `curr.next ← prev points the ${values[0]} at none. With one node, nothing was lost this time.` });
    t.step({ line: 7, array: [], lists: rows(true, { prev: "n0", curr: "end" }), vars: {}, done: n > 1 ? "notfound" : "found",
      message: n > 1 ? `curr ← curr.next now reads the arrow we just changed: curr becomes none, and the loop ends after one node. It returns ${values[0]} → none, and ${values.slice(1).join(", ")} are gone. The fix: save nxt ← curr.next before changing curr.next.` : "It returns the single node. Try it with more nodes to see the trap." });
  },
};

/* ---------- Reversing part of a list ---------- */
export type PartInput = { values: number[]; from: number; to: number };
export const partExample: PartInput = { values: [3, 8, 5, 2, 6], from: 2, to: 4 };
export const partFields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "from", label: "reverse from position", kind: "number" },
  { key: "to", label: "to position", kind: "number" },
];
export function partPrepare(raw: PartInput): Prepared<PartInput> {
  const n = raw.values.length;
  if (n === 0) return { error: "Give the list at least one value." };
  if (n > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  if (!Number.isInteger(raw.from) || !Number.isInteger(raw.to) || raw.from < 1 || raw.to > n || raw.from > raw.to) return { error: `Positions count from 1. Pick 1 ≤ from ≤ to ≤ ${n}.` };
  return { input: raw };
}

const part: Approach<PartInput> = {
  id: "part",
  name: "Reversing positions from..to",
  code: `function reverseBetween(head, from, to)
    dummy ← new ListNode(0)
    dummy.next ← head
    before ← dummy
    repeat from - 1 times
        before ← before.next
    prev ← none
    curr ← before.next
    repeat to - from + 1 times
        nxt ← curr.next
        curr.next ← prev
        prev ← curr
        curr ← nxt
    before.next.next ← curr  // old first → rest
    before.next ← prev  // join the front
    return dummy.next
`,
  run({ values, from: L, to: R }, t) {
    const n = values.length;
    // Row positions: 0 = dummy, 1..n = nodes, n + 1 = END. The part is rows L..R.
    const ids = ["dummy", ...values.map((_, i) => `n${i}`), "end"];
    const nodes: N[] = [{ id: "dummy", val: "dummy", kind: "dummy" }, ...values.map((v, i) => ({ id: `n${i}`, val: v })), END()];
    const draw = (p: number, ptr: Record<string, number>, tones: Record<number, Tone> = {}): ListRow => ({
      nodes,
      // arrows[j] sits between row j and row j + 1. Reversed nodes point back; the newest one has no link forward yet.
      arrows: Array.from({ length: n + 1 }, (_, j) => (L === n && p === 1 && j === n ? "right" as const : j >= L && j <= L + p - 2 ? "left" as const : p > 0 && j === L + p - 1 ? null : "right" as const)),
      // The part's old first node points to none: an arc to the end marker (unless it's already next to it).
      skips: p > 0 && !(L === n) ? [{ from: ids[L], to: "end" }] : undefined,
      pointers: Object.fromEntries(Object.entries(ptr).map(([k, j]) => [k, ids[j]])),
      tones: { ...Object.fromEntries(Array.from({ length: R - L + 1 }, (_, k) => [ids[L + k], "side-b" as Tone])), ...Object.fromEntries(Object.entries(tones).map(([j, tn]) => [ids[Number(j)], tn])) },
    });
    let before = 0;
    t.step({ line: 4, array: [], lists: [draw(0, { before })], vars: { from: L, to: R },
      message: `Reverse only positions ${L} to ${R} (shaded). It's the same walk, with two extra jobs: stop after ${R - L + 1} node${R === L ? "" : "s"}, and stitch the reversed part back between what comes before and after. A dummy in front means position 1 has a node before it too.` });
    for (let s = 0; s < L - 1; s++) {
      t.op(); before++;
      t.step({ line: 6, array: [], lists: [draw(0, { before }, { [before]: "active" })], vars: { from: L, to: R }, message: `before moves to the ${values[before - 1]}.` });
    }
    t.step({ line: 8, array: [], lists: [draw(0, { before, curr: L })], vars: { from: L, to: R },
      message: `before is on ${before ? `the ${values[before - 1]}` : "the dummy"}, the node just in front of the part. curr starts on the part's first node, the ${values[L - 1]}.` });
    for (let p = 1; p <= R - L + 1; p++) {
      t.op();
      const c = L + p - 1;
      t.step({ line: 13, array: [], lists: [draw(p, { before, prev: c, curr: c + 1 }, { [c]: "found" })], vars: { from: L, to: R },
        message: p === 1 ? `The ${values[c - 1]} now points to none for the moment. It will become the part's last node.` : `The ${values[c - 1]} now points back to the ${values[c - 2]}.` });
    }
    const after = R + 1; // row of the first node after the part (or END)
    const order = [...values.slice(0, L - 1), ...values.slice(L - 1, R).reverse(), ...values.slice(R)];
    // Rows in their new order (ids stay with their nodes, so they slide into place).
    const rowOrder = [...Array.from({ length: L - 1 }, (_, k) => k + 1), ...Array.from({ length: R - L + 1 }, (_, k) => R - k), ...Array.from({ length: n - R }, (_, k) => R + 1 + k)];
    t.step({ ask: { q: `The part is reversed, but it's floating loose. The old first node of the part, the ${values[L - 1]}, still points to none. What should it point to?`, options: [`${after <= n ? `The ${values[after - 1]}, the first node after the part` : "none, since nothing comes after the part"}`, `The ${values[R - 1]}, the new first node of the part`, `${before ? `The ${values[before - 1]}` : "The dummy"}, the node before the part`], answer: 0 },
      line: 15, array: [], vars: { from: L, to: R },
      lists: [{ nodes: [nodes[0], ...rowOrder.map((j) => nodes[j]), END()],
        arrows: Array.from({ length: n + 1 }, () => "right" as const), pointers: { dummy: "dummy" },
        tones: Object.fromEntries(Array.from({ length: R - L + 1 }, (_, k) => [ids[L + k], "found" as Tone])) }],
      message: `Two links stitch it back: the old first node of the part (the ${values[L - 1]}) points on to ${after <= n ? `the ${values[after - 1]}` : "none"}, and ${before ? `the ${values[before - 1]}` : "the dummy"} points to the new first node, the ${values[R - 1]}.` });
    t.step({ line: 16, array: [], vars: { from: L, to: R }, done: "found",
      lists: [{ nodes: [...rowOrder.map((j) => nodes[j]), END()], arrows: order.map(() => "right" as const), tones: Object.fromEntries(Array.from({ length: R - L + 1 }, (_, k) => [ids[L + k], "settled" as Tone])) }],
      message: `Return dummy.next: ${order.join(" → ")} → none. Only positions ${L} to ${R} turned around.` });
  },
};

export const approaches = { twoLists, wrongOrder };
export const partApproaches = { part };
