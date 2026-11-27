import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/** A sorted linked list, given as its values. */
export type Input = { nums: number[] };
export const example: Input = { nums: [1, 3, 4, 6, 7, 8, 10] };
export const fields: InputField[] = [{ key: "nums", label: "sorted list", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.nums.length || raw.nums.length > 12) return { error: "Use 1 to 12 values so the list and tree fit." };
  if (raw.nums.some((x, i) => i > 0 && raw.nums[i - 1] >= x)) return { error: "Use values in strictly increasing order." };
  return { input: raw };
}
const listRow = (nums: number[], tones: Record<string, Tone>, ptrs: Record<string, string | null>): ListRow[] =>
  [{ label: "list", nodes: nums.map((v, i) => ({ id: `l${i}`, val: v })), arrows: nums.slice(1).map(() => "right" as const), tones, pointers: ptrs }];
class Grow {
  nodes: TreeNodeData[] = []; by = new Map<string, TreeNodeData>(); root: string | null = null;
  add(v: number, parent: string | null, side: "left" | "right" | null) { const n: TreeNodeData = { id: `t${v}`, val: v, left: null, right: null }; this.nodes.push(n); this.by.set(n.id, n); if (!parent) this.root = n.id; else this.by.get(parent)![side!] = n.id; return n.id; }
  view(tones: Record<string, Tone> = {}): TreeData[] { return [{ root: this.root, nodes: this.nodes.map((n) => ({ ...n })), tones }]; }
}
const seg = (lo: number, hi: number, tone: Tone) => Object.fromEntries(Array.from({ length: Math.max(0, hi - lo) }, (_, k) => [`l${lo + k}`, tone]));

