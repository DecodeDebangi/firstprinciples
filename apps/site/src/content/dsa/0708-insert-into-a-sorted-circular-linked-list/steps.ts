import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

/** The ring's values in order, starting from the node we're given (which needn't be the smallest). */
export type Input = { values: number[]; x: number };
type P = Input;
export const example: Input = { values: [5, 7, 1, 3], x: 4 };
export const fields: InputField[] = [
  { key: "values", label: "ring, from the given node", kind: "numbers" },
  { key: "x", label: "insert", kind: "number" },
];
const drops = (v: number[]) => v.filter((a, i) => a > v[(i + 1) % v.length]).length;
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length > 6) return { error: "Keep the ring to at most 6 nodes so it fits." };
  if (raw.values.length > 1 && drops(raw.values) > 1) return { error: "Going round the ring, the values must rise to the largest, drop once to the smallest, and rise again: like 5, 7, 1, 3." };
  return { input: raw, ...(raw.values.length === 0 ? { note: "An empty ring: the new node will be the whole list." } : {}) };
}

type N = { id: string; val: number | string };
type T = Parameters<Approach<P>["run"]>[1];
const nid = (i: number) => `n${i}`;

/** Draw the ring left to right from the given node; the last node's next is the arc back to the first. */
function ring(values: number[], x: number, pointers: Record<string, number>, tones: Record<number, Tone> = {}, insertAfter?: number): ListRow[] {
  const nodes: N[] = values.map((v, i) => ({ id: nid(i), val: v }));
  if (insertAfter !== undefined) nodes.splice(insertAfter + 1, 0, { id: "new", val: x });
  const t: Record<string, Tone> = Object.fromEntries(Object.entries(tones).map(([i, tn]) => [nid(Number(i)), tn]));
  if (insertAfter !== undefined) t.new = "found";
  const main: ListRow = {
    nodes, arrows: nodes.slice(1).map(() => "right" as const), skips: [{ from: nodes[nodes.length - 1].id, to: nodes[0].id }],
    pointers: Object.fromEntries(Object.entries(pointers).map(([k, i]) => [k, nid(i)])), tones: t,
  };
  return insertAfter !== undefined ? [main] : [main, { label: "new", nodes: [{ id: "new", val: x }], arrows: [], tones: { new: "active" } }];
}
function emptyCase(t: T, x: number) {
  t.step({ line: 4, array: [], vars: { x }, lists: [{ nodes: [{ id: "new", val: x }], arrows: [], skips: [{ from: "new", to: "new" }], tones: { new: "found" } }],
    message: `The ring is empty, so the new node is the whole list: point its next at itself, so it's a ring of one.` });
  t.step({ line: 5, array: [], vars: { x }, done: "found", lists: [{ nodes: [{ id: "new", val: x }], arrows: [], skips: [{ from: "new", to: "new" }], pointers: { node: "new" }, tones: { new: "settled" } }],
    message: "Return the new node." });
}
function finish(t: T, values: number[], x: number, prev: number, lines: [number, number], why: string) {
  const k = values.length, curr = (prev + 1) % k;
  t.step({ line: lines[0], array: [], vars: { x }, lists: ring(values, x, { head: 0, prev }, { [prev]: "active", [curr]: "active" }, prev),
    message: `${why ? why + " " : ""}Link it in: the ${values[prev]} now points to ${x}, and ${x} points to the ${values[curr]}.` });
  t.step({ line: lines[1], array: [], vars: { x }, done: "found", lists: ring(values, x, { head: 0 }, Object.fromEntries(values.map((_, i) => [i, "settled" as Tone])), prev),
    message: `Return head, the node we were given. Going round from the smallest value, the ring still reads in order.` });
}

