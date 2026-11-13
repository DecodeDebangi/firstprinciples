import type { Approach, GraphData, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { n: number; edges: number[]; source: number };

export const example: Input = { n: 7, edges: [0, 1, 0, 2, 1, 3, 2, 3, 3, 4, 4, 5, 4, 6], source: 0 };

export const fields: InputField[] = [
  { key: "n", label: "nodes n", kind: "number" },
  { key: "edges", label: "edges (pairs)", kind: "numbers" },
  { key: "source", label: "start", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const { n, edges, source } = raw;
  if (!Number.isInteger(n) || n < 1 || n > 9) return { error: "Use 1 to 9 nodes so the graph fits." };
  if (edges.length % 2 || edges.length > 24) return { error: "Give up to 12 edges as pairs: a, b, a, b…" };
  if (edges.some((v) => !Number.isInteger(v) || v < 0 || v >= n)) return { error: `Edge ends must be nodes 0 to ${n - 1}.` };
  const seen = new Set<string>();
  for (let i = 0; i < edges.length; i += 2) {
    const [a, b] = [edges[i], edges[i + 1]];
    if (a === b) return { error: "An edge must join two different nodes." };
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(key)) return { error: `The edge ${a}–${b} is listed twice.` };
    seen.add(key);
  }
  if (!Number.isInteger(source) || source < 0 || source >= n) return { error: `Start must be a node from 0 to ${n - 1}.` };
  return { input: raw };
}

const pairs = (flat: number[]) => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]] as const);

