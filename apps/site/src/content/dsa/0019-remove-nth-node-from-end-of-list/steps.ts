import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { values: number[]; n: number };
type P = Input;
export const example: Input = { values: [7, 3, 9, 4, 2], n: 2 };

export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "n", label: "remove the nth from the end, n =", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const L = raw.values.length;
  if (L === 0) return { error: "Give the list at least one value." };
  if (L > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > L) return { error: `n must be a whole number from 1 to ${L} (the list's length).` };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const DUMMY: N = { id: "dummy", val: "dummy", kind: "dummy" };
type T = Parameters<Approach<P>["run"]>[1];

/** Positions in `live`: 0 is the dummy, then the real nodes, then END (index live.length). */
function setup({ values }: P) {
  const live: N[] = [DUMMY, ...values.map((v, i) => ({ id: `n${i}`, val: v }))];
  const all = [...live, END];
  const dup = (v: number | string) => values.filter((x) => x === v).length > 1;
  const name = (i: number) => { const x = all[i]; return x.kind === "dummy" ? "the dummy" : x.kind === "null" ? "none" : dup(x.val) ? `the ${x.val} (node ${i})` : `the ${x.val}`; };
  const row = (pointers: Record<string, number>, tones: Record<number, Tone> = {}, extra: Partial<ListRow> = {}): ListRow => ({
    nodes: extra.nodes ?? all, arrows: (extra.nodes ?? all).slice(1).map(() => "right" as const),
    pointers: Object.fromEntries(Object.entries(pointers).map(([k, i]) => [k, all[i].id])),
    tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [all[Number(i)].id, t])), ...extra,
  });
  return { live, all, name, row };
}

/** Draw the unlink (arc past the target), then the shorter list. */
function unlink(t: T, s: ReturnType<typeof setup>, prev: number, ptr: string, line: number, endLine: number, input: P, vars: Record<string, number>) {
  const target = prev + 1;
  t.step({ line, array: [], vars, lists: [{ ...s.row({ [ptr]: prev }, { [prev]: "active", [target]: "miss" }), arrows: s.live.map((_, i) => (i === prev ? null : "right" as const)), skips: [{ from: s.all[prev].id, to: s.all[target + 1].id }] }],
    message: `${ptr}.next is ${s.name(target)}, the ${ord(input.n)} node from the end. Point ${prev === 0 ? "the dummy" : `${s.name(prev)}`}'s next past it, to ${s.name(target + 1)}.` });
  const kept = s.live.filter((_, i) => i !== target);
  const nodes = [...kept, END];
  t.step({ line: endLine, array: [], vars, done: "found",
    lists: [{ nodes, arrows: kept.map(() => "right" as const), pointers: { dummy: "dummy", "dummy.next": nodes[1].id }, tones: Object.fromEntries(kept.slice(1).map((x) => [x.id, "settled" as Tone])) },
      { label: "removed", nodes: [s.all[target]], arrows: [], tones: { [s.all[target].id]: "discard" } }],
    message: `Return dummy.next: ${kept.length > 1 ? kept.slice(1).map((x) => x.val).join(" → ") + " → none" : "none, the list is now empty"}.${target === 1 ? " The head itself was removed, and the dummy handled it like any other node." : ""}` });
}
const ord = (k: number) => (k === 1 ? "1st" : k === 2 ? "2nd" : k === 3 ? "3rd" : `${k}th`);

