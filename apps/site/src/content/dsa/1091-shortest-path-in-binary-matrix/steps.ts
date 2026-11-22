import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { bfsLayers, charGridError, key, parseCharGrid, DIRS8 } from "../../concepts/50-searching-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "00010 11010 00000 01110 00010" };
export const fields: InputField[] = [{ key: "grid", label: "grid (0 open, 1 blocked)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "01", 5, 5);
  if (e) return { error: e };
  if (g.length !== g[0].length) return { error: "The grid must be square (n × n)." };
  return { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
const blocked = (g: string[][]) => Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), ch === "1" ? "discard" : ""])).filter(([, v]) => v)) as Record<string, Tone>;

const relax: Approach<Input> = {
  id: "relax",
  name: "Improve distances until nothing changes",
  code: `function shortestPathBinaryMatrix(grid)
    dist ← n × n grid, all ∞
    dist[0][0] ← 1  // the path counts cells
    repeat
        changed ← false
        for each open cell (r, c)
            d ← 1 + min dist of its 8 neighbours
            if d < dist[r][c]
                dist[r][c], changed ← d, true
    until not changed
    return dist[n-1][n-1], or -1 if it's ∞
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), n = g.length;
    if (g[0][0] === "1" || g[n - 1][n - 1] === "1") {
      t.step({ line: 11, array: [], board: { rows: g, labels: true, tones: blocked(g) }, vars: { answer: -1 }, done: "notfound", message: `The start or the end is blocked: return -1.` });
      return;
    }
    const dist = g.map((row) => row.map(() => Infinity));
    dist[0][0] = 1;
    const show = () => g.map((row, r) => row.map((ch, c) => (ch === "1" ? "" : dist[r][c] === Infinity ? "∞" : dist[r][c])));
    t.step({ line: 3, array: [], board: { rows: show(), labels: true, tones: blocked(g) }, vars: { sweeps: 0 },
      message: `Give every open cell a best-known path length, ∞ at first, and 1 for the start. Then sweep the grid again and again, improving each cell from its 8 neighbours, until a whole sweep changes nothing.` });
    let sweeps = 0, changed = true;
    while (changed) {
      changed = false; sweeps++;
      const improved: Record<string, Tone> = {};
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (g[r][c] === "1" || (r === 0 && c === 0)) continue;
        t.op(8);
        let best = Infinity;
        for (const [dr, dc] of DIRS8) { const v = dist[r + dr]?.[c + dc]; if (v !== undefined && g[r + dr][c + dc] === "0") best = Math.min(best, v); }
        if (best + 1 < dist[r][c]) { dist[r][c] = best + 1; changed = true; improved[key(r, c)] = "found"; }
      }
      t.step({ line: changed ? 9 : 10, array: [], board: { rows: show(), labels: true, tones: { ...blocked(g), ...improved } }, vars: { sweeps },
        message: changed ? `Sweep ${sweeps}: ${Object.keys(improved).length} cell${Object.keys(improved).length === 1 ? "" : "s"} found a shorter path (green).` : `Sweep ${sweeps} changed nothing: every distance is final.` });
    }
    const ans = dist[n - 1][n - 1] === Infinity ? -1 : dist[n - 1][n - 1];
    t.step({ line: 11, array: [], board: { rows: show(), labels: true, tones: { ...blocked(g), [key(n - 1, n - 1)]: ans > 0 ? "found" : "miss" } }, vars: { sweeps, answer: ans }, done: ans > 0 ? "found" : "notfound",
      message: `${ans > 0 ? `The shortest clear path has ${ans} cells.` : "The end can't be reached: -1."} That took ${sweeps} sweeps over all n² cells, and a winding path can need up to n² sweeps: O(n⁴).` });
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "BFS with 8 neighbours",
  code: `function shortestPathBinaryMatrix(grid)
    if grid[0][0] or grid[n-1][n-1] is blocked
        return -1
    queue ← [(0, 0)] with length 1
    while queue not empty
        r, c, len ← queue.popFront()
        if (r, c) = (n - 1, n - 1)
            return len
        for each of the 8 neighbours (nr, nc)
            if it's open and not seen
                queue.push((nr, nc, len + 1))
    return -1
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), n = g.length;
    if (g[0][0] === "1" || g[n - 1][n - 1] === "1") {
      t.step({ line: 3, array: [], board: { rows: g, labels: true, tones: blocked(g) }, vars: { answer: -1 }, done: "notfound", message: `The start or the end is blocked: return -1.` });
      return;
    }
    const base = g.map((row) => row.map((ch) => (ch === "1" ? "" : "")));
    t.step({ line: 4, array: [], board: { rows: base, labels: true, tones: blocked(g) }, vars: {},
      message: `Every move costs one cell, so BFS from the top-left reaches cells in order of path length. Moves go in all 8 directions, diagonals included. The first time the bottom-right is reached, that's the shortest.` });
    const { dist } = bfsLayers({ t, rows: base, sources: [[0, 0]], open: (r, c) => g[r][c] === "0", dirs: DIRS8, line: 11, ask: true, stopAt: [n - 1, n - 1], mark: (d) => d + 1,
      layerMsg: (d, cells) => `Path length ${d + 1}: ${cells.length} cell${cells.length === 1 ? "" : "s"}${cells.some(([r, c]) => r === n - 1 && c === n - 1) ? ", including the bottom-right corner" : ""}.` });
    const end = dist.get(key(n - 1, n - 1)), ans = end === undefined ? -1 : end + 1;
    t.step({ line: ans > 0 ? 8 : 12, array: [], board: { rows: g.map((row, r) => row.map((ch, c) => (ch === "1" ? "" : dist.has(key(r, c)) ? dist.get(key(r, c))! + 1 : ""))), labels: true, tones: { ...blocked(g), [key(n - 1, n - 1)]: ans > 0 ? "found" : "miss" } }, vars: { answer: ans }, done: ans > 0 ? "found" : "notfound",
      message: ans > 0 ? `The bottom-right corner is first reached with a path of ${ans} cells: the shortest. Each cell was queued at most once: O(n²).` : `The queue ran out without reaching the corner: return -1.` });
  },
};

export const approaches = { relax, bfs };

/** An n × n grid with a snaking corridor, so the path winds back and forth. */
export const growth = measureGrowth(
  [{ approach: relax, slot: 1 }, { approach: bfs, slot: 3 }],
  (n) => ({ grid: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r % 2 === 1 && (r % 4 === 1 ? c < n - 1 : c > 0) ? "1" : "0")).join("")).join(" ") }),
  [3, 5, 7, 9, 11],
);
