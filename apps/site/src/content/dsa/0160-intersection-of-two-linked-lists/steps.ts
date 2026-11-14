import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/** Two lists that may share a tail: A = onlyA + shared, B = onlyB + shared. Shared nodes are the SAME nodes in both. */
export type Input = { onlyA: number[]; onlyB: number[]; shared: string };
type P = Input;
/** "9, 4" → [9, 4]; "" or "none" → []. */
const parseShared = (s: string) => { const t = s.trim().toLowerCase(); return t === "" || t === "none" ? [] : t.split(/[\s,]+/).filter(Boolean).map(Number); };

export const example: Input = { onlyA: [2, 7], onlyB: [3, 7, 1], shared: "9, 4" };

export const fields: InputField[] = [
  { key: "onlyA", label: "A's own part", kind: "numbers" },
  { key: "onlyB", label: "B's own part", kind: "numbers" },
  { key: "shared", label: "shared tail (or none)", kind: "text" },
];

export function prepare(raw: Input): Prepared<Input> {
  const shared = parseShared(raw.shared);
  if (shared.some((n) => !Number.isInteger(n))) return { error: "The shared tail must be whole numbers separated by commas, or none." };
  if (raw.onlyA.length + shared.length > 6 || raw.onlyB.length + shared.length > 6) return { error: "Keep each list to at most 6 nodes so both fit." };
  return { input: { onlyA: raw.onlyA, onlyB: raw.onlyB, shared: shared.length ? shared.join(", ") : "none" } };
}

type N = { id: string; val: number };
const END = (id: string) => ({ id, val: "none" as number | string, kind: "null" as const });

/** Build the nodes once; the shared ones appear in both rows because they are the same nodes. */
function build({ onlyA, onlyB, shared: sharedText }: P) {
  const shared = parseShared(sharedText);
  const a = onlyA.map((v, i) => ({ id: `A${i + 1}`, val: v }));
  const b = onlyB.map((v, i) => ({ id: `B${i + 1}`, val: v }));
  const s = shared.map((v, i) => ({ id: `S${i + 1}`, val: v }));
  return { A: [...a, ...s], B: [...b, ...s], S: new Set(s.map((x) => x.id)), first: s[0] };
}
const rowOf = (label: string, nodes: N[], S: Set<string>, pointers: Record<string, string | null>, tones: Record<string, Tone> = {}): ListRow => ({
  label, nodes: [...nodes, END("end")], arrows: nodes.map(() => "right" as const), pointers,
  tones: { ...Object.fromEntries(nodes.filter((n) => S.has(n.id)).map((n) => [n.id, "side-b" as Tone])), ...tones },
});
const views = (g: ReturnType<typeof build>, pa: Record<string, string | null>, pb: Record<string, string | null>, ta: Record<string, Tone> = {}, tb: Record<string, Tone> = {}) =>
  [rowOf("A", g.A, g.S, pa, ta), rowOf("B", g.B, g.S, pb, tb)];
/** How a reader would say it: "A's 7", "B's 1", "the shared 9". */
const name = (n: N, g: ReturnType<typeof build>) => (g.S.has(n.id) ? `the shared ${n.val}` : `${n.id[0]}'s ${n.val}`);
const short = (n: N, g: ReturnType<typeof build>) => (g.S.has(n.id) ? `shared ${n.val}` : `${n.id[0]}'s ${n.val}`);

