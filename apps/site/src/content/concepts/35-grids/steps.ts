import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** A grid typed as rows separated by "/", values by spaces or commas: "1 2 3 / 4 5 6". */
export const parseGrid = (s: string): number[][] =>
  s.split("/").map((r) => r.trim().split(/[\s,]+/).filter(Boolean).map(Number)).filter((r) => r.length);
export const gridText = (g: (number | string)[][]) => g.map((r) => r.join(" ")).join(" / ");
/** Checks a typed grid; returns an error message, or null when it's fine. */
export function gridError(g: number[][], maxRows: number, maxCols: number, square = false): string | null {
  if (!g.length) return 'Type at least one row, like "1 2 / 3 4".';
  if (g.some((r) => r.some((x) => !Number.isFinite(x)))) return "Use whole numbers only.";
  if (g.some((r) => r.length !== g[0].length)) return "Every row needs the same number of values.";
  if (square && g.length !== g[0].length) return "The grid must be square: as many rows as columns.";
  if (g.length > maxRows || g[0].length > maxCols) return `Use at most ${maxRows} rows of ${maxCols} so the grid fits.`;
  return null;
}
export const key = (r: number, c: number) => `${r},${c}`;
type T = Parameters<Approach<{ grid: string }>["run"]>[1];

/* ---------- Walking row by row ---------- */
export type WalkInput = { grid: string };
export const walkExample: WalkInput = { grid: "4 7 1 9 / 2 8 6 3 / 5 0 7 2" };
export const walkFields: InputField[] = [{ key: "grid", label: "grid (rows split by /)", kind: "text" }];
export function walkPrepare(raw: WalkInput): Prepared<WalkInput> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 4, 5);
  return e ? { error: e } : { input: { grid: gridText(g) } };
}

const walk: Approach<WalkInput> = {
  id: "walk",
  name: "Row by row",
  code: `function walkGrid(grid)
    m ← length(grid)  // rows
    n ← length(grid[0])  // columns
    for r ← 0 to m - 1
        for c ← 0 to n - 1
            visit grid[r][c]
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length;
    const tones: Record<string, Tone> = {};
    t.step({ line: 3, array: [], board: { rows: g, labels: true }, vars: { m, n },
      message: `A grid is a list of rows. m = ${m} rows (numbered down the left) and n = ${n} columns (along the top). grid[r][c] is row r, then column c within that row.` });
    let asked = false;
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        t.op();
        const ask = !asked && r === 1 && c === 0 && n > 1
          ? (asked = true, { ask: { q: `Row 0 is finished at grid[0][${n - 1}]. Which cell comes next?`, options: ["grid[1][0]", `grid[0][${n}]`, `grid[1][${n - 1}]`], answer: 0 } }) : {};
        t.step({ ...ask, line: 6, array: [], board: { rows: g, labels: true, tones: { ...tones, [key(r, c)]: "active" } }, vars: { r, c, "r · n + c": r * n + c },
          message: c === 0 && r > 0
            ? `Row ${r - 1} is done, so the inner loop starts again at c = 0 on the next row: grid[${r}][0] = ${g[r][0]}.`
            : `grid[${r}][${c}] = ${g[r][c]}: row ${r}, column ${c}. It's cell number ${r} · ${n} + ${c} = ${r * n + c} in reading order.` });
        tones[key(r, c)] = "visited";
      }
    }
    t.step({ line: 6, array: [], board: { rows: g, labels: true, tones }, vars: { visited: m * n }, done: "found",
      message: `Every cell once, in reading order: m · n = ${m} · ${n} = ${m * n} visits, so O(m · n). Swap the two loops to go column by column instead.` });
  },
};

/* ---------- Neighbours ---------- */
export type NbrInput = { rows: number; cols: number; r: number; c: number };
export const nbrExample: NbrInput = { rows: 3, cols: 4, r: 0, c: 2 };
export const nbrFields: InputField[] = [
  { key: "rows", label: "rows m", kind: "number" },
  { key: "cols", label: "columns n", kind: "number" },
  { key: "r", label: "cell row r", kind: "number" },
  { key: "c", label: "cell column c", kind: "number" },
];
export function nbrPrepare(raw: NbrInput): Prepared<NbrInput> {
  if (raw.rows < 1 || raw.rows > 4 || raw.cols < 1 || raw.cols > 5) return { error: "Use 1 to 4 rows and 1 to 5 columns." };
  if (raw.r < 0 || raw.r >= raw.rows || raw.c < 0 || raw.c >= raw.cols) return { error: `The cell must be inside the grid: r from 0 to ${raw.rows - 1}, c from 0 to ${raw.cols - 1}.` };
  return { input: raw };
}

