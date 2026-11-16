import { type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { values: number[]; val: number };
type P = Input;
export const example: Input = { values: [5, 5, 1, 5, 8, 5], val: 5 };
export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "val", label: "remove every", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  return { input: raw, ...(raw.values.length === 0 ? { note: "An empty list: there's nothing to remove." } : {}) };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
type T = Parameters<Approach<P>["run"]>[1];
const END: N = { id: "end", val: "none", kind: "null" };
const DUMMY: N = { id: "dummy", val: "dummy", kind: "dummy" };
const row = (nodes: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [...nodes, END], arrows: nodes.map(() => "right" as const), ...extra });
const nodesOf = (values: number[]): N[] => values.map((v, i) => ({ id: `n${i}`, val: v }));
const idOrEnd = (n?: N) => n?.id ?? "end";
const chain = (nodes: N[]) => (nodes.length ? nodes.map((x) => x.val).join(" → ") + " → none" : "none (the list is empty)");

/** One unlink in two parts: the arc that skips the node, then the chain without it. */
function unlink(t: T, live: N[], at: number, line: number, ptrs: Record<string, string>, lead: string, val: number, extra: object = {}) {
  const prev = live[at - 1], gone = live[at];
  t.step({ ...extra, line, array: [], vars: { val }, lists: [{ ...row(live, { pointers: ptrs, tones: { [prev.id]: "active", [gone.id]: "miss" } }), arrows: live.map((_, i) => (i === at - 1 ? null : "right" as const)), skips: [{ from: prev.id, to: idOrEnd(live[at + 1]) }] }],
    message: `${lead}curr.next holds ${gone.val} = ${val}: point ${prev.kind === "dummy" ? "the dummy" : `the ${prev.val}`}'s next past it, to ${live[at + 1] ? `the ${live[at + 1].val}` : "none"}. Don't move curr: the node that slid in hasn't been checked.` });
  live.splice(at, 1);
}

const copy: Approach<P> = {
  id: "copy",
  name: "Copy what you keep into a new list",
  code: `function removeElements(head, val)
    newHead ← none
    tail ← none
    curr ← head
    while curr ≠ none
        if curr.val ≠ val
            node ← new ListNode(curr.val)
            if newHead = none then newHead ← node
            else tail.next ← node
            tail ← node
        curr ← curr.next
    return newHead
`,
  run({ values, val }, t) {
    const old = nodesOf(values);
    const built: N[] = [];
    const view = (curr: number, tones: Record<string, Tone> = {}): ListRow[] => [
      row(old, { label: "old", pointers: { curr: idOrEnd(old[curr]) }, tones }),
      row(built, { label: "new", pointers: built.length ? { newHead: built[0].id, tail: built[built.length - 1].id } : {} }),
    ];
    t.step({ line: 4, array: [], lists: view(0), vars: { val },
      message: `Walk the old list and copy every value that isn't ${val} into a brand-new list. tail remembers the new list's last node, so each copy can be attached after it.` });
    for (let i = 0; i < old.length; i++) {
      t.op();
      const x = old[i];
      if (x.val === val) {
        t.step({ line: 6, array: [], lists: view(i, { [x.id]: "miss" }), vars: { val }, message: `${x.val} = ${val}: skip it, don't copy.` });
      } else {
        const first = built.length === 0;
        built.push({ id: `c${i}`, val: x.val });
        t.step({ line: first ? 8 : 9, array: [], lists: view(i, { [x.id]: "found" }), vars: { val },
          message: first ? `${x.val} ≠ ${val}: copy it. The new list is empty, so this copy becomes newHead. That's a special case: there's no tail to attach it to yet.`
            : `${x.val} ≠ ${val}: copy it and attach it after tail.` });
      }
    }
    t.step({ line: 12, array: [], lists: view(old.length), vars: { val }, done: "found",
      message: `Return newHead: ${chain(built)}. One pass, O(n) time, but it made ${built.length} new node${built.length === 1 ? "" : "s"}: O(n) extra space, when the old nodes could simply be unlinked.` });
  },
};

