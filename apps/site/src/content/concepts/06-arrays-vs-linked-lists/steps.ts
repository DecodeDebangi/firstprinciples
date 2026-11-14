import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; x: number; k: number };

export const example: Input = { nums: [4, 9, 2, 7, 5], x: 8, k: 3 };

export const fields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "x", label: "insert x", kind: "number" },
  { key: "k", label: "read index k", kind: "number" },
];

const uniq = (o: string[]) => o.filter((v, i, a) => a.indexOf(v) === i);

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length > 7) return { error: "Use at most 7 values so both views fit." };
  if (raw.k < 0 || raw.k >= raw.nums.length) return { error: `k must be an index from 0 to ${raw.nums.length - 1}.` };
  return { input: raw };
}

const chain = (vals: number[], ids: string[], pointers: Record<string, string | null> = {}, tones: Record<string, Tone> = {}): ListRow => ({
  nodes: [...vals.map((v, i) => ({ id: ids[i], val: v })), { id: "none", val: "none", kind: "null" as const }],
  arrows: vals.map(() => "right" as const),
  pointers, tones,
});

const arrayInsert: Approach<Input> = {
  id: "array-insert",
  name: "Array: insert at the front",
  code: `function insertFront(arr, x)
  arr.push(none)  // make room at the end
  for i ← length(arr) - 1 down to 1
    arr[i] ← arr[i - 1]  // shift right
  arr[0] ← x
`,
  run({ nums, x }, t) {
    const a: (number | string)[] = [...nums, "_"];
    t.step({ line: 2, array: [...a], tones: { [a.length - 1]: "active" }, vars: { x },
      message: "An array stores its items side by side in one block of memory. To make room at the front, every item has to move one place right." });
    for (let i = a.length - 1; i > 0; i--) {
      t.op();
      a[i] = a[i - 1];
      t.step({ ...(i === a.length - 1 ? { ask: { q: `To insert at the front of ${nums.length} items, how many existing items have to move?`, options: uniq([`All ${nums.length}`, "Just one", "none"]), answer: 0 } } : {}),
        line: 4, array: [...a], pointers: { i }, tones: { [i]: "compare" }, badge: { at: i, text: "shift" }, vars: { x, moved: a.length - i },
        message: `Copy ${a[i]} one place right, into slot ${i}.` });
    }
    t.op();
    a[0] = x;
    t.step({ line: 5, array: [...a], tones: { 0: "found" }, vars: { x, moved: nums.length }, done: "found",
      message: `Write ${x} into slot 0. That took ${nums.length} moves: inserting at the front of an array is O(n).` });
  },
};

const listInsert: Approach<Input> = {
  id: "list-insert",
  name: "Linked list: insert at the front",
  code: `function insertFront(head, x)
  node ← ListNode(x)
  node.next ← head
  return node  // the new head
`,
  run({ nums, x }, t) {
    const ids = nums.map((_, i) => `n${i}`);
    t.step({ line: 2, array: [], lists: [chain(nums, ids, { head: ids[0] ?? "none" })], vars: { x },
      message: "A linked list stores each item in its own node, anywhere in memory, with a pointer to the next one. Nothing has to move." });
    t.op();
    t.step({ line: 3, array: [], lists: [{ ...chain([x, ...nums], ["new", ...ids], { node: "new", head: ids[0] ?? "none" }, { new: "active" }), arrows: [null, ...nums.map(() => "right" as const)] }], vars: { x },
      message: `Create a node for ${x}. It isn't linked to anything yet.` });
    t.op();
    t.step({ ask: { q: `The list has ${nums.length} nodes. How many of them have to move to put ${x} in front?`, options: uniq(["none", `All ${nums.length}`]), answer: 0 },
      line: 3, array: [], lists: [chain([x, ...nums], ["new", ...ids], { node: "new", head: ids[0] ?? "none" }, { new: "compare" })], vars: { x },
      message: `Point the new node at the old head. One pointer written.` });
    t.step({ line: 4, array: [], lists: [chain([x, ...nums], ["new", ...ids], { head: "new" }, { new: "found" })], vars: { x }, done: "found",
      message: `Return it as the new head. Two pointer writes, whatever the list's length: O(1).` });
  },
};

const arrayRead: Approach<Input> = {
  id: "array-read",
  name: "Array: read item k",
  code: `function get(arr, k)
  return arr[k]  // address = start + k * size
`,
  run({ nums, k }, t) {
    t.step({ line: 2, array: nums, vars: { k }, message: "Every slot is the same size and the slots are consecutive, so item k's address can be computed directly." });
    t.op();
    t.step({ ask: { q: `How many steps does it take to reach item ${k}?`, options: uniq(["1, a direct jump", `${k + 1}, walking from the start`]), answer: 0 },
      line: 2, array: nums, pointers: { k }, tones: { [k]: "found" }, badge: { at: k, text: `start + ${k}×size` }, vars: { k, value: nums[k] }, done: "found",
      message: `Jump straight to slot ${k}: ${nums[k]}. One step, whatever k is: O(1).` });
  },
};

const listRead: Approach<Input> = {
  id: "list-read",
  name: "Linked list: read item k",
  code: `function get(head, k)
  node ← head
  repeat k times
    node ← node.next  // follow the chain
  return node.val
`,
  run({ nums, k }, t) {
    const ids = nums.map((_, i) => `n${i}`);
    const visited = (upto: number): Record<string, Tone> => Object.fromEntries(ids.slice(0, upto).map((id) => [id, "visited" as Tone]));
    t.op();
    t.step({ ask: { q: `Where is item ${k} stored in memory?`, options: ["We can't know without following the pointers", `At start + ${k} × size`], answer: 0 },
      line: 2, array: [], lists: [chain(nums, ids, { node: ids[0] }, { [ids[0]]: "active" })], vars: { k, step: 0 },
      message: "Nodes are scattered in memory, so there's no way to compute where node k is. Start at the head and follow pointers." });
    for (let s = 1; s <= k; s++) {
      t.op();
      t.step({ line: 4, array: [], lists: [chain(nums, ids, { node: ids[s] }, { ...visited(s), [ids[s]]: "active" })], vars: { k, step: s },
        message: `Follow next: now at ${nums[s]} (item ${s}).` });
    }
    t.step({ line: 5, array: [], lists: [chain(nums, ids, { node: ids[k] }, { ...visited(k), [ids[k]]: "found" })], vars: { k, value: nums[k] }, done: "found",
      message: `Item ${k} is ${nums[k]}, after ${k} hop${k === 1 ? "" : "s"}. Reading by index is O(n) in a linked list.` });
  },
};

export const approaches = { "array-insert": arrayInsert, "list-insert": listInsert, "array-read": arrayRead, "list-read": listRead };

const sizes = [8, 16, 32, 48, 64, 96, 128];
const vals = (n: number) => Array.from({ length: n }, (_, i) => i);
export const growthInsert = measureGrowth([{ approach: arrayInsert, slot: 1 }, { approach: listInsert, slot: 2 }], (n) => ({ nums: vals(n), x: -1, k: 0 }), sizes);
export const growthRead = measureGrowth([{ approach: listRead, slot: 1 }, { approach: arrayRead, slot: 2 }], (n) => ({ nums: vals(n), x: -1, k: n - 1 }), sizes);
