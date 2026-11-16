import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const HEAD: N = { id: "head", val: "head", kind: "dummy" };
const TAIL: N = { id: "tail", val: "tail", kind: "dummy" };

/* ---------- Unlinking a node you hold ---------- */
export type UnlinkInput = { values: number[]; at: number };
export const unlinkExample: UnlinkInput = { values: [4, 9, 2, 7], at: 2 };
export const unlinkFields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "at", label: "remove the node at position", kind: "number" },
];
export function unlinkPrepare(raw: UnlinkInput): Prepared<UnlinkInput> {
  const n = raw.values.length;
  if (n === 0) return { error: "Give the list at least one value." };
  if (n > 5) return { error: "Keep the list to at most 5 nodes so it fits with the two sentinels." };
  if (!Number.isInteger(raw.at) || raw.at < 1 || raw.at > n) return { error: `Positions count from 1: pick 1 to ${n}.` };
  return { input: raw };
}

const unlink: Approach<UnlinkInput> = {
  id: "unlink",
  name: "Unlinking a node you hold",
  code: `function unlink(node)
    node.prev.next ← node.next
    node.next.prev ← node.prev
`,
  run({ values, at }, t) {
    const nodes: N[] = [HEAD, ...values.map((v, i) => ({ id: `n${i}`, val: v })), TAIL];
    const k = at; // row index of the node (0 is the head sentinel)
    const name = (j: number) => (j === 0 ? "the head sentinel" : j === nodes.length - 1 ? "the tail sentinel" : `the ${nodes[j].val}`);
    const base = (): ListRow["arrows"] => nodes.slice(1).map(() => "double" as const);
    t.step({ line: 1, array: [], vars: {}, lists: [{ nodes, arrows: base(), pointers: { node: nodes[k].id }, tones: { [nodes[k].id]: "active" } }],
      message: `Every node points both ways: next (→) and prev (←). There's a sentinel node at each end, so every real node always has a node on both sides. We're holding the ${values[at - 1]} and want it out of the list. No walking needed: it knows its own neighbours.` });
    t.op();
    const a1 = base(); a1[k - 1] = "left"; // prev no longer points forward to node; node.prev still points back
    t.step({ line: 2, array: [], vars: {}, lists: [{ nodes, arrows: a1, skips: [{ from: nodes[k - 1].id, to: nodes[k + 1].id }], pointers: { node: nodes[k].id }, tones: { [nodes[k].id]: "miss", [nodes[k - 1].id]: "active" } }],
      message: `node.prev.next ← node.next: ${name(k - 1)} now points forward past the ${values[at - 1]}, to ${name(k + 1)}.` });
    t.op();
    const a2 = [...a1]; a2[k] = "right"; // next no longer points back to node; node.next still points forward
    t.step({ line: 3, array: [], vars: {}, lists: [{ nodes, arrows: a2, skips: [{ from: nodes[k - 1].id, to: nodes[k + 1].id }, { from: nodes[k + 1].id, to: nodes[k - 1].id }], pointers: { node: nodes[k].id }, tones: { [nodes[k].id]: "miss", [nodes[k + 1].id]: "active" } }],
      message: `node.next.prev ← node.prev: ${name(k + 1)} now points back past it, to ${name(k - 1)}. Nothing points to the ${values[at - 1]} any more.` });
    const kept = nodes.filter((_, j) => j !== k);
    t.step({ line: 3, array: [], vars: {}, done: "found",
      lists: [{ nodes: kept, arrows: kept.slice(1).map(() => "double" as const), tones: Object.fromEntries(kept.filter((x) => !x.kind).map((x) => [x.id, "settled" as Tone])) },
        { label: "removed", nodes: [nodes[k]], arrows: [], tones: { [nodes[k].id]: "discard" } }],
      message: `Done: two pointer changes, O(1), wherever the node is. In a singly linked list you'd first have to walk from the head to find the node before it, which is O(n). And thanks to the sentinels, removing the first or last real node needs no special case.` });
  },
};

