import { type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/* ---------- Shared: a list kept as next links, drawn by following them ---------- */

export type Links = { val: Record<string, number>; next: Record<string, string | null> };
export const makeLinks = (vals: number[]): { L: Links; head: string | null; ids: string[] } => {
  const ids = vals.map((_, i) => `n${i}`);
  return { L: { val: Object.fromEntries(ids.map((id, i) => [id, vals[i]])), next: Object.fromEntries(ids.map((id, i) => [id, ids[i + 1] ?? null])) }, head: ids[0] ?? null, ids };
};
/** The nodes reached from `head` by following next, in order. */
export const walk = (L: Links, head: string | null) => { const out: string[] = []; for (let x = head; x && out.length < 50; x = L.next[x]) out.push(x); return out; };
/** One drawn row: the chain from `head`, then a none marker. A dummy node can lead it. */
export function chain(L: Links, head: string | null, o: { label?: string; pointers?: Record<string, string | null>; tones?: Record<string, Tone>; dummy?: boolean } = {}): ListRow {
  const ids = walk(L, head);
  const nodes = [...(o.dummy ? [{ id: "dummy", val: "dummy", kind: "dummy" as const }] : []), ...ids.map((id) => ({ id, val: L.val[id] })), { id: `none-${o.label ?? "x"}`, val: "none", kind: "null" as const }];
  const pointers = Object.fromEntries(Object.entries(o.pointers ?? {}).map(([k, v]) => [k, v === null ? `none-${o.label ?? "x"}` : v]));
  return { ...(o.label ? { label: o.label } : {}), nodes, arrows: nodes.slice(0, -1).map(() => "right" as const), pointers, tones: o.tones ?? {} };
}
export const listFields: InputField[] = [{ key: "head", label: "head (values)", kind: "numbers" }];
export function listPrepare(raw: { head: number[] }): Prepared<{ head: number[] }> {
  if (raw.head.length > 8) return { error: "Use at most 8 values so the list fits." };
  return { input: raw };
}

/* ---------- 24. Swap Nodes in Pairs ---------- */

export type Input = { head: number[] };
export const example: Input = { head: [4, 9, 2, 7, 5] };
export const fields = listFields;
export const prepare = listPrepare;

const rebuild: Approach<Input> = {
  id: "rebuild",
  name: "Put the nodes in an array, relink by position",
  code: `function swapPairs(head)
    nodes ← every node of the list, in order
    for each even i with i + 1 < length(nodes)
        swap nodes[i] and nodes[i + 1]
    for i ← 0 to length(nodes) - 2
        nodes[i].next ← nodes[i + 1]
    last node's next ← none
    return nodes[0], or none if empty
`,
  run({ head: vals }, t) {
    const { L, head, ids } = makeLinks(vals);
    t.step({ line: 2, array: [], lists: [chain(L, head, { label: "list", pointers: { head } })], vars: {},
      message: "Copy a reference to every node into an array. Positions make the swaps easy: trade places 0 and 1, 2 and 3, and so on, then relink the nodes in their new order." });
    const arr = [...ids];
    ids.forEach(() => t.op());
    t.step({ line: 2, array: arr.map((id) => L.val[id]), lists: [chain(L, head, { label: "list" })], vars: { nodes: arr.length },
      message: `The array holds all ${arr.length} nodes: O(n) extra memory before any swapping.` });
    for (let i = 0; i + 1 < arr.length; i += 2) { t.op(); [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; }
    t.step({ line: 4, array: arr.map((id) => L.val[id]), tones: Object.fromEntries(arr.map((_, i) => [i, (i + 1 < arr.length || arr.length % 2 === 0 ? "active" : "settled") as Tone])), lists: [chain(L, head, { label: "list" })], vars: {},
      message: `Swap each pair of positions in the array.${arr.length % 2 ? ` The last node, ${L.val[arr[arr.length - 1]]}, has no partner and stays put.` : ""}` });
    arr.forEach((id, i) => { t.op(); L.next[id] = arr[i + 1] ?? null; });
    t.step({ line: 8, array: arr.map((id) => L.val[id]), lists: [chain(L, arr[0] ?? null, { label: "list", pointers: { head: arr[0] ?? null }, tones: Object.fromEntries(arr.map((id) => [id, "settled" as Tone])) })], vars: {}, done: "found",
      message: `Relink every node to the next one in the array. Done in O(n) time, but with an O(n) array the in-place version doesn't need.` });
  },
};

const relink: Approach<Input> = {
  id: "relink",
  name: "Relink each pair in place, with a dummy head",
  code: `function swapPairs(head)
    dummy ← new ListNode(), dummy.next ← head
    prev ← dummy
    while prev.next ≠ none and prev.next.next ≠ none
        a, b ← prev.next, prev.next.next
        a.next ← b.next  // a skips past b
        b.next ← a  // b now comes first
        prev.next ← b  // the list before sees b
        prev ← a  // a ends this pair
    return dummy.next
`,
  run({ head: vals }, t) {
    const { L, head } = makeLinks(vals);
    let first = head, prev = "dummy", asked = false;
    const row = (p: Record<string, string | null>, tones: Record<string, Tone> = {}) => [chain(L, first, { label: "list", pointers: p, tones, dummy: true })];
    t.step({ line: 3, array: [], lists: row({ prev: "dummy" }), vars: {},
      message: "A dummy node in front means the first pair has a node before it too, so every pair is handled the same way. prev is the node just before the next pair." });
    const done: string[] = [];
    while (true) {
      const a = prev === "dummy" ? first : L.next[prev], b = a ? L.next[a] : null;
      t.op();
      if (!a || !b) break;
      const ask = !asked ? (asked = true, { ask: { q: `Pair ${L.val[a]}, ${L.val[b]}: after relinking, what does ${L.val[a]} point to?`, options: [...new Set([L.next[b] ? String(L.val[L.next[b]!]) : "none", String(L.val[b]), "itself"])], answer: 0 } }) : {};
      t.step({ line: 5, array: [], lists: row({ prev, a, b }, { ...Object.fromEntries(done.map((x) => [x, "settled" as Tone])), [a]: "compare", [b]: "compare" }), vars: { a: L.val[a], b: L.val[b] },
        message: `The next pair is ${L.val[a]} and ${L.val[b]}. Three links change: ${L.val[a]} points past ${L.val[b]}, ${L.val[b]} points back to ${L.val[a]}, and ${prev === "dummy" ? "the dummy" : L.val[prev]} points to ${L.val[b]}.` });
      L.next[a] = L.next[b]; L.next[b] = a;
      if (prev === "dummy") first = b; else L.next[prev] = b;
      done.push(a, b);
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 8, array: [], lists: row({ prev, a, b }, { ...Object.fromEntries(done.map((x) => [x, "settled" as Tone])), [a]: "found", [b]: "found" }), vars: { a: L.val[a], b: L.val[b] },
        message: `Swapped: now ${L.val[b]} → ${L.val[a]}${L.next[a] ? ` → ${L.val[L.next[a]!]}` : " → none"}. ${L.val[a]} ends this pair, so it becomes prev.` });
      prev = a;
    }
    const left = prev === "dummy" ? first : L.next[prev];
    t.step({ line: 10, array: [], lists: row({ head: first }, Object.fromEntries(walk(L, first).map((x) => [x, "settled" as Tone]))), vars: {}, done: "found",
      message: `${left ? `Only ${L.val[left]} is left, with no partner: it stays. ` : ""}Return dummy.next. Each pair took three link changes: O(n) time and O(1) extra space.` });
  },
};

export const approaches = { rebuild, relink };
