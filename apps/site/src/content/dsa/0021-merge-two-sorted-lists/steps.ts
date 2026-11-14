import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { list1: number[]; list2: number[] };

export const example: Input = { list1: [1, 4, 7], list2: [2, 3, 8, 9] };

export const fields: InputField[] = [
  { key: "list1", label: "list1", kind: "numbers" },
  { key: "list2", label: "list2", kind: "numbers" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.list1.length + raw.list2.length > 10) return { error: "Use at most 10 values in total so both lists fit." };
  const a = [...raw.list1].sort((x, y) => x - y), b = [...raw.list2].sort((x, y) => x - y);
  const changed = a.some((v, i) => v !== raw.list1[i]) || b.some((v, i) => v !== raw.list2[i]);
  return { input: { list1: a, list2: b }, note: changed ? "Both lists must be sorted, so your values were sorted first." : undefined };
}

type Node = { id: string; val: number };
const chain = (label: string, nodes: Node[], pointers: Record<string, string | null> = {}, tones: Record<string, Tone> = {}, dummy = false): ListRow => {
  // Always a fresh array: steps are snapshots, and the caller keeps mutating its lists.
  const all = [...(dummy ? [{ id: "dummy", val: "dummy" as number | string, kind: "dummy" as const }] : []), ...nodes];
  return { label, nodes: all, arrows: all.slice(0, -1).map(() => "right" as const), pointers, tones };
};
const nodesOf = (vals: number[], tag: string): Node[] => vals.map((v, i) => ({ id: `${tag}${i}`, val: v }));

const sortRebuild: Approach<Input> = {
  id: "sort",
  name: "Collect, sort, rebuild",
  code: `function mergeTwoLists(list1, list2)
  vals ← empty list
  for each node in [list1, list2]
    while node ≠ none
      vals.push(node.val)
      node ← node.next
  vals.sort()
  dummy ← new ListNode(), tail ← dummy
  for each v in vals
    tail.next ← new ListNode(v)
    tail ← tail.next
  return dummy.next
`,
  run({ list1, list2 }, t) {
    const A = nodesOf(list1, "a"), B = nodesOf(list2, "b");
    const vals: string[] = [];
    const rows = (extra: ListRow[] = [], pa: Record<string, string | null> = {}, pb: Record<string, string | null> = {}, ta: Record<string, Tone> = {}, tb: Record<string, Tone> = {}) =>
      [chain("list1", A, pa, ta), chain("list2", B, pb, tb), ...extra];
    t.step({ line: 2, array: [], lists: rows(), stack: [], stackTitle: "vals", vars: { copied: 0 },
      message: "Ignore that both lists are already sorted: copy every value out, sort them, and build a new list." });
    for (const [L, tag] of [[A, "list1"], [B, "list2"]] as const) {
      for (const n of L) {
        t.op();
        vals.push(String(n.val));
        const p = { node: n.id }, tn = { [n.id]: "compare" as Tone };
        t.step({ line: 5, array: [], lists: tag === "list1" ? rows([], p, {}, tn) : rows([], {}, p, {}, tn), stack: [...vals], stackTitle: "vals", vars: { copied: vals.length },
          message: `Copy ${n.val} from ${tag}.` });
      }
    }
    const sorted = [...list1, ...list2].sort((x, y) => x - y);
    const k = sorted.length;
    t.op(Math.ceil(k * Math.log2(Math.max(k, 2))));
    t.step({ line: 7, array: [], lists: rows(), stack: sorted.map(String), stackTitle: "vals (sorted)", vars: { copied: k },
      message: `Sort all ${k} values: about ${k}·log₂${k} comparisons, re-discovering an order both lists already had.` });
    const built: Node[] = [];
    for (const v of sorted) {
      t.op();
      built.push({ id: `m${built.length}`, val: v });
      t.step({ line: 10, array: [], lists: rows([chain("new", built, { tail: built[built.length - 1].id }, { [built[built.length - 1].id]: "active" }, true)]),
        stack: sorted.map(String), stackTitle: "vals (sorted)", vars: { copied: k }, message: `New node ${v} on the end.` });
    }
    t.step({ line: 12, array: [], lists: rows([chain("new", built, {}, Object.fromEntries(built.map((n) => [n.id, "settled" as const])), true)]),
      stack: sorted.map(String), stackTitle: "vals (sorted)", vars: { copied: k }, done: "found",
      message: `Merged, but with ${k} copied values and ${k} brand-new nodes.` });
  },
};