const largestFirst: Approach<P> = {
  id: "largest-first",
  name: "Find the largest first, then walk",
  code: `function insert(head, x)
    node ← new ListNode(x)
    if head = none
        node.next ← node
        return node
    big ← head  // walk to the largest value
    while big.next ≠ head and big.val ≤ big.next.val
        big ← big.next
    prev ← big
    if x > big.next.val and x < big.val
        prev ← big.next  // the smallest
        while prev.next.val < x
            prev ← prev.next
    node.next ← prev.next
    prev.next ← node
    return head
`,
  run({ values, x }, t) {
    const k = values.length;
    if (k === 0) { emptyCase(t, x); return; }
    const nx = (i: number) => (i + 1) % k;
    let big = 0;
    t.step({ line: 6, array: [], vars: { x }, lists: ring(values, x, { head: 0, big }),
      message: `We're handed some node of the ring, not necessarily the smallest. First find where the values wrap around: walk to the largest value, whose next is the smallest.` });
    while (true) {
      t.op();
      const n = nx(big);
      if (n === 0 || values[big] > values[n]) {
        t.step({ line: 7, array: [], vars: { x }, lists: ring(values, x, { head: 0, big }, { [big]: "found" }),
          message: n === 0 ? `big.next is head: we've gone all the way round, so every value is the same and big can stay.` : `The ${values[big]} is followed by the ${values[n]}, a smaller value: the ${values[big]} is the largest, and the ${values[n]} the smallest.` });
        break;
      }
      big = n;
      t.step({ line: 8, array: [], vars: { x }, lists: ring(values, x, { head: 0, big }, { [big]: "active" }), message: `Still rising: big moves to the ${values[big]}.` });
    }
    const small = nx(big);
    t.op();
    if (!(x > values[small] && x < values[big])) {
      t.step({ line: 10, array: [], vars: { x }, lists: ring(values, x, { head: 0, prev: big }, { [big]: "active", [small]: "active" }),
        message: x >= values[big] ? `${x} ≥ ${values[big]}, the largest: it goes after the largest, at the wrap-around.` : `${x} ≤ ${values[small]}, the smallest: it goes before the smallest, which is the same spot, at the wrap-around.` });
      finish(t, values, x, big, [15, 16], "");
      return;
    }
    let prev = small;
    t.step({ line: 11, array: [], vars: { x }, lists: ring(values, x, { head: 0, prev }, { [prev]: "active" }),
      message: `${values[small]} < ${x} < ${values[big]}, so ${x} belongs somewhere in the middle. Start at the smallest, the ${values[small]}, and walk until the next value is at least ${x}.` });
    while (true) {
      t.op();
      const n = nx(prev);
      if (!(values[n] < x)) break;
      prev = n;
      t.step({ line: 13, array: [], vars: { x }, lists: ring(values, x, { head: 0, prev }, { [prev]: "active" }), message: `The next value is smaller than ${x}: move prev to the ${values[prev]}.` });
    }
    finish(t, values, x, prev, [15, 16], `The next value, ${values[nx(prev)]}, is at least ${x}, so ${x} goes right after the ${values[prev]}.`);
  },
};

const onePass: Approach<P> = {
  id: "one-pass",
  name: "One pass, three cases (optimal)",
  code: `function insert(head, x)
    node ← new ListNode(x)
    if head = none
        node.next ← node
        return node
    prev, curr ← head, head.next
    while true
        if prev.val ≤ x and x ≤ curr.val
            break  // x fits between them
        if prev.val > curr.val  // max → min
            if x ≥ prev.val or x ≤ curr.val
                break  // x is a new max or min
        prev, curr ← curr, curr.next
        if prev = head
            break  // full circle: all equal
    prev.next ← node
    node.next ← curr
    return head
`,
  run({ values, x }, t) {
    const k = values.length;
    if (k === 0) { emptyCase(t, x); return; }
    const nx = (i: number) => (i + 1) % k;
    let prev = 0;
    t.step({ line: 6, array: [], vars: { x }, lists: ring(values, x, { head: 0, prev, curr: nx(0) }),
      message: `Walk round the ring once, looking at each neighbouring pair prev → curr, and stop at the first gap where ${x} belongs.` });
    let askedDrop = false;
    while (true) {
      const curr = nx(prev), a = values[prev], b = values[curr];
      t.op();
      const fits = a <= x && x <= b;
      const ptr = { head: 0, prev, curr };
      if (fits) {
        t.step({ line: 9, array: [], vars: { x }, lists: ring(values, x, ptr, { [prev]: "found", [curr]: "found" }), message: `${a} ≤ ${x} ≤ ${b}: ${x} fits between them.` });
        finish(t, values, x, prev, [17, 18], "");
        return;
      }
      t.op();
      if (a > b) {
        const atDrop = x >= a || x <= b;
        const ask = askedDrop ? {} : { ask: { q: `prev holds ${a}, curr holds ${b}: the values drop here, from the largest to the smallest. Does ${x} go between them?`, options: ["Yes: it's a new largest or smallest value", "No: keep walking"], answer: atDrop ? 0 : 1 } };
        askedDrop = true;
        t.step({ ...ask, line: atDrop ? 12 : 11, array: [], vars: { x }, lists: ring(values, x, ptr, { [prev]: atDrop ? "found" : "compare", [curr]: atDrop ? "found" : "compare" }),
          message: atDrop ? `${a} > ${b}: this is where the ring wraps from largest to smallest. ${x >= a ? `${x} ≥ ${a}, so it's a new largest value` : `${x} ≤ ${b}, so it's a new smallest value`}, and either way it goes right here.`
            : `${a} > ${b}: this is the wrap-around, but ${b} < ${x} < ${a}, so ${x} belongs somewhere else. Keep walking.` });
        if (atDrop) { finish(t, values, x, prev, [17, 18], ""); return; }
      } else {
        t.step({ line: 8, array: [], vars: { x }, lists: ring(values, x, ptr, { [prev]: "compare", [curr]: "compare" }),
          message: `Is ${a} ≤ ${x} ≤ ${b}? No. And ${a} ≤ ${b}, so this isn't the wrap-around either. Move on.` });
      }
      prev = curr;
      t.op();
      if (prev === 0) {
        t.step({ line: 15, array: [], vars: { x }, lists: ring(values, x, { head: 0, prev, curr: nx(prev) }, { [prev]: "active" }),
          message: `prev is back on head: we've checked every gap without stopping, which only happens when every value is the same. Any gap will do.` });
        finish(t, values, x, prev, [17, 18], "");
        return;
      }
    }
  },
};

export const approaches = { largestFirst, onePass };
