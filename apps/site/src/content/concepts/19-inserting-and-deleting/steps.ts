import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; x: number; after: number; del: number };
export const example: Input = { nums: [3, 8, 5, 1], x: 7, after: 8, del: 5 };
export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "x", label: "insert x", kind: "number" },
  { key: "after", label: "after value", kind: "number" },
  { key: "del", label: "delete value", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1) return { error: "Use at least one value." };
  if (raw.nums.length > 6) return { error: "Use at most 6 values so the chain fits with the new node." };
  if (!raw.nums.includes(raw.after)) return { error: `"after value" must be one of the values (it's the node to insert after).` };
  if (!raw.nums.includes(raw.del)) return { error: `"delete value" must be one of the values.` };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const row = (nodes: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [...nodes, END], arrows: nodes.map(() => "right" as const), ...extra });
const alone = (node: N, label: string, tones: Record<string, Tone> = {}): ListRow => ({ label, nodes: [node], arrows: [], tones });
const nodesOf = (nums: number[]): N[] => nums.map((v, i) => ({ id: `n${i}`, val: v }));
const NEW = "new";

const insertHead: Approach<Input> = {
  id: "insert-head",
  name: "Insert at the head",
  code: `function insertHead(head, x)
    added ← new ListNode(x)
    added.next ← head
    return added  // the new head
`,
  run({ nums, x }, t) {
    const ns = nodesOf(nums), fresh: N = { id: NEW, val: x };
    t.step({ line: 2, array: [], lists: [row(ns, { label: "list", pointers: { head: "n0" } }), alone(fresh, "new", { [NEW]: "active" })], vars: { x },
      message: `Make a new node holding ${x}. It isn't part of the list yet: nothing points to it, and it points to nothing.` });
    t.op();
    t.step({ line: 3, array: [], lists: [row([fresh, ...ns], { label: "list", pointers: { head: "n0", added: NEW }, tones: { [NEW]: "active" } })], vars: { x },
      message: `Point ${x}'s next at the current head, ${nums[0]}. Nothing else moves: unlike an array, no item shifts.` });
    t.step({ line: 4, array: [], lists: [row([fresh, ...ns], { label: "list", pointers: { head: NEW }, tones: { [NEW]: "found" } })], vars: { x }, done: "found",
      message: `Return ${x} as the new head. One new node and one pointer change, however long the list is: O(1).` });
  },
};

const insertAfter: Approach<Input> = {
  id: "insert-after",
  name: "Insert after a node: the right order",
  code: `function insertAfter(node, x)
    added ← new ListNode(x)
    added.next ← node.next  // hold on to the rest
    node.next ← added
`,
  run({ nums, x, after }, t) {
    const ns = nodesOf(nums), fresh: N = { id: NEW, val: x };
    const k = nums.indexOf(after), nk = `n${k}`, nextId = k + 1 < nums.length ? `n${k + 1}` : "end";
    const nextName = k + 1 < nums.length ? String(nums[k + 1]) : "none";
    t.step({ line: 2, array: [], lists: [row(ns, { label: "list", pointers: { node: nk }, tones: { [nk]: "active" } }), alone(fresh, "new", { [NEW]: "active" })], vars: { x },
      message: `You're holding node ${after} and want ${x} right after it. First make the new node, ${x}, not linked to anything yet.` });
    const mid = [...ns.slice(0, k + 1), fresh, ...ns.slice(k + 1)];
    const arrowsMid = mid.map((_, i) => (i === k ? null : "right" as const));
    t.op();
    t.step({
      ask: { q: `Two pointers must change: ${after}'s next and ${x}'s next. Which one first?`, options: [`${x}'s next, to point at ${nextName}`, `${after}'s next, to point at ${x}`], answer: 0 },
      line: 3, array: [], lists: [{ ...row(mid, { label: "list", pointers: { node: nk, added: NEW }, tones: { [NEW]: "active", [nextId]: "compare" } }), arrows: arrowsMid, skips: [{ from: nk, to: nextId }] }],
      vars: { x }, message: `Point ${x}'s next at whatever comes after ${after}: that's ${nextName}. For a moment both ${after} and ${x} point at ${nextName}, and the rest of the list is still safely attached.` });
    t.op();
    t.step({ line: 4, array: [], lists: [row(mid, { label: "list", pointers: { node: nk, added: NEW }, tones: { [nk]: "settled", [NEW]: "found" } })], vars: { x }, done: "found",
      message: `Now point ${after}'s next at ${x}. The chain reads ${mid.map((m) => m.val).join(" → ")} → none. Two pointer changes: O(1) once you hold the node. Finding node ${after} in the first place is the O(n) part.` });
  },
};

