import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { snap } from "../57-binary-search-trees/steps";

/** A sorted list of distinct values. */
export type SortedInput = { nums: number[] };
export const sortedExample: SortedInput = { nums: [1, 3, 4, 6, 7, 8, 10] };
export const sortedFields: InputField[] = [{ key: "nums", label: "sorted values", kind: "numbers" }];
export function sortedPrepare(raw: SortedInput): Prepared<SortedInput> {
  if (raw.nums.length < 1 || raw.nums.length > 15) return { error: "Use 1 to 15 values so the tree fits." };
  if (raw.nums.some((x, i) => !Number.isInteger(x) || (i > 0 && raw.nums[i - 1] >= x))) return { error: "Use whole numbers in strictly increasing order." };
  return { input: raw };
}

const heightOf = (by: Map<string, TreeNodeData>, id: string | null): number => (id ? 1 + Math.max(heightOf(by, by.get(id)!.left), heightOf(by, by.get(id)!.right)) : 0);
const view = (root: string | null, nodes: TreeNodeData[], tones: Record<string, Tone> = {}, ptr?: string): TreeData[] => [{ root, nodes: snap(nodes), tones: { ...tones }, pointers: ptr ? { node: ptr } : {} }];

/* ---------- Inserting sorted values one by one: a chain ---------- */
export const chain: Approach<SortedInput> = {
  id: "chain",
  name: "Insert sorted values one by one",
  code: `function buildByInserting(nums)
    root ← none
    for each x in nums
        root ← insertIntoBST(root, x)
    return root
`,
  run({ nums }, t) {
    const nodes: TreeNodeData[] = [], by = new Map<string, TreeNodeData>();
    let root: string | null = null;
    t.step({ line: 2, array: [], grid: { title: "nums", rows: [nums] }, trees: view(null, []), vars: { height: 0 },
      message: "Build a BST by inserting the values in the order given. Here they arrive sorted, smallest first, which happens a lot in practice." });
    nums.forEach((x, k) => {
      let id = root, parent: string | null = null, steps = 0;
      while (id) { t.op(); steps++; parent = id; id = x < (by.get(id)!.val as number) ? by.get(id)!.left : by.get(id)!.right; }
      const n: TreeNodeData = { id: `c${k}`, val: x, left: null, right: null };
      nodes.push(n); by.set(n.id, n);
      if (!parent) root = n.id; else if (x < (by.get(parent)!.val as number)) by.get(parent)!.left = n.id; else by.get(parent)!.right = n.id;
      const h = heightOf(by, root);
      t.step({ line: 4, array: [], grid: { title: "nums", rows: [nums], tones: { [`0,${k}`]: "active" } }, trees: view(root, nodes, { [n.id]: "found" }, n.id), vars: { inserted: x, "walked past": steps, height: h },
        message: k === 0 ? `${x} becomes the root.` : `${x} is bigger than everything already in the tree, so its search goes right past ${steps === 1 ? "the root" : `all ${steps} nodes`} and it lands at the bottom. Height ${h}.` });
    });
    const h = heightOf(by, root);
    t.step({ line: 5, array: [], grid: { title: "nums", rows: [nums] }, trees: view(root, nodes, Object.fromEntries(nodes.map((n) => [n.id, "miss" as Tone]))), vars: { height: h }, done: "notfound",
      message: `A valid BST, but it's a chain: height ${h} for ${nums.length} values. Searching it is a walk down a list, O(n), and building it took 0 + 1 + … + ${nums.length - 1} steps: O(n²).` });
  },
};

