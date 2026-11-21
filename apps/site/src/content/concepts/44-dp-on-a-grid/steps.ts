import { CallTree, type Approach, type ArrayStep, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ m: number; n: number }>["run"]>[1];
export type GridInput = { m: number; n: number };
export const gridFields: InputField[] = [
  { key: "m", label: "rows m", kind: "number" },
  { key: "n", label: "columns n", kind: "number" },
];
export function gridPrepare(raw: GridInput, max = 5): Prepared<GridInput> {
  if (raw.m < 1 || raw.n < 1 || raw.m > max || raw.n > max) return { error: `Use 1 to ${max} rows and columns so the table fits.` };
  return { input: raw };
}

/** The table as a panel: row and column numbers, empty cells for values not filled yet. */
export const tablePanel = (title: string, dp: (number | string)[][], tones: Record<string, Tone> = {}): ArrayStep["grid"] => ({
  title, rows: dp.map((r) => [...r]), rowLabels: dp.map((_, i) => i), colLabels: dp[0].map((_, j) => j), dense: true, tones,
});

/** Plain recursion paths(r, c), drawn as a call tree. Shared with LC 62. */
export function pathsRecursion(m: number, n: number, t: T, lines: { base: number; split: number; done: number }) {
  const tree = new CallTree();
  const seen = new Map<string, number>();
  let calls = 0;
  const rec = (r: number, c: number, parent: string | null): number => {
    const key = `${r},${c}`, id = tree.add(parent, key);
    calls++;
    const times = (seen.get(key) ?? 0) + 1;
    seen.set(key, times);
    if (r === 0 || c === 0) {
      tree.log({ id, kind: "solution", line: lines.base, note: "1", vars: { r, c, calls },
        message: `paths(${r}, ${c}): ${r === 0 ? "the top row" : "the left column"} can only be reached in a straight line, so 1 way.${times > 1 ? ` This call has been made ${times} times now.` : ""}` });
      return 1;
    }
    tree.log({ id, kind: "call", line: lines.split, vars: { r, c, calls },
      ...(times === 2 && !tree.events.some((e) => e.ask) ? { ask: { q: `paths(${r}, ${c}) was already worked out earlier. What does plain recursion do now?`, options: ["Works it out all over again", "Reuses the earlier answer", "Skips it"], answer: 0 } } : {}),
      message: `paths(${r}, ${c}): the last move into (${r}, ${c}) came from above or from the left, so add paths(${r - 1}, ${c}) and paths(${r}, ${c - 1}).${times > 1 ? ` This is call number ${times} for (${r}, ${c}): all of its work is repeated.` : ""}` });
    const v = rec(r - 1, c, id) + rec(r, c - 1, id);
    tree.events.push({ id, kind: "solution", line: lines.split, note: String(v), vars: { r, c, calls }, message: `paths(${r}, ${c}) = ${v}.` });
    return v;
  };
  const total = rec(m - 1, n - 1, null);
  const repeated = [...seen.values()].filter((k) => k > 1).length;
  tree.replay(t, {
    intro: { line: lines.split, vars: { m, n }, message: `Count the routes from the top-left cell (0, 0) to the bottom-right (${m - 1}, ${n - 1}), moving only right or down. Each call is drawn as a node "r,c"; its number underneath is what it returned.` },
    finish: (grid) => ({ line: lines.done, grid, vars: { routes: total, calls }, done: "found",
      message: `${total} routes, after ${calls} calls for only ${m * n} cells: ${repeated} cell${repeated === 1 ? " was" : "s were"} worked out more than once. The number of calls grows exponentially with the grid's size.` }),
    stackLabel: (id) => `paths(${tree.nodes.find((x) => x.id === id)!.val})`,
  });
  return total;
}

/** The table version: dp[r][c] = dp[r − 1][c] + dp[r][c − 1]. Shared with LC 62. */
export function pathsTable(m: number, n: number, t: T, lines: { init: number; fill: number; done: number }) {
  const dp: (number | string)[][] = Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => (r === 0 || c === 0 ? 1 : "")));
  const edge: Record<string, Tone> = {};
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (r === 0 || c === 0) edge[`${r},${c}`] = "settled";
  t.op(m + n);
  t.step({ line: lines.init, array: [], hideStage: true, grid: tablePanel("dp: routes to each cell", dp, edge), vars: { m, n },
    message: `dp[r][c] will hold the number of routes to cell (r, c). The top row and the left column can only be reached in a straight line: 1 route each.` });
  let asked = false;
  const done: Record<string, Tone> = { ...edge };
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) {
    t.op();
    const up = dp[r - 1][c] as number, left = dp[r][c - 1] as number;
    const ask = !asked && r >= 1 && c >= 2 ? (asked = true, { ask: { q: `Above (${r}, ${c}) is ${up} and to its left is ${left}. What goes in dp[${r}][${c}]?`, options: [String(up + left), String(Math.max(up, left)), String(up * left)].filter((o, k, a) => a.indexOf(o) === k), answer: 0 } }) : {};
    dp[r][c] = up + left;
    t.step({ ...ask, line: lines.fill, array: [], hideStage: true, grid: tablePanel("dp: routes to each cell", dp, { ...done, [`${r - 1},${c}`]: "compare", [`${r},${c - 1}`]: "compare", [`${r},${c}`]: "found" }), vars: { r, c, "dp[r][c]": up + left },
      message: `Every route into (${r}, ${c}) arrives from above (${up} routes) or from the left (${left} routes): ${up} + ${left} = ${up + left}. Both were filled already, because the table goes row by row, left to right.` });
    done[`${r},${c}`] = "settled";
  }
  t.step({ line: lines.done, array: [], hideStage: true, grid: tablePanel("dp: routes to each cell", dp, { ...done, [`${m - 1},${n - 1}`]: "found" }), vars: { routes: dp[m - 1][n - 1] }, done: "found",
    message: `${dp[m - 1][n - 1]} routes. Each of the ${m * n} cells was filled once with one addition: O(m · n) time and O(m · n) space.` });
  return dp[m - 1][n - 1] as number;
}

export const recursionCode = `function uniquePaths(m, n)
    return paths(m - 1, n - 1)
function paths(r, c)  // routes to (r, c)
    if r = 0 or c = 0
        return 1  // one straight line
    return paths(r - 1, c) + paths(r, c - 1)
`;
export const tableCode = `function uniquePaths(m, n)
    dp ← m × n grid, all 1
    for r ← 1 to m - 1
        for c ← 1 to n - 1
            dp[r][c] ← dp[r - 1][c] + dp[r][c - 1]
    return dp[m - 1][n - 1]
`;

export const recExample: GridInput = { m: 3, n: 3 };
export const tableExample: GridInput = { m: 4, n: 5 };

const recursion: Approach<GridInput> = { id: "recursion", name: "Plain recursion", code: recursionCode, run({ m, n }, t) { pathsRecursion(m, n, t, { base: 5, split: 6, done: 2 }); } };
const table: Approach<GridInput> = { id: "table", name: "Fill a table", code: tableCode, run({ m, n }, t) { pathsTable(m, n, t, { init: 2, fill: 5, done: 6 }); } };

export const recApproaches = { recursion };
export const tableApproaches = { table };
