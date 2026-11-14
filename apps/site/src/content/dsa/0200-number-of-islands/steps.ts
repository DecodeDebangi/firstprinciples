import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** The map as rows of 0s and 1s separated by spaces, e.g. "11001 10011". */
export type Input = { map: string };

export const example: Input = { map: "11001 10011 00100 10110" };

export const fields: InputField[] = [{ key: "map", label: "map (rows of 0/1, space-separated)", kind: "text" }];

export function prepare(raw: Input): Prepared<Input> {
  // Rows are separated by spaces or "/"; commas inside a row are ignored, so "1,0/0,1" works too.
  const rows = raw.map.trim().split(/[\s/]+/).map((r) => r.replace(/,/g, "")).filter(Boolean);
  if (!rows.length) return { error: "Type at least one row, like 1100." };
  if (rows.some((r) => !/^[01]+$/.test(r))) return { error: "Rows may only contain 0 (water) and 1 (land)." };
  if (rows.some((r) => r.length !== rows[0].length)) return { error: "Every row must be the same length." };
  if (rows.length > 5 || rows[0].length > 6) return { error: "Use at most 5 rows of 6 so the map fits." };
  return { input: { map: rows.join(" ") } };
}

const parse = (map: string) => map.split(" ").map((r) => r.split("").map(Number));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
/** Islands take turns between two colours so neighbouring ones stay distinct. */
const islandTone = (k: number): Tone => (k % 2 ? "settled" : "side-a");

/** The board: water faded, each island in its colour, plus whatever is happening now. */
function boardOf(g: number[][], owner: number[][], extra: Record<string, Tone> = {}) {
  const tones: Record<string, Tone> = {};
  g.forEach((row, r) => row.forEach((v, c) => {
    if (!v) tones[`${r},${c}`] = "discard";
    else if (owner[r][c]) tones[`${r},${c}`] = islandTone(owner[r][c]);
  }));
  return { rows: g.map((row) => row.map(String)), tones: { ...tones, ...extra } };
}

const islandAsk = (r: number, c: number, count: number) => ({
  q: `The scan reaches land at row ${r}, column ${c} that no island has claimed yet. What does that mean?`,
  options: [`A new island: count it (${count + 1}) and claim all of it`, "Part of the last island: skip it"],
  answer: 0,
});

const dfs: Approach<Input> = {
  id: "dfs",
  name: "Depth-first: sink each island",
  code: `DIRS ← [(1, 0), (-1, 0), (0, 1), (0, -1)]
function numIslands(grid)
    R, C ← length(grid), length(grid[0])
    function sink(r, c)
        if not (0 ≤ r < R and 0 ≤ c < C)
            return  // off the map
        if grid[r][c] ≠ "1"
            return  // water, or sunk already
        grid[r][c] ← "0"  // sink it: visited
        for each (dr, dc) in DIRS
            sink(r + dr, c + dc)
    count ← 0
    for r ← 0 to R - 1
        for c ← 0 to C - 1
            if grid[r][c] = "1"
                count += 1  // a new island
                sink(r, c)
    return count
`,
  run({ map }, t) {
    const g = parse(map);
    const R = g.length, C = g[0].length;
    const owner = g.map((row) => row.map(() => 0));
    const stack: string[] = [];
    let count = 0, sunk = 0;
    t.step({ line: 12, array: [], board: boardOf(g, owner), vars: { islands: 0 },
      message: "Scan the map cell by cell. Land that no island has claimed yet starts a new island; then sink every land cell connected to it (up, down, left, right), so the scan never counts it again." });
    const sink = (r: number, c: number) => {
      t.op();
      if (r < 0 || r >= R || c < 0 || c >= C || !g[r][c] || owner[r][c]) return;
      owner[r][c] = count;
      sunk++;
      stack.push(`sink(${r}, ${c})`);
      t.step({ line: 9, array: [], board: boardOf(g, owner, { [`${r},${c}`]: "active" }), stack: [...stack], vars: { islands: count, row: r, col: c },
        message: `Sink (${r}, ${c}): it joins island ${count}. Then try its four neighbours; water, sunk cells and the edge of the map return straight away.` });
      for (const [dr, dc] of DIRS) sink(r + dr, c + dc);
      stack.pop();
    };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      t.op();
      if (!g[r][c] || owner[r][c]) continue;
      t.step({ ask: islandAsk(r, c, count), line: 16, array: [], board: boardOf(g, owner, { [`${r},${c}`]: "compare" }), stack: [], vars: { islands: count + 1, row: r, col: c },
        message: `Land at (${r}, ${c}) that isn't sunk: island ${count + 1}. Sink all of it.` });
      count++;
      sink(r, c);
    }
    t.step({ line: 18, array: [], board: boardOf(g, owner), stack: [], vars: { islands: count }, done: "found",
      message: `${count} island${count === 1 ? "" : "s"}. Every cell is scanned once and sunk at most once, and each sink checks 4 neighbours: O(rows × cols) time. The recursion can be as deep as the biggest island: O(rows × cols) space in the worst case.` });
  },
};

