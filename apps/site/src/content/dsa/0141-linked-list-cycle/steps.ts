import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/** A list of values; the last node's `next` either is none or points back to the node at position `loopTo`. */
export type Input = { values: number[]; loopTo: string };
type P = Input;
/** "1" → 1; "" or "none" → -1. */
const parseLoop = (s: string) => { const t = s.trim().toLowerCase(); return t === "" || t === "none" ? -1 : Number(t); };

export const example: Input = { values: [3, 8, 1, 5, 6], loopTo: "1" };

export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "loopTo", label: "last node links back to position (or none)", kind: "text" },
];

export function prepare(raw: Input): Prepared<Input> {
  const n = raw.values.length;
  const k = parseLoop(raw.loopTo);
  if (n === 0) return { error: "Give the list at least one value." };
  if (n > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  if (!Number.isInteger(k) || k < -1 || k >= n) return { error: `The link-back position must be a whole number from 0 to ${n - 1}, or none.` };
  return { input: { values: raw.values, loopTo: k === -1 ? "none" : String(k) } };
}

/** Node ids are positions ("n0", "n1"…); next(i) follows the real links, including the one back. */
function build({ values, loopTo }: P) {
  const n = values.length, k = parseLoop(loopTo);
  const id = (i: number) => (i < 0 ? "end" : `n${i}`);
  const next = (i: number) => (i < n - 1 ? i + 1 : k);
  const dup = (v: number) => values.filter((x) => x === v).length > 1;
  /** How a reader would say it: "the 8", or "the 8 at position 3" when another node also holds 8. */
  const name = (i: number) => (i < 0 ? "none" : dup(values[i]) ? `the ${values[i]} at position ${i}` : `the ${values[i]}`);
  const row = (pointers: Record<string, number | null>, tones: Record<number, Tone> = {}): ListRow => ({
    nodes: [...values.map((v, i) => ({ id: id(i), val: v })), ...(k < 0 ? [{ id: "end", val: "none", kind: "null" as const }] : [])],
    arrows: Array.from({ length: k < 0 ? n : n - 1 }, () => "right" as const),
    skips: k >= 0 ? [{ from: id(n - 1), to: id(k) }] : undefined,
    pointers: Object.fromEntries(Object.entries(pointers).map(([p, i]) => [p, i == null ? null : id(i)])),
    tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [id(Number(i)), t])),
  });
  return { n, k, next, name, row, head: 0 };
}

const brute: Approach<P> = {
  id: "rewalk",
  name: "Rewalk from the head",
  code: `function hasCycle(head)
    curr ← head
    steps ← 0
    while curr ≠ none
        check ← head
        repeat steps times
            if check = curr then return true
            check ← check.next
        curr ← curr.next
        steps += 1
    return false
`,
  run(input, t) {
    const g = build(input);
    t.step({ line: 2, array: [], lists: [g.row({ curr: 0 })], vars: { steps: 0 },
      message: "Walk the list with curr. At each node, go back to the head and walk the nodes before it: if curr is one of them, we've been here before, so the list loops." });
    let curr = 0, steps = 0;
    while (curr >= 0) {
      let check = 0;
      for (let s = 0; s < steps; s++) {
        t.op();
        const same = check === curr;
        t.step({ line: 7, array: [], lists: [g.row({ curr, check }, { [curr]: same ? "found" : "active", ...(same ? {} : { [check]: "compare" }) })], vars: { steps },
          message: same ? `check is on ${g.name(check)} after ${s} of ${steps} steps, and so is curr. curr has come back to a node it already passed: there's a loop.`
            : `Is ${g.name(check)} (step ${s + 1} of ${steps}) the same node as curr, ${g.name(curr)}? No.` });
        if (same) {
          t.step({ line: 7, array: [], lists: [g.row({ curr, check }, { [curr]: "found" })], vars: { steps }, done: "found",
            message: `Return true. Each node rewalks everything before it: about n²/2 checks, O(n²), but only two pointers: O(1) space.` });
          return;
        }
        check = g.next(check);
      }
      const nxt = g.next(curr);
      steps++;
      t.step({ line: 9, array: [], lists: [g.row({ curr: nxt }, nxt >= 0 ? { [nxt]: "active" } : {})], vars: { steps },
        message: steps === 1 ? `The head has nothing before it, so there's nothing to check. Move curr to ${g.name(nxt)}.`
          : nxt < 0 ? `None of the ${steps - 1} earlier nodes was curr. Move on: curr.next is none.`
          : `None of the ${steps - 1} earlier nodes was curr. Move curr to ${g.name(nxt)}.` });
      curr = nxt;
    }
    t.step({ line: 11, array: [], lists: [g.row({ curr: null })], vars: { steps }, done: "notfound",
      message: "curr reached none: the list has an end, so it can't loop. Return false." });
  },
};

