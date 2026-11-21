import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gridError, gridText, parseGrid } from "../../concepts/35-grids/steps";
import { tablePanel } from "../../concepts/44-dp-on-a-grid/steps";

export type Input = { grid: string };
export const example: Input = { grid: "1 4 2 / 3 1 5 / 6 2 1" };
export const fields: InputField[] = [{ key: "grid", label: "costs (rows split by /)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 3, 3);
  if (e) return { error: e };
  if (g.flat().some((v) => v < 0 || v > 99)) return { error: "Use costs from 0 to 99." };
  return { input: { grid: gridText(g) } };
}

const recursion: Approach<Input> = {
  id: "recursion",
  name: "Plain recursion",
  code: `function minPathSum(grid)
    return best(m - 1, n - 1)
function best(r, c)  // cheapest path to (r, c)
    if r = 0 and c = 0
        return grid[0][0]
    if r = 0
        return best(0, c - 1) + grid[0][c]
    if c = 0
        return best(r - 1, 0) + grid[r][0]
    up, left ← best(r - 1, c), best(r, c - 1)
    return min(up, left) + grid[r][c]
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length, tree = new CallTree();
    let calls = 0;
    const seen = new Map<string, number>();
    const rec = (r: number, c: number, parent: string | null): number => {
      const key = `${r},${c}`, id = tree.add(parent, key);
      calls++;
      const times = (seen.get(key) ?? 0) + 1; seen.set(key, times);
      if (r === 0 && c === 0) {
        tree.log({ id, kind: "solution", line: 5, note: String(g[0][0]), vars: { r, c, calls }, message: `best(0, 0) is just the starting cell's cost, ${g[0][0]}.` });
        return g[0][0];
      }
      if (r === 0 || c === 0) {
        tree.log({ id, kind: "call", line: r === 0 ? 7 : 9, vars: { r, c, calls }, message: `best(${r}, ${c}): on the ${r === 0 ? "top row only the cell to the left" : "left column only the cell above"} leads here.` });
        const v = (r === 0 ? rec(0, c - 1, id) : rec(r - 1, 0, id)) + g[r][c];
        tree.events.push({ id, kind: "solution", line: r === 0 ? 7 : 9, note: String(v), vars: { r, c, calls }, message: `best(${r}, ${c}) = ${v - g[r][c]} + ${g[r][c]} = ${v}.` });
        return v;
      }
      tree.log({ id, kind: "call", line: 10, vars: { r, c, calls },
        ...(times === 2 && !tree.events.some((e) => e.ask) ? { ask: { q: `best(${r}, ${c}) was already worked out. What does plain recursion do?`, options: ["Works it out again", "Reuses the earlier answer"], answer: 0 } } : {}),
        message: `best(${r}, ${c}): arrive from above or from the left, whichever path is cheaper.${times > 1 ? ` This is call number ${times} for (${r}, ${c}).` : ""}` });
      const up = rec(r - 1, c, id), left = rec(r, c - 1, id), v = Math.min(up, left) + g[r][c];
      tree.events.push({ id, kind: "solution", line: 11, note: String(v), vars: { r, c, calls }, message: `best(${r}, ${c}) = min(${up}, ${left}) + ${g[r][c]} = ${v}.` });
      return v;
    };
    const total = rec(m - 1, n - 1, null);
    tree.replay(t, {
      intro: { line: 2, vars: { m, n }, message: `The cheapest path to the bottom-right cell ends with a step from above or from the left, so try both and keep the cheaper. Each node "r,c" is a call; the number under it is what it returned.` },
      finish: (gr) => ({ line: 2, grid: gr, vars: { cost: total, calls }, done: "found", message: `The cheapest path costs ${total}, after ${calls} calls for ${m * n} cells: cells were worked out repeatedly, and the calls grow exponentially.` }),
      stackLabel: (id) => `best(${tree.nodes.find((x) => x.id === id)!.val})`,
    });
  },
};

