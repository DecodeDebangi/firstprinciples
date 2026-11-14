import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { head: number[] };

export const example: Input = { head: [1, 2, 3, 4, 5] };

export const fields: InputField[] = [{ key: "head", label: "head (values)", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.head.length > 8) return { error: "Use at most 8 values so the list fits." };
  return { input: raw };
}

const NONE_L = "noneL", NONE_R = "noneR";
const nid = (i: number) => `n${i}`;

/**
 * One row: None | n0 … n(k-1) | None. `next` maps each node id to the id it points at
 * (NONE_L / NONE_R for None, null for "not set yet"); arrows are derived from it.
 */
function row(vals: number[], next: Record<string, string | null>, pointers: Record<string, string | null>, tones: Record<string, Tone> = {}): ListRow {
  const ids = [NONE_L, ...vals.map((_, i) => nid(i)), NONE_R];
  const nodes = ids.map((id) => (id === NONE_L || id === NONE_R ? { id, val: "none", kind: "null" as const } : { id, val: vals[Number(id.slice(1))] }));
  const arrows = ids.slice(0, -1).map((a, k) => {
    const b = ids[k + 1];
    const fwd = next[a] === b, back = next[b] === a;
    return fwd && back ? "both" : fwd ? "right" : back ? "left" : null;
  });
  const pointed = new Set(Object.values(next));
  const t: Record<string, Tone> = { ...tones };
  for (const id of [NONE_L, NONE_R]) if (!pointed.has(id) && !Object.values(pointers).includes(id)) t[id] = t[id] ?? "discard";
  return { nodes, arrows, pointers, tones: t };
}
const original = (vals: number[]) => Object.fromEntries(vals.map((_, i) => [nid(i), i + 1 < vals.length ? nid(i + 1) : NONE_R])) as Record<string, string | null>;

const copyRebuild: Approach<Input> = {
  id: "copy",
  name: "Copy the values, rebuild backwards",
  code: `function reverseList(head)
  vals ← empty list
  while head ≠ none
    vals.push(head.val)
    head ← head.next
  dummy ← new ListNode(), tail ← dummy
  for each v in vals, last to first
    tail.next ← new ListNode(v)
    tail ← tail.next
  return dummy.next
`,
  run({ head: vals }, t) {
    const next = original(vals);
    const copied: string[] = [];
    t.step({ line: 2, array: [], lists: [{ label: "head", ...row(vals, next, { head: vals.length ? nid(0) : NONE_R }) }], stack: [], stackTitle: "vals",
      vars: { copied: 0 }, message: "The obvious way: read every value into a plain list, then build a brand-new linked list from it, back to front." });
    for (let i = 0; i < vals.length; i++) {
      t.op();
      copied.push(String(vals[i]));
      t.step({ line: 4, array: [], lists: [{ label: "head", ...row(vals, next, { head: nid(i) }, { [nid(i)]: "compare" }) }], stack: [...copied], stackTitle: "vals",
        vars: { copied: copied.length }, message: `Copy ${vals[i]} into vals and move to the next node.` });
    }
    const built: number[] = [];
    const out = (tones: Record<string, Tone> = {}): ListRow => {
      const ids = ["dummy", ...built.map((_, k) => `m${k}`)];
      return { label: "new", nodes: ids.map((id, k) => (k === 0 ? { id, val: "dummy", kind: "dummy" as const } : { id, val: built[k - 1] })),
        arrows: ids.slice(0, -1).map(() => "right" as const), pointers: { tail: ids[ids.length - 1] }, tones };
    };
    t.step({ line: 6, array: [], lists: [{ label: "head", ...row(vals, next, {}) }, out()], stack: [...copied], stackTitle: "vals", vars: { copied: copied.length },
      message: `All ${vals.length} values copied. Now build new nodes from the end of vals.` });
    for (let k = vals.length - 1; k >= 0; k--) {
      t.op();
      built.push(vals[k]);
      t.step({ line: 8, array: [], lists: [{ label: "head", ...row(vals, next, {}) }, out({ [`m${built.length - 1}`]: "active" })], stack: [...copied], stackTitle: "vals",
        vars: { copied: copied.length }, message: `Create a new node ${vals[k]} and hang it off tail.` });
    }
    t.step({ line: 10, array: [], lists: [{ label: "head", ...row(vals, next, {}) }, out(Object.fromEntries(built.map((_, k) => [`m${k}`, "settled" as const])))],
      stack: [...copied], stackTitle: "vals", vars: { copied: copied.length }, done: "found",
      message: `Reversed, but with ${vals.length} copied values and ${vals.length} new nodes: O(n) extra memory the problem didn't need.` });
  },
};