const hashSet: Approach<P> = {
  id: "set",
  name: "Set of seen nodes",
  code: `function hasCycle(head)
    seen ← empty set  // nodes, not values
    curr ← head
    while curr ≠ none
        if curr in seen then return true
        seen.add(curr)
        curr ← curr.next
    return false
`,
  run(input, t) {
    const g = build(input);
    const seen: number[] = [];
    const key = (i: number) => `the ${input.values[i]} at position ${i}`;
    const panel = (hl?: number) => ({ title: "seen (nodes)", entries: seen.map((i) => [key(i), "seen"] as [string, string]), highlight: hl == null ? undefined : key(hl) });
    t.step({ line: 2, array: [], lists: [g.row({ curr: 0 })], map: panel(), vars: {},
      message: "Walk the list and remember every node you pass. Nodes, not values: two different nodes can hold the same number. Meeting a remembered node means the list loops." });
    let curr = 0;
    while (curr >= 0) {
      t.op();
      const hit = seen.includes(curr);
      t.step({
        ...(hit ? { ask: { q: `curr is on ${g.name(curr)} again. What does that mean?`, options: ["We've been here: the list loops", "Nothing: values can repeat", "The list has ended"], answer: 0 } } : {}),
        line: 5, array: [], lists: [g.row({ curr }, { [curr]: hit ? "found" : "compare", ...Object.fromEntries(seen.filter((i) => i !== curr).map((i) => [i, "visited" as Tone])) })], map: panel(hit ? curr : undefined), vars: {},
        message: hit ? `Yes: ${g.name(curr)} is already in seen. It's the same node, reached a second time. The list loops.` : `Is ${g.name(curr)} in seen? No, first visit.` });
      if (hit) {
        t.step({ line: 5, array: [], lists: [g.row({ curr }, { [curr]: "found" })], map: panel(curr), vars: {}, done: "found",
          message: `Return true. Each node is visited once before the repeat: O(n) time, but seen can hold all n nodes: O(n) space.` });
        return;
      }
      seen.push(curr);
      const nxt = g.next(curr);
      t.step({ line: 6, array: [], lists: [g.row({ curr }, Object.fromEntries(seen.map((i) => [i, "visited" as Tone])))], map: panel(curr), vars: {},
        message: `Remember ${g.name(curr)}, then move to ${nxt < 0 ? "curr.next, which is none" : g.name(nxt)}.` });
      curr = nxt;
    }
    t.step({ line: 8, array: [], lists: [g.row({ curr: null }, Object.fromEntries(seen.map((i) => [i, "visited" as Tone])))], map: panel(), vars: {}, done: "notfound",
      message: "curr reached none: the list ends, so there's no loop. Return false." });
  },
};

const floyd: Approach<P> = {
  id: "fast-slow",
  name: "Fast and slow pointers (optimal)",
  code: `function hasCycle(head)
    slow, fast ← head, head
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
        if slow = fast
            return true
    return false
`,
  run(input, t) {
    const g = build(input);
    let slow = 0, fast = 0, round = 0;
    /** Steps fast needs to reach slow by following next (only meaningful once both are on the loop). */
    const gap = () => { let i = fast, d = 0; while (i !== slow && d <= g.n) { i = g.next(i); d++; if (i < 0) return -1; } return d > g.n ? -1 : d; };
    const onLoop = (i: number) => g.k >= 0 && i >= g.k;
    t.step({ line: 2, array: [], lists: [g.row({ slow, fast })], vars: { round },
      message: "slow moves one node per round, fast moves two. If the list ends, fast finds the end first. If it loops, fast laps around and catches slow from behind." });
    while (true) {
      const f1 = g.next(fast);
      t.op();
      if (fast < 0 || f1 < 0) {
        t.step({ line: 8, array: [], lists: [g.row({ slow, fast: fast < 0 ? null : fast }, fast < 0 ? {} : { [fast]: "miss" })], vars: { round }, done: "notfound",
          message: `${fast < 0 ? "fast is none" : "fast.next is none"}: fast found the end of the list, so there's no loop. Return false. fast covered the list in about n / 2 rounds: O(n) time, O(1) space.` });
        return;
      }
      const [s0, f0] = [slow, fast];
      const closing = round > 0 && onLoop(s0) && onLoop(f0) && gap() === 1;
      slow = g.next(slow); fast = g.next(f1); round++;
      t.op();
      const met = slow === fast;
      t.step({
        ...(closing ? { ask: { q: `On the loop, fast is now one node behind slow. Next round slow moves 1 and fast moves 2. What happens?`, options: ["fast lands on slow's node", "fast jumps over slow", "slow pulls further ahead"], answer: 0 } } : {}),
        line: 6, array: [], lists: [g.row({ slow, fast }, met ? { [slow]: "found" } : { [slow]: "active", [fast]: "compare" })], vars: { round },
        message: met ? `slow moved to ${g.name(slow)} and fast jumped two nodes to ${g.name(fast)}: the same node. Only a loop could bring fast back behind slow.`
          : `slow moves to ${g.name(slow)}, fast jumps two to ${g.name(fast)}.${onLoop(slow) && onLoop(fast) ? ` Both are on the loop now; each round fast closes the gap by one node (${gap()} to go).` : " Not the same node."}` });
      if (met) {
        t.step({ line: 7, array: [], lists: [g.row({ slow, fast }, { [slow]: "found" })], vars: { round }, done: "found",
          message: `Return true. Once both are on the loop, fast gains one node per round, so they meet within one lap: O(n) time, and just two pointers: O(1) space.` });
        return;
      }
    }
  },
};

export const approaches = { brute, hashSet, floyd };

/** Worst case for every approach: the last node links back to the head, so the whole list is the loop. */
export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: hashSet, slot: 2 }, { approach: floyd, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => i), loopTo: "0" }),
  [4, 8, 16, 24, 32],
);
