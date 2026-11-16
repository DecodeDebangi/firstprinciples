import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/** randoms: for each node, the position its random pointer points to (from 0), or "none". */
export type Input = { values: number[]; randoms: string };
type P = Input;
export const example: Input = { values: [7, 3, 9], randoms: "2, 0, none" };
export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "randoms", label: "each node's random → position (or none)", kind: "text" },
];
const parseRandoms = (s: string) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).map((x) => (x === "none" ? -1 : Number(x)));
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.values.length, r = parseRandoms(raw.randoms);
  if (n === 0) return { error: "Give the list at least one value." };
  if (n > 4) return { error: "Keep the list to at most 4 nodes, so the copies fit next to it." };
  if (r.length !== n) return { error: `Give one random target per node: ${n} entries, each a position from 0 to ${n - 1} or none.` };
  if (r.some((x) => !Number.isInteger(x) || x < -1 || x >= n)) return { error: `Each random target must be a position from 0 to ${n - 1}, or none.` };
  return { input: { values: raw.values, randoms: r.map((x) => (x < 0 ? "none" : String(x))).join(", ") } };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END = (id: string): N => ({ id, val: "none", kind: "null" });
type Skip = NonNullable<ListRow["skips"]>[number];

function setup({ values, randoms }: P) {
  const n = values.length, rnd = parseRandoms(randoms);
  const o = (i: number) => `o${i}`, c = (i: number) => `c${i}`;
  const oNode = (i: number): N => ({ id: o(i), val: values[i] }), cNode = (i: number): N => ({ id: c(i), val: values[i] });
  const name = (i: number) => (i < 0 ? "none" : `the ${values[i]}${values.filter((v) => v === values[i]).length > 1 ? ` at position ${i}` : ""}`);
  /** Random arcs for the given nodes (id maker), only where set. */
  const arcs = (ids: (i: number) => string, which: number[], set: (number | null)[] = rnd): Skip[] =>
    which.filter((i) => set[i] !== null && set[i]! >= 0).map((i) => ({ from: ids(i), to: ids(set[i]!), tone: "aux" as const }));
  const original = (ptr: Record<string, string> = {}, tones: Record<string, Tone> = {}, showRandoms = true): ListRow => ({
    label: "original", nodes: [...values.map((_, i) => oNode(i)), END("o-end")], arrows: values.map(() => "right" as const),
    skips: showRandoms ? arcs(o, values.map((_, i) => i)) : undefined, pointers: ptr, tones,
  });
  return { n, rnd, o, c, oNode, cNode, name, arcs, original };
}

const byPosition: Approach<P> = {
  id: "position",
  name: "Copy the chain, then find each random by position",
  code: `function copyRandomList(head)
    dummy ← new Node(0)
    tail ← dummy
    curr ← head
    while curr ≠ none  // copy the next links
        tail.next ← new Node(curr.val)
        tail ← tail.next
        curr ← curr.next
    a, b ← head, dummy.next
    while a ≠ none  // copy each random
        if a.random ≠ none
            k ← position of a.random from head
            b.random ← node at position k in copy
        a, b ← a.next, b.next
    return dummy.next
`,
  run(input, t) {
    const g = setup(input);
    const { n, rnd } = g;
    const set: (number | null)[] = Array(n).fill(null);
    const copy = (built: number, ptr: Record<string, string> = {}, tones: Record<string, Tone> = {}): ListRow => ({
      label: "copy", nodes: [...Array.from({ length: built }, (_, i) => g.cNode(i)), END("c-end")], arrows: Array.from({ length: built }, () => "right" as const),
      skips: g.arcs(g.c, Array.from({ length: built }, (_, i) => i), set), pointers: ptr, tones,
    });
    t.step({ line: 4, array: [], lists: [g.original(), copy(0)], vars: {},
      message: "Each node has a next pointer and a random pointer (the dashed arcs), which can point to any node or to none. The copy must be made of brand-new nodes whose randoms point into the copy, never into the original. First, copy the plain chain." });
    for (let i = 0; i < n; i++) {
      t.op();
      t.step({ line: 7, array: [], lists: [g.original({ curr: g.o(i) }, { [g.o(i)]: "active" }), copy(i + 1, { tail: g.c(i) }, { [g.c(i)]: "found" })], vars: {},
        message: `Make a new node holding ${input.values[i]} and attach it to the copy.` });
    }
    for (let i = 0; i < n; i++) {
      const r = rnd[i];
      if (r < 0) {
        set[i] = -1;
        t.step({ line: 11, array: [], lists: [g.original({ a: g.o(i) }, { [g.o(i)]: "active" }), copy(n, { b: g.c(i) }, { [g.c(i)]: "active" })], vars: {},
          message: `${g.name(i)[0].toUpperCase()}${g.name(i).slice(1)}'s random is none, so the copy's stays none.` });
        continue;
      }
      for (let k = 0; k <= r; k++) t.op(); // walk from the head to find the position
      for (let k = 0; k <= r; k++) t.op(); // and walk the copy to the same position
      set[i] = r;
      t.step({ line: 13, array: [], lists: [g.original({ a: g.o(i) }, { [g.o(i)]: "active", [g.o(r)]: "compare" }), copy(n, { b: g.c(i) }, { [g.c(i)]: "active", [g.c(r)]: "found" })], vars: { k: r },
        message: `${g.name(i)[0].toUpperCase()}${g.name(i).slice(1)}'s random points to ${g.name(r)}. Walk from the head to learn that's position ${r}, then walk the copy to its position ${r} and point there. Two walks for one pointer.` });
    }
    t.step({ line: 15, array: [], lists: [g.original(), copy(n, {}, Object.fromEntries(Array.from({ length: n }, (_, i) => [g.c(i), "settled" as Tone])))], vars: {}, done: "found",
      message: "Return the copy. Correct, but each random took up to two walks of the list: O(n²) time." });
  },
};