const middle: Approach<Input> = {
  id: "middle", name: "Find the middle with slow and fast pointers, every time",
  code: `function sortedListToBST(head)
    return build(head, none)
function build(start, stop)  // stop excluded
    if start = stop
        return none
    slow, fast ← start, start
    while fast ≠ stop and fast.next ≠ stop
        slow ← slow.next
        fast ← fast.next.next
    node ← new node(slow.val)  // the middle
    node.left ← build(start, slow)
    node.right ← build(slow.next, stop)
    return node
`,
  run({ nums }, t) {
    const g = new Grow();
    let asked = 0;
    if (t.record) t.step({ line: 2, array: [], lists: listRow(nums, {}, {}), trees: g.view(), vars: {},
      message: "As with a sorted array, the middle value should be the root, with each half built the same way below it. But a linked list can't jump to its middle: it has to walk there, with a slow pointer that moves one step while a fast one moves two." });
    const go = (lo: number, hi: number, parent: string | null, side: "left" | "right" | null) => {
      t.op();
      if (lo >= hi) return;
      let slow = lo, fast = lo;
      while (fast !== hi && fast + 1 !== hi) { t.op(); slow++; fast += 2; }
      const opts = [...new Set([nums[slow], nums[lo], nums[hi - 1]].map(String))];
      const ask = t.record && asked < 2 && opts.length > 1 ? (asked++, { ask: { q: `Building from ${nums.slice(lo, hi).join(", ")}: where does the slow pointer stop?`, options: opts, answer: 0 } }) : {};
      const id = g.add(nums[slow], parent, side);
      if (t.record) t.step({ ...ask, line: 10, array: [], lists: listRow(nums, { ...seg(lo, hi, "side-a"), [`l${slow}`]: "found" }, { slow: `l${slow}` }), trees: g.view({ [id]: "found" }), vars: { stretch: `${nums[lo]}…${nums[hi - 1]}`, walked: slow - lo },
        message: `In ${nums.slice(lo, hi).join(", ")}, the slow pointer walks ${slow - lo} step${slow - lo === 1 ? "" : "s"} to the middle, ${nums[slow]}, which becomes ${parent ? `${g.by.get(parent)!.val}'s ${side} child` : "the root"}.` });
      go(lo, slow, id, "left");
      go(slow + 1, hi, id, "right");
    };
    go(0, nums.length, null, null);
    if (t.record) t.step({ line: 13, array: [], lists: listRow(nums, {}, {}), trees: g.view(Object.fromEntries(g.nodes.map((n) => [n.id, "settled" as Tone]))), vars: { nodes: nums.length }, done: "found",
      message: "Balanced. But every level of the recursion walked over the list again to find its middles: about n/2 steps per level, over log n levels, O(n log n)." });
  },
};

const inorder: Approach<Input> = {
  id: "inorder", name: "Build in in-order, reading the list once",
  code: `function sortedListToBST(head)
    n ← length of the list
    cur ← head
    return build(0, n − 1)
function build(lo, hi)  // positions lo..hi
    if lo > hi
        return none
    mid ← floor((lo + hi) / 2)
    left ← build(lo, mid − 1)
    node ← new node(cur.val)  // cur is at mid
    cur ← cur.next
    node.left ← left
    node.right ← build(mid + 1, hi)
    return node
`,
  run({ nums }, t) {
    const g = new Grow(), n = nums.length;
    let cur = 0, asked = 0;
    t.op(n);
    if (t.record) t.step({ line: 3, array: [], lists: listRow(nums, {}, { cur: "l0" }), trees: g.view(), vars: { n },
      message: `Turn it around: an in-order walk of the finished tree visits the values in sorted order, the same order as the list. So build the tree in in-order (left subtree, node, right subtree), and each new node simply takes the next list value. Count the list first: ${n} values.` });
    // Positions decide the shape; the list only supplies values, in order.
    type Out = { id: string; mid: number } | null;
    const build = (lo: number, hi: number): Out => {
      t.op();
      if (lo > hi) return null;
      const mid = Math.floor((lo + hi) / 2);
      const left = build(lo, mid - 1);
      const id = `t${nums[cur]}`;
      g.nodes.push({ id, val: nums[cur], left: left ? left.id : null, right: null }); g.by.set(id, g.nodes[g.nodes.length - 1]);
      const opts = [...new Set([nums[cur], nums[lo], nums[hi]].map(String))];
      const ask = t.record && asked < 2 && opts.length > 1 ? (asked++, { ask: { q: `Positions ${lo}–${hi}, middle ${mid}: its left part is done. Which value does this node get?`, options: opts, answer: 0 } }) : {};
      const nodeView = () => { const roots = new Set(g.nodes.map((x) => x.id)); for (const x of g.nodes) { if (x.left) roots.delete(x.left); if (x.right) roots.delete(x.right); } return [{ roots: [...roots].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), root: null, nodes: g.nodes.map((x) => ({ ...x })), tones: { [id]: "found" as Tone } }]; };
      if (t.record) t.step({ ...ask, line: 11, array: [], lists: listRow(nums, { ...Object.fromEntries(nums.slice(0, cur).map((_, k) => [`l${k}`, "settled" as Tone])), [`l${cur}`]: "found" }, (cur + 1 < n ? { cur: `l${cur + 1}` } : {})), trees: nodeView(), vars: { lo, hi, mid, made: nums[cur], "cur.val": cur + 1 < n ? nums[cur + 1] : "none" },
        message: `Positions ${lo}–${hi}: the root of this stretch is position ${mid}. Its left part (${left ? "already built" : "empty"}) came first, so cur is now exactly at position ${mid}: make a node from ${nums[cur]}${left ? `, with the left part hanging below it` : ""}, and move cur on.` });
      cur++; t.op();
      const right = build(mid + 1, hi);
      g.by.get(id)!.right = right ? right.id : null;
      return { id, mid };
    };
    const top = build(0, n - 1);
    g.root = top ? top.id : null;
    if (t.record) t.step({ line: 4, array: [], lists: listRow(nums, Object.fromEntries(nums.map((_, k) => [`l${k}`, "settled" as Tone])), {}), trees: g.view(Object.fromEntries(g.nodes.map((x) => [x.id, "settled" as Tone]))), vars: { nodes: n }, done: "found",
      message: "Balanced, and the list was read once, front to back: O(n) time, with O(log n) for the recursion." });
  },
};

export const approaches = { middle, inorder };
/** n values, 1 to n. */
export const growth = measureGrowth(
  [{ approach: middle, slot: 1 }, { approach: inorder, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i + 1) }),
  [8, 16, 32, 64, 128, 256],
);