const iterative: Approach<Input> = {
  id: "iterative",
  name: "Three pointers, in place",
  code: `function reverseList(head)
  prev, curr ← none, head
  while curr ≠ none
    nxt ← curr.next
    curr.next ← prev
    prev ← curr
    curr ← nxt
  return prev
`,
  run({ head: vals }, t) {
    const next = original(vals);
    let prev = NONE_L, curr: string = vals.length ? nid(0) : NONE_R;
    const done = new Set<string>();
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...done].map((d) => [d, "settled" as const])), ...extra });
    t.step({ line: 2, array: [], lists: [row(vals, next, { prev, curr })], vars: { prev: "none", curr: vals[0] ?? "none" },
      message: "Walk the list once and turn each arrow around as you pass it. prev trails one node behind curr." });
    while (curr !== NONE_R) {
      const c = curr;
      const nxt = next[c]!;
      const val = vals[Number(c.slice(1))];
      t.step({ line: 4, array: [], lists: [row(vals, next, { prev, curr: c, nxt }, tones({ [c]: "active" }))],
        vars: { prev: prev === NONE_L ? "none" : vals[Number(prev.slice(1))], curr: val, nxt: nxt === NONE_R ? "none" : vals[Number(nxt.slice(1))] },
        message: `Save nxt first: once ${val}'s arrow turns around, the rest of the list is unreachable without it.` });
      t.op();
      next[c] = prev;
      done.add(c);
      t.step({ ask: { q: `curr.next = prev is next. Which way will ${val}'s arrow point?`, options: ["Back, to prev", "Forward, to nxt"], answer: 0 },
        line: 5, array: [], lists: [row(vals, next, { prev, curr: c, nxt }, tones({ [c]: "compare" }))],
        vars: { prev: prev === NONE_L ? "none" : vals[Number(prev.slice(1))], curr: val, nxt: nxt === NONE_R ? "none" : vals[Number(nxt.slice(1))] },
        message: `Point ${val} back at ${prev === NONE_L ? "none" : vals[Number(prev.slice(1))]}. One arrow flipped.` });
      prev = c;
      curr = nxt;
      t.step({ line: 7, array: [], lists: [row(vals, next, { prev, curr }, tones())],
        vars: { prev: val, curr: curr === NONE_R ? "none" : vals[Number(curr.slice(1))] },
        message: curr === NONE_R ? "curr ran off the end: every arrow has been turned." : "Step forward: prev and curr each move one node right." });
    }
    t.step({ line: 8, array: [], lists: [row(vals, next, { "new head": prev }, tones({ [prev]: "found" }))], vars: { prev: prev === NONE_L ? "none" : vals[Number(prev.slice(1))] },
      done: "found", message: `Return prev: ${prev === NONE_L ? "none" : vals[Number(prev.slice(1))]} is the new head. One pass, three pointers, no extra memory.` });
  },
};

const recursive: Approach<Input> = {
  id: "recursive",
  name: "Recursive",
  code: `function reverseList(head)
  if head = none or head.next = none
    return head
  newHead ← reverseList(head.next)
  head.next.next ← head
  head.next ← none
  return newHead
`,
  run({ head: vals }, t) {
    const next = original(vals);
    const stack: string[] = [];
    const v = (id: string) => vals[Number(id.slice(1))];
    if (!vals.length) {
      t.step({ line: 3, array: [], lists: [row(vals, next, {})], stack: [], done: "found", message: "An empty list is already reversed." });
      return;
    }
    const go = (i: number): string => {
      const id = nid(i);
      stack.push(`reverse(${v(id)})`);
      t.op();
      if (i === vals.length - 1) {
        t.step({ line: 3, array: [], lists: [row(vals, next, { head: id }, { [id]: "found" })], stack: [...stack], vars: { head: v(id) },
          message: `${v(id)} is the last node: the base case. It becomes the new head, and the calls start returning.` });
        stack.pop();
        return id;
      }
      t.step({ line: 4, array: [], lists: [row(vals, next, { head: id }, { [id]: "active" })], stack: [...stack], vars: { head: v(id) },
        message: `First reverse everything after ${v(id)}. This call waits on the stack.` });
      const newHead = go(i + 1);
      const nx = nid(i + 1);
      next[nx] = id;
      t.step({ ask: { q: `Back in reverse(${v(id)}). head.next.next ← head is next. What does it make?`, options: [`${v(nx)} point back at ${v(id)}`, `${v(id)} point at none`], answer: 0 },
        line: 5, array: [], lists: [row(vals, next, { head: id, "new head": newHead }, { [id]: "compare", [nx]: "compare" })], stack: [...stack], vars: { head: v(id) },
        message: `Make ${v(nx)} point back at ${v(id)}. For a moment the two point at each other.` });
      next[id] = i === 0 ? NONE_L : null;
      t.step({ line: 6, array: [], lists: [row(vals, next, { head: id, "new head": newHead }, { [id]: "settled" })], stack: [...stack], vars: { head: v(id) },
        message: `Cut ${v(id)}'s old forward arrow. ${i === 0 ? "It's the new tail, pointing at none." : "The caller will point it back at the node before it."}` });
      stack.pop();
      return newHead;
    };
    t.step({ line: 2, array: [], lists: [row(vals, next, { head: nid(0) })], stack: [], vars: { head: vals[0] },
      message: "Reverse the rest of the list first, then fix the one arrow between head and the node after it." });
    const h = go(0);
    t.step({ line: 7, array: [], lists: [row(vals, next, { "new head": h }, { [h]: "found" })], stack: [], vars: { head: v(h) }, done: "found",
      message: `Returned ${v(h)} as the new head. Same arrows as the loop, but the call stack held ${vals.length} frames at its deepest.` });
  },
};

export const approaches = { copy: copyRebuild, iterative, recursive };

const worstCase = (n: number): Input => ({ head: Array.from({ length: n }, (_, i) => i) });

export const growth = measureGrowth(
  [
    { approach: copyRebuild, slot: 1 },
    { approach: iterative, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