const bfs: Approach<Input> = {
  id: "bfs",
  name: "Breadth-first: flood with a queue",
  code: `// queue: join at back, leave from front
DIRS ← [(1, 0), (-1, 0), (0, 1), (0, -1)]
function numIslands(grid)
    R, C ← length(grid), length(grid[0])
    count ← 0
    for r ← 0 to R - 1
        for c ← 0 to C - 1
            if grid[r][c] ≠ "1"
                continue
            count += 1  // a new island
            grid[r][c] ← "0"  // mark when queued
            queue ← queue of [(r, c)]
            while queue not empty
                i, j ← queue.popFront()
                for each (di, dj) in DIRS
                    x, y ← i + di, j + dj
                    inside ← 0 ≤ x < R and 0 ≤ y < C
                    if inside and grid[x][y] = "1"
                        grid[x][y] ← "0"
                        queue.push((x, y))
    return count
`,
  run({ map }, t) {
    const g = parse(map);
    const R = g.length, C = g[0].length;
    const owner = g.map((row) => row.map(() => 0));
    let count = 0;
    const panel = (q: [number, number][]) => ({ stack: [...q].reverse().map(([a, b]) => `(${a}, ${b})`), stackTitle: "Queue, front first" });
    t.step({ line: 5, array: [], board: boardOf(g, owner), ...panel([]), vars: { islands: 0 },
      message: "Scan the map. Unclaimed land starts a new island; flood it outward with a queue, one ring of neighbours at a time. Mark cells when they're queued, so none is queued twice." });
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      t.op();
      if (!g[r][c] || owner[r][c]) continue;
      count++;
      owner[r][c] = count;
      const q: [number, number][] = [[r, c]];
      t.step({ ask: islandAsk(r, c, count - 1), line: 10, array: [], board: boardOf(g, owner, { [`${r},${c}`]: "compare" }), ...panel(q), vars: { islands: count, row: r, col: c },
        message: `Land at (${r}, ${c}) that isn't claimed: island ${count}. Mark it and queue it.` });
      while (q.length) {
        const [i, j] = q.shift()!;
        t.op();
        const fresh: string[] = [];
        const extra: Record<string, Tone> = { [`${i},${j}`]: "active" };
        for (const [di, dj] of DIRS) {
          const x = i + di, y = j + dj;
          t.op();
          if (x >= 0 && x < R && y >= 0 && y < C && g[x][y] && !owner[x][y]) {
            owner[x][y] = count;
            q.push([x, y]);
            fresh.push(`(${x}, ${y})`);
            extra[`${x},${y}`] = "compare";
          }
        }
        t.step({ line: fresh.length ? 20 : 14, array: [], board: boardOf(g, owner, extra), ...panel(q), vars: { islands: count, row: i, col: j },
          message: `Take (${i}, ${j}) from the front. ${fresh.length ? `Unclaimed land next to it: ${fresh.join(", ")}. Mark and queue.` : "No unclaimed land next to it."}` });
      }
    }
    t.step({ line: 21, array: [], board: boardOf(g, owner), ...panel([]), vars: { islands: count }, done: "found",
      message: `${count} island${count === 1 ? "" : "s"}. Each cell is scanned once and queued at most once: O(rows × cols) time. The queue only holds an island's current frontier, usually far fewer cells than the island, and there's no recursion to overflow.` });
  },
};

export const approaches = { dfs, bfs };
