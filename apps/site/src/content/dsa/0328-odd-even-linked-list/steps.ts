import { type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { values: number[] };
type P = Input;
export const example: Input = { values: [4, 8, 1, 6, 3, 9, 5] };
export const fields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  return { input: raw, ...(raw.values.length === 0 ? { note: "An empty list: nothing to reorder." } : {}) };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const ord = (k: number) => (k % 10 === 1 && k !== 11 ? `${k}st` : k % 10 === 2 && k !== 12 ? `${k}nd` : k % 10 === 3 && k !== 13 ? `${k}rd` : `${k}th`);

const arrays: Approach<P> = {
  id: "arrays",
  name: "Collect the values, then write them back",
  code: `function oddEvenList(head)
    odds ← empty list
    evens ← empty list
    curr ← head
    position ← 1
    while curr ≠ none
        if position is odd then odds.push(curr.val)
        else evens.push(curr.val)
        curr ← curr.next
        position += 1
    curr ← head
    for each v in odds, then in evens
        curr.val ← v
        curr ← curr.next
    return head
`,
  run({ values }, t) {
    const vals = [...values];
    const nodes = (): N[] => vals.map((v, i) => ({ id: `n${i}`, val: v }));
    const row = (curr: number, tones: Record<number, Tone> = {}): ListRow => ({ nodes: [...nodes(), END], arrows: vals.map(() => "right" as const),
      pointers: { curr: curr < vals.length ? `n${curr}` : "end" }, tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])) });
    const odds: number[] = [], evens: number[] = [];
    const panel = (hl?: string) => ({ title: "collected values", entries: [["odds", odds.join(", ") || "(empty)"], ["evens", evens.join(", ") || "(empty)"]] as [string, string][], highlight: hl });
    t.step({ line: 4, array: [], lists: [row(0)], map: panel(), vars: { position: 1 },
      message: "Walk the list, counting positions from 1. Values at odd positions (1st, 3rd, 5th…) go in odds, the rest in evens. It's the position that counts, not whether the value is odd." });
    for (let i = 0; i < vals.length; i++) {
      t.op();
      const pos = i + 1, odd = pos % 2 === 1;
      (odd ? odds : evens).push(vals[i]);
      t.step({ line: odd ? 7 : 8, array: [], lists: [row(i, { [i]: odd ? "side-a" : "side-b" })], map: panel(odd ? "odds" : "evens"), vars: { position: pos },
        message: `The ${vals[i]} is ${ord(pos)}, an ${odd ? "odd" : "even"} position: add it to ${odd ? "odds" : "evens"}.` });
    }
    const order = [...odds, ...evens];
    t.step({ line: 11, array: [], lists: [row(0)], map: panel(), vars: {},
      message: vals.length ? `Now walk the list again and overwrite its values in the new order: ${order.join(", ")}.` : "The list is empty: nothing to write back." });
    for (let i = 0; i < vals.length; i++) {
      t.op();
      vals[i] = order[i];
      t.step({ line: 13, array: [], lists: [row(i, { ...Object.fromEntries(Array.from({ length: i }, (_, j) => [j, (j < odds.length ? "side-a" : "side-b") as Tone])), [i]: "active" })], map: panel(i < odds.length ? "odds" : "evens"), vars: {},
        message: `Write ${order[i]} into the ${ord(i + 1)} node.` });
    }
    t.step({ line: 15, array: [], lists: [row(vals.length, Object.fromEntries(vals.map((_, j) => [j, (j < odds.length ? "side-a" : "side-b") as Tone])))], map: panel(), vars: {}, done: "found",
      message: `Return head: ${vals.length ? vals.join(" → ") + " → none" : "none"}. Two passes, O(n) time, but the two lists hold every value: O(n) extra space. And it moved values, not nodes, which the problem doesn't allow.` });
  },
};