const brute: Approach<P> = {
  id: "brute",
  name: "Brute force, every pair of nodes",
  code: `function getIntersectionNode(headA, headB)
    a ← headA
    while a ≠ none
        b ← headB
        while b ≠ none
            if a = b  // same node, not just same value
                return a
            b ← b.next
        a ← a.next
    return none
`,
  run(input, t) {
    const g = build(input);
    t.step({ line: 2, array: [], lists: views(g, { a: g.A[0]?.id ?? "end" }, {}), vars: {},
      message: "For every node of A, walk the whole of B and ask: is this the very same node? Equal values aren't enough; it has to be one node reachable from both heads." });
    for (const a of g.A) {
      for (const b of g.B) {
        t.op();
        const same = a.id === b.id;
        t.step({ line: 6, array: [], lists: views(g, { a: a.id }, { b: b.id }, { [a.id]: same ? "found" : "active" }, { [b.id]: same ? "found" : "compare" }), vars: { "a.val": a.val, "b.val": b.val },
          message: same ? `a and b are the same node: ${name(a, g)}. That's where the lists meet.`
            : a.val === b.val ? `A's ${a.val} and B's ${b.val} hold the same value, but they're different nodes, so this isn't the meeting point.`
            : `${name(a, g)} vs ${name(b, g)}: different nodes.` });
        if (same) {
          t.step({ line: 7, array: [], lists: views(g, { a: a.id }, { b: b.id }, { [a.id]: "found" }, { [b.id]: "found" }), vars: {}, done: "found",
            message: `Return ${name(a, g)}. Every node of A can be checked against every node of B: O(m · n) comparisons.` });
          return;
        }
      }
    }
    t.step({ line: 10, array: [], lists: views(g, {}, {}), vars: {}, done: "notfound", message: "No node appears in both lists: return none. That took every pair, m · n comparisons." });
  },
};

const hashSet: Approach<P> = {
  id: "set",
  name: "Hash set of A's nodes",
  code: `function getIntersectionNode(headA, headB)
    seen ← empty set  // nodes, not values
    a ← headA
    while a ≠ none
        seen.add(a)
        a ← a.next
    b ← headB
    while b ≠ none
        if b in seen
            return b
        b ← b.next
    return none
`,
  run(input, t) {
    const g = build(input);
    const seen: N[] = [];
    const panel = (hl?: string) => ({ title: "seen (nodes of A)", entries: seen.map((n) => [short(n, g), "stored"] as [string, string]), highlight: hl ? short([...g.A, ...g.B].find((x) => x.id === hl)!, g) : undefined });
    t.step({ line: 2, array: [], lists: views(g, { a: g.A[0]?.id ?? "end" }, {}), map: panel(), vars: {},
      message: "Walk A once and remember every node in a set. A set of nodes, not values: two different nodes can hold the same value." });
    for (const a of g.A) {
      t.op(); seen.push(a);
      t.step({ line: 5, array: [], lists: views(g, { a: a.id }, {}, { [a.id]: "active" }), map: panel(a.id), vars: {}, message: `Remember ${name(a, g)}: the node itself, not just the value ${a.val}.` });
    }
    let asked = false;
    for (const b of g.B) {
      t.op();
      const hit = g.S.has(b.id);
      const twin = !hit && !asked && seen.some((n) => n.val === b.val);
      if (twin) asked = true;
      t.step({
        ...(twin ? { ask: { q: `b is on B's ${b.val}. A also has a node holding ${b.val}. Is b in seen?`, options: ["No: it's a different node", "Yes: the value is in the set"], answer: 0 } } : {}),
        line: 9, array: [], lists: views(g, {}, { b: b.id }, {}, { [b.id]: hit ? "found" : "compare" }), map: panel(hit ? b.id : undefined), vars: {},
        message: hit ? `The shared ${b.val} is in the set: it's the first node of B that also belongs to A.` : `Is B's ${b.val} in seen? No${seen.some((n) => n.val === b.val) ? `. A's ${b.val} is, but that's a different node` : ""}.` });
      if (hit) {
        t.step({ line: 10, array: [], lists: views(g, {}, { b: b.id }, { [b.id]: "found" }, { [b.id]: "found" }), map: panel(b.id), vars: {}, done: "found",
          message: `Return ${name(b, g)}. One pass over A, one over B: O(m + n) time, but the set holds up to m nodes: O(m) space.` });
        return;
      }
    }
    t.step({ line: 12, array: [], lists: views(g, {}, {}), map: panel(), vars: {}, done: "notfound", message: "No node of B is in the set: the lists never meet. Return none." });
  },
};