/* ---------- Middle as root ---------- */
function middleBuild(nums: number[], t: Parameters<Approach<SortedInput>["run"]>[1], copy: boolean) {
  const nodes: TreeNodeData[] = [], by = new Map<string, TreeNodeData>();
  let root: string | null = null, asked = 0, copied = 0;
  const L = copy ? { mid: 5, ret: 10 } : { mid: 7, ret: 10 };
  t.step({ line: 2, array: [], grid: { title: "nums", rows: [nums] }, trees: view(null, []), vars: {},
    message: `The middle value should be the root: then half the values go left and half go right, and the same is true inside each half. That keeps the tree as short as possible.` });
  const go = (lo: number, hi: number, parent: string | null, side: "left" | "right" | null): string | null => {
    t.op();
    if (lo > hi) return null;
    if (copy) { t.op(hi - lo + 1); copied += hi - lo + 1; }
    // The copy version takes floor(length / 2) of its slice; the index version floor((lo + hi) / 2).
    const mid = copy ? lo + Math.floor((hi - lo + 1) / 2) : Math.floor((lo + hi) / 2);
    const opts = [...new Set([nums[mid], nums[lo], nums[hi]].map(String))];
    const q = asked < 3 && opts.length > 1 ? (asked++, { ask: { q: `Building from ${nums.slice(lo, hi + 1).join(", ")}: which value becomes this subtree's root?`, options: opts, answer: 0 } }) : {};
    const n: TreeNodeData = { id: `m${mid}`, val: nums[mid], left: null, right: null };
    nodes.push(n); by.set(n.id, n);
    if (!parent) root = n.id; else by.get(parent)![side!] = n.id;
    const tones = Object.fromEntries(nums.map((_, k) => [`0,${k}`, (k < lo || k > hi ? "discard" : k === mid ? "found" : "side-a") as Tone]));
    t.step({ ...q, line: L.mid, array: [], grid: { title: "nums", rows: [nums], tones }, trees: view(root, nodes, { [n.id]: "found" }, n.id), vars: { lo, hi, mid, ...(copy ? { "values copied": copied } : {}) },
      message: `${copy ? `Copy out ${nums.slice(lo, hi + 1).join(", ")} (${hi - lo + 1} value${hi === lo ? "" : "s"}). ` : `Positions ${lo} to ${hi}. `}The middle is ${nums[mid]}: make it ${parent ? `${by.get(parent)!.val}'s ${side} child` : "the root"}. ${mid > lo ? `${nums.slice(lo, mid).join(", ")} ${mid - lo === 1 ? "goes" : "go"} left` : "Nothing goes left"}, ${mid < hi ? `${nums.slice(mid + 1, hi + 1).join(", ")} ${hi - mid === 1 ? "goes" : "go"} right` : "nothing goes right"}.` });
    go(lo, mid - 1, n.id, "left");
    go(mid + 1, hi, n.id, "right");
    return n.id;
  };
  go(0, nums.length - 1, null, null);
  const h = heightOf(by, root);
  t.step({ line: L.ret, array: [], grid: { title: "nums", rows: [nums] }, trees: view(root, nodes, Object.fromEntries(nodes.map((n) => [n.id, "settled" as Tone]))), vars: { height: h, ...(copy ? { "values copied": copied } : {}) }, done: "found",
    message: copy
      ? `Height ${h} for ${nums.length} values, as short as possible. But every level of the recursion copied out every value again: ${copied} copies, O(n log n).`
      : `Height ${h} for ${nums.length} values: every node's two sides differ in height by at most 1. Each value was placed once, using positions instead of copies: O(n).` });
}

export const middleCopy: Approach<SortedInput> = {
  id: "copy",
  name: "Middle as root, copying each half",
  code: `function sortedArrayToBST(nums)
    if nums is empty
        return none
    mid ← floor(length(nums) / 2)
    node ← new node(nums[mid])
    left ← nums[0..mid - 1]
    right ← nums[mid + 1..end]
    node.left ← sortedArrayToBST(left)
    node.right ← sortedArrayToBST(right)
    return node
`,
  run({ nums }, t) { middleBuild(nums, t, true); },
};
export const middleIdx: Approach<SortedInput> = {
  id: "indexes",
  name: "Middle as root, using positions",
  code: `function sortedArrayToBST(nums)
    return build(nums, 0, length(nums) - 1)
function build(nums, lo, hi)
    if lo > hi
        return none
    mid ← floor((lo + hi) / 2)
    node ← new node(nums[mid])
    node.left ← build(nums, lo, mid - 1)
    node.right ← build(nums, mid + 1, hi)
    return node
`,
  run({ nums }, t) { middleBuild(nums, t, false); },
};