const chains: Approach<P> = {
  id: "chains",
  name: "Two chains in place, then join (optimal)",
  code: `function oddEvenList(head)
    if head = none then return none
    odd ← head
    even ← head.next
    evenHead ← even
    while even ≠ none and even.next ≠ none
        odd.next ← even.next
        odd ← odd.next
        even.next ← odd.next
        even ← even.next
    odd.next ← evenHead
    return head
`,
  run({ values }, t) {
    const n = values.length;
    const node = (i: number): N => ({ id: `n${i}`, val: values[i] });
    if (n === 0) {
      t.step({ line: 2, array: [], lists: [{ nodes: [END], arrows: [] }], vars: {}, done: "found", message: "The list is empty: return none." });
      return;
    }
    const O = [0], E: number[] = n > 1 ? [1] : [];
    let r = 2; // first node not yet moved to a chain
    let evenNone = n === 1;
    const tone = (i: number): Tone => (i % 2 === 0 ? "side-a" : "side-b");
    /** odd row: the odd chain (its last next is rewired each round, so it's left undrawn). even row: even chain, then the untouched rest. */
    const draw = (lift: Record<number, Tone> = {}, evenLinked = true): ListRow[] => {
      const rest = Array.from({ length: Math.max(0, n - r) }, (_, k) => r + k);
      const evenNodes = [...E, ...rest];
      const toneOf = (i: number) => lift[i] ?? (O.includes(i) || E.includes(i) ? tone(i) : undefined);
      const tones = (ids: number[]) => Object.fromEntries(ids.filter((i) => toneOf(i)).map((i) => [`n${i}`, toneOf(i)!]));
      return [
        { label: "odd", nodes: O.map(node), arrows: O.slice(1).map(() => "right" as const), pointers: { odd: `n${O[O.length - 1]}` }, tones: tones(O) },
        { label: "even", nodes: [...evenNodes.map(node), END], arrows: evenNodes.map((i, k) => (!evenLinked && k === E.length - 1 ? null : "right" as const)),
          pointers: { ...(E.length ? { evenHead: `n${E[0]}` } : {}), even: evenNone ? "end" : `n${E[E.length - 1]}` }, tones: tones(evenNodes) },
      ];
    };
    t.step({ line: 5, array: [], lists: draw(), vars: {},
      message: n > 1 ? `Split the list into two chains. odd starts on the 1st node (the ${values[0]}), even on the 2nd (the ${values[1]}), and evenHead remembers where the even chain starts, for joining at the end.`
        : `Only one node: odd is on the ${values[0]} and even is none. There's nothing to move.` });
    let round = 0;
    while (true) {
      t.op();
      const evenId = evenNone ? -1 : E[E.length - 1];
      if (evenId < 0 || r >= n) {
        t.step({ line: 6, array: [], lists: draw(), vars: { round },
          message: evenId < 0 ? "even is none: every node is in a chain." : `even.next is none: the ${values[evenId]} was the last node. Both chains are complete.` });
        break;
      }
      round++;
      const ask = round === 1 ? { ask: { q: `odd is on the ${values[O[O.length - 1]]}, even is on the ${values[evenId]}. Which node joins the odd chain next?`, options: ["even.next, the node after even", "even itself", "two nodes after even"], answer: 0 } } : {};
      const take = r; O.push(r); r++;
      t.step({ ...ask, line: 8, array: [], lists: draw({ [take]: "active" }, false), vars: { round },
        message: `The next odd-position node is even.next, the ${values[take]} (${ord(take + 1)}). Link odd to it and move odd there. even.next still points at the ${values[take]} for a moment; the next line fixes that.` });
      if (r < n) {
        const take2 = r; E.push(r); r++;
        t.step({ line: 10, array: [], lists: draw({ [take2]: "active" }), vars: { round },
          message: `The node after the new odd, the ${values[take2]} (${ord(take2 + 1)}), is the next even one. Link even to it and move even there.` });
      } else {
        evenNone = true;
        t.step({ line: 10, array: [], lists: draw(), vars: { round },
          message: `odd.next is none (the ${values[take]} was the last node), so even.next becomes none and even moves to none.` });
      }
    }
    t.step({ ask: { q: "Both chains are built. What should the last odd node point to?", options: ["evenHead, the first even node", "none", "even, the last even node"], answer: 0 },
      line: 11, array: [], vars: {},
      lists: [{ nodes: [...O.map(node), ...E.map(node), END], arrows: [...O, ...E].map(() => "right" as const), pointers: { head: "n0", ...(E.length ? { evenHead: `n${E[0]}` } : {}) },
        tones: Object.fromEntries([...O, ...E].map((i) => [`n${i}`, tone(i)])) }],
      message: E.length ? `Join the chains: point the last odd node, the ${values[O[O.length - 1]]}, at evenHead, the ${values[E[0]]}.` : "There are no even nodes, so odd.next becomes none." });
    t.step({ line: 12, array: [], vars: {}, done: "found",
      lists: [{ nodes: [...O.map(node), ...E.map(node), END], arrows: [...O, ...E].map(() => "right" as const), pointers: { head: "n0" }, tones: Object.fromEntries([...O, ...E].map((i) => [`n${i}`, "settled" as Tone])) }],
      message: `Return head: ${[...O, ...E].map((i) => values[i]).join(" → ")} → none. One pass, O(n) time, and no new nodes or lists, just four pointers: O(1) space.` });
  },
};

export const approaches = { arrays, chains };
