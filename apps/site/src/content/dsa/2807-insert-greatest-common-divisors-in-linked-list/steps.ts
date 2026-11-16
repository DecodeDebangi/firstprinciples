import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { values: number[] };
type P = Input;
export const example: Input = { values: [18, 12, 20] };
export const fields: InputField[] = [{ key: "values", label: "values (whole numbers from 1 to 1000)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 4) return { error: "Keep the list to at most 4 nodes: with the new ones in between, that's 7." };
  if (raw.values.some((v) => !Number.isInteger(v) || v < 1 || v > 1000)) return { error: "Use whole numbers from 1 to 1000." };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" };
const END: N = { id: "end", val: "none", kind: "null" };
/** The list after inserting the first `done` gcd nodes (new nodes have ids g0, g1, …). */
function row(values: number[], gcds: number[], done: number, ptr: Record<string, string> = {}, tones: Record<string, Tone> = {}): ListRow {
  const nodes: N[] = [];
  values.forEach((v, i) => { nodes.push({ id: `n${i}`, val: v }); if (i < done) nodes.push({ id: `g${i}`, val: gcds[i] }); });
  return { nodes: [...nodes, END], arrows: nodes.map(() => "right" as const), pointers: ptr,
    tones: { ...Object.fromEntries(Array.from({ length: done }, (_, i) => [`g${i}`, "side-b" as Tone])), ...tones } };
}
const euclid = (a: number, b: number) => { let x = a, y = b, steps = 0; const trail = [`gcd(${x}, ${y})`]; while (y !== 0) { [x, y] = [y, x % y]; steps++; trail.push(`gcd(${x}, ${y})`); } return { g: x, steps, trail }; };

function walk(t: Parameters<Approach<P>["run"]>[1], values: number[], gcdOf: (a: number, b: number, i: number) => { g: number; work: number; note: string; vars: Record<string, string | number> }, lines: { compute: number; link: number; ret: number }, extraEnd: string) {
  const gcds: number[] = [];
  let asked = false;
  for (let i = 0; i + 1 < values.length; i++) {
    const a = values[i], b = values[i + 1];
    const r = gcdOf(a, b, i);
    t.op(r.work);
    gcds.push(r.g);
    // Wrong options: 1 (g > 1 here), and the smaller value if that isn't the GCD, else 2g (which can't divide both).
    const ask = !asked && r.g > 1
      ? (asked = true, { ask: { q: `What's the greatest number that divides both ${a} and ${b} exactly?`, options: [String(r.g), "1", String(Math.min(a, b) !== r.g ? Math.min(a, b) : r.g * 2)], answer: 0 } }) : {};
    t.step({ ...ask, line: lines.compute, array: [], lists: [row(values, gcds, i, { curr: `n${i}` }, { [`n${i}`]: "active", [`n${i + 1}`]: "active" })], vars: r.vars,
      message: r.note });
    t.op(2);
    t.step({ line: lines.link, array: [], lists: [row(values, gcds, i + 1, { curr: i + 2 < values.length ? `n${i + 1}` : `n${i + 1}` }, { [`g${i}`]: "found" })], vars: { gcd: r.g },
      message: `Make a node holding ${r.g} and link it between the ${a} and the ${b}: it points to the ${b}, and the ${a} points to it. Then move curr on to the ${b}, skipping the new node.` });
  }
  t.step({ line: lines.ret, array: [], lists: [row(values, gcds, gcds.length, {}, Object.fromEntries([...values.map((_, i) => [`n${i}`, "settled" as Tone]), ...gcds.map((_, i) => [`g${i}`, "settled" as Tone])]))], vars: {}, done: "found",
    message: values.length < 2 ? "A single node has no neighbours, so nothing is inserted." : `Done: ${values.flatMap((v, i) => (i < gcds.length ? [v, gcds[i]] : [v])).join(" → ")} → none.${extraEnd}` });
}

const countDown: Approach<P> = {
  id: "count-down",
  name: "Find each GCD by counting down",
  code: `function insertGcd(head)
    curr ← head
    while curr.next ≠ none
        a, b ← curr.val, curr.next.val
        g ← min(a, b)
        while a % g ≠ 0 or b % g ≠ 0
            g -= 1
        node ← new ListNode(g)
        node.next ← curr.next
        curr.next ← node
        curr ← node.next
    return head
`,
  run({ values }, t) {
    t.step({ line: 2, array: [], lists: [row(values, [], 0, { curr: "n0" })], vars: {},
      message: "Between every two neighbouring nodes, insert a new node holding their greatest common divisor (GCD): the biggest whole number that divides both exactly. The GCD of 18 and 12 is 6. The plain way to find it: start at the smaller number and count down until something divides both." });
    walk(t, values, (a, b) => {
      let g = Math.min(a, b), tries = 1;
      while (a % g !== 0 || b % g !== 0) { g--; tries++; }
      return { g, work: tries, vars: { a, b, tries, g }, note: `${a} and ${b}: try ${Math.min(a, b)}${tries > 1 ? `, ${Math.min(a, b) - 1}${tries > 2 ? ", …" : ""}` : ""} until one divides both. After ${tries} tr${tries === 1 ? "y" : "ies"}: ${g}.` };
    }, { compute: 7, link: 11, ret: 12 }, " Each GCD can take as many tries as the smaller number: O(n · m) for values up to m.");
  },
};

const euclidWay: Approach<P> = {
  id: "euclid",
  name: "Find each GCD with Euclid's algorithm (optimal)",
  code: `function insertGcd(head)
    curr ← head
    while curr.next ≠ none
        g ← gcd(curr.val, curr.next.val)
        node ← new ListNode(g)
        node.next ← curr.next
        curr.next ← node
        curr ← node.next
    return head

function gcd(a, b)
    while b ≠ 0
        a, b ← b, a % b
    return a
`,
  run({ values }, t) {
    t.step({ line: 2, array: [], lists: [row(values, [], 0, { curr: "n0" })], vars: {},
      message: "Same walk, but a much faster GCD. Euclid's algorithm uses one fact: any number dividing both a and b also divides the remainder a % b. So gcd(a, b) = gcd(b, a % b), and the numbers shrink fast until the remainder is 0." });
    walk(t, values, (a, b) => {
      const e = euclid(a, b);
      return { g: e.g, work: e.steps + 1, vars: { a, b, steps: e.steps }, note: `${e.trail.join(" = ")}: when b reaches 0, a is the answer, ${e.g}. Only ${e.steps} step${e.steps === 1 ? "" : "s"}.` };
    }, { compute: 4, link: 7, ret: 9 }, " Euclid's algorithm takes O(log m) steps for values up to m: O(n · log m) in total.");
  },
};

export const approaches = { countDown, euclidWay };

/** Neighbouring values around 1000 that share no factor: counting down tries almost every number. */
export const growth = measureGrowth(
  [{ approach: countDown, slot: 1 }, { approach: euclidWay, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => 999 - i) }),
  [4, 8, 16, 24, 32],
);