const twoPointers: Approach<P> = {
  id: "switch",
  name: "Two pointers that switch lists (optimal)",
  code: `function getIntersectionNode(headA, headB)
    a, b ← headA, headB
    while a ≠ b
        a ← (a = none) ? headB : a.next
        b ← (b = none) ? headA : b.next
    return a  // the meeting node, or none
`,
  run(input, t) {
    const g = build(input);
    // Each pointer walks its own list, then the other: both travel lenA + lenB, so they line up.
    const pathA = [...g.A.map((n) => ["A", n.id]), ["A", "end"], ...g.B.map((n) => ["B", n.id]), ["B", "end"]];
    const pathB = [...g.B.map((n) => ["B", n.id]), ["B", "end"], ...g.A.map((n) => ["A", n.id]), ["A", "end"]];
    const draw = (i: number) => {
      const pa = pathA[i], pb = pathB[i];
      const ptrA: Record<string, string | null> = {}, ptrB: Record<string, string | null> = {};
      (pa[0] === "A" ? ptrA : ptrB).a = pa[1]; (pb[0] === "A" ? ptrA : ptrB).b = pb[1];
      return views(g, ptrA, ptrB);
    };
    const nodeName = (p: string[]) => (p[1] === "end" ? "none" : (() => { const n = [...g.A, ...g.B].find((x) => x.id === p[1])!; return name(n, g); })());
    t.step({ line: 2, array: [], lists: draw(0), vars: { "len A": g.A.length, "len B": g.B.length },
      message: `a walks A, b walks B. They can't meet yet: A has ${g.A.length - g.S.size} node${g.A.length - g.S.size === 1 ? "" : "s"} before the shared part and B has ${g.B.length - g.S.size}. The trick evens that out.` });
    let i = 0;
    // a = b also holds when both are none (lists that never meet): then the loop ends and returns none.
    while (pathA[i][1] !== pathB[i][1]) {
      const switching = pathA[i][1] === "end" && pathA[i][0] === "A";
      t.op(); t.op(); i++;
      t.step({
        ...(switching ? { ask: { q: "a has reached none at the end of A. Where does it go next?", options: ["To headB, the start of the other list", "Back to headA", "It stops"], answer: 0 } } : {}),
        line: 4, array: [], lists: draw(i), vars: { round: i },
        message: switching ? `a reached the end of A, so it jumps to headB. From now on it walks B, and b will do the same with A when it runs out.`
          : pathB[i - 1][1] === "end" && pathB[i - 1][0] === "B" ? `b reached the end of B and jumps to headA. Both pointers are now on the other list.`
          : `Both step forward: a is on ${nodeName(pathA[i])}, b is on ${nodeName(pathB[i])}.${pathA[i][1] === pathB[i][1] ? "" : " Not the same node yet."}` });
      if (i > pathA.length) break;
    }
    const meet = pathA[i][1];
    t.step({ line: 6, array: [], lists: draw(i), vars: { round: i }, done: meet === "end" ? "notfound" : "found",
      message: meet === "end"
        ? `Both reached none together: the lists never share a node. Return none. Each pointer walked both lists once: O(m + n), with just two pointers: O(1) space.`
        : `a and b are on the same node, ${nodeName(pathA[i])}. Each walked its own list plus the other's own part, the same total distance, so they arrive together. O(m + n) time, O(1) space.` });
  },
};

export const approaches = { brute, hashSet, twoPointers };

/** Worst case: no shared nodes, both lists n / 2 long. */
export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: hashSet, slot: 2 }, { approach: twoPointers, slot: 3 }],
  (n) => ({ onlyA: Array.from({ length: Math.max(1, Math.floor(n / 2)) }, (_, i) => i), onlyB: Array.from({ length: Math.max(1, Math.ceil(n / 2)) }, (_, i) => i + 100), shared: "none" }),
  [4, 8, 16, 24, 32],
);
