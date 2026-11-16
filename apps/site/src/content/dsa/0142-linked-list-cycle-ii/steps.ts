import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/** A list of values; the last node's `next` either is none or points back to the node at position `loopTo`. */
export type Input = { values: number[]; loopTo: string };
type P = Input;
/** "1" → 1; "" or "none" → -1. */
const parseLoop = (s: string) => { const t = s.trim().toLowerCase(); return t === "" || t === "none" ? -1 : Number(t); };

export const example: Input = { values: [4, 9, 2, 7, 5, 1], loopTo: "2" };

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
  code: `function detectCycle(head)
    curr ← head
    steps ← 0
    while curr ≠ none
        check ← head
        repeat steps times
            if check = curr then return curr
            check ← check.next
        curr ← curr.next
        steps += 1
    return none
`,
  run(input, t) {
    const g = build(input);
    t.step({ line: 2, array: [], lists: [g.row({ curr: 0 })], vars: { steps: 0 },
      message: "Walk the list with curr. At each node, rewalk the nodes before it from the head. The first node that turns out to be a repeat is where the loop starts, because the loop's first node is the first one you come back to." });
    let curr = 0, steps = 0;
    while (curr >= 0) {
      let check = 0;
      for (let s = 0; s < steps; s++) {
        t.op();
        const same = check === curr;
        t.step({ line: 7, array: [], lists: [g.row({ curr, check }, { [curr]: same ? "found" : "active", ...(same ? {} : { [check]: "compare" }) })], vars: { steps },
          message: same ? `check is on ${g.name(check)} after ${s} of ${steps} steps, and so is curr. curr has come back to a node it already passed, and it's the first repeat: the loop starts here.`
            : `Is ${g.name(check)} (step ${s + 1} of ${steps}) the same node as curr, ${g.name(curr)}? No.` });
        if (same) {
          t.step({ line: 7, array: [], lists: [g.row({ curr }, { [curr]: "found" })], vars: { steps }, done: "found",
            message: `Return ${g.name(curr)}, the node at position ${curr}. Each node rewalks everything before it: O(n²) checks, but O(1) space.` });
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
      message: "curr reached none: the list has an end, so there's no loop. Return none." });
  },
};

const hashSet: Approach<P> = {
  id: "set",
  name: "Set of seen nodes",
  code: `function detectCycle(head)
    seen ← empty set  // nodes, not values
    curr ← head
    while curr ≠ none
        if curr in seen then return curr
        seen.add(curr)
        curr ← curr.next
    return none
`,
  run(input, t) {
    const g = build(input);
    const seen: number[] = [];
    const key = (i: number) => `the ${input.values[i]} at position ${i}`;
    const panel = (hl?: number) => ({ title: "seen (nodes)", entries: seen.map((i) => [key(i), "seen"] as [string, string]), highlight: hl == null ? undefined : key(hl) });
    t.step({ line: 2, array: [], lists: [g.row({ curr: 0 })], map: panel(), vars: {},
      message: "Walk the list and remember every node you pass. The first node you meet a second time is where the loop starts: it's the first one the last node's next leads back to." });
    let curr = 0;
    while (curr >= 0) {
      t.op();
      const hit = seen.includes(curr);
      t.step({
        ...(hit ? { ask: { q: `curr is back on ${g.name(curr)}, which is in seen. What do you return?`, options: ["This node: it's where the loop starts", "The node before it", "true"], answer: 0 } } : {}),
        line: 5, array: [], lists: [g.row({ curr }, { [curr]: hit ? "found" : "compare", ...Object.fromEntries(seen.filter((i) => i !== curr).map((i) => [i, "visited" as Tone])) })], map: panel(hit ? curr : undefined), vars: {},
        message: hit ? `Yes: ${g.name(curr)} is already in seen. It's the first node reached twice, so the loop starts here.` : `Is ${g.name(curr)} in seen? No, first visit.` });
      if (hit) {
        t.step({ line: 5, array: [], lists: [g.row({ curr }, { [curr]: "found" })], map: panel(curr), vars: {}, done: "found",
          message: `Return ${g.name(curr)}, the node at position ${curr}. One visit per node: O(n) time, but seen can hold all n nodes: O(n) space.` });
        return;
      }
      seen.push(curr);
      const nxt = g.next(curr);
      t.step({ line: 6, array: [], lists: [g.row({ curr }, Object.fromEntries(seen.map((i) => [i, "visited" as Tone])))], map: panel(curr), vars: {},
        message: `Remember ${g.name(curr)}, then move to ${nxt < 0 ? "curr.next, which is none" : g.name(nxt)}.` });
      curr = nxt;
    }
    t.step({ line: 8, array: [], lists: [g.row({ curr: null }, Object.fromEntries(seen.map((i) => [i, "visited" as Tone])))], map: panel(), vars: {}, done: "notfound",
      message: "curr reached none: the list ends, so there's no loop. Return none." });
  },
};

