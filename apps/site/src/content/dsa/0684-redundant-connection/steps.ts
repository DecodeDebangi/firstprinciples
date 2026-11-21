import { measureGrowth, type Approach, type GraphData, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { UnionFind, parseLinks, unionSteps } from "../../concepts/43-union-find/steps";

/** Edges between nodes 1 … n, in order; n is the number of edges. */
export type Input = { edges: string };
export const example: Input = { edges: "1-3, 3-4, 2-4, 1-5, 5-2, 4-6" };
export const fields: InputField[] = [{ key: "edges", label: "edges in order (1-3, …)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const e = parseLinks(raw.edges), n = e.length;
  if (n < 3 || n > 7) return { error: "Give 3 to 7 edges." };
  if (e.some(([a, b]) => a < 1 || b < 1 || a > n || b > n || a === b)) return { error: `With ${n} edges, the nodes are 1 to ${n}, and an edge joins two different nodes.` };
  const uf = new UnionFind(n + 1);
  let extra = 0;
  for (const [a, b] of e) { const ra = uf.findRoot(a), rb = uf.findRoot(b); if (ra === rb) extra++; else uf.parent[ra] = rb; }
  if (extra !== 1 || new Set(Array.from({ length: n }, (_, i) => uf.findRoot(i + 1))).size !== 1)
    return { error: "The edges must connect all the nodes with exactly one extra edge (a tree plus one)." };
  return { input: { edges: e.map(([a, b]) => `${a}-${b}`).join(", ") } };
}
const graphOf = (n: number, edges: [number, number][], tones: Record<number, Tone> = {}, edgeTones: Record<string, Tone> = {}): GraphData[] => [{
  nodes: Array.from({ length: n }, (_, i) => ({ id: `g${i + 1}`, label: i + 1 })),
  edges: edges.map(([a, b]) => ({ a: `g${a}`, b: `g${b}` })),
  tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`g${i}`, tn])),
  edgeTones: Object.fromEntries(Object.entries(edgeTones).map(([k, tn]) => [k.replace(/(\d+)>(\d+)/, "g$1>g$2"), tn])),
}];

const searchEach: Approach<Input> = {
  id: "search",
  name: "Search before adding each edge",
  code: `function findRedundantConnection(edges)
    graph ← empty adjacency lists
    for each u, v in edges
        if v can be reached from u in graph  // DFS
            return [u, v]
        add the edge u–v to graph
`,
  run({ edges }, t) {
    const e = parseLinks(edges), n = e.length, added: [number, number][] = [], adj = new Map<number, number[]>();
    t.step({ line: 2, array: [], graphs: graphOf(n, added), vars: {},
      message: `Add the edges one at a time. An edge is redundant when its two ends are already connected by the edges added before it: adding it would close a loop. So before adding each edge, search from one end for the other.` });
    let asked = false;
    for (const [u, v] of e) {
      const seen = new Set([u]), stack = [u];
      while (stack.length) { const x = stack.pop()!; for (const y of adj.get(x) ?? []) { t.op(); if (!seen.has(y)) { seen.add(y); stack.push(y); } } }
      t.op();
      const hit = seen.has(v);
      const reach = Object.fromEntries([...seen].map((x) => [x, "visited" as Tone]));
      const q = !asked && added.length >= 2 ? (asked = true, { ask: { q: `Before adding ${u}–${v}: can ${v} already be reached from ${u}?`, options: ["Yes: this edge closes a loop", "No: add it"], answer: hit ? 0 : 1 } }) : {};
      if (hit) {
        t.step({ ...q, line: 5, array: [], graphs: graphOf(n, [...added, [u, v]], { ...reach, [u]: "found", [v]: "found" }, { [`${u}>${v}`]: "miss" }), vars: { edge: `${u}-${v}` }, done: "found",
          message: `The search from ${u} reaches ${[...seen].sort((x, y) => x - y).join(", ")}, including ${v}: they're already connected, so ${u}–${v} closes a loop. Return [${u}, ${v}]. Each search can cover the whole graph: O(n) per edge, O(n²) in total.` });
        return;
      }
      added.push([u, v]);
      adj.set(u, [...(adj.get(u) ?? []), v]); adj.set(v, [...(adj.get(v) ?? []), u]);
      t.step({ ...q, line: 6, array: [], graphs: graphOf(n, added, { ...reach, [u]: "compare", [v]: "compare" }, { [`${u}>${v}`]: "found" }), vars: { edge: `${u}-${v}` },
        message: `From ${u} the search reaches only ${[...seen].sort((x, y) => x - y).join(", ")}, not ${v}. Add ${u}–${v}.` });
    }
  },
};

const withUnion: Approach<Input> = {
  id: "unionFind",
  name: "Union-find",
  code: `function findRedundantConnection(edges)
    for each u, v in edges
        if not union(u, v)  // already in one group
            return [u, v]
`,
  run({ edges }, t) {
    const e = parseLinks(edges), n = e.length;
    const uf = new UnionFind(n, true, true, Array.from({ length: n }, (_, i) => String(i + 1)));
    t.step({ line: 2, array: [], trees: uf.view(), grid: uf.panel(), vars: {},
      message: `union(u, v) returns false when u and v already share a root, which means they're already connected. That's exactly a redundant edge, found without any search.` });
    let k = 0;
    for (const [u, v] of e) {
      const joined = unionSteps(uf, u - 1, v - 1, t, { find: 3, same: 4, link: 3 }, () => ({ vars: { edge: `${u}-${v}` } }), k++ === 2, ["u", "v"]);
      if (!joined) {
        t.step({ line: 4, array: [], trees: uf.view(), grid: uf.panel(), vars: { edge: `${u}-${v}` }, done: "found",
          message: `${u} and ${v} were already in one group, so ${u}–${v} closes a loop. Return [${u}, ${v}]. Each union is almost O(1): about O(n) for all the edges.` });
        return;
      }
    }
  },
};

export const approaches = { search: searchEach, unionFind: withUnion };

/** A path 1–2–…–n, then the edge n–1 that closes it. */
export const growth = measureGrowth(
  [{ approach: searchEach, slot: 1 }, { approach: withUnion, slot: 3 }],
  (n) => ({ edges: [...Array.from({ length: n - 1 }, (_, i) => `${i + 1}-${i + 2}`), `${n}-1`].join(", ") }),
  [8, 16, 32, 48, 64],
);
