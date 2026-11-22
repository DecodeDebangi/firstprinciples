import { type Approach, type Tone } from "@firstprinciples/ui";
import { chain, listFields, listPrepare, makeLinks, walk } from "../0024-swap-nodes-in-pairs/steps";

export type Input = { head: number[] };
export const example: Input = { head: [1, 2, 3, 4, 5, 6] };
export const fields = listFields;
export const prepare = listPrepare;

const array: Approach<Input> = {
  id: "array",
  name: "Put the nodes in an array, link from both ends",
  code: `function reorderList(head)
    nodes ← every node of the list, in order
    i, j ← 0, length(nodes) - 1
    while i < j
        nodes[i].next ← nodes[j]  // front → back
        i += 1
        if i = j
            break
        nodes[j].next ← nodes[i]  // back → front
        j -= 1
    nodes[i].next ← none
`,
  run({ head: vals }, t) {
    const { L, head, ids } = makeLinks(vals);
    if (!ids.length) { t.step({ line: 2, array: [], lists: [chain(L, head, { label: "list" })], vars: {}, done: "found", message: "An empty list: nothing to reorder." }); return; }
    ids.forEach(() => t.op());
    t.step({ line: 2, array: ids.map((id) => L.val[id]), lists: [chain(L, head, { label: "list", pointers: { head } })], vars: {},
      message: "The new order takes from the front, then the back, then the front again. An array of the nodes gives both ends directly. Holding every node costs O(n) memory." });
    let i = 0, j = ids.length - 1;
    const order = [ids[0]];
    while (i < j) {
      t.op();
      order.push(ids[j]); i++;
      if (i === j) break;
      order.push(ids[i]); j--;
    }
    order.forEach((id, k) => { L.next[id] = order[k + 1] ?? null; });
    t.step({ line: 11, array: ids.map((id) => L.val[id]), lists: [chain(L, head, { label: "list", pointers: { head }, tones: Object.fromEntries(order.map((id) => [id, "settled" as Tone])) })], vars: {}, done: "found",
      message: `Linked front, back, front, back… from both ends of the array: ${order.map((id) => L.val[id]).join(" → ")}. O(n) time, but O(n) extra space for the array.` });
  },
};

const threeSteps: Approach<Input> = {
  id: "threeSteps",
  name: "Find the middle, reverse the back half, weave",
  code: `function reorderList(head)
    slow, fast ← head, head
    while fast.next ≠ none and fast.next.next ≠ none
        slow, fast ← slow.next, fast.next.next
    second ← reverse(slow.next)
    slow.next ← none  // cut the list in two
    first ← head
    while second ≠ none
        a, b ← first.next, second.next
        first.next ← second
        second.next ← a
        first, second ← a, b
`,
  run({ head: vals }, t) {
    const { L, head, ids } = makeLinks(vals);
    if (ids.length < 3) { t.step({ line: 2, array: [], lists: [chain(L, head, { label: "list" })], vars: {}, done: "found", message: "With fewer than 3 nodes the order doesn't change." }); return; }
    let slow = head!, fast = head!;
    while (L.next[fast] && L.next[L.next[fast]!]) { t.op(); slow = L.next[slow]!; fast = L.next[L.next[fast]!]!; }
    t.step({ line: 4, array: [], lists: [chain(L, head, { label: "list", pointers: { slow, fast } })], vars: {},
      message: `Step 1, find the middle: fast moves two nodes for each one slow moves, so when fast reaches the end, slow is at the middle, ${L.val[slow]}. (See the fast and slow pointers read.)` });
    // Reverse the back half.
    let prev: string | null = null, cur = L.next[slow];
    while (cur) { t.op(); const nx = L.next[cur]; L.next[cur] = prev; prev = cur; cur = nx; }
    L.next[slow] = null;
    let first: string | null = head, second: string | null = prev;
    const rows = (p1: Record<string, string | null>, p2: Record<string, string | null>, tones: Record<string, Tone> = {}) => [chain(L, head, { label: "first", pointers: p1, tones }), chain(L, second, { label: "second", pointers: p2, tones })];
    t.step({ line: 6, array: [], lists: rows({ first }, { second }), vars: {},
      message: `Step 2: cut after the middle and reverse the back half, so its last node comes first. Now the order wanted is simply: take one from each row in turn.` });
    let asked = false;
    const woven: string[] = [];
    while (second) {
      t.op();
      const a = L.next[first!], b: string | null = L.next[second];
      const ask = !asked ? (asked = true, { ask: { q: `first is at ${L.val[first!]} and second at ${L.val[second]}. After this round, what comes right after ${L.val[first!]}?`, options: [...new Set([String(L.val[second]), a ? String(L.val[a]) : "none", "none"])], answer: 0 } }) : {};
      L.next[first!] = second; L.next[second] = a;
      woven.push(first!, second);
      const moved = second;
      first = a; second = b;
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 12, array: [], lists: rows({ first }, { second }, { ...Object.fromEntries(woven.map((x) => [x, "settled" as Tone])), [moved]: "found" }), vars: {},
        message: `Step 3, weave: hang ${L.val[moved]} after ${L.val[woven[woven.length - 2]]}, and point it on to ${a ? L.val[a] : "none"}, the next node of the first row.` });
    }
    const out = walk(L, head);
    t.step({ line: 12, array: [], lists: [chain(L, head, { label: "list", pointers: { head }, tones: Object.fromEntries(out.map((x) => [x, "settled" as Tone])) })], vars: {}, done: "found",
      message: `Reordered: ${out.map((x) => L.val[x]).join(" → ")}. Three passes of pointer changes, no array: O(n) time, O(1) extra space.` });
  },
};

export const approaches = { array, threeSteps };
