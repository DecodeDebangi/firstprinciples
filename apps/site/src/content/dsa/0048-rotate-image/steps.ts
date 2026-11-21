import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { gridError, gridText, key, parseGrid, transposeSteps } from "../../concepts/35-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "1 2 3 4 / 5 6 7 8 / 9 10 11 12 / 13 14 15 16" };
export const fields: InputField[] = [{ key: "grid", label: "square grid (rows split by /)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 5, 5, true);
  return e ? { error: e } : { input: { grid: gridText(g) } };
}

const all = (n: number, tone: Tone) => Object.fromEntries(Array.from({ length: n * n }, (_, i) => [key(Math.floor(i / n), i % n), tone]));

const withCopy: Approach<Input> = {
  id: "copy",
  name: "Copy, then write each value to its new place",
  code: `function rotate(grid)
    n ← length(grid)
    old ← a copy of grid
    for r ← 0 to n - 1
        for c ← 0 to n - 1
            grid[c][n - 1 - r] ← old[r][c]
`,
  run({ grid }, t) {
    const g = parseGrid(grid), n = g.length, old = g.map((r) => [...r]);
    const written: Record<string, Tone> = {};
    t.step({ line: 3, array: [], board: { rows: g.map((r) => [...r]), labels: true }, grid: { title: "old (the copy)", rows: old }, vars: { n },
      message: `Turning a quarter clockwise, row r becomes column n − 1 − r: the top row becomes the right-hand column. Writing straight into the grid would overwrite values not yet moved, so copy it first.` });
    let asked = false;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        t.op();
        const tr = c, tc = n - 1 - r;
        const ask = !asked && r === 0 && c === 1 && n > 2
          ? (asked = true, { ask: { q: `old[0][1] = ${old[0][1]}. Where does it go?`, options: [`grid[1][${n - 1}]`, `grid[${n - 1}][1]`, "grid[1][0]"], answer: 0 } }) : {};
        g[tr][tc] = old[r][c];
        written[key(tr, tc)] = "settled";
        t.step({ ...ask, line: 6, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: { ...written, [key(tr, tc)]: "found" } },
          grid: { title: "old (the copy)", rows: old, tones: { [key(r, c)]: "active" } }, vars: { r, c, "n - 1 - r": tc },
          message: `old[${r}][${c}] = ${old[r][c]} goes to grid[${c}][${n - 1} − ${r}] = grid[${tr}][${tc}]: row ${r} of the old grid is filling column ${tc}.` });
      }
    }
    t.step({ line: 6, array: [], board: { rows: g, labels: true, tones: all(n, "settled") }, grid: { title: "old (the copy)", rows: old }, vars: { n }, done: "found",
      message: `Rotated. Each of the n² = ${n * n} values was written once: O(n²) time. But the copy costs another n² cells of memory: O(n²) space.` });
  },
};

const transposeReverse: Approach<Input> = {
  id: "transposeReverse",
  name: "Transpose, then reverse each row",
  code: `function rotate(grid)
    n ← length(grid)
    for r ← 0 to n - 1  // transpose
        for c ← r + 1 to n - 1
            swap grid[r][c] and grid[c][r]
    for each row in grid  // reverse each row
        lo, hi ← 0, n - 1
        while lo < hi
            swap row[lo] and row[hi]
            lo, hi ← lo + 1, hi - 1
`,
  run({ grid }, t) {
    const g = parseGrid(grid), n = g.length;
    const diag = Object.fromEntries(Array.from({ length: n }, (_, i) => [key(i, i), "settled" as Tone]));
    t.step({ line: 2, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: diag }, vars: { n },
      message: `Two in-place moves. First transpose: swap each value with its mirror across the diagonal, so rows become columns. Then reverse each row, so the grid turns clockwise.` });
    transposeSteps(g, t, 5, { phase: "transpose" }, n > 2);
    t.step({ line: 6, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: all(n, "visited") }, vars: { phase: "reverse rows" },
      message: `Transposed: the first row is now ${g[0].join(", ")}, the old first column. A clockwise turn needs the old first column on the right, read top to bottom, so now reverse every row.` });
    let asked = false;
    for (let r = 0; r < n; r++) {
      const row = g[r];
      let lo = 0, hi = n - 1;
      const doneRows: Record<string, Tone> = {};
      for (let k = 0; k < r; k++) for (let c = 0; c < n; c++) doneRows[key(k, c)] = "settled";
      while (lo < hi) {
        t.op();
        const ask = !asked && n > 2
          ? (asked = true, { ask: { q: `Reversing row ${r} = [${row.join(", ")}]: which two columns swap first?`, options: [`columns 0 and ${n - 1}`, "columns 0 and 1", `columns ${n - 2} and ${n - 1}`], answer: 0 } }) : {};
        const [a, b] = [row[lo], row[hi]];
        [row[lo], row[hi]] = [b, a];
        t.step({ ...ask, line: 9, array: [], board: { rows: g.map((x) => [...x]), labels: true, tones: { ...all(n, "visited"), ...doneRows, [key(r, lo)]: "found", [key(r, hi)]: "found" } }, vars: { phase: "reverse rows", row: r, lo, hi },
          message: `Row ${r}: swap ${a} (column ${lo}) and ${b} (column ${hi}).` });
        lo++; hi--;
      }
    }
    t.step({ line: 10, array: [], board: { rows: g, labels: true, tones: all(n, "settled") }, vars: { n }, done: "found",
      message: `Rotated in place. ${n * (n - 1) / 2} swaps to transpose and ${n * Math.floor(n / 2)} to reverse the rows: O(n²) time, and only a few variables, O(1) space.` });
  },
};

export const approaches = { copy: withCopy, transposeReverse };