const splice: Approach<Input> = {
  id: "splice",
  name: "Splice with a dummy head",
  code: `function mergeTwoLists(list1, list2)
  dummy ← new ListNode(), tail ← dummy
  while list1 ≠ none and list2 ≠ none
    if list1.val ≤ list2.val
      tail.next ← list1
      list1 ← list1.next
    else
      tail.next ← list2
      list2 ← list2.next
    tail ← tail.next
  tail.next ← the list that is left over
  return dummy.next
`,
  run({ list1, list2 }, t) {
    const A = nodesOf(list1, "a"), B = nodesOf(list2, "b");
    const merged: Node[] = [];
    const tailId = () => (merged.length ? merged[merged.length - 1].id : "dummy");
    const rows = (ta: Record<string, Tone> = {}, tb: Record<string, Tone> = {}, tm: Record<string, Tone> = {}) => [
      chain("list1", A, { list1: A[0]?.id ?? null }, ta),
      chain("list2", B, { list2: B[0]?.id ?? null }, tb),
      chain("merged", merged, { tail: tailId() }, tm, true),
    ];
    t.step({ line: 2, array: [], lists: rows(), vars: { merged: 0 },
      message: "Both lists are sorted, so the smallest remaining value is always at one of the two heads. A dummy node gives the result somewhere to start." });
    while (A.length && B.length) {
      t.op();
      const a = A[0], b = B[0];
      const takeA = a.val <= b.val;
      t.step({ ask: { q: `Heads: list1 = ${a.val}, list2 = ${b.val}. Which node goes next?`, options: [`list1's ${a.val}`, `list2's ${b.val}`], answer: takeA ? 0 : 1 },
        line: 4, array: [], lists: rows({ [a.id]: "compare" }, { [b.id]: "compare" }), vars: { merged: merged.length },
        message: `Compare the heads: ${a.val} ${takeA ? "≤" : ">"} ${b.val}.` });
      const n = takeA ? A.shift()! : B.shift()!;
      merged.push(n);
      t.step({ line: takeA ? 5 : 8, array: [], lists: rows({}, {}, { [n.id]: "found" }), vars: { merged: merged.length },
        message: `Splice ${n.val} onto the end of merged and advance ${takeA ? "list1" : "list2"}. No new node is created; the existing one is relinked.` });
    }
    const rest = A.length ? A : B;
    const which = A.length ? "list1" : "list2";
    if (rest.length) {
      const moved = rest.splice(0);
      merged.push(...moved);
      t.step({ line: 11, array: [], lists: rows({}, {}, Object.fromEntries(moved.map((n) => [n.id, "found" as const]))), vars: { merged: merged.length },
        message: `${which === "list1" ? "list2" : "list1"} is empty, so attach what's left of ${which} in one link. It's already sorted.` });
    }
    t.step({ line: 12, array: [], lists: rows({}, {}, Object.fromEntries(merged.map((n) => [n.id, "settled" as const]))), vars: { merged: merged.length }, done: "found",
      message: `Return dummy.next. Every node was reused; the only extra memory is the dummy node.` });
  },
};

export const approaches = { sort: sortRebuild, splice };

/** Worst case for splicing: perfectly interleaved values, so every step needs a comparison. */
const worstCase = (n: number): Input => ({
  list1: Array.from({ length: Math.ceil(n / 2) }, (_, i) => 2 * i),
  list2: Array.from({ length: Math.floor(n / 2) }, (_, i) => 2 * i + 1),
});

export const growth = measureGrowth(
  [
    { approach: sortRebuild, slot: 1 },
    { approach: splice, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