const floyd: Approach<P> = {
  id: "fast-slow",
  name: "Fast and slow, then walk from the head (optimal)",
  code: `function detectCycle(head)
    slow, fast ← head, head
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
        if slow = fast
            p ← head
            while p ≠ slow
                p ← p.next
                slow ← slow.next
            return p
    return none
`,
  run(input, t) {
    const g = build(input);
    let slow = 0, fast = 0, round = 0;
    const gap = () => { let i = fast, d = 0; while (i !== slow && d <= g.n) { i = g.next(i); d++; if (i < 0) return -1; } return d > g.n ? -1 : d; };
    const onLoop = (i: number) => g.k >= 0 && i >= g.k;
    t.step({ line: 2, array: [], lists: [g.row({ slow, fast })], vars: { round },
      message: "Part 1 is Linked List Cycle: slow moves one node per round, fast moves two. If fast finds the end there's no loop; if they meet, there is one, and part 2 finds where it starts." });
    while (true) {
      const f1 = g.next(fast);
      t.op();
      if (fast < 0 || f1 < 0) {
        t.step({ line: 12, array: [], lists: [g.row({ slow, fast: fast < 0 ? null : fast }, fast < 0 ? {} : { [fast]: "miss" })], vars: { round }, done: "notfound",
          message: `${fast < 0 ? "fast is none" : "fast.next is none"}: fast found the end of the list, so there's no loop. Return none.` });
        return;
      }
      const closing = round > 0 && onLoop(slow) && onLoop(fast) && gap() === 1;
      slow = g.next(slow); fast = g.next(f1); round++;
      t.op();
      const met = slow === fast;
      t.step({
        ...(closing ? { ask: { q: `On the loop, fast is now one node behind slow. Next round slow moves 1 and fast moves 2. What happens?`, options: ["fast lands on slow's node", "fast jumps over slow", "slow pulls further ahead"], answer: 0 } } : {}),
        line: 6, array: [], lists: [g.row({ slow, fast }, met ? { [slow]: "settled" } : { [slow]: "active", [fast]: "compare" })], vars: { round },
        message: met ? `slow moved to ${g.name(slow)} and fast jumped two nodes to ${g.name(fast)}: they've met, so the list loops. But this meeting point isn't necessarily where the loop starts.`
          : `slow moves to ${g.name(slow)}, fast jumps two to ${g.name(fast)}.${onLoop(slow) && onLoop(fast) ? ` Both are on the loop now; fast closes the gap by one node per round (${gap()} to go).` : " Not the same node yet."}` });
      if (met) break;
    }
    // Part 2: p walks from the head, slow from the meeting point, one node each; they meet at the loop's start.
    const meet = slow;
    let d = 0; for (let i = meet; i !== g.k; i = g.next(i)) d++;
    const L = g.n - g.k, a = g.k;
    let p = 0, moves = 0;
    t.step({ ask: { q: "p starts at the head, slow stays where they met, and both now move one node at a time. Where do they meet?", options: ["At the node where the loop starts", "Back at the meeting point", "They never meet"], answer: 0 },
      line: 7, array: [], lists: [g.row({ p, slow }, { [p]: "active", [slow]: "active" })], vars: { round },
      message: `Put p on the head. p is ${a} node${a === 1 ? "" : "s"} from the loop's start. slow, going round, is ${d} node${d === 1 ? "" : "s"} from it${a > d ? `, plus ${(a - d) / L} lap${(a - d) / L === 1 ? "" : "s"} of ${L}` : ""}. That's the same distance, so moving them together brings them to the start at the same moment.` });
    while (true) {
      t.op();
      if (p === slow) break;
      t.step({ line: 8, array: [], lists: [g.row({ p, slow }, { [p]: "compare", [slow]: "compare" })], vars: { moves },
        message: `p is on ${g.name(p)}, slow is on ${g.name(slow)}: not the same node, so both move one step.` });
      p = g.next(p); slow = g.next(slow); moves++;
      t.step({ line: 10, array: [], lists: [g.row({ p, slow }, { [p]: "active", [slow]: "active" })], vars: { moves },
        message: `p moves to ${g.name(p)}, slow moves to ${g.name(slow)}.` });
    }
    t.step({ line: 8, array: [], lists: [g.row({ p, slow }, { [p]: "found" })], vars: { moves },
      message: `p and slow are both on ${g.name(p)}${moves === 0 ? " already (the loop starts at the head)" : ` after ${moves} move${moves === 1 ? "" : "s"}`}. That's the loop's first node.` });
    t.step({ line: 11, array: [], lists: [g.row({ p }, { [p]: "found" })], vars: { moves }, done: "found",
      message: `Return ${g.name(p)}, the node at position ${p}. Both parts walk O(n) nodes, with three pointers and nothing else: O(n) time, O(1) space.` });
  },
};

export const approaches = { brute, hashSet, floyd };

/** Worst case for every approach: the last node links back to the head, so the whole list is the loop. */
export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: hashSet, slot: 2 }, { approach: floyd, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => i), loopTo: "0" }),
  [4, 8, 16, 24, 32],
);