const twoPass: Approach<P> = {
  id: "two-pass",
  name: "Count the length, then walk",
  code: `function removeNthFromEnd(head, n)
    length ← 0
    curr ← head
    while curr ≠ none
        length += 1
        curr ← curr.next
    dummy ← new ListNode(0)
    dummy.next ← head
    prev ← dummy
    repeat length - n times
        prev ← prev.next
    prev.next ← prev.next.next
    return dummy.next
`,
  run(input, t) {
    const s = setup(input);
    const L = input.values.length;
    let length = 0, curr = 1;
    const noDummy = { nodes: s.all.slice(1) };
    t.step({ line: 3, array: [], lists: [s.row({ curr }, {}, noDummy)], vars: { length },
      message: `"${ord(input.n)} from the end" is hard to find walking forwards, because you don't know where the end is yet. So first walk the whole list and count it.` });
    while (curr <= L) {
      t.op(); length++; curr++;
      t.step({ line: 6, array: [], lists: [s.row({ curr }, curr <= L ? { [curr]: "active" } : {}, noDummy)], vars: { length },
        message: curr <= L ? `Count ${s.name(curr - 1)}: length is ${length}. Move on to ${s.name(curr)}.` : `Count ${s.name(curr - 1)}: length is ${length}, and curr is now none. The list has ${length} nodes.` });
    }
    const k = length - input.n;
    let prev = 0;
    t.step({ ask: { q: `length is ${length} and n is ${input.n}. How many steps from the dummy to the node just before the one to remove?`, options: [`${k} (length − n)`, `${input.n} (n)`, `${k + 1} (length − n + 1)`].filter((o, i, a) => a.findIndex((x) => x.split(" ")[0] === o.split(" ")[0]) === i), answer: 0 },
      line: 9, array: [], lists: [s.row({ prev }, { 0: "active" })], vars: { length, n: input.n },
      message: `The ${ord(input.n)} from the end is node ${k + 1} from the front. To unlink it you stand on the node before it, ${k} step${k === 1 ? "" : "s"} from the dummy. Start prev on the dummy, so that even removing the head works the same way.` });
    for (let i = 0; i < k; i++) {
      t.op(); prev++;
      t.step({ line: 11, array: [], lists: [s.row({ prev }, { [prev]: "active" })], vars: { length, steps: i + 1 },
        message: `Step ${i + 1} of ${k}: prev moves to ${s.name(prev)}.` });
    }
    t.op();
    unlink(t, s, prev, "prev", 12, 13, input, { length });
  },
};

const gap: Approach<P> = {
  id: "gap",
  name: "Two pointers n apart, one pass (optimal)",
  code: `function removeNthFromEnd(head, n)
    dummy ← new ListNode(0)
    dummy.next ← head
    fast, slow ← dummy, dummy
    repeat n + 1 times
        fast ← fast.next
    while fast ≠ none
        fast ← fast.next
        slow ← slow.next
    slow.next ← slow.next.next
    return dummy.next
`,
  run(input, t) {
    const s = setup(input);
    const L = input.values.length, endAt = L + 1;
    let fast = 0, slow = 0;
    t.step({ line: 4, array: [], lists: [s.row({ slow, fast })], vars: { n: input.n },
      message: `Two pointers on the dummy. Give fast a head start of n + 1 = ${input.n + 1} nodes, then move both together. When fast falls off the end, slow is exactly where we need it: just before the ${ord(input.n)} node from the end.` });
    for (let i = 0; i < input.n + 1; i++) {
      t.op(); fast++;
      t.step({ line: 6, array: [], lists: [s.row({ slow, fast }, fast < endAt ? { [fast]: "active" } : {})], vars: { gap: fast - slow },
        message: `Head start ${i + 1} of ${input.n + 1}: fast moves to ${s.name(fast)}.${i === input.n ? ` Now there are ${input.n + 1} steps between slow and fast.` : ""}` });
    }
    while (fast < endAt) {
      t.op(); fast++; slow++;
      const last = fast === endAt;
      t.step({ line: 9, array: [], lists: [s.row({ slow, fast }, { [slow]: "active", ...(last ? {} : { [fast]: "active" }) })], vars: { gap: fast - slow },
        message: last ? `fast reached none. slow is still ${input.n + 1} steps behind it, so slow is on the node just before the ${ord(input.n)} from the end.`
          : `Both move: slow to ${s.name(slow)}, fast to ${s.name(fast)}. The gap stays ${input.n + 1}.` });
    }
    const q = { ask: { q: "fast is none. Which node is slow.next?", options: [`The ${ord(input.n)} node from the end: the one to remove`, "The last node", "none"], answer: 0 } };
    t.op();
    const target = slow + 1;
    t.step({ ...q, line: 10, array: [], lists: [s.row({ slow }, { [slow]: "active", [target]: "compare" })], vars: { gap: fast - slow },
      message: `slow.next is ${s.name(target)}. Count back from the end: ${input.values.slice(target - 1).reverse().join(", ")}. It's the ${ord(input.n)}, the one to remove.` });
    unlink(t, s, slow, "slow", 10, 11, input, { gap: fast - slow });
  },
};

export const approaches = { twoPass, gap };
