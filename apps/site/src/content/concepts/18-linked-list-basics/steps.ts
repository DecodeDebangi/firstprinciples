import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };
export const example: Input = { nums: [3, 8, 5, 1], target: 5 };
export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "target", label: "find", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1) return { error: "Use at least one value." };
  if (raw.nums.length > 7) return { error: "Use at most 7 values so the chain fits." };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const row = (nodes: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [...nodes, END], arrows: nodes.map(() => "right" as const), ...extra });
const nodesOf = (nums: number[]): N[] => nums.map((v, i) => ({ id: `n${i}`, val: v }));
const upTo = (k: number, tone: Tone) => Object.fromEntries(Array.from({ length: k }, (_, i) => [`n${i}`, tone]));

const walk: Approach<Input> = {
  id: "walk",
  name: "Walk the list: count the nodes",
  code: `function length(head)
    count ← 0
    curr ← head
    while curr ≠ none
        count += 1
        curr ← curr.next
    return count
`,
  run({ nums }, t) {
    const ns = nodesOf(nums), n = nums.length;
    t.step({ line: 3, array: [], lists: [row(ns, { pointers: { head: "n0", curr: "n0" } })], vars: { count: 0 },
      message: `A linked list is a chain of nodes. Each node holds a value and a pointer called next, which says where the following node is. The last node points to none. All you're given is head, the first node.` });
    for (let i = 0; i < n; i++) {
      t.op();
      t.step({ line: 5, array: [], lists: [row(ns, { pointers: { head: "n0", curr: `n${i}` }, tones: { ...upTo(i, "visited"), [`n${i}`]: "active" } })],
        vars: { count: i + 1 }, message: `curr is on ${nums[i]}: count it. count = ${i + 1}.` });
      const next = i + 1 < n ? `n${i + 1}` : "end";
      t.step({
        ...(i === 0 && n > 2 ? { ask: { q: `curr is on ${nums[0]}. Where does curr ← curr.next take it?`, options: [`To ${nums[1]}, the node after it`, `To ${nums[n - 1]}, the last node`, "To none"], answer: 0 } } : {}),
        line: 6, array: [], lists: [row(ns, { pointers: { head: "n0", curr: next }, tones: { ...upTo(i + 1, "visited"), ...(next !== "end" ? { [next]: "compare" } : {}) } })],
        vars: { count: i + 1 }, message: i + 1 < n ? `Follow ${nums[i]}'s next pointer: it leads to ${nums[i + 1]}.` : `${nums[i]}'s next is none: the chain ends here.` });
    }
    t.step({ line: 7, array: [], lists: [row(ns, { pointers: { head: "n0", curr: "end" }, tones: upTo(n, "settled") })], vars: { count: n }, done: "found",
      message: `curr is none, so the loop stops. The length is ${n}. There's no shortcut: the only way to know the length is to walk every node, which is O(n).` });
  },
};

const find: Approach<Input> = {
  id: "find",
  name: "Find a value",
  code: `function find(head, target)
    curr ← head
    while curr ≠ none
        if curr.val = target
            return curr
        curr ← curr.next
    return none
`,
  run({ nums, target }, t) {
    const ns = nodesOf(nums), n = nums.length;
    t.step({ line: 2, array: [], lists: [row(ns, { pointers: { head: "n0", curr: "n0" } })], vars: { target },
      message: `Look for ${target}. A linked list has no indexes to jump to, so start at head and check one node at a time.` });
    for (let i = 0; i < n; i++) {
      t.op();
      const hit = nums[i] === target;
      t.step({
        ...(i === 0 ? { ask: { q: `curr is on ${nums[0]} and the target is ${target}. What happens?`, options: hit ? ["Return this node", "Move to the next node"] : ["Move to the next node", "Return this node"], answer: 0 } } : {}),
        line: 4, array: [], lists: [row(ns, { pointers: { head: "n0", curr: `n${i}` }, tones: { ...upTo(i, "discard"), [`n${i}`]: hit ? "found" : "compare" } })],
        vars: { target, "curr.val": nums[i] }, message: hit ? `${nums[i]} = ${target}: found it.` : `${nums[i]} ≠ ${target}.` });
      if (hit) {
        t.step({ line: 5, array: [], lists: [row(ns, { pointers: { head: "n0", curr: `n${i}` }, tones: { ...upTo(i, "discard"), [`n${i}`]: "found" } })], vars: { target }, done: "found",
          message: `Return the node holding ${target}. It took ${i + 1} step${i ? "s" : ""}; in the worst case, the value is last or missing and it takes all n: O(n).` });
        return;
      }
      const next = i + 1 < n ? `n${i + 1}` : "end";
      t.step({ line: 6, array: [], lists: [row(ns, { pointers: { head: "n0", curr: next }, tones: upTo(i + 1, "discard") })], vars: { target },
        message: i + 1 < n ? `Move on to ${nums[i + 1]}.` : `${nums[i]}'s next is none.` });
    }
    t.step({ line: 7, array: [], lists: [row(ns, { pointers: { head: "n0", curr: "end" }, tones: upTo(n, "discard") })], vars: { target }, done: "notfound",
      message: `Reached none without finding ${target}: return none. Every node was checked: O(n).` });
  },
};

export const approaches = { walk, find };