const DIRS: [number, number, string][] = [[-1, 0, "up"], [1, 0, "down"], [0, -1, "left"], [0, 1, "right"]];
const neighbours: Approach<NbrInput> = {
  id: "neighbours",
  name: "The four neighbours",
  code: `function neighbours(grid, r, c)
    m, n ← length(grid), length(grid[0])
    directions ← [(-1, 0), (1, 0), (0, -1), (0, 1)]
    result ← empty list
    for each dr, dc in directions
        nr, nc ← r + dr, c + dc
        if 0 ≤ nr < m and 0 ≤ nc < n
            result.push((nr, nc))
    return result
`,
  run({ rows: m, cols: n, r, c }, t) {
    const cells = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => key(i, j)));
    const tones: Record<string, Tone> = { [key(r, c)]: "found" };
    const result: string[] = [];
    t.step({ line: 4, array: [], board: { rows: cells, tones: { ...tones } }, vars: { r, c, m, n },
      message: `Each cell shows its own "row,column". The neighbours of (${r}, ${c}) are one step up, down, left and right. Each direction is a change (dr, dc) to add to the row and column.` });
    for (const [dr, dc, name] of DIRS) {
      t.op();
      const nr = r + dr, nc = c + dc, inside = nr >= 0 && nr < m && nc >= 0 && nc < n;
      const ask = { q: `Going ${name}: (${r} + ${dr}, ${c} + ${dc}) = (${nr}, ${nc}). Is that inside a grid of ${m} × ${n}?`, options: ["Yes: add it", "No: it's off the edge, skip it"], answer: inside ? 0 : 1 };
      const why = nr < 0 ? `row ${nr} doesn't exist (rows start at 0)` : nr >= m ? `row ${nr} doesn't exist (the last row is ${m - 1})` : nc < 0 ? `column ${nc} doesn't exist (columns start at 0)` : `column ${nc} doesn't exist (the last column is ${n - 1})`;
      if (inside) {
        result.push(`(${nr}, ${nc})`);
        tones[key(nr, nc)] = "settled";
        t.step({ ask, line: 8, array: [], board: { rows: cells, tones: { ...tones, [key(nr, nc)]: "compare" } }, vars: { dr, dc, nr, nc, result: result.join(" ") },
          message: `${name}: (${nr}, ${nc}) passes the check 0 ≤ ${nr} < ${m} and 0 ≤ ${nc} < ${n}. Add it.` });
      } else {
        t.step({ ask, line: 7, array: [], board: { rows: cells, tones: { ...tones } }, vars: { dr, dc, nr, nc, result: result.join(" ") || "none yet" },
          message: `${name}: (${nr}, ${nc}) is off the grid: ${why}. Reading grid[${nr}][${nc}] would crash or read garbage, so the check skips it.` });
      }
    }
    t.step({ line: 9, array: [], board: { rows: cells, tones }, vars: { result: result.join(" ") }, done: "found",
      message: `(${r}, ${c}) has ${result.length} neighbour${result.length === 1 ? "" : "s"}. A cell in the middle has 4, an edge cell 3 and a corner 2: always check the bounds before reading.` });
  },
};

/* ---------- Transposing ---------- */
export type TrInput = { grid: string };
export const trExample: TrInput = { grid: "1 2 3 4 / 5 6 7 8 / 9 10 11 12 / 13 14 15 16" };
export const trFields: InputField[] = [{ key: "grid", label: "square grid (rows split by /)", kind: "text" }];
export function trPrepare(raw: TrInput): Prepared<TrInput> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 5, 5, true);
  return e ? { error: e } : { input: { grid: gridText(g) } };
}

/** Transpose g in place, one step per swap. Shared with Rotate Image. */
export function transposeSteps(g: number[][], t: T, line: number, extraVars: Record<string, string | number> = {}, askOnce = true) {
  const n = g.length;
  const done: Record<string, Tone> = {};
  for (let i = 0; i < n; i++) done[key(i, i)] = "settled";
  let asked = !askOnce;
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      t.op();
      const ask = !asked && r === 0 && c === Math.min(2, n - 1)
        ? (asked = true, { ask: { q: `Which cell does grid[0][${c}] swap with?`, options: [`grid[${c}][0]`, `grid[0][${n - 1 - c}]`, `grid[${c}][${c}]`], answer: 0 } }) : {};
      const [a, b] = [g[r][c], g[c][r]];
      [g[r][c], g[c][r]] = [b, a];
      done[key(r, c)] = "settled"; done[key(c, r)] = "settled";
      t.step({ ...ask, line, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: { ...done, [key(r, c)]: "found", [key(c, r)]: "found" } }, vars: { ...extraVars, r, c },
        message: `Swap grid[${r}][${c}] = ${a} with grid[${c}][${r}] = ${b}: the mirror cells across the diagonal. Now ${b} is at (${r}, ${c}) and ${a} is at (${c}, ${r}).` });
    }
  }
}

const transpose: Approach<TrInput> = {
  id: "transpose",
  name: "Transpose in place",
  code: `function transpose(grid)  // n × n
    n ← length(grid)
    for r ← 0 to n - 1
        for c ← r + 1 to n - 1
            swap grid[r][c] and grid[c][r]
`,
  run({ grid }, t) {
    const g = parseGrid(grid), n = g.length;
    const diag = Object.fromEntries(Array.from({ length: n }, (_, i) => [key(i, i), "settled" as Tone]));
    t.step({ line: 2, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: diag }, vars: { n },
      message: `Transposing turns rows into columns: the value at (r, c) moves to (c, r). The diagonal, where r = c, stays put. Every other cell swaps with its mirror across the diagonal, exactly once, so c starts at r + 1.` });
    transposeSteps(g, t, 5);
    t.step({ line: 5, array: [], board: { rows: g, labels: true, tones: Object.fromEntries(g.flatMap((row, r) => row.map((_, c) => [key(r, c), "settled" as Tone]))) }, vars: { swaps: n * (n - 1) / 2 }, done: "found",
      message: `Done: row 0 is now ${g[0].join(", ")}, which was column 0. ${n * (n - 1) / 2} swaps, O(n²), and no second grid. Reverse each row afterwards and the grid has turned a quarter clockwise.` });
  },
};

export const walkApproaches = { walk };
export const nbrApproaches = { neighbours };
export const trApproaches = { transpose };
