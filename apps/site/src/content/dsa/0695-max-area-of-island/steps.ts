import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { charGridError, floodSteps, key, parseCharGrid, DIRS4, type Cell } from "../../concepts/50-searching-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "110010 100011 001011 111000" };
export const fields: InputField[] = [{ key: "grid", label: "grid (1 land, 0 water)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "01");
  return e ? { error: e } : { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
const water = (g: string[][]) => Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), ch === "0" ? "discard" : ""])).filter(([, v]) => v)) as Record<string, Tone>;
/** The island containing (r, c), found silently, counting one operation per neighbour check. */
const islandOf = (g: string[][], r0: number, c0: number, op: (k: number) => void) => {
  const seen = new Set([key(r0, c0)]), st: Cell[] = [[r0, c0]], got: Cell[] = [];
  while (st.length) { const [r, c] = st.pop()!; got.push([r, c]); for (const [dr, dc] of DIRS4) { op(1); const a = r + dr, b = c + dc; if (g[a]?.[b] === "1" && !seen.has(key(a, b))) { seen.add(key(a, b)); st.push([a, b]); } } }
  return got;
};

const fromEveryCell: Approach<Input> = {
  id: "everyCell",
  name: "Measure the island of every land cell",
  code: `function maxAreaOfIsland(grid)
    best ← 0
    for each land cell (r, c)
        size ← area(grid, r, c)  // flood fill
        best ← max(best, size)
    return best
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid);
    let best = 0;
    t.step({ line: 2, array: [], board: { rows: g, labels: true, tones: water(g) }, vars: { best }, message: `For every land cell, flood-fill its island from scratch and measure it. Simple, but a cell in a big island gets its island measured once for every cell in it.` });
    g.forEach((row, r) => row.forEach((ch, c) => {
      t.op();
      if (ch !== "1") return;
      const cells = islandOf(g, r, c, (k) => t.op(k));
      best = Math.max(best, cells.length);
      t.step({ line: 5, array: [], board: { rows: g, labels: true, tones: { ...water(g), ...Object.fromEntries(cells.map(([a, b]) => [key(a, b), "compare" as Tone])), [key(r, c)]: "active" } }, vars: { r, c, size: cells.length, best },
        message: `From (${r}, ${c}): its island has ${cells.length} cell${cells.length === 1 ? "" : "s"}${cells.length > 1 ? ", measured again even if a neighbour already measured it" : ""}.` });
    }));
    t.step({ line: 6, array: [], board: { rows: g, labels: true, tones: water(g) }, vars: { best }, done: "found",
      message: `The biggest island has ${best} cells. Each land cell re-measures its whole island: up to O((rows · columns)²) when one island covers the grid.` });
  },
};

const once: Approach<Input> = {
  id: "once",
  name: "Measure each island once",
  code: `function maxAreaOfIsland(grid)
    seen ← empty set
    best ← 0
    for each land cell (r, c) not in seen
        size ← flood fill from (r, c) into seen
        best ← max(best, size)
    return best
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), seen = new Set<string>(), done: Record<string, Tone> = {};
    let best = 0, islands = 0;
    t.step({ line: 2, array: [], board: { rows: g, labels: true, tones: water(g) }, vars: { best }, message: `Keep one "seen" set for the whole grid. Each new land cell starts a flood fill that measures its whole island and marks every cell of it seen, so no island is measured twice.` });
    g.forEach((row, r) => row.forEach((ch, c) => {
      t.op();
      if (ch !== "1" || seen.has(key(r, c))) return;
      islands++;
      const cells = floodSteps({ t, rows: g, start: [r, c], open: (a, b) => g[a][b] === "1", seen, base: { ...water(g), ...done }, line: 5, label: "size" });
      cells.forEach(([a, b]) => (done[key(a, b)] = cells.length > best ? "found" : "visited"));
      if (cells.length > best) { Object.keys(done).forEach((k) => { if (done[k] === "found" && !cells.some(([a, b]) => key(a, b) === k)) done[k] = "visited"; }); best = cells.length; }
      t.step({ line: 6, array: [], board: { rows: g, labels: true, tones: { ...water(g), ...done } }, vars: { islands, best },
        message: `Island ${islands} has ${cells.length} cell${cells.length === 1 ? "" : "s"}. The biggest so far: ${best}.` });
    }));
    t.step({ line: 7, array: [], board: { rows: g, labels: true, tones: { ...water(g), ...done } }, vars: { islands, best }, done: "found",
      message: `${islands} island${islands === 1 ? "" : "s"}; the biggest has ${best} cells (green). Every cell is visited once: O(rows · columns).` });
  },
};

export const approaches = { everyCell: fromEveryCell, once };

/** One n × 3 block of land: a single island covering everything. */
export const growth = measureGrowth(
  [{ approach: fromEveryCell, slot: 1 }, { approach: once, slot: 3 }],
  (n) => ({ grid: Array(n).fill("111").join(" ") }),
  [2, 4, 6, 8, 10],
);
