import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { values: number[]; k: number };
type P = Input;
export const example: Input = { values: [6, 2, 9, 4, 1, 7], k: 4 };
export const fields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "k", label: "number of parts, k =", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > 5) return { error: "Pick k from 1 to 5, so every part gets its own row." };
  return { input: raw, ...(raw.values.length === 0 ? { note: "An empty list: every part is empty." } : {}) };
}

const END = (id: string) => ({ id, val: "none", kind: "null" as const });
const sizes = (n: number, k: number) => Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));

/** Rows: one per finished part, then the uncut rest (from index `from`). */
function rows(values: number[], parts: [number, number][], from: number, ptr: Record<string, number> = {}, lift: Record<number, Tone> = {}, k?: number): ListRow[] {
  const node = (i: number) => ({ id: `n${i}`, val: values[i] });
  const out: ListRow[] = parts.map(([s, len], j) => ({
    label: `part ${j + 1}`, compact: true, nodes: [...Array.from({ length: len }, (_, q) => node(s + q)), END(`e${j}`)], arrows: Array.from({ length: len }, () => "right" as const),
    tones: Object.fromEntries(Array.from({ length: len }, (_, q) => [`n${s + q}`, (lift[s + q] ?? (j % 2 ? "side-b" : "side-a")) as Tone])),
  }));
  if (k === undefined || parts.length < k) {
    const rest = Array.from({ length: values.length - from }, (_, q) => from + q);
    out.push({ label: parts.length ? "rest" : "list", nodes: [...rest.map(node), END("e-rest")], arrows: rest.map(() => "right" as const),
      pointers: Object.fromEntries(Object.entries(ptr).map(([p, i]) => [p, i >= values.length ? "e-rest" : `n${i}`])),
      tones: Object.fromEntries(Object.entries(lift).filter(([i]) => Number(i) >= from).map(([i, tn]) => [`n${i}`, tn])) });
  }
  return out;
}
const sizeAsk = (n: number, k: number) => {
  const right = sizes(n, k);
  const wrong1 = [...right].reverse(); // shorter parts first
  const wrong2 = Array.from({ length: k }, (_, i) => (i < k - 1 ? Math.ceil(n / k) : Math.max(0, n - Math.ceil(n / k) * (k - 1)))); // fill greedily
  const opts = [right, wrong1, wrong2].map((s) => s.join(", ")).filter((o, i, a) => a.indexOf(o) === i);
  return opts.length > 1 ? { ask: { q: `n is ${n} and k is ${k}. How long are the parts, in order?`, options: opts, answer: 0 } } : {};
};
const explainSizes = (n: number, k: number) => {
  const size = Math.floor(n / k), extra = n % k;
  return `size = floor(${n} / ${k}) = ${size} and extra = ${n} % ${k} = ${extra}: every part gets ${size} node${size === 1 ? "" : "s"}, and the first ${extra} part${extra === 1 ? " gets" : "s get"} one more. Lengths: ${sizes(n, k).join(", ")}.`;
};