function setup({ n, edges }: Input) {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of pairs(edges)) { adj[a].push(b); adj[b].push(a); }
  const listed = pairs(edges);
  const key = (u: number, v: number) => (listed.some(([a, b]) => a === u && b === v) ? `${u}>${v}` : `${v}>${u}`);
  const base = { nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: i })), edges: listed.map(([a, b]) => ({ a: String(a), b: String(b) })) };
  const draw = (tones: Record<number, Tone>, notes: Record<number, string>, edgeTones: Record<string, Tone>, at?: number): GraphData[] =>
    [{ ...base, tones, notes, edgeTones, pointers: at === undefined ? {} : { now: String(at) } }];
  const adjMap = (hl?: number) => ({ title: "adjacency list", entries: adj.map((ns, i) => [String(i), ns.length ? ns.join(", ") : "—"] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
  return { adj, key, draw, adjMap };
}

const bfs: Approach<Input> = {
  id: "bfs",
  name: "BFS: distances, level by level",
  code: `from collections import deque
def distances(graph, start):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt in graph[node]:
            if nxt not in dist:  # first time seen
                dist[nxt] = dist[node] + 1
                queue.append(nxt)
    return dist
`,
  run(input, t) {
    const s = input.source;
    const G = setup(input);
    const dist = new Map<number, number>([[s, 0]]);
    const queue = [s];
    const done = new Set<number>();
    const tree: Record<string, Tone> = {};
    const notes = () => Object.fromEntries([...dist].map(([k, d]) => [k, `d = ${d}`]));
    const tones = (extra: Record<number, Tone> = {}) => {
      const out: Record<number, Tone> = {};
      for (const k of dist.keys()) out[k] = done.has(k) ? "settled" : "side-b";
      return { ...out, ...extra };
    };
    const panel = () => ({ stack: [...queue].reverse().map(String), stackTitle: "Queue, front first" });
    t.step({ line: 4, array: [], graphs: G.draw(tones({ [s]: "active" }), notes(), tree), map: G.adjMap(), ...panel(), vars: { start: s },
      message: `Start at ${s}, distance 0. BFS visits nodes in order of distance: everything 1 edge away, then 2, and so on, because a queue hands back the oldest discovery first.` });
    while (queue.length) {
      const node = queue.shift()!;
      t.op();
      done.add(node);
      const fresh: number[] = [];
      const now: Record<string, Tone> = {};
      for (const nxt of G.adj[node]) {
        t.op();
        if (!dist.has(nxt)) { dist.set(nxt, dist.get(node)! + 1); queue.push(nxt); fresh.push(nxt); tree[G.key(node, nxt)] = "settled"; now[G.key(node, nxt)] = "active"; }
      }
      const d = dist.get(node)!;
      t.step({ ...(fresh.length ? { ask: { q: `${node} is at distance ${d}. Its unseen neighbours are about to be discovered. What distance do they get?`, options: [String(d + 1), String(d), String(d + 2)], answer: 0 } } : {}),
        line: fresh.length ? 9 : 7, array: [], graphs: G.draw(tones({ [node]: "active" }), notes(), { ...tree, ...now }, node), map: G.adjMap(node), ...panel(), vars: { node, distance: d },
        message: `Take ${node} (distance ${d}). ${fresh.length ? `New neighbours ${fresh.join(", ")} get distance ${d + 1} and join the queue.` : "No new neighbours."}` });
    }
    const far = [...Array(input.n).keys()].filter((i) => !dist.has(i));
    t.step({ line: 11, array: [], graphs: G.draw(tones(Object.fromEntries(far.map((f) => [f, "discard" as Tone]))), notes(), tree), map: G.adjMap(), ...panel(), vars: { reached: dist.size }, done: "found",
      message: `Every distance is the fewest edges from ${s}${far.length ? `; ${far.join(", ")} can't be reached` : ""}. The green edges form a shortest-path tree. Each node and edge is handled once: O(V + E).` });
  },
};

const dfs: Approach<Input> = {
  id: "dfs",
  name: "DFS: go deep, then back up",
  code: `def explore(graph, start):
    seen, order = set(), []
    def dfs(node):
        seen.add(node)
        order.append(node)
        for nxt in graph[node]:
            if nxt not in seen:
                dfs(nxt)  # go deeper first
    dfs(start)
    return order
`,
  run(input, t) {
    const s = input.source;
    const G = setup(input);
    const seen = new Set<number>();
    const path: number[] = [];
    const finished = new Set<number>();
    const notes: Record<number, string> = {};
    const tree: Record<string, Tone> = {};
    const tones = (extra: Record<number, Tone> = {}) => {
      const out: Record<number, Tone> = {};
      for (const k of seen) out[k] = finished.has(k) ? "settled" : "side-a";
      return { ...out, ...extra };
    };
    const panel = () => ({ stack: path.map((p) => `dfs(${p})`) });
    t.step({ line: 9, array: [], graphs: G.draw(tones(), notes, tree), map: G.adjMap(), ...panel(), vars: { start: s },
      message: "DFS follows one path as far as it goes, and only backs up when a node has no unseen neighbours left. The call stack remembers the way back." });
    let k = 0;
    const go = (node: number, from?: number) => {
      t.op();
      seen.add(node);
      path.push(node);
      notes[node] = `#${++k}`;
      if (from !== undefined) tree[G.key(from, node)] = "settled";
      const unseen = G.adj[node].filter((x) => !seen.has(x));
      t.step({ line: 5, array: [], graphs: G.draw(tones({ [node]: "active" }), notes, tree, node), map: G.adjMap(node), ...panel(), vars: { node, visited: k },
        message: `Visit ${node} (#${k}). ${unseen.length ? `Unseen neighbours: ${unseen.join(", ")}. Go to ${unseen[0]} first, and only come back for the rest later.` : "No unseen neighbours: back up."}` });
      for (const nxt of G.adj[node]) { t.op(); if (!seen.has(nxt)) go(nxt, node); }
      finished.add(node);
      path.pop();
    };
    go(s);
    t.step({ line: 10, array: [], graphs: G.draw(tones(), notes, tree), map: G.adjMap(), ...panel(), vars: { visited: k }, done: "found",
      message: `Visited ${k} node${k === 1 ? "" : "s"} in depth-first order. DFS also takes O(V + E), but its tree (green) follows long paths, so it doesn't give shortest distances. It's the tool for "is it connected?", cycles and topological order.` });
  },
};

const noSeen: Approach<Input> = {
  id: "no-seen",
  name: "The bug: DFS with no visited set",
  code: `def dfs(node):  # BUG: nothing remembers visits
    print(node)
    for nxt in graph[node]:
        dfs(nxt)
`,
  run(input, t) {
    const s = input.source;
    const G = setup(input);
    const visits = new Map<number, number>();
    const path: number[] = [];
    const LIMIT = 14;
    let calls = 0;
    const notes = () => Object.fromEntries([...visits].map(([k, v]) => [k, `×${v}`]));
    const tones = (extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries([...visits].map(([k, v]) => [k, (v > 1 ? "side-b" : "side-a") as Tone])), ...extra });
    const panel = () => ({ stack: path.slice(-6).map((p) => `dfs(${p})`), stackTitle: "Most recent calls" });
    t.step({ line: 1, array: [], graphs: G.draw(tones(), notes(), {}), ...panel(), vars: { start: s },
      message: `The same DFS without a visited set. In an undirected graph, every edge leads back the way it came, so watch what happens. (Stopped after ${LIMIT} calls.)` });
    const go = (node: number): boolean => {
      if (calls >= LIMIT) return true;
      t.op();
      calls++;
      visits.set(node, (visits.get(node) ?? 0) + 1);
      path.push(node);
      const v = visits.get(node)!;
      const back = path.length > 1 ? path[path.length - 2] : undefined;
      t.step({ ...(v === 2 ? { ask: { q: `dfs(${node}) is called again. Will this search ever finish on its own?`, options: ["No: it keeps coming back", "Yes, once every node is printed"], answer: 0 } } : {}),
        line: 2, array: [], graphs: G.draw(tones({ [node]: v > 1 ? "miss" : "active" }), notes(), back !== undefined ? { [G.key(back, node)]: v > 1 ? "miss" : "active" } : {}, node), ...panel(), vars: { node, calls, depth: path.length },
        message: v > 1 ? `${node} again: visit number ${v}. Nothing stops ${back !== undefined ? `${back} and ${node}` : "it"} from calling each other forever.` : `Visit ${node}.` });
      for (const nxt of G.adj[node]) if (go(nxt)) return true;
      path.pop();
      return false;
    };
    const stopped = go(s);
    t.step({ line: 4, array: [], graphs: G.draw(tones(), notes(), {}), ...panel(), vars: { calls }, done: stopped ? "notfound" : "found",
      message: stopped ? `Cut off after ${LIMIT} calls, and it would never stop: Python would give up with a RecursionError. A set of seen nodes is what makes graph search finish.` : "This graph has no edges to bounce along, so it happened to finish. Any edge at all would make it loop." });
  },
};

export const approaches = { bfs, dfs, "no-seen": noSeen };
