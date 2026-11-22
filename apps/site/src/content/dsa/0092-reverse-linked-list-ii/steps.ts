import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { chain, makeLinks, walk } from "../0024-swap-nodes-in-pairs/steps";

export type Input = { head: number[]; left: number; right: number };
export const example: Input = { head: [3, 8, 5, 1, 9], left: 2, right: 4 };
export const fields: InputField[] = [
  { key: "head", label: "head (values)", kind: "numbers" },
  { key: "left", label: "left (from 1)", kind: "number" },
  { key: "right", label: "right", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.head.length;
  if (!n || n > 8) return { error: "Use 1 to 8 values so the list fits." };
  if (!Number.isInteger(raw.left) || !Number.isInteger(raw.right) || raw.left < 1 || raw.right > n || raw.left > raw.right) return { error: `Need 1 ≤ left ≤ right ≤ ${n} (positions count from 1).` };
  return { input: raw };
}
const span = (ids: string[], l: number, r: number, tn: Tone) => Object.fromEntries(ids.slice(l - 1, r).map((id) => [id, tn]));

const values: Approach<Input> = {
  id: "values",
  name: "Copy the stretch's values, write them back reversed",
  code: `function reverseBetween(head, left, right)
    vals ← values at positions left to right
    node ← the node at position left
    for each v in vals, last to first
        node.val ← v
        node ← node.next
    return head
`,
  run({ head: hv, left, right }, t) {
    const { L, head, ids } = makeLinks(hv);
    const vals = ids.slice(left - 1, right).map((id) => { t.op(); return L.val[id]; });
    t.step({ line: 2, array: [...vals], lists: [chain(L, head, { label: "list", tones: span(ids, left, right, "compare") })], vars: { left, right },
      message: `Copy the values at positions ${left} to ${right} into a separate list: ${vals.join(", ")}. Then write them back into the same nodes in reverse.` });
    [...vals].reverse().forEach((v, k) => { t.op(); L.val[ids[left - 1 + k]] = v; });
    t.step({ line: 5, array: [...vals].reverse(), lists: [chain(L, head, { label: "list", tones: span(ids, left, right, "found") })], vars: {}, done: "found",
      message: `Written back reversed. It works, but it changes the values instead of the links, and holds a copy of the whole stretch: O(n) extra space. If nodes carried more than one value, every field would have to be copied.` });
  },
};

const insertFront: Approach<Input> = {
  id: "insertFront",
  name: "In place: move each node to the front of the stretch",
  code: `function reverseBetween(head, left, right)
    dummy ← new ListNode(), dummy.next ← head
    prev ← dummy
    repeat left - 1 times
        prev ← prev.next  // before the stretch
    cur ← prev.next  // it will end up last
    repeat right - left times
        move ← cur.next
        cur.next ← move.next  // unhook move
        move.next ← prev.next
        prev.next ← move  // move goes to the front
    return dummy.next
`,
  run({ head: hv, left, right }, t) {
    const { L, ids } = makeLinks(hv);
    const D = "dummy";
    L.next[D] = ids[0]; L.val[D] = 0;
    let prev = D;
    for (let k = 0; k < left - 1; k++) { t.op(); prev = L.next[prev]!; }
    const cur = L.next[prev]!;
    const stretch = new Set(ids.slice(left - 1, right));
    const row = (p: Record<string, string | null>, tones: Record<string, Tone>) => [chain(L, L.next[D], { label: "list", dummy: true, pointers: p, tones })];
    const base = () => Object.fromEntries([...stretch].map((id) => [id, "side-a" as Tone]));
    t.step({ line: 6, array: [], lists: row({ prev, cur }, { ...base(), [cur]: "active" }), vars: { left, right },
      message: `Walk ${prev === D ? "zero steps: the stretch starts at the head, so prev is the dummy" : `to prev, the node before the stretch (${L.val[prev]})`}. cur is the stretch's first node, ${L.val[cur]}: it will end up last. Then, ${right - left} time${right - left === 1 ? "" : "s"}, take the node after cur and move it to the front of the stretch.` });
    let asked = false;
    for (let k = 0; k < right - left; k++) {
      t.op();
      const move = L.next[cur]!;
      const front = L.next[prev]!;
      const ask = !asked && k > 0 ? (asked = true, { ask: { q: `The stretch now starts ${walk(L, L.next[prev]).slice(0, k + 2).map((x) => L.val[x]).join(" → ")}. Which node moves to the front next?`, options: [...new Set([String(L.val[move]), String(L.val[front]), String(L.val[cur])])], answer: 0 } }) : {};
      L.next[cur] = L.next[move]; L.next[move] = front; L.next[prev] = move;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 11, array: [], lists: row({ prev, cur, move }, { ...base(), [move]: "found", [cur]: "active" }), vars: { move: L.val[move] },
        message: `Unhook ${L.val[move]} (the node after cur) and put it right after prev, in front of ${L.val[front]}. Three links change. cur itself never moves: nodes jump in front of it, so it ends up one place further back.` });
    }
    const out = walk(L, L.next[D]);
    t.step({ line: 12, array: [], lists: row({ head: out[0] }, Object.fromEntries(out.map((id) => [id, (stretch.has(id) ? "found" : "settled") as Tone]))), vars: {}, done: "found",
      message: `Positions ${left} to ${right} are reversed, by links alone, in one pass: O(n) time, O(1) extra space. ${left === 1 ? "The dummy meant starting at the head needed no special case." : "With the dummy in front, left = 1 would need no special case either."}` });
  },
};

export const approaches = { values, insertFront };
