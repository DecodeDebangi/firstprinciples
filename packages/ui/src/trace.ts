/**
 * Every animation is generated from the algorithm itself: an approach's `run`
 * function executes the real algorithm and calls `t.step(...)` with a full
 * snapshot whenever something worth seeing happens. The player replays those
 * snapshots, so stepping backwards is free and no animation is hand-drawn.
 */

/** Lifted: compare, found, active, miss. Sunk: discard. Coloured but resting: settled, visited, side-a, side-b. */
export type Tone = "compare" | "found" | "active" | "miss" | "discard" | "settled" | "visited" | "side-a" | "side-b";

/** One linked list for ListView: nodes left to right, and the arrow between each neighbour pair. */
export interface ListRow {
  label?: string;
  /** `kind: "null"` draws a None end marker; `"dummy"` a dashed placeholder head. */
  nodes: { id: string; val: number | string; kind?: "null" | "dummy" }[];
  /** arrows[i] sits between nodes[i] and nodes[i + 1]: "right" = i.next is i+1, "left" = (i+1).next is i. */
  /** "both" = the two nodes point at each other (a brief 2-cycle, e.g. mid-way through a recursive reversal). */
  arrows: ("right" | "left" | "both" | null)[];
  pointers?: Record<string, string | null>;
  tones?: Record<string, Tone>;
  /** Small rows with no lift and no empty pointer rail, for many short lists (e.g. hash-table buckets). */
  compact?: boolean;
}

/** One binary-tree node. Children are node ids (or null). */
export interface TreeNodeData {
  id: string; val: number | string; left: string | null; right: string | null;
  /** Any number of children, for call trees (e.g. backtracking). Used instead of left/right; needs layout "compact". */
  kids?: string[];
}

/** One graph for GraphView. */
export interface GraphData {
  nodes: { id: string; label: number | string }[];
  edges: { a: string; b: string }[];
  /** Draw an arrow from a to b on each edge. */
  directed?: boolean;
  /** Fixed positions, 0..1 across and down. Without them, nodes sit evenly on a circle in the order given. */
  pos?: Record<string, { x: number; y: number }>;
  tones?: Record<string, Tone>;
  /** Edge tones keyed "a>b", in the edge's listed order. */
  edgeTones?: Record<string, Tone>;
  /** A short label under a node: a distance, an order, a count. */
  notes?: Record<string, string>;
  pointers?: Record<string, string | null>;
}

/** One tree for TreeView. Node ids stay stable across steps, so moved subtrees slide instead of jumping. */
export interface TreeData {
  label?: string;
  root: string | null;
  nodes: TreeNodeData[];
  tones?: Record<string, Tone>;
  /** Small text under a node: a return value, an allowed range, a level… */
  notes?: Record<string, string>;
  pointers?: Record<string, string | null>;
  /** "compact" gives columns only to leaves and centres parents: for call trees, where nodes have 0 or 2 children. */
  layout?: "inorder" | "compact";
}

/** Build a tree from LeetCode's level-order list, e.g. [3, 9, 20, null, null, 15, 7]. Ids are "t0", "t1", … */
export function treeFromLevelOrder(vals: (number | null)[]): { root: string | null; nodes: TreeNodeData[] } {
  if (!vals.length || vals[0] === null) return { root: null, nodes: [] };
  const nodes: TreeNodeData[] = [];
  const make = (k: number) => { const n = { id: `t${k}`, val: vals[k] as number, left: null, right: null } as TreeNodeData; nodes.push(n); return n; };
  const queue = [make(0)];
  let k = 1;
  while (queue.length && k < vals.length) {
    const node = queue.shift()!;
    if (k < vals.length) { if (vals[k] !== null) { const c = make(k); node.left = c.id; queue.push(c); } k++; }
    if (k < vals.length) { if (vals[k] !== null) { const c = make(k); node.right = c.id; queue.push(c); } k++; }
  }
  return { root: "t0", nodes };
}

export interface ArrayStep {
  /** 1-based line in the approach's `code` to highlight. */
  line: number;
  /** The decision being made, in plain words. */
  message: string;
  array: (number | string)[];
  /** Text under each cell. Defaults to the index. */
  labels?: string[];
  /** Linked lists drawn instead of the array (pass `array: []`). */
  lists?: ListRow[];
  /** Binary trees drawn instead of the array (pass `array: []`). */
  trees?: TreeData[];
  /** Graphs drawn instead of the array (pass `array: []`). */
  graphs?: GraphData[];
  /** A 2D board of cells drawn instead of the array (pass `array: []`), e.g. a map of land and water. Tones keyed "r,c". */
  board?: { rows: (number | string)[][]; tones?: Record<string, Tone> };
  /** Named pointers, e.g. { lo: 0, hi: 7 }. */
  pointers?: Record<string, number>;
  tones?: Record<number, Tone>;
  /** The comparison being made, floated above one cell, e.g. { at: 4, text: "27 < 63 →" }. */
  badge?: { at: number; text: string };
  /** A value copied from one cell to another this step: an arrow arcs from `from` to `to` and the value slides across. */
  move?: { from: number; to: number };
  /** Inclusive window still being considered; cells outside are dimmed. */
  range?: [number, number] | null;
  vars?: Record<string, string | number | boolean | null>;
  /** A hash map / set panel. */
  map?: { title: string; entries: [string, string][]; highlight?: string };
  /** A stack panel, top (innermost) last. */
  stack?: string[];
  /** Heading for the stack panel. Defaults to "Call stack". */
  stackTitle?: string;
  /** A 2D panel (e.g. Pascal's triangle). Tones are keyed "row,col". Rows are centred. */
  /** A 2D panel. Optional row/column labels draw as a header row and a leading column (tones keys stay "r,c" of `rows`); `dense` narrows the cells (e.g. a timeline). */
  grid?: { title: string; rows: (number | string)[][]; tones?: Record<string, Tone>; rowLabels?: (number | string)[]; colLabels?: (number | string)[]; dense?: boolean };
  /**
   * Predict mode: asked *before* this step is shown, while the learner still sees the previous one.
   * `answer` is the index of the correct option; this step's message explains it.
   */
  ask?: { q: string; options: string[]; answer: number };
  /** Basic operations counted so far (filled in by the tracer). */
  ops: number;
  done?: "found" | "notfound";
}

export class Tracer {
  steps: ArrayStep[] = [];
  ops = 0;
  constructor(public readonly record = true) {}
  /** Count basic operations (comparisons, lookups). */
  op(n = 1) {
    this.ops += n;
  }
  step(s: Omit<ArrayStep, "ops">) {
    if (this.record) this.steps.push({ ...s, ops: this.ops });
  }
}

export interface Approach<I> {
  id: string;
  name: string;
  /** Pseudocode shown next to the animation; step `line`s refer to it (1-based). */
  code: string;
  run: (input: I, t: Tracer) => void;
}

export interface GrowthSeries {
  name: string;
  /** Categorical slot 1-3, fixed per approach so colour follows the approach. */
  slot: 1 | 2 | 3;
  points: [n: number, ops: number][];
}

/** Run approaches without recording to count operations as n grows. */
export function measureGrowth<I>(
  approaches: { approach: Approach<I>; slot: 1 | 2 | 3 }[],
  worstCase: (n: number) => I,
  sizes: number[],
): GrowthSeries[] {
  return approaches.map(({ approach, slot }) => ({
    name: approach.name,
    slot,
    points: sizes.map((n) => {
      const t = new Tracer(false);
      approach.run(worstCase(n), t);
      return [n, t.ops] as [number, number];
    }),
  }));
}