/* ---------- An LRU cache ---------- */
export type LruInput = { capacity: number; ops: string };
export const lruExample: LruInput = { capacity: 2, ops: "put 1 10, put 2 20, get 1, put 3 30, get 2, get 3" };
export const lruFields: InputField[] = [
  { key: "capacity", label: "capacity", kind: "number" },
  { key: "ops", label: "operations", kind: "text", hint: "put key value, get key" },
];
type Op = { kind: "get"; key: number } | { kind: "put"; key: number; val: number };
function parse(s: string): Op[] | string {
  const out: Op[] = [];
  for (const part of s.split(",").map((x) => x.trim()).filter(Boolean)) {
    const w = part.split(/\s+/);
    const nums = w.slice(1).map(Number);
    if (nums.some((x) => !Number.isInteger(x))) return `"${part}": keys and values must be whole numbers.`;
    if (w[0] === "get" && nums.length === 1) out.push({ kind: "get", key: nums[0] });
    else if (w[0] === "put" && nums.length === 2) out.push({ kind: "put", key: nums[0], val: nums[1] });
    else return `"${part}" isn't an operation. Use "put key value" or "get key".`;
  }
  return out;
}
export function lruPrepare(raw: LruInput): Prepared<LruInput> {
  if (!Number.isInteger(raw.capacity) || raw.capacity < 1 || raw.capacity > 3) return { error: "Pick a capacity from 1 to 3, so the list fits." };
  const ops = parse(raw.ops);
  if (typeof ops === "string") return { error: ops };
  if (ops.length === 0) return { error: "Give at least one operation." };
  if (ops.length > 8) return { error: "Keep it to at most 8 operations." };
  return { input: raw };
}