function tableRun(grid: string, t: Parameters<Approach<Input>["run"]>[1], oneRow: boolean) {
  const g = parseGrid(grid), m = g.length, n = g[0].length;
  const dp: (number | string)[][] = g.map((r) => r.map(() => ""));
  const done: Record<string, Tone> = {};
  t.step({ line: 2, array: [], hideStage: true, grid: tablePanel("costs", g), vars: { m, n },
    message: oneRow
      ? `Same rule as the table, but keep only one row of best costs. Before an update, row[c] holds the best cost from the row above; row[c − 1] is this row's cell to the left.`
      : `dp[r][c] will be the cheapest cost to reach (r, c), including its own cost. A cell is reached from above or from the left, so take the cheaper of those two, plus its own cost.` });
  let asked = false;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    t.op();
    const up = r > 0 ? (dp[r - 1][c] as number) : Infinity, left = c > 0 ? (dp[r][c - 1] as number) : Infinity;
    const from = r === 0 && c === 0 ? 0 : Math.min(up, left);
    dp[r][c] = from + g[r][c];
    const src = r === 0 && c === 0 ? {} : up <= left ? { [`${r - 1},${c}`]: "compare" as Tone } : { [`${r},${c - 1}`]: "compare" as Tone };
    const ask = !asked && r > 0 && c > 0 ? (asked = true, { ask: { q: `Above costs ${up}, the left costs ${left}, and the cell itself costs ${g[r][c]}. What goes in this cell?`, options: [String(from + g[r][c]), String(Math.max(up, left) + g[r][c]), String(up + left + g[r][c])].filter((o, k, a) => a.indexOf(o) === k), answer: 0 } }) : {};
    const shown = oneRow ? [dp[r].map((v, k) => (v === "" && r > 0 ? dp[r - 1][k] : v))] : dp;
    t.step({ ...ask, line: oneRow ? (c === 0 ? 5 : 8) : (r === 0 && c === 0 ? 6 : 9), array: [], hideStage: true,
      grid: oneRow
        ? { title: `row (now row ${r})`, rows: shown.map((x) => [...x]), colLabels: g[0].map((_, k) => k), dense: true, tones: { [`0,${c}`]: "found", ...(c > 0 ? { [`0,${c - 1}`]: "compare" as Tone } : {}) } }
        : tablePanel("dp: cheapest cost to each cell", dp, { ...done, ...src, [`${r},${c}`]: "found" }),
      vars: { r, c, cost: g[r][c] },
      message: r === 0 && c === 0 ? `The start costs ${g[0][0]}.` : r === 0 ? `Top row: only from the left, ${left} + ${g[r][c]} = ${dp[r][c]}.` : c === 0 ? `Left column: only from above, ${up} + ${g[r][c]} = ${dp[r][c]}.` : `min(${up} above, ${left} left) + ${g[r][c]} = ${dp[r][c]}.` });
    done[`${r},${c}`] = "settled";
  }
  t.step({ line: oneRow ? 9 : 10, array: [], hideStage: true, grid: oneRow ? { title: "row (last row)", rows: [[...dp[m - 1]]], colLabels: g[0].map((_, k) => k), dense: true, tones: { [`0,${n - 1}`]: "found" } } : tablePanel("dp: cheapest cost to each cell", dp, { ...done, [`${m - 1},${n - 1}`]: "found" }),
    vars: { cost: dp[m - 1][n - 1] }, done: "found",
    message: `The cheapest path costs ${dp[m - 1][n - 1]}. One step per cell: O(m · n) time, and ${oneRow ? "one row of memory: O(n)" : "a full table: O(m · n) space"}.` });
}

const table: Approach<Input> = {
  id: "table",
  name: "Fill a table",
  code: `function minPathSum(grid)
    dp ← m × n grid  // at(r, c) is ∞ outside it
    for r ← 0 to m - 1
        for c ← 0 to n - 1
            if r = 0 and c = 0
                dp[0][0] ← grid[0][0]
                continue
            from ← min(at(r - 1, c), at(r, c - 1))
            dp[r][c] ← from + grid[r][c]
    return dp[m - 1][n - 1]
`,
  run({ grid }, t) { tableRun(grid, t, false); },
};

const oneRow: Approach<Input> = {
  id: "oneRow",
  name: "Keep one row",
  code: `function minPathSum(grid)
    row ← array of n, all ∞
    row[0] ← 0  // so the start adds only its cost
    for r ← 0 to m - 1
        row[0] ← row[0] + grid[r][0]
        for c ← 1 to n - 1
            best ← min(row[c], row[c - 1])
            row[c] ← best + grid[r][c]
    return row[n - 1]
`,
  run({ grid }, t) { tableRun(grid, t, true); },
};

export const approaches = { recursion, table, oneRow };

/** An n × n grid of costs. */
export const growth = measureGrowth(
  [{ approach: recursion, slot: 1 }, { approach: table, slot: 2 }, { approach: oneRow, slot: 3 }],
  (n) => ({ grid: gridText(Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ((r * 7 + c * 3) % 9) + 1))) }),
  [2, 3, 4, 5, 6, 7],
);
