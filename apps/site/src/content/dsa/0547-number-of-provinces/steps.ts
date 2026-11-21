import type { Approach, GraphData, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { UnionFind, parseLinks, unionSteps } from "../../concepts/43-union-find/steps";

/** n cities and the pairs marked 1 in isConnected, written as links "0-1, 1-2". */
export type Input = { n: number; links: string };
export const example: Input = { n: 6, links: "0-1, 1-2, 3-4" };
export const fields: InputField[] = [
  { key: "n", label: "cities n", kind: "number" },
  { key: "links", label: "connected pairs (0-1, …)", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.n < 1 || raw.n > 7) return { error: "Use 1 to 7 cities so the drawing fits." };
  const l = parseLinks(raw.links);
  if (l.some(([a, b]) => a >= raw.n || b >= raw.n)) return { error: `Cities are numbered 0 to ${raw.n - 1}.` };
  if (l.length > 10) return { error: "Use at most 10 pairs." };
  return { input: { n: raw.n, links: l.map(([a, b]) => `${a}-${b}`).join(", ") } };
}
const matrixOf = (n: number, links: string) => {
  const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (const [a, b] of parseLinks(links)) { m[a][b] = 1; m[b][a] = 1; }
  return m;
};
export const graphOf = (n: number, links: string, tones: Record<number, Tone> = {}, notes: Record<number, string> = {}): GraphData[] => [{
  nodes: Array.from({ length: n }, (_, i) => ({ id: `g${i}`, label: i })),
  edges: parseLinks(links).filter(([a, b]) => a !== b).map(([a, b]) => ({ a: `g${a}`, b: `g${b}` })),
  tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`g${i}`, tn])),
  notes: Object.fromEntries(Object.entries(notes).map(([i, s]) => [`g${i}`, s])),
}];

const dfsCount: Approach<Input> = {
  id: "dfs",
  name: "Depth-first search from each unvisited city",
  code: `function findCircleNum(isConnected)
    n ← length(isConnected)
    visited ← array of n, all false
    provinces ← 0
    for i ← 0 to n - 1
        if not visited[i]
            provinces += 1
            dfs(i)
    return provinces
function dfs(i)
    visited[i] ← true
    for j ← 0 to n - 1
        if isConnected[i][j] = 1 and not visited[j]
            dfs(j)
`,
  run({ n, links }, t) {
    const m = matrixOf(n, links), seen = Array(n).fill(false), notes: Record<number, string> = {};
    let provinces = 0;
    const tones = () => Object.fromEntries(seen.map((v, i) => [i, (v ? "settled" : "discard") as Tone]).filter(([, tn]) => tn === "settled"));
    t.step({ line: 4, array: [], graphs: graphOf(n, links), vars: { provinces },
      message: `A province is a group of cities joined directly or through others. Start a search from every city not yet reached: each new start is a new province, and the search marks everything it can reach.` });
    let asked = false;
    const dfs = (i: number) => {
      seen[i] = true; notes[i] = `P${provinces}`;
      t.step({ line: 11, array: [], graphs: graphOf(n, links, { ...tones(), [i]: "active" }, notes), vars: { provinces, city: i },
        message: `Reach city ${i}: it's in province ${provinces}. Look along its row of isConnected for unvisited neighbours.` });
      for (let j = 0; j < n; j++) { t.op(); if (m[i][j] && !seen[j]) dfs(j); }
    };
    for (let i = 0; i < n; i++) {
      t.op();
      if (seen[i]) continue;
      const q = !asked && provinces > 0 ? (asked = true, { ask: { q: `City ${i} hasn't been reached by any search so far. What does that mean?`, options: ["It starts a new province", "It belongs to the last province", "It has no neighbours"], answer: 0 } }) : {};
      provinces++;
      t.step({ ...q, line: 7, array: [], graphs: graphOf(n, links, { ...tones(), [i]: "compare" }, notes), vars: { provinces, start: i },
        message: `City ${i} wasn't reached by any earlier search, so it starts province ${provinces}.` });
      dfs(i);
    }
    t.step({ line: 9, array: [], graphs: graphOf(n, links, tones(), notes), vars: { provinces }, done: "found",
      message: `${provinces} province${provinces === 1 ? "" : "s"}. Each city scans its whole row of isConnected once: O(n²), the size of the matrix.` });
  },
};

const unionCount: Approach<Input> = {
  id: "unionFind",
  name: "Union-find",
  code: `function findCircleNum(isConnected)
    n ← length(isConnected)
    provinces ← n  // each city alone
    for i ← 0 to n - 1
        for j ← i + 1 to n - 1
            if isConnected[i][j] = 1 and union(i, j)
                provinces -= 1
    return provinces
`,
  run({ n, links }, t) {
    const m = matrixOf(n, links), uf = new UnionFind(n, true, true);
    t.step({ line: 3, array: [], trees: uf.view(), grid: uf.panel(), vars: { provinces: n },
      message: `Start with every city as its own province. Each connected pair is a union; a union that joins two different groups merges two provinces into one. (union, from the read, returns true when it joined two groups.)` });
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      t.op();
      if (!m[i][j]) continue;
      unionSteps(uf, i, j, t, { find: 6, same: 6, link: 7 }, () => ({}), k++ === 1, ["i", "j"]);
    }
    t.step({ line: 8, array: [], trees: uf.view(), grid: uf.panel(), vars: { provinces: uf.groups() }, done: "found",
      message: `${uf.groups()} province${uf.groups() === 1 ? "" : "s"}: one per tree. Reading the matrix is O(n²), and each union is almost O(1), so O(n²) overall, the same as the search. Union-find shines when links arrive one at a time.` });
  },
};

export const approaches = { dfs: dfsCount, unionFind: unionCount };