const lru: Approach<LruInput> = {
  id: "lru",
  name: "An LRU cache",
  code: `class LRUCache
    constructor(capacity)
        this.cap ← capacity
        this.map ← empty map  // key → node
        this.head ← new Node()  // sentinels
        this.tail ← new Node()
        this.head.next ← this.tail
        this.tail.prev ← this.head
    function get(key)
        if key not in this.map then return -1
        node ← this.map[key]
        this.moveToFront(node)
        return node.val
    function put(key, val)
        if key in this.map
            this.map[key].val ← val
            this.moveToFront(this.map[key])
            return
        node ← new Node(key, val)
        this.map[key] ← node
        this.addFront(node)
        if size of this.map > this.cap
            old ← this.tail.prev  // least recent
            this.unlink(old)
            remove old.key from this.map
    function unlink(node)
        node.prev.next ← node.next
        node.next.prev ← node.prev
    function addFront(node)
        node.prev ← this.head
        node.next ← this.head.next
        this.head.next.prev ← node
        this.head.next ← node
    function moveToFront(node)
        this.unlink(node)
        this.addFront(node)
`,
  run({ capacity, ops: text }, t) {
    const ops = parse(text) as Op[];
    let order: { key: number; val: number }[] = []; // most recent first
    const evicted: { key: number; val: number }[] = [];
    const nid = (k: number) => `k${k}`;
    const draw = (tones: Record<number, Tone> = {}): ListRow[] => {
      const nodes: N[] = [HEAD, ...order.map((e) => ({ id: nid(e.key), val: e.key })), TAIL];
      const rows: ListRow[] = [{ nodes, arrows: nodes.slice(1).map(() => "double" as const), tones: Object.fromEntries(Object.entries(tones).map(([k, tn]) => [nid(Number(k)), tn])) }];
      if (evicted.length) rows.push({ label: "evicted", nodes: evicted.slice(-1).map((e) => ({ id: `${nid(e.key)}-gone`, val: e.key })), arrows: [], tones: { [`${nid(evicted[evicted.length - 1].key)}-gone`]: "discard" } });
      return rows;
    };
    const map = (hl?: number) => ({ title: "map: key → node", entries: [...order].sort((a, b) => a.key - b.key).map((e) => [String(e.key), `node, value ${e.val}`] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    t.step({ line: 8, array: [], lists: draw(), map: map(), vars: { capacity },
      message: `An LRU (least recently used) cache holds at most ${capacity} item${capacity === 1 ? "" : "s"}. When it's full and a new one arrives, it throws out the one used longest ago. The list keeps items in order of use, most recent next to the head sentinel; each node is labelled with its key. The map finds any key's node instantly.` });
    let askedEvict = false;
    for (const op of ops) {
      t.op();
      const idx = order.findIndex((e) => e.key === op.key);
      if (op.kind === "get") {
        if (idx < 0) {
          t.step({ line: 10, array: [], lists: draw(), map: map(), vars: { op: `get(${op.key})`, returned: -1 },
            message: `get(${op.key}): ${op.key} isn't in the map${evicted.some((e) => e.key === op.key) ? " (it was evicted earlier)" : ""}, so return -1.` });
          continue;
        }
        const e = order[idx];
        order = [e, ...order.filter((_, j) => j !== idx)];
        t.step({ line: 12, array: [], lists: draw({ [e.key]: "found" }), map: map(e.key), vars: { op: `get(${op.key})`, returned: e.val },
          message: `get(${op.key}): the map gives its node in O(1). Using it makes it the most recent, so unlink it and add it at the front: two O(1) pointer jobs. Return ${e.val}.` });
        continue;
      }
      if (idx >= 0) {
        order[idx].val = op.val;
        const e = order[idx];
        order = [e, ...order.filter((_, j) => j !== idx)];
        t.step({ line: 17, array: [], lists: draw({ [e.key]: "found" }), map: map(e.key), vars: { op: `put(${op.key}, ${op.val})` },
          message: `put(${op.key}, ${op.val}): ${op.key} is already cached. Update its value to ${op.val} and move it to the front.` });
        continue;
      }
      const full = order.length === capacity;
      const lastKey = full ? order[order.length - 1].key : undefined;
      // Ask once, when there are two different items it could be (capacity ≥ 2).
      const ask = full && capacity > 1 && !askedEvict
        ? (askedEvict = true, { ask: { q: `The cache is full and ${op.key} is new. Which item gets thrown out?`, options: [`${lastKey}: the one next to the tail, used longest ago`, `${order[0].key}: the one next to the head, used most recently`, `${op.key}: the new one`], answer: 0 } }) : {};
      order = [{ key: op.key, val: op.val }, ...order];
      t.step({ ...ask, line: 21, array: [], lists: draw({ [op.key]: "found", ...(full ? { [lastKey!]: "miss" } : {}) }), map: map(op.key), vars: { op: `put(${op.key}, ${op.val})`, size: order.length },
        message: `put(${op.key}, ${op.val}): new key. Make a node, add it to the map, and add it at the front.${full ? ` Now there are ${order.length} items, one more than the capacity.` : ""}` });
      if (full) {
        const old = order.pop()!;
        evicted.push(old);
        t.op();
        t.step({ line: 25, array: [], lists: draw(), map: map(), vars: { op: `put(${op.key}, ${op.val})`, size: order.length },
          message: `Over capacity: the least recently used item is always tail.prev, here key ${old.key}. Unlink it and remove ${old.key} from the map. Both are O(1).` });
      }
    }
    t.step({ line: 1, array: [], lists: draw(Object.fromEntries(order.map((e) => [e.key, "settled" as Tone]))), map: map(), vars: { capacity }, done: "found",
      message: `Every get and put took O(1): the map finds the node, and the doubly linked list can unlink it, add it at the front, or drop the last one, each with a few pointer changes.` });
  },
};

export const unlinkApproaches = { unlink };
export const lruApproaches = { lru };