const withMap: Approach<P> = {
  id: "map",
  name: "Map each original node to its copy",
  code: `function copyRandomList(head)
    copyOf ← empty map  // original → copy
    curr ← head
    while curr ≠ none
        copyOf[curr] ← new Node(curr.val)
        curr ← curr.next
    curr ← head
    while curr ≠ none  // copyOf[none] is none
        copyOf[curr].next ← copyOf[curr.next]
        copyOf[curr].random ← copyOf[curr.random]
        curr ← curr.next
    return copyOf[head]
`,
  run(input, t) {
    const g = setup(input);
    const { n, rnd } = g;
    const made: number[] = [];
    const linked: boolean[] = Array(n).fill(false);
    const set: (number | null)[] = Array(n).fill(null);
    const copy = (tones: Record<string, Tone> = {}): ListRow => ({
      label: "copy", nodes: [...made.map((i) => g.cNode(i)), END("c-end")],
      arrows: made.map((i) => (linked[i] ? "right" as const : null)), skips: g.arcs(g.c, made, set), tones,
    });
    const panel = (hl?: number) => ({ title: "copyOf (original → copy)", entries: made.map((i) => [`original ${input.values[i]}`, `copy ${input.values[i]}`] as [string, string]), highlight: hl === undefined ? undefined : `original ${input.values[hl]}` });
    t.step({ line: 2, array: [], lists: [g.original(), copy()], map: panel(), vars: {},
      message: "The hard part is knowing, for any original node, which copy node stands for it. A map answers that in O(1). Pass 1 makes every copy node and records it in the map." });
    for (let i = 0; i < n; i++) {
      t.op(); made.push(i);
      t.step({ line: 5, array: [], lists: [g.original({ curr: g.o(i) }, { [g.o(i)]: "active" }), copy({ [g.c(i)]: "found" })], map: panel(i), vars: {},
        message: `Make a copy of ${g.name(i)} and remember: copyOf[original ${input.values[i]}] is this new node. It isn't linked to anything yet.` });
    }
    for (let i = 0; i < n; i++) {
      t.op(); t.op();
      linked[i] = true; set[i] = rnd[i];
      t.step({ ...(i === 0 && rnd[0] >= 0 ? { ask: { q: `${g.name(0)[0].toUpperCase()}${g.name(0).slice(1)}'s random points to ${g.name(rnd[0])}. Where should its copy's random point?`, options: [`To the copy of ${g.name(rnd[0])}: copyOf[curr.random]`, `To ${g.name(rnd[0])} in the original`, "To none"], answer: 0 } } : {}),
        line: 10, array: [], lists: [g.original({ curr: g.o(i) }, { [g.o(i)]: "active" }), copy({ [g.c(i)]: "found" })], map: panel(i), vars: {},
        message: `Copy ${g.name(i)}'s two pointers through the map: next → copyOf[${i + 1 < n ? `the ${input.values[i + 1]}` : "none"}], random → copyOf[${g.name(rnd[i])}]${rnd[i] < 0 ? ", which is none" : ""}. Each is one O(1) lookup.` });
    }
    t.step({ line: 12, array: [], lists: [g.original(), copy(Object.fromEntries(made.map((i) => [g.c(i), "settled" as Tone])))], map: panel(), vars: {}, done: "found",
      message: "Return copyOf[head]. Two passes with O(1) lookups: O(n) time. The map holds n entries: O(n) extra space." });
  },
};

