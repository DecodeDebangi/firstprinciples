import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; v: number };
export const example: Input = { nums: [6, 6, 2, 6, 3], v: 6 };
export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "v", label: "remove every", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1) return { error: "Use at least one value." };
  if (raw.nums.length > 6) return { error: "Use at most 6 values so the chain fits." };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const DUMMY: N = { id: "dummy", val: "dummy", kind: "dummy" };
const row = (nodes: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [...nodes, END], arrows: nodes.map(() => "right" as const), ...extra });
const nodesOf = (nums: number[]): N[] => nums.map((v, i) => ({ id: `n${i}`, val: v }));
const idOrEnd = (n?: N) => n?.id ?? "end";

/** One unlink drawn in two steps: the arc that skips the node, then the chain without it. */
function unlink(t: Parameters<Approach<Input>["run"]>[1], live: N[], at: number, line: number, ptrs: Record<string, string>, lead: string, v: number) {
  const prev = live[at - 1], gone = live[at];
  t.step({ line, array: [], lists: [{ ...row(live, { pointers: ptrs, tones: { [prev.id]: "active", [gone.id]: "miss" } }), arrows: live.map((_, i) => (i === at - 1 ? null : "right" as const)), skips: [{ from: prev.id, to: idOrEnd(live[at + 1]) }] }],
    vars: { v }, message: `${lead}${gone.val} = ${v}: point ${prev.kind === "dummy" ? "dummy" : prev.val}'s next past it, to ${live[at + 1] ? `the node after it (${live[at + 1].val})` : "none"}.` });
  live.splice(at, 1);
}

const noDummy: Approach<Input> = {
  id: "no-dummy",
  name: "Without a dummy: the head is a special case",
  code: `function removeAll(head, v)
    while head ≠ none and head.val = v
        head ← head.next  // special case: the head
    curr ← head
    while curr ≠ none and curr.next ≠ none
        if curr.next.val = v
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return head
`,
  run({ nums, v }, t) {
    const live = nodesOf(nums);
    t.step({ line: 2, array: [], lists: [row(live, { pointers: { head: idOrEnd(live[0]) } })], vars: { v },
      message: `Remove every ${v}. To unlink a node you rewire the node before it, but the head has no node before it. So the head needs its own loop first.` });
    while (live.length && live[0].val === v) {
      t.op();
      const gone = live.shift()!;
      t.step({ line: 3, array: [], lists: [row(live, { pointers: { head: idOrEnd(live[0]) } }), { label: "removed", nodes: [gone], arrows: [], tones: { [gone.id]: "discard" } }], vars: { v },
        message: `The head is ${v}: move head on to ${live[0]?.val ?? "none"}. This is the special case.` });
    }
    if (!live.length) {
      t.step({ line: 10, array: [], lists: [row([], { pointers: {} })], vars: { v }, done: "found", message: `Every node was ${v}: the list is now empty.` });
      return;
    }
    let c = 0;
    t.step({ line: 4, array: [], lists: [row(live, { pointers: { head: live[0].id, curr: live[0].id } })], vars: { v },
      message: `The head is safe now. Second loop: curr looks one node ahead, at curr.next.` });
    while (c < live.length - 1) {
      t.op();
      if (live[c + 1].val === v) {
        unlink(t, live, c + 1, 7, { head: live[0].id, curr: live[c].id }, "", v);
      } else {
        c++;
        t.step({ line: 9, array: [], lists: [row(live, { pointers: { head: live[0].id, curr: live[c].id }, tones: { [live[c].id]: "compare" } })], vars: { v },
          message: `${live[c].val} ≠ ${v}: move curr forward.` });
      }
    }
    t.step({ line: 10, array: [], lists: [row(live, { pointers: { head: live[0].id }, tones: Object.fromEntries(live.map((x) => [x.id, "settled" as Tone])) })], vars: { v }, done: "found",
      message: `Done: ${live.map((x) => x.val).join(" → ")} → none. It works, but it took two loops that do the same job, because the head was different.` });
  },
};

const withDummy: Approach<Input> = {
  id: "with-dummy",
  name: "With a dummy: one loop for everything",
  code: `function removeAll(head, v)
    dummy ← new ListNode(0)
    dummy.next ← head
    curr ← dummy
    while curr.next ≠ none
        if curr.next.val = v
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return dummy.next
`,
  run({ nums, v }, t) {
    const live = [DUMMY, ...nodesOf(nums)];
    t.step({ line: 3, array: [], lists: [row(live, { pointers: { dummy: "dummy", head: live[1].id }, tones: { dummy: "active" } })], vars: { v },
      message: `Put a fake node, the dummy, in front of the head. Its value never matters. Now every real node, the head included, has a node before it.` });
    let c = 0;
    t.step({ line: 4, array: [], lists: [row(live, { pointers: { dummy: "dummy", curr: "dummy" } })], vars: { v },
      message: `curr starts on the dummy and looks one node ahead, exactly like before. There's no special case to handle first.` });
    while (c < live.length - 1) {
      t.op();
      if (live[c + 1].val === v) {
        unlink(t, live, c + 1, 7, { dummy: "dummy", curr: live[c].id }, c === 0 ? "The head itself, handled like any other node: " : "", v);
      } else {
        c++;
        t.step({ line: 9, array: [], lists: [row(live, { pointers: { dummy: "dummy", curr: live[c].id }, tones: { [live[c].id]: "compare" } })], vars: { v },
          message: `${live[c].val} ≠ ${v}: move curr forward.` });
      }
    }
    const real = live.slice(1);
    t.step({ line: 10, array: [], lists: [row(live, { pointers: { dummy: "dummy", "dummy.next": idOrEnd(real[0]) }, tones: Object.fromEntries(real.map((x) => [x.id, "settled" as Tone])) })], vars: { v }, done: "found",
      message: `Return dummy.next, the real head: ${real.length ? real.map((x) => x.val).join(" → ") + " → none" : "none (the list is empty)"}. One loop, no special case, and it works even when the head is removed.` });
  },
};

export const approaches = { noDummy, withDummy };
