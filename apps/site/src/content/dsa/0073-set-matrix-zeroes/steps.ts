import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gridError, gridText, key, parseGrid } from "../../concepts/35-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "3 1 0 2 / 5 0 7 1 / 6 2 8 4 / 9 4 3 5" };
export const fields: InputField[] = [{ key: "grid", label: "grid (rows split by /)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 4, 5);
  return e ? { error: e } : { input: { grid: gridText(g) } };
}

const snap = (g: number[][]) => g.map((r) => [...r]);
/** Grey for cells already zeroed by the algorithm. */
const zeroTones = (g: number[][], from: number[][]) => {
  const t: Record<string, Tone> = {};
  g.forEach((row, r) => row.forEach((v, c) => { if (v === 0 && from[r][c] !== 0) t[key(r, c)] = "discard"; }));
  return t;
};
const list = (xs: number[]) => (xs.length ? xs.join(", ") : "none");

const copyFirst: Approach<Input> = {
  id: "copy",
  name: "Copy, then clear a row and a column per zero",
  code: `function setZeroes(grid)
    m, n ← length(grid), length(grid[0])
    old ← a copy of grid
    for r ← 0 to m - 1
        for c ← 0 to n - 1
            if old[r][c] = 0
                set every value in row r to 0
                set every value in column c to 0
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length, old = snap(g);
    t.step({ line: 3, array: [], board: { rows: snap(g), labels: true }, grid: { title: "old (the copy)", rows: old }, vars: { m, n },
      message: `Every 0 wipes out its whole row and column. Zeros written along the way mustn't wipe out more, so look for the original zeros in a copy, and write into the grid.` });
    let zeros = 0, asked = false;
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        t.op();
        if (old[r][c] !== 0) continue;
        zeros++;
        const ask = !asked && g[r].some((v, k) => k !== c && v !== 0)
          ? (asked = true, { ask: { q: `old[${r}][${c}] is 0. Which cells become 0?`, options: [`All of row ${r} and all of column ${c}`, `Just (${r}, ${c})`, `Only the cells next to (${r}, ${c})`], answer: 0 } }) : {};
        t.op(m + n);
        for (let k = 0; k < n; k++) g[r][k] = 0;
        for (let k = 0; k < m; k++) g[k][c] = 0;
        const hl: Record<string, Tone> = {};
        for (let k = 0; k < n; k++) hl[key(r, k)] = "found";
        for (let k = 0; k < m; k++) hl[key(k, c)] = "found";
        t.step({ ...ask, line: 8, array: [], board: { rows: snap(g), labels: true, tones: { ...zeroTones(g, old), ...hl } }, grid: { title: "old (the copy)", rows: old, tones: { [key(r, c)]: "active" } }, vars: { r, c },
          message: `The copy has a 0 at (${r}, ${c}), so set all of row ${r} and column ${c} to 0: ${m + n} writes. A 0 already written there doesn't count, because only the copy is searched.` });
      }
    }
    t.step({ line: 8, array: [], board: { rows: g, labels: true, tones: zeroTones(g, old) }, grid: { title: "old (the copy)", rows: old }, vars: { zeros }, done: "found",
      message: `Done. The scan is m · n, and each of the ${zeros} zeros cost m + n more writes: up to O(m · n · (m + n)) when there are many zeros. The copy costs O(m · n) memory.` });
  },
};

const markLists: Approach<Input> = {
  id: "lists",
  name: "Remember which rows and columns",
  code: `function setZeroes(grid)
    m, n ← length(grid), length(grid[0])
    zeroRow ← array of m, all false
    zeroCol ← array of n, all false
    for r ← 0 to m - 1
        for c ← 0 to n - 1
            if grid[r][c] = 0
                zeroRow[r], zeroCol[c] ← true, true
    for r ← 0 to m - 1
        for c ← 0 to n - 1
            if zeroRow[r] or zeroCol[c]
                grid[r][c] ← 0
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length, old = snap(g);
    const rows: number[] = [], cols: number[] = [];
    t.step({ line: 4, array: [], board: { rows: snap(g), labels: true }, vars: { "zero rows": "none", "zero columns": "none" },
      message: `All that matters is which rows and which columns contain a 0. Find them first, without changing anything, then clear them in a second pass.` });
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        t.op();
        if (g[r][c] !== 0) continue;
        if (!rows.includes(r)) rows.push(r);
        if (!cols.includes(c)) cols.push(c);
        t.step({ line: 8, array: [], board: { rows: snap(g), labels: true, tones: { [key(r, c)]: "active" } }, vars: { "zero rows": list(rows), "zero columns": list(cols) },
          message: `A 0 at (${r}, ${c}): remember row ${r} and column ${c}.` });
      }
    }
    let asked = false;
    for (let r = 0; r < m; r++) {
      const changed: Record<string, Tone> = {};
      for (let c = 0; c < n; c++) {
        t.op();
        if (rows.includes(r) || cols.includes(c)) { if (g[r][c] !== 0) changed[key(r, c)] = "found"; g[r][c] = 0; }
      }
      const ask = !asked && !rows.includes(r) && cols.length && n > cols.length
        ? (asked = true, { ask: { q: `Row ${r} isn't a zero row, and the zero columns are ${list(cols)}. Which of its cells become 0?`, options: [`Only those in columns ${list(cols)}`, "All of them", "None of them"], answer: 0 } }) : {};
      t.step({ ...ask, line: 12, array: [], board: { rows: snap(g), labels: true, tones: { ...zeroTones(g, old), ...changed } }, vars: { r, "zero rows": list(rows), "zero columns": list(cols) },
        message: rows.includes(r) ? `Row ${r} is a zero row: every cell becomes 0.` : cols.length ? `Row ${r} keeps its values except in the zero columns (${list(cols)}).` : `No zero columns, and row ${r} isn't a zero row: nothing changes.` });
    }
    t.step({ line: 12, array: [], board: { rows: g, labels: true, tones: zeroTones(g, old) }, vars: { "zero rows": list(rows), "zero columns": list(cols) }, done: "found",
      message: `Two passes over the grid: O(m · n) time. The two true/false lists hold m + n values: O(m + n) space.` });
  },
};

