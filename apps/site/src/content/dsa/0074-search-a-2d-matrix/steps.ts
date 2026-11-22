import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gridError, gridText, key, parseGrid } from "../../concepts/35-grids/steps";

export type Input = { grid: string; target: number };
export const example: Input = { grid: "1 4 6 9 / 11 13 17 20 / 24 28 31 35", target: 17 };
export const fields: InputField[] = [
  { key: "grid", label: "grid (rows split by /)", kind: "text" },
  { key: "target", label: "target", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 4, 5);
  if (e) return { error: e };
  const flat = g.flat();
  if (flat.some((v, i) => i > 0 && v <= flat[i - 1])) return { error: "Read row by row, the values must keep increasing." };
  return { input: { grid: gridText(g), target: raw.target } };
}

const scan: Approach<Input> = {
  id: "scan",
  name: "Check every cell",
  code: `function searchMatrix(grid, target)
    for each row in grid
        for each v in row
            if v = target
                return true
    return false
`,
  run({ grid, target }, t) {
    const g = parseGrid(grid), seen: Record<string, Tone> = {};
    t.step({ line: 2, array: [], board: { rows: g, labels: true }, vars: { target }, message: `Ignore the order and compare every cell with ${target}.` });
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[0].length; c++) {
      t.op();
      const hit = g[r][c] === target;
      t.step({ line: hit ? 5 : 4, array: [], board: { rows: g, labels: true, tones: { ...seen, [key(r, c)]: hit ? "found" : "compare" } }, vars: { r, c, target }, ...(hit ? { done: "found" as const } : {}),
        message: hit ? `Found ${target} at (${r}, ${c}). O(m · n) in the worst case.` : `(${r}, ${c}) holds ${g[r][c]}.` });
      if (hit) return;
      seen[key(r, c)] = "visited";
    }
    t.step({ line: 6, array: [], board: { rows: g, labels: true, tones: seen }, vars: { target }, done: "notfound", message: `${target} isn't in the grid, after checking all ${g.flat().length} cells.` });
  },
};

const flat: Approach<Input> = {
  id: "binary",
  name: "Binary search as one long list",
  code: `function searchMatrix(grid, target)
    m, n ← length(grid), length(grid[0])
    lo, hi ← 0, m · n - 1
    while lo ≤ hi
        mid ← floor((lo + hi) / 2)
        v ← grid[floor(mid / n)][mid % n]
        if v = target
            return true
        if v < target
            lo ← mid + 1
        else
            hi ← mid - 1
    return false
`,
  run({ grid, target }, t) {
    const g = parseGrid(grid), n = g[0].length, total = g.length * n;
    const out = (lo: number, hi: number) => Object.fromEntries(Array.from({ length: total }, (_, i) => i).filter((i) => i < lo || i > hi).map((i) => [key(Math.floor(i / n), i % n), "discard" as Tone]));
    let lo = 0, hi = total - 1, asked = false;
    t.step({ line: 3, array: [], board: { rows: g, labels: true }, vars: { lo, hi, target },
      message: `Read row by row, the grid is one sorted list of ${total} values. Number the cells 0 to ${total - 1} in reading order; cell i is row floor(i / ${n}), column i % ${n}. Then binary search that list.` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2), r = Math.floor(mid / n), c = mid % n, v = g[r][c];
      t.op();
      const opts = [`(${r}, ${c})`, `(${c}, ${r})`, `(${mid % g.length}, ${Math.floor(mid / g.length)})`].filter((o, k, arr) => arr.indexOf(o) === k);
      const q = !asked && opts.length > 1 ? (asked = true, { ask: { q: `mid is ${mid} in a grid ${n} columns wide. Which cell is that?`, options: opts, answer: 0 } }) : {};
      if (v === target) {
        t.step({ ...q, line: 8, array: [], board: { rows: g, labels: true, tones: { ...out(lo, hi), [key(r, c)]: "found" } }, vars: { lo, hi, mid, row: r, col: c }, done: "found",
          message: `mid = ${mid} is row floor(${mid} / ${n}) = ${r}, column ${mid} % ${n} = ${c}, which holds ${target}. Found. O(log(m · n)).` });
        return;
      }
      if (v < target) lo = mid + 1; else hi = mid - 1;
      t.step({ ...q, line: v < target ? 10 : 12, array: [], board: { rows: g, labels: true, tones: { ...out(lo, hi), [key(r, c)]: "miss" } }, vars: { lo, hi, mid, row: r, col: c },
        message: `mid = ${mid} is (${r}, ${c}), holding ${v}. ${v} ${v < target ? "<" : ">"} ${target}, so ${v < target ? `everything up to it is too small: lo = ${mid + 1}` : `everything from it on is too big: hi = ${mid - 1}`}.` });
    }
    t.step({ line: 13, array: [], board: { rows: g, labels: true, tones: out(1, 0) }, vars: { target }, done: "notfound", message: `The range is empty: ${target} isn't in the grid. Return false.` });
  },
};

export const approaches = { scan, binary: flat };

/** An n × n grid of 1 … n², searching for the last value. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: flat, slot: 3 }],
  (n) => ({ grid: gridText(Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1))), target: n * n }),
  [2, 4, 6, 8, 10],
);
