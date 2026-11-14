import { measureGrowth, treeFromLevelOrder, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { root: (number | null)[] };

export const example: Input = { root: [1, 2, 3, 4, null, 5, 6, null, 7] };

export const fields: InputField[] = [{ key: "root", label: "root (level order)", kind: "tree" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.root.length) return { error: "Give at least one node." };
  return { input: raw };
}

const rewalk: Approach<Input> = {
  id: "rewalk",
  name: "One walk per level",
  code: `function levelOrder(root)
  result, depth ← [], 0
  while true
    level ← empty list
    collect(root, 0, depth, level)
    if level is empty
      return result
    result.push(level)
    depth += 1

function collect(node, d, target, level)
  if node = none or d > target
    return
  if d = target
    level.push(node.val)
  collect(node.left, d + 1, target, level)
  collect(node.right, d + 1, target, level)
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const result: (number | string)[][] = [];
    const map = () => ({ title: "result", entries: result.map((lv, k) => [`level ${k}`, `[${lv.join(", ")}]`] as [string, string]) });
    t.step({ line: 2, array: [], trees: [{ root, nodes }], map: map(), vars: { depth: 0 },
      message: "For each depth, walk down from the root and collect the nodes at exactly that depth." });
    for (let depth = 0; ; depth++) {
      const level: (number | string)[] = [];
      const walked: string[] = [];
      const levelIds = new Set<string>();
      const collect = (id: string | null, d: number) => {
        if (!id || d > depth) return;
        t.op();
        walked.push(id);
        const n = by.get(id)!;
        if (d === depth) { level.push(n.val); levelIds.add(id); }
        collect(n.left, d + 1);
        collect(n.right, d + 1);
      };
      collect(root, 0);
      const tones: Record<string, Tone> = Object.fromEntries(walked.map((id) => [id, "visited" as Tone]));
      for (const id of levelIds) tones[id] = "found";
      if (!level.length) {
        t.step({ line: 7, array: [], trees: [{ root, nodes }], map: map(), vars: { depth }, done: "found",
          message: `Nothing at depth ${depth}: done. ${result.length} levels, but the top of the tree was walked ${result.length + 1} times.` });
        return;
      }
      result.push(level);
      t.step({ line: 8, array: [], trees: [{ root, nodes, tones }], map: map(), vars: { depth, walked: walked.length },
        message: `Depth ${depth}: walked ${walked.length} node${walked.length === 1 ? "" : "s"} from the root to collect [${level.join(", ")}]. The shaded ones were walked again just to get here.` });
    }
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Queue, one level at a time",
  code: `function levelOrder(root)
  result ← empty list
  queue ← root = none ? [] : queue of [root]
  while queue not empty
    level ← empty list
    repeat length(queue) times
      node ← queue.popFront()
      level.push(node.val)
      queue.push(node.left) if it exists
      queue.push(node.right) if it exists
    result.push(level)
  return result
`,
  run({ root: vals }, t) {
    const { root, nodes } = treeFromLevelOrder(vals);
    const by = new Map(nodes.map((n) => [n.id, n]));
    const queue = root ? [root] : [];
    const result: (number | string)[][] = [];
    const done = new Set<string>();
    const grid = () => ({ title: "queue (front → back)", rows: [queue.length ? queue.map((id) => by.get(id)!.val) : ["empty"]] });
    const map = () => ({ title: "result", entries: result.map((lv, k) => [`level ${k}`, `[${lv.join(", ")}]`] as [string, string]) });
    const tones = (extra: Record<string, Tone> = {}) => ({ ...Object.fromEntries([...done].map((d) => [d, "settled" as Tone])), ...extra });
    t.step({ line: 3, array: [], trees: [{ root, nodes }], grid: grid(), map: map(), vars: { level: null },
      message: "A queue hands out nodes in the order they were found: level by level, left to right. Visit each node once." });
    while (queue.length) {
      const size = queue.length;
      const level: (number | string)[] = [];
      for (let k = 0; k < size; k++) {
        const id = queue.shift()!;
        const n = by.get(id)!;
        t.op();
        level.push(n.val);
        if (n.left) queue.push(n.left);
        if (n.right) queue.push(n.right);
        done.add(id);
        t.step({ ...(k === 0 ? { ask: { q: `The queue holds ${size} node${size === 1 ? "" : "s"}. How many of them belong to the current level?`, options: [`All ${size}`, "Just the first one"], answer: 0 } } : {}),
          line: 8, array: [], trees: [{ root, nodes, tones: tones({ [id]: "found" }), pointers: { node: id } }], grid: grid(), map: map(), vars: { level: `[${level.join(", ")}]` },
          message: `Take ${n.val} from the front${n.left || n.right ? `; its children go to the back` : ""}.` });
      }
      result.push(level);
      t.step({ line: 11, array: [], trees: [{ root, nodes, tones: tones() }], grid: grid(), map: map(), vars: { level: `[${level.join(", ")}]` },
        message: `That's the whole level: [${level.join(", ")}].` });
    }
    t.step({ line: 12, array: [], trees: [{ root, nodes, tones: tones() }], grid: grid(), map: map(), vars: { level: null }, done: "found",
      message: `${result.length} levels, and every node was visited exactly once.` });
  },
};

export const approaches = { rewalk, bfs };

/** Worst case for re-walking: a chain, where every level sits one node deeper. */
const worstCase = (n: number): Input => ({ root: Array.from({ length: n }, (_, i) => [i, null]).flat().slice(0, 2 * n - 1) as (number | null)[] });

export const growth = measureGrowth(
  [
    { approach: rewalk, slot: 1 },
    { approach: bfs, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