const withArray: Approach<P> = {
  id: "array",
  name: "Collect the nodes, then cut at the boundaries",
  code: `function splitListToParts(head, k)
    nodes ← empty list
    curr ← head
    while curr ≠ none
        nodes.push(curr)
        curr ← curr.next
    n ← length(nodes)
    size, extra ← floor(n / k), n % k
    parts ← empty list
    start ← 0
    for i ← 0 to k - 1
        len ← size
        if i < extra then len += 1
        if len = 0 then parts.push(none)
        else
            parts.push(nodes[start])
            nodes[start + len - 1].next ← none
        start += len
    return parts
`,
  run({ values, k }, t) {
    const n = values.length;
    t.op(n);
    const grid = { title: "nodes (by position)", rows: [n ? values : ["(empty)"]], colLabels: n ? values.map((_, i) => i) : undefined };
    t.step({ line: 7, array: [], lists: rows(values, [], 0), grid, vars: { n },
      message: `Copy a reference to every node into an array, so any position can be reached at once. That also gives the length: n = ${n}.` });
    t.step({ ...sizeAsk(n, k), line: 8, array: [], lists: rows(values, [], 0), grid, vars: { n, size: Math.floor(n / k), extra: n % k }, message: explainSizes(n, k) });
    const parts: [number, number][] = [];
    let start = 0;
    for (let i = 0; i < k; i++) {
      t.op();
      const len = sizes(n, k)[i];
      parts.push([start, len]);
      t.step({ line: len ? 17 : 14, array: [], lists: rows(values, parts, start + len, {}, {}, k), grid, vars: { i, len, start },
        message: len ? `Part ${i + 1} is ${len} node${len === 1 ? "" : "s"} long: it starts at nodes[${start}], and nodes[${start + len - 1}] (the ${values[start + len - 1]}) gets next ← none to end it.` : `Part ${i + 1} gets 0 nodes: it's an empty list, none.` });
      start += len;
    }
    t.step({ line: 19, array: [], lists: rows(values, parts, n, {}, {}, k), grid, vars: {}, done: "found",
      message: `Return the ${k} parts. O(n + k) time, but the array holds a reference to every node: O(n) extra space.` });
  },
};

const countAndCut: Approach<P> = {
  id: "count-cut",
  name: "Count, then cut while walking (optimal)",
  code: `function splitListToParts(head, k)
    n ← 0
    curr ← head
    while curr ≠ none
        n += 1
        curr ← curr.next
    size, extra ← floor(n / k), n % k
    parts ← empty list
    curr ← head
    for i ← 0 to k - 1
        parts.push(curr)
        len ← size
        if i < extra then len += 1
        repeat len - 1 times
            curr ← curr.next
        if curr ≠ none
            nxt ← curr.next
            curr.next ← none
            curr ← nxt
    return parts
`,
  run({ values, k }, t) {
    const n = values.length;
    t.op(n);
    t.step({ line: 6, array: [], lists: rows(values, [], 0, { curr: n }), vars: { n },
      message: `Walk the list once just to count it: n = ${n}. To split evenly you need to know the total first.` });
    t.step({ ...sizeAsk(n, k), line: 7, array: [], lists: rows(values, [], 0, n ? { curr: 0 } : {}), vars: { n, size: Math.floor(n / k), extra: n % k }, message: explainSizes(n, k) });
    const parts: [number, number][] = [];
    let start = 0;
    for (let i = 0; i < k; i++) {
      const len = sizes(n, k)[i];
      if (len === 0) {
        parts.push([start, 0]);
        t.step({ line: 11, array: [], lists: rows(values, parts, start, {}, {}, k), vars: { i, len },
          message: `curr is none, so part ${i + 1} is none: an empty part. This happens when k is bigger than the list.` });
        continue;
      }
      t.op(len);
      const last = start + len - 1;
      t.step({ line: 15, array: [], lists: rows(values, parts, start, { curr: last }, { [last]: "active", ...Object.fromEntries(Array.from({ length: len - 1 }, (_, q) => [start + q, "compare" as Tone])) }), vars: { i, len },
        message: `Part ${i + 1} starts at the ${values[start]} and is ${len} long, so walk curr ${len - 1} step${len - 1 === 1 ? "" : "s"} to its last node, the ${values[last]}.` });
      parts.push([start, len]);
      start += len;
      t.step({ line: 19, array: [], lists: rows(values, parts, start, start < n ? { curr: start } : {}, {}, k), vars: { i, len },
        message: `Cut: remember the node after it, set the ${values[last]}'s next to none, and continue from ${start < n ? `the ${values[start]}` : "none"}.` });
    }
    t.step({ line: 20, array: [], lists: rows(values, parts, n, {}, {}, k), vars: {}, done: "found",
      message: `Return the ${k} parts. One walk to count, one to cut: O(n + k) time. Nothing extra is stored apart from the answer itself: O(1) extra space.` });
  },
};

export const approaches = { withArray, countAndCut };