const insertWrong: Approach<Input> = {
  id: "insert-wrong",
  name: "Insert after a node: the wrong order",
  code: `function insertAfterWrong(node, x)
    added ← new ListNode(x)
    node.next ← added  // too early!
    added.next ← node.next  // node.next is added now
`,
  run({ nums, x, after }, t) {
    const ns = nodesOf(nums), fresh: N = { id: NEW, val: x };
    const k = nums.indexOf(after), nk = `n${k}`, rest = ns.slice(k + 1);
    t.step({ line: 2, array: [], lists: [row(ns, { label: "list", pointers: { node: nk }, tones: { [nk]: "active" } }), alone(fresh, "new", { [NEW]: "active" })], vars: { x },
      message: `Same goal: put ${x} after ${after}. Same first step: make the new node.` });
    t.op();
    const lost: ListRow = rest.length ? { ...row(rest, { label: "lost", tones: Object.fromEntries(rest.map((r) => [r.id, "miss" as Tone])) }) } : { label: "lost", nodes: [], arrows: [] };
    t.step({ line: 3, array: [], lists: [row([...ns.slice(0, k + 1), fresh], { label: "list", pointers: { node: nk, added: NEW }, tones: { [NEW]: "active" } }), lost], vars: { x },
      message: rest.length
        ? `Point ${after}'s next at ${x} first... and now nothing points at ${rest[0].val}. ${rest.length > 2 ? `${rest.slice(0, -1).map((r) => r.val).join(", ")} and ${rest[rest.length - 1].val}` : rest.map((r) => r.val).join(" and ")} ${rest.length === 1 ? "is" : "are"} cut off from the list, and with no pointer to ${rest.length === 1 ? "it" : "them"}, there's no way back.`
        : `${after} was the last node, so nothing gets cut off here. Try a node in the middle to see what goes wrong.` });
    t.op();
    const looped: ListRow = { label: "list", nodes: [...ns.slice(0, k + 1), fresh], arrows: ns.slice(0, k + 1).map(() => "right" as const), pointers: { node: nk, added: NEW }, tones: { [NEW]: "miss" }, skips: [{ from: NEW, to: NEW, tone: "miss" }] };
    t.step({ line: 4, array: [], lists: [looped, lost], vars: { x }, done: "notfound",
      message: `Then ${x}'s next ← ${after}'s next. But ${after}'s next is ${x} now, so ${x} ends up pointing at itself: a loop that never reaches none.${rest.length ? ` And ${rest.map((r) => r.val).join(" and ")} ${rest.length === 1 ? "is" : "are"} gone.` : ""} The fix: always attach the new node to the rest first.` });
  },
};

const remove: Approach<Input> = {
  id: "delete",
  name: "Delete a value",
  code: `function deleteValue(head, v)
    if head.val = v
        return head.next  // the head itself goes
    prev ← head
    while prev.next ≠ none and prev.next.val ≠ v
        prev ← prev.next
    if prev.next ≠ none
        prev.next ← prev.next.next  // step over it
    return head
`,
  run({ nums, del }, t) {
    const ns = nodesOf(nums), n = nums.length;
    t.op();
    if (nums[0] === del) {
      t.step({ line: 2, array: [], lists: [row(ns, { pointers: { head: "n0" }, tones: { n0: "found" } })], vars: { v: del },
        message: `The head itself holds ${del}. Deleting the head is a special case: there's no node before it to rewire.` });
      t.step({ line: 3, array: [], lists: [row(ns.slice(1), { pointers: { head: ns[1]?.id ?? "end" } }), alone(ns[0], "removed", { n0: "discard" })], vars: { v: del }, done: "found",
        message: `Just return head.next as the new head: ${nums[1] ?? "none"}. ${del} drops off the front. O(1).` });
      return;
    }
    t.step({ line: 4, array: [], lists: [row(ns, { pointers: { head: "n0", prev: "n0" }, tones: { n0: "compare" } })], vars: { v: del },
      message: `${nums[0]} isn't ${del}. To unlink a node you need the one before it, so walk with prev and always look one node ahead, at prev.next.` });
    let p = 0;
    while (p + 1 < n && nums[p + 1] !== del) {
      t.op();
      t.step({ line: 6, array: [], lists: [row(ns, { pointers: { head: "n0", prev: `n${p + 1}` }, tones: { [`n${p + 1}`]: "compare" } })], vars: { v: del },
        message: `prev.next is ${nums[p + 1]}, not ${del}: move prev forward.` });
      p++;
    }
    const target = `n${p + 1}`, after = p + 2 < n ? `n${p + 2}` : "end";
    t.op();
    t.step({
      ask: { q: `prev is on ${nums[p]}, and prev.next holds ${del}. What does prev.next ← prev.next.next do?`, options: [`Point ${nums[p]} straight at ${p + 2 < n ? nums[p + 2] : "none"}, skipping ${del}`, `Delete ${nums[p]}`, `Move prev forward`], answer: 0 },
      line: 8, array: [], lists: [{ ...row(ns, { pointers: { head: "n0", prev: `n${p}` }, tones: { [`n${p}`]: "active", [target]: "miss" } }), arrows: ns.map((_, i) => (i === p ? null : "right" as const)), skips: [{ from: `n${p}`, to: after }] }],
      vars: { v: del }, message: `prev.next holds ${del}. Point ${nums[p]}'s next past it, straight at ${p + 2 < n ? nums[p + 2] : "none"}. ${del} still points onward, but nothing points at ${del} any more.` });
    const kept = ns.filter((x) => x.id !== target);
    t.step({ line: 9, array: [], lists: [row(kept, { pointers: { head: "n0" } }), alone(ns[p + 1], "removed", { [target]: "discard" })], vars: { v: del }, done: "found",
      message: `${del} is out of the chain: ${kept.map((x) => x.val).join(" → ")} → none. The unlink itself is O(1); walking to find the node before it was O(n).` });
  },
};

export const approaches = { insertHead, insertAfter, insertWrong, remove };