const weave: Approach<P> = {
  id: "weave",
  name: "Weave the copies in, then pull them out (optimal)",
  code: `function copyRandomList(head)
    curr ← head
    while curr ≠ none  // 1: a copy after each
        copy ← new Node(curr.val)
        copy.next ← curr.next
        curr.next ← copy
        curr ← copy.next
    curr ← head
    while curr ≠ none  // 2: the copies' randoms
        if curr.random ≠ none
            curr.next.random ← curr.random.next
        curr ← curr.next.next
    dummy ← new Node(0)
    tail ← dummy
    curr ← head
    while curr ≠ none  // 3: pull the copies out
        tail.next ← curr.next
        tail ← tail.next
        curr.next ← curr.next.next
        curr ← curr.next
    return dummy.next
`,
  run(input, t) {
    const g = setup(input);
    const { n, rnd } = g;
    const set: (number | null)[] = Array(n).fill(null);
    // Woven row: o0, c0, o1, c1, ... (copies only once made).
    const woven = (made: number, ptr: Record<string, string>, tones: Record<string, Tone> = {}, showOrig = true, focus?: number): ListRow => {
      const order: N[] = [];
      for (let i = 0; i < n; i++) { order.push(g.oNode(i)); if (i < made) order.push(g.cNode(i)); }
      const skips: Skip[] = [
        ...(showOrig ? g.arcs(g.o, values()) : focus !== undefined && rnd[focus] >= 0 ? [{ from: g.o(focus), to: g.o(rnd[focus]), tone: "aux" as const }] : []),
        ...g.arcs(g.c, Array.from({ length: made }, (_, i) => i), set),
      ];
      return { nodes: [...order, END("w-end")], arrows: order.map(() => "right" as const), skips, pointers: ptr,
        tones: { ...Object.fromEntries(Array.from({ length: made }, (_, i) => [g.c(i), "side-b" as Tone])), ...tones } };
    };
    const values = () => input.values.map((_, i) => i);
    t.step({ line: 2, array: [], lists: [woven(0, { curr: g.o(0) })], vars: {},
      message: "No map this time. Instead, put each copy right after its original, in the same list. Then the copy of any node x is simply x.next, so the list itself does the map's job." });
    for (let i = 0; i < n; i++) {
      t.op();
      t.step({ line: 7, array: [], lists: [woven(i + 1, { curr: i + 1 < n ? g.o(i + 1) : "w-end" }, { [g.c(i)]: "found" })], vars: {},
        message: `Make a copy of ${g.name(i)} and splice it in right after the original. curr jumps over it to the next original.` });
    }
    for (let i = 0; i < n; i++) {
      t.op();
      const r = rnd[i];
      set[i] = r;
      t.step({ ...(i === 0 && r >= 0 ? { ask: { q: `${g.name(0)[0].toUpperCase()}${g.name(0).slice(1)}'s random points to ${g.name(r)}. Which node is the copy of ${g.name(r)}?`, options: [`curr.random.next: the node right after ${g.name(r)}`, "curr.random itself", "curr.next"], answer: 0 } } : {}),
        line: r >= 0 ? 11 : 10, array: [], lists: [woven(n, { curr: g.o(i) }, { [g.o(i)]: "active", [g.c(i)]: "found", ...(r >= 0 ? { [g.c(r)]: "compare" } : {}) }, false, i)], vars: {},
        message: r >= 0 ? `${g.name(i)[0].toUpperCase()}${g.name(i).slice(1)}'s random is ${g.name(r)}, and the copy of that is the node right after it. So curr.next.random ← curr.random.next.` : `${g.name(i)[0].toUpperCase()}${g.name(i).slice(1)}'s random is none, so its copy's stays none.` });
    }
    // Pass 3: unweave into two rows.
    const orig = (k: number): ListRow => ({ ...g.original({}, {}, true), label: "original", arrows: input.values.map((_, i) => (i < k ? "right" as const : null)) });
    for (let k = 1; k <= n; k++) {
      t.op();
      const copyRow: ListRow = { label: "copy", nodes: [...Array.from({ length: k }, (_, i) => g.cNode(i)), END("c-end")], arrows: Array.from({ length: k }, () => "right" as const),
        skips: g.arcs(g.c, Array.from({ length: k }, (_, i) => i), set.map((x) => (x !== null && x < k ? x : null))), tones: { [g.c(k - 1)]: "found" } };
      t.step({ line: 20, array: [], lists: [orig(k), copyRow], vars: {},
        message: `Pull the copy of ${g.name(k - 1)} out into its own list, and point the original back at its real next${k < n ? `, the ${input.values[k]}` : ", none"}.${k === n ? "" : " (A copy's random arc appears once the node it points to has been pulled out too.)"}` });
    }
    const final: ListRow = { label: "copy", nodes: [...input.values.map((_, i) => g.cNode(i)), END("c-end")], arrows: input.values.map(() => "right" as const), skips: g.arcs(g.c, values(), set),
      tones: Object.fromEntries(input.values.map((_, i) => [g.c(i), "settled" as Tone])) };
    t.step({ line: 21, array: [], lists: [g.original(), final], vars: {}, done: "found",
      message: "Return the copy. The original is exactly as it was. Three passes, O(n) time, and no map: O(1) extra space besides the copy itself." });
  },
};

export const approaches = { byPosition, withMap, weave };

/** Every random points at the last node: the position approach walks almost the whole list for each. */
export const growth = measureGrowth(
  [{ approach: byPosition, slot: 1 }, { approach: withMap, slot: 2 }, { approach: weave, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => i), randoms: Array.from({ length: n }, () => String(n - 1)).join(", ") }),
  [4, 8, 16, 24, 32],
);
