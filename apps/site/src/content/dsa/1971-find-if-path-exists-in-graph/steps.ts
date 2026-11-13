import type { Approach, GraphData, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { n: number; edges: number[]; source: number; destination: number };

export const example: Input = { n: 7, edges: [0, 1, 0, 2, 1, 3, 2, 3, 3, 4, 5, 6], source: 0, destination: 4 };

export const fields: InputField[] = [
  { key: "n", label: "nodes n", kind: "number" },
  { key: "edges", label: "edges (pairs)", kind: "numbers" },
  { key: "source", label: "source", kind: "number" },
  { key: "destination", label: "destination", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const { n, edges, source, destination } = raw;
  if (!Number.isInteger(n) || n < 1 || n > 9) return { error: "Use 1 to 9 nodes so the graph fits." };
  if (edges.length % 2) return { error: "Edges come in pairs: a, b, a, b…" };
  if (edges.length > 24) return { error: "Use at most 12 edges." };
  if (edges.some((v) => !Number.isInteger(v) || v < 0 || v >= n)) return { error: `Edge ends must be nodes 0 to ${n - 1}.` };
  const seen = new Set<string>();
  for (let i = 0; i < edges.length; i += 2) {
    const [a, b] = [edges[i], edges[i + 1]];
    if (a === b) return { error: "An edge must join two different nodes." };
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(key)) return { error: `The edge ${a}–${b} is listed twice.` };
    seen.add(key);
  }
  if (![source, destination].every((v) => Number.isInteger(v) && v >= 0 && v < n)) return { error: `Source and destination must be nodes 0 to ${n - 1}.` };
  return { input: raw };
}

const pairs = (flat: number[]) => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]] as const);

/** The undirected graph, its adjacency lists, and a drawing helper. */
function setup({ n, edges }: Input) {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of pairs(edges)) { adj[a].push(b); adj[b].push(a); }
  const base = { nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: i })), edges: pairs(edges).map(([a, b]) => ({ a: String(a), b: String(b) })) };
  const used = new Set<string>(); // edges that discovered a node, keyed as listed
  const keyOf = (u: number, v: number) => (pairs(edges).some(([a, b]) => a === u && b === v) ? `${u}>${v}` : `${v}>${u}`);
  const draw = (tones: Record<number, Tone>, notes: Record<number, string>, extraEdges: Record<string, Tone> = {}, at?: number): GraphData[] => [{
    ...base,
    tones,
    edgeTones: { ...Object.fromEntries([...used].map((k) => [k, "settled" as Tone])), ...extraEdges },
    notes,
    pointers: at === undefined ? {} : { node: String(at) },
  }];
  const adjMap = (hl?: number) => ({ title: "adjacency list", entries: adj.map((ns, i) => [String(i), ns.length ? ns.join(", ") : "—"] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
  return { adj, used, keyOf, draw, adjMap };
}

function search(kind: "bfs" | "dfs"): Approach<Input> {
  const bfs = kind === "bfs";
  const L = bfs ? { pop: 8, found: 10, loop: 11, none: 14 } : { pop: 7, found: 9, loop: 10, none: 13 };
  return {
    id: kind,
    name: bfs ? "Breadth-first search (queue)" : "Depth-first search (stack)",
    code: bfs ? `from collections import deque
def valid_path(n, edges, source, destination):
    graph = [[] for _ in range(n)]
    for a, b in edges:
        graph[a].append(b); graph[b].append(a)
    seen, queue = {source}, deque([source])
    while queue:
        node = queue.popleft()  # oldest first
        if node == destination:
            return True
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt); queue.append(nxt)
    return False
` : `def valid_path(n, edges, source, destination):
    graph = [[] for _ in range(n)]
    for a, b in edges:
        graph[a].append(b); graph[b].append(a)
    seen, stack = {source}, [source]
    while stack:
        node = stack.pop()  # newest first
        if node == destination:
            return True
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt); stack.append(nxt)
    return False
`,
    run(input, t) {
      const { source: s, destination: d } = input;
      const G = setup(input);
      const seen = new Set([s]);
      const box: number[] = [s];
      const done = new Set<number>();
      const notes: Record<number, string> = { [d]: "goal" };
      let order = 0;
      const tones = (extra: Record<number, Tone> = {}) => {
        const out: Record<number, Tone> = {};
        for (const v of seen) out[v] = "side-b";
        for (const v of done) out[v] = "settled";
        return { ...out, ...extra };
      };
      // Queue: front first. Stack: shown so the top (next out) is first.
      const panel = () => ({ stack: (bfs ? [...box].reverse() : [...box]).map(String), stackTitle: bfs ? "Queue, front first" : "Stack, top first" });
      for (let i = 0; i < input.edges.length; i += 2) t.op();
      t.step({ line: bfs ? 5 : 4, array: [], graphs: G.draw(tones({ [s]: "active" }), notes), map: G.adjMap(), ...panel(), vars: { source: s, destination: d },
        message: `First turn the edge list into an adjacency list: for each node, its neighbours. Then search outward from ${s}, keeping a set of nodes already seen so nothing is visited twice. Goal: ${d}.` });
      while (box.length) {
        const front = bfs ? box[0] : box[box.length - 1];
        const other = bfs ? box[box.length - 1] : box[0];
        const ask = box.length > 1 ? { q: `The ${bfs ? "queue" : "stack"} holds ${(bfs ? box : [...box].reverse()).join(", ")}. Which node is visited next?`, options: [...new Set([`${front}, the ${bfs ? "oldest" : "newest"}`, `${other}, the ${bfs ? "newest" : "oldest"}`])], answer: 0 } : undefined;
        const node = bfs ? box.shift()! : box.pop()!;
        t.op();
        done.add(node);
        notes[node] = `#${++order}`;
        if (node === d) {
          t.step({ ...(ask && ask.options.length > 1 ? { ask } : {}), line: L.found, array: [], graphs: G.draw(tones({ [node]: "found" }), notes, {}, node), map: G.adjMap(node), ...panel(), vars: { node, visited: order }, done: "found",
            message: `${node} is the destination: a path exists. Return True after visiting ${order} node${order === 1 ? "" : "s"}. The green edges show how each node was first reached.` });
          return;
        }
        const fresh: number[] = [];
        const extra: Record<string, Tone> = {};
        for (const nxt of G.adj[node]) {
          t.op();
          if (!seen.has(nxt)) { seen.add(nxt); box.push(nxt); fresh.push(nxt); G.used.add(G.keyOf(node, nxt)); extra[G.keyOf(node, nxt)] = "active"; }
        }
        t.step({ ...(ask && ask.options.length > 1 ? { ask } : {}), line: L.loop, array: [], graphs: G.draw(tones({ [node]: "active" }), notes, extra, node), map: G.adjMap(node), ...panel(), vars: { node, visited: order },
          message: `Visit ${node}. ${G.adj[node].length ? `Its neighbours: ${G.adj[node].join(", ")}.` : "It has no neighbours."} ${fresh.length ? `New: ${fresh.join(", ")} → ${bfs ? "back of the queue" : "top of the stack"}.` : "All already seen."}` });
      }
      t.step({ line: L.none, array: [], graphs: G.draw(tones({ [d]: "miss" }), notes), map: G.adjMap(), ...panel(), vars: { visited: order }, done: "notfound",
        message: `The ${bfs ? "queue" : "stack"} is empty: every node reachable from ${s} has been visited, and ${d} isn't one of them. Return False.` });
    },
  };
}

export const approaches = { bfs: search("bfs"), dfs: search("dfs") };
