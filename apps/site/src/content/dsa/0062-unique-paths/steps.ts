import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gridFields, gridPrepare, pathsRecursion, pathsTable, recursionCode, tableCode, type GridInput } from "../../concepts/44-dp-on-a-grid/steps";

export type Input = GridInput;
export const example: Input = { m: 3, n: 3 };
export const fields: InputField[] = gridFields;
export function prepare(raw: Input): Prepared<Input> { return gridPrepare(raw, 3); }

const recursion: Approach<Input> = { id: "recursion", name: "Plain recursion", code: recursionCode, run({ m, n }, t) { pathsRecursion(m, n, t, { base: 5, split: 6, done: 2 }); } };
const table: Approach<Input> = { id: "table", name: "Fill a table", code: tableCode, run({ m, n }, t) { pathsTable(m, n, t, { init: 2, fill: 5, done: 6 }); } };

const oneRow: Approach<Input> = {
  id: "oneRow",
  name: "Keep one row",
  code: `function uniquePaths(m, n)
    row ← array of n, all 1  // row 0: all 1s
    for r ← 1 to m - 1
        for c ← 1 to n - 1
            row[c] ← row[c] + row[c - 1]
    return row[n - 1]
`,
  run({ m, n }, t) {
    const row = Array(n).fill(1);
    t.op(n);
    const grid = (tones: Record<string, Tone> = {}, r = 0) => ({ grid: { title: `row (now row ${r})`, rows: [[...row]], colLabels: row.map((_, c) => c), dense: true, tones } });
    t.step({ line: 2, array: [], hideStage: true, ...grid(), vars: { r: 0 },
      message: `Each row of the table only needs the row above it. So keep one row and overwrite it: before an update, row[c] still holds the value from the row above, and row[c − 1] already holds this row's value to the left.` });
    let asked = false;
    for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) {
      t.op();
      const above = row[c], left = row[c - 1];
      const ask = !asked && c >= 2 ? (asked = true, { ask: { q: `Row ${r}, column ${c}: row[${c}] is ${above} (from the row above) and row[${c - 1}] is ${left} (this row). What does row[${c}] become?`, options: [String(above + left), String(above), String(left)].filter((o, k, a) => a.indexOf(o) === k), answer: 0 } }) : {};
      row[c] = above + left;
      t.step({ ...ask, line: 5, array: [], hideStage: true, ...grid({ [`0,${c - 1}`]: "compare", [`0,${c}`]: "found" }, r), vars: { r, c },
        message: `Row ${r}, column ${c}: ${above} routes from above + ${left} from the left = ${row[c]}.` });
    }
    t.step({ line: 6, array: [], hideStage: true, ...grid({ [`0,${n - 1}`]: "found" }, m - 1), vars: { routes: row[n - 1] }, done: "found",
      message: `${row[n - 1]} routes. Still O(m · n) time, but only one row of memory: O(n).` });
  },
};

export const approaches = { recursion, table, oneRow };

/** An n × n grid. */
export const growth = measureGrowth(
  [{ approach: recursion, slot: 1 }, { approach: table, slot: 2 }, { approach: oneRow, slot: 3 }],
  (n) => ({ m: n, n }),
  [2, 3, 4, 5, 6, 7],
);