const twoLoops: Approach<P> = {
  id: "no-dummy",
  name: "Unlink in place, head first",
  code: `function removeElements(head, val)
    while head ≠ none and head.val = val
        head ← head.next  // special case: the head
    curr ← head
    while curr ≠ none and curr.next ≠ none
        if curr.next.val = val
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return head
`,
  run({ values, val }, t) {
    const live = nodesOf(values);
    t.step({ line: 2, array: [], lists: [row(live, { pointers: { head: idOrEnd(live[0]) } })], vars: { val },
      message: `Unlink the ${val}s from the list itself. Unlinking a node means rewiring the node before it, and the head has nothing before it. So first, move head past any ${val}s at the front.` });
    while (live.length && live[0].val === val) {
      t.op();
      const gone = live.shift()!;
      t.step({ line: 3, array: [], lists: [row(live, { pointers: { head: idOrEnd(live[0]) } }), { label: "removed", nodes: [gone], arrows: [], tones: { [gone.id]: "discard" } }], vars: { val },
        message: `The head holds ${val}: move head on to ${live[0] ? `the ${live[0].val}` : "none"}.` });
    }
    if (!live.length) {
      t.step({ line: 10, array: [], lists: [row([])], vars: { val }, done: "found", message: `Every node held ${val}, so the list is now empty: return none.` });
      return;
    }
    t.op();
    t.step({ line: 4, array: [], lists: [row(live, { pointers: { head: live[0].id, curr: live[0].id }, tones: { [live[0].id]: "settled" } })], vars: { val },
      message: `The head is now ${live[0].val}, which stays. Second loop: curr looks one node ahead, at curr.next, so it's always standing on the node before the one it might remove.` });
    let c = 0;
    while (c < live.length - 1) {
      t.op();
      if (live[c + 1].val === val) unlink(t, live, c + 1, 7, { head: live[0].id, curr: live[c].id }, "", val);
      else {
        c++;
        t.step({ line: 9, array: [], lists: [row(live, { pointers: { head: live[0].id, curr: live[c].id }, tones: { [live[c].id]: "compare" } })], vars: { val },
          message: `curr.next holds ${live[c].val} ≠ ${val}: keep it, and move curr forward.` });
      }
    }
    t.step({ line: 10, array: [], lists: [row(live, { pointers: { head: live[0].id }, tones: Object.fromEntries(live.map((x) => [x.id, "settled" as Tone])) })], vars: { val }, done: "found",
      message: `Return head: ${chain(live)}. O(n) time and O(1) space, but two loops doing the same job, only because the head is different.` });
  },
};

const dummy: Approach<P> = {
  id: "dummy",
  name: "Unlink in place with a dummy head (optimal)",
  code: `function removeElements(head, val)
    dummy ← new ListNode(0)
    dummy.next ← head
    curr ← dummy
    while curr.next ≠ none
        if curr.next.val = val
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return dummy.next
`,
  run({ values, val }, t) {
    const live = [DUMMY, ...nodesOf(values)];
    t.step({ line: 4, array: [], lists: [row(live, { pointers: { dummy: "dummy", curr: "dummy" }, tones: { dummy: "active" } })], vars: { val },
      message: `Put a fake node, the dummy, in front of the head. Now every real node, the head included, has a node before it, so one loop handles them all. curr starts on the dummy.` });
    let c = 0, asked = false;
    while (c < live.length - 1) {
      t.op();
      const next = live[c + 1];
      const ask = !asked && c > 0 && next.val === val && live[c].val !== val ? (asked = true, { ask: { q: `curr is on the ${live[c].val} and curr.next holds ${val}. What happens?`, options: ["Unlink curr.next and stay on the " + live[c].val, "Unlink curr.next and move curr forward", "Move curr forward and unlink later"], answer: 0 } }) : {};
      if (next.val === val) {
        unlink(t, live, c + 1, 7, { dummy: "dummy", curr: live[c].id }, c === 0 ? "The head itself, handled like any other node: " : "", val, ask);
      } else {
        c++;
        t.step({ line: 9, array: [], lists: [row(live, { pointers: { dummy: "dummy", curr: live[c].id }, tones: { [live[c].id]: "compare" } })], vars: { val },
          message: `curr.next holds ${live[c].val} ≠ ${val}: keep it, and move curr forward.` });
      }
    }
    const real = live.slice(1);
    t.step({ line: 10, array: [], lists: [row(live, { pointers: { dummy: "dummy", "dummy.next": idOrEnd(real[0]) }, tones: Object.fromEntries(real.map((x) => [x.id, "settled" as Tone])) })], vars: { val }, done: "found",
      message: `Return dummy.next, the real head: ${chain(real)}. One loop, O(n) time, O(1) space, and removing the head needed no special code.` });
  },
};

export const approaches = { copy, twoLoops, dummy };
