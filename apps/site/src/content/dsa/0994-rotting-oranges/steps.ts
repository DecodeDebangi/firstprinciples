import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { bfsLayers, charGridError, key, parseCharGrid, DIRS4, type Cell } from "../../concepts/50-searching-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "2110 1101 0112 1001" };
export const fields: InputField[] = [{ key: "grid", label: "grid (2 rotten, 1 fresh, 0 empty)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "012");
  return e ? { error: e } : { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
const toneOf = (ch: string): Tone | undefined => (ch === "0" ? "discard" : ch === "2" ? "miss" : undefined);
const tonesFor = (g: string[][]) => Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), toneOf(ch)])).filter(([, v]) => v)) as Record<string, Tone>;

const simulate: Approach<Input> = {
  id: "simulate",
  name: "Scan the whole grid every minute",
  code: `function orangesRotting(grid)
    minutes ← 0
    repeat
        newly ← fresh cells beside a rotten one
        if newly is empty
            break
        make every cell in newly rotten
        minutes += 1
    return any fresh left ? -1 : minutes
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), R = g.length, C = g[0].length;
    let minutes = 0;
    t.step({ line: 2, array: [], board: { rows: g.map((r) => [...r]), labels: true, tones: tonesFor(g) }, vars: { minutes },
      message: `Each minute, every fresh orange (1) next to a rotten one (2) goes rotten. Simulate it directly: scan the whole grid for fresh oranges with a rotten neighbour, rot them all, and repeat.` });
    for (;;) {
      const newly: Cell[] = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        t.op();
        if (g[r][c] === "1" && DIRS4.some(([dr, dc]) => g[r + dr]?.[c + dc] === "2")) newly.push([r, c]);
      }
      if (!newly.length) break;
      newly.forEach(([r, c]) => (g[r][c] = "2"));
      minutes++;
      t.step({ line: 7, array: [], board: { rows: g.map((r) => [...r]), labels: true, tones: { ...tonesFor(g), ...Object.fromEntries(newly.map(([r, c]) => [key(r, c), "found" as Tone])) } }, vars: { minutes },
        message: `Minute ${minutes}: a full scan of all ${R * C} cells finds ${newly.length} fresh orange${newly.length === 1 ? "" : "s"} next to rotten ones. They rot.` });
    }
    const fresh = g.flat().includes("1");
    t.step({ line: 9, array: [], board: { rows: g, labels: true, tones: tonesFor(g) }, vars: { minutes, answer: fresh ? -1 : minutes }, done: fresh ? "notfound" : "found",
      message: fresh ? `Nothing more rots, but fresh oranges are left that no rotten one can reach: return -1.` : `Everything is rotten after ${minutes} minute${minutes === 1 ? "" : "s"}. Each minute rescanned the whole grid: up to O((rows · columns)²).` });
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Multi-source BFS",
  code: `function orangesRotting(grid)
    queue ← every rotten orange, at minute 0
    while queue not empty
        r, c ← queue.popFront()
        for each neighbour (nr, nc) of (r, c)
            if grid[nr][nc] is fresh
                rot it at minute[r][c] + 1
                queue.push((nr, nc))
    if any fresh orange is left
        return -1
    return the largest minute
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), sources: Cell[] = [];
    g.forEach((row, r) => row.forEach((ch, c) => { if (ch === "2") sources.push([r, c]); }));
    const base = g.map((row) => row.map((ch) => (ch === "0" ? "" : ch)));
    t.step({ line: 2, array: [], board: { rows: base, labels: true, tones: tonesFor(g) }, vars: {},
      message: `The rot spreads from every rotten orange at once, one step per minute: that's BFS from all of them together. Each fresh orange then shows the minute it rots.` });
    const { dist } = bfsLayers({ t, rows: base, sources, open: (r, c) => g[r][c] === "1", line: 7, ask: true, mark: (d) => d,
      layerMsg: (d, cells) => d === 0 ? `Minute 0: the ${cells.length} rotten orange${cells.length === 1 ? "" : "s"} start the spread.` : `Minute ${d}: ${cells.length} fresh orange${cells.length === 1 ? "" : "s"} next to minute-${d - 1} rot go rotten.` });
    const fresh = g.flat().filter((ch) => ch === "1").length, reachedFresh = [...dist.values()].filter((d) => d > 0).length;
    const left = fresh - reachedFresh, maxD = Math.max(0, ...dist.values());
    t.step({ line: left ? 10 : 11, array: [], board: { rows: g.map((row, r) => row.map((ch, c) => (ch === "1" && !dist.has(key(r, c)) ? "1" : ch === "0" ? "" : dist.get(key(r, c)) ?? ch))), labels: true, tones: Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), (ch === "0" ? "discard" : ch === "1" && !dist.has(key(r, c)) ? "miss" : "settled") as Tone]))) }, vars: { answer: left ? -1 : maxD }, done: left ? "notfound" : "found",
      message: left ? `${left} fresh orange${left === 1 ? " is" : "s are"} never reached: return -1.` : `Every orange is rotten by minute ${maxD}. One BFS: each cell is handled once, O(rows · columns).` });
  },
};

export const approaches = { simulate, bfs };

/** A single row of n cells, rotten only at the left end: one new orange per minute. */
export const growth = measureGrowth(
  [{ approach: simulate, slot: 1 }, { approach: bfs, slot: 3 }],
  (n) => ({ grid: "2" + "1".repeat(n - 1) }),
  [4, 8, 16, 24, 32],
);