const inPlace: Approach<Input> = {
  id: "markers",
  name: "First row and column as markers",
  code: `function setZeroes(grid)
    m, n ← length(grid), length(grid[0])
    row0 ← row 0 contains a 0
    col0 ← column 0 contains a 0
    for r ← 1 to m - 1
        for c ← 1 to n - 1
            if grid[r][c] = 0
                grid[r][0] ← 0  // mark row r
                grid[0][c] ← 0  // mark column c
    for r ← 1 to m - 1
        for c ← 1 to n - 1
            if grid[r][0] = 0 or grid[0][c] = 0
                grid[r][c] ← 0
    if row0
        set every value in row 0 to 0
    if col0
        set every value in column 0 to 0
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length, old = snap(g);
    t.op(m + n);
    const row0 = g[0].includes(0), col0 = g.some((row) => row[0] === 0);
    const edge: Record<string, Tone> = {};
    for (let c = 0; c < n; c++) edge[key(0, c)] = "side-a";
    for (let r = 0; r < m; r++) edge[key(r, 0)] = "side-a";
    t.step({ line: 4, array: [], board: { rows: snap(g), labels: true, tones: edge }, vars: { row0, col0 },
      message: `Use row 0 and column 0 as the true/false lists: a 0 in grid[r][0] will mean "clear row r", and a 0 in grid[0][c] "clear column c". They're about to be written over, so first note whether they had a 0 of their own: row0 = ${row0}, col0 = ${col0}.` });
    let asked = 0;
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) {
        t.op();
        if (g[r][c] !== 0) continue;
        const ask = asked === 0
          ? (asked++, { ask: { q: `grid[${r}][${c}] is 0. Where does the algorithm note that row ${r} and column ${c} must be cleared?`, options: [`In grid[${r}][0] and grid[0][${c}]`, "In a separate list", `Nowhere: it clears them straight away`], answer: 0 } }) : {};
        g[r][0] = 0; g[0][c] = 0;
        t.step({ ...ask, line: 9, array: [], board: { rows: snap(g), labels: true, tones: { ...edge, [key(r, c)]: "active", [key(r, 0)]: "compare", [key(0, c)]: "compare" } }, vars: { r, c, row0, col0 },
          message: `A 0 at (${r}, ${c}). Mark it at the start of its row, grid[${r}][0] ← 0, and at the top of its column, grid[0][${c}] ← 0. Those cells would be cleared anyway, so nothing is lost.` });
      }
    }
    for (let r = 1; r < m; r++) {
      const changed: Record<string, Tone> = {};
      for (let c = 1; c < n; c++) {
        t.op();
        if (g[r][0] === 0 || g[0][c] === 0) { if (g[r][c] !== 0) changed[key(r, c)] = "found"; g[r][c] = 0; }
      }
      const marked = g[r][0] === 0;
      const ask = asked === 1 && !marked
        ? (asked++, { ask: { q: `Row ${r}'s marker grid[${r}][0] is ${g[r][0]}, not 0. Which of its cells (from column 1) become 0?`, options: ["Only those whose column is marked in row 0", "All of them", "None of them"], answer: 0 } }) : {};
      t.step({ ...ask, line: 13, array: [], board: { rows: snap(g), labels: true, tones: { ...edge, ...zeroTones(g, old), ...changed, [key(r, 0)]: "compare" } }, vars: { r, row0, col0 },
        message: marked ? `grid[${r}][0] is 0: row ${r} is marked, so its cells from column 1 on become 0.` : `grid[${r}][0] is ${g[r][0]}: row ${r} isn't marked. Only cells under a marked column (a 0 in row 0) become 0.` });
    }
    const after: Record<string, Tone> = {};
    if (row0) { t.op(n); for (let c = 0; c < n; c++) { if (g[0][c] !== 0) after[key(0, c)] = "found"; g[0][c] = 0; } }
    t.step({ line: 15, array: [], board: { rows: snap(g), labels: true, tones: { ...zeroTones(g, old), ...after } }, vars: { row0, col0 },
      message: row0 ? `row0 is true: row 0 had a 0 of its own, so clear it now, last, after its markers have been used.` : `row0 is false: row 0 had no 0 of its own, so it keeps its values, apart from the markers.` });
    const after2: Record<string, Tone> = {};
    if (col0) { t.op(m); for (let r = 0; r < m; r++) { if (g[r][0] !== 0) after2[key(r, 0)] = "found"; g[r][0] = 0; } }
    t.step({ line: 17, array: [], board: { rows: g, labels: true, tones: { ...zeroTones(g, old), ...after2 } }, vars: { row0, col0 }, done: "found",
      message: `${col0 ? "col0 is true, so clear column 0 too." : "col0 is false, so column 0 keeps its values, apart from the markers."} Done: O(m · n) time, and two true/false values: O(1) extra space.` });
  },
};

export const approaches = { copy: copyFirst, lists: markLists, markers: inPlace };

/** n × n grids where every other value is 0. */
export const growth = measureGrowth(
  [{ approach: copyFirst, slot: 1 }, { approach: markLists, slot: 2 }, { approach: inPlace, slot: 3 }],
  (n) => ({ grid: gridText(Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ((r + c) % 2 ? 1 : 0)))) }),
  [4, 8, 16, 24, 32],
);
