import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { numRows: number };

export const example: Input = { numRows: 5 };

export const fields: InputField[] = [{ key: "numRows", label: "numRows", kind: "number" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.numRows < 1 || raw.numRows > 10) return { error: "numRows must be between 1 and 10 so the triangle fits." };
  return { input: raw };
}

const TITLE = "Triangle so far";
const PENDING = "·";

const formula: Approach<Input> = {
  id: "formula",
  name: "Formula with factorials",
  code: `from math import factorial as f

def generate(num_rows):
    rows = []
    for r in range(num_rows):
        row = []
        for c in range(r + 1):
            row.append(f(r) // (f(c) * f(r - c)))
        rows.append(row)
    return rows
`,
  run({ numRows }, t) {
    const fact = (k: number) => { let x = 1n; for (let m = 2n; m <= BigInt(k); m++) x *= m; return x; };
    const rows: string[][] = [];
    t.step({ line: 4, array: [PENDING], grid: { title: TITLE, rows: [] }, vars: { r: null, c: null },
      message: "Every entry has a closed formula: row r, position c is r! ÷ (c! × (r−c)!), the number of ways to choose c things from r." });
    for (let r = 0; r < numRows; r++) {
      const row: string[] = Array(r + 1).fill(PENDING);
      for (let c = 0; c <= r; c++) {
        // Each factorial k! costs about k multiplications, computed from scratch every time.
        t.op(Math.max(r, 1) + Math.max(c, 1) + Math.max(r - c, 1));
        const v = fact(r) / (fact(c) * fact(r - c));
        row[c] = v.toString();
        t.step({ line: 8, array: [...row], pointers: { c }, tones: { [c]: "active" }, grid: { title: TITLE, rows: [...rows] },
          vars: { r, c, value: row[c] },
          message: `${r}! ÷ (${c}! × ${r - c}!) = ${fact(r)} ÷ (${fact(c)} × ${fact(r - c)}) = ${row[c]}. Three factorials, recomputed from scratch.` });
      }
      rows.push(row);
      t.step({ line: 9, array: [...row], tones: Object.fromEntries(row.map((_, k) => [k, "found" as const])), grid: { title: TITLE, rows: [...rows] },
        vars: { r, c: null }, message: `Row ${r} is done.` });
    }
    t.step({ line: 10, array: rows[rows.length - 1], grid: { title: TITLE, rows }, vars: { r: null, c: null }, done: "found",
      message: `All ${numRows} rows built, each entry from scratch.` });
  },
};

const buildRows: Approach<Input> = {
  id: "build",
  name: "Build each row from the one above",
  code: `def generate(num_rows):
    rows = [[1]]
    for r in range(1, num_rows):
        prev = rows[-1]
        row = [1] * (r + 1)
        for c in range(1, r):
            row[c] = prev[c - 1] + prev[c]
        rows.append(row)
    return rows
`,
  run({ numRows }, t) {
    const rows: number[][] = [[1]];
    t.step({ line: 2, array: [1], grid: { title: TITLE, rows: [[1]] }, vars: { r: 0, c: null },
      message: "Row 0 is just [1]. Every row after that starts and ends with 1, and each inside number is the sum of the two above it." });
    for (let r = 1; r < numRows; r++) {
      const prev = rows[r - 1];
      const row: (number | string)[] = Array.from({ length: r + 1 }, (_, k) => (k === 0 || k === r ? 1 : PENDING));
      t.step({ line: 5, array: [...row], tones: { 0: "found", [r]: "found" }, grid: { title: TITLE, rows: [...rows] }, vars: { r, c: null },
        message: `Row ${r} has ${r + 1} slots. Both ends are always 1${r > 1 ? "; fill the inside from row " + (r - 1) : ""}.` });
      for (let c = 1; c < r; c++) {
        t.op();
        const [pa, pb] = [prev[c - 1], prev[c]];
        const opts = [...new Set([pa + pb, pa * pb, Math.max(pa, pb), pa + pb + 1])].slice(0, 3).sort((x, y) => x - y);
        const ask = { q: `What goes in row ${r}, position ${c}? Look at the row above.`, options: opts.map(String), answer: opts.indexOf(pa + pb) };
        row[c] = prev[c - 1] + prev[c];
        const gt: Record<string, Tone> = { [`${r - 1},${c - 1}`]: "compare", [`${r - 1},${c}`]: "compare" };
        t.step({ ask, line: 7, array: [...row], pointers: { c }, tones: { [c]: "active" }, grid: { title: TITLE, rows: [...rows], tones: gt },
          vars: { r, c, value: row[c] as number },
          message: `row[${c}] = ${prev[c - 1]} + ${prev[c]} = ${row[c]}: the two numbers just above it. One addition.` });
      }
      rows.push(row as number[]);
      t.step({ line: 8, array: [...row], tones: Object.fromEntries(row.map((_, k) => [k, "found" as const])), grid: { title: TITLE, rows: [...rows] },
        vars: { r, c: null }, message: `Row ${r} is done and becomes "the row above" for the next one.` });
    }
    t.step({ line: 9, array: rows[rows.length - 1], grid: { title: TITLE, rows }, vars: { r: null, c: null }, done: "found",
      message: `All ${numRows} rows built, each number with a single addition.` });
  },
};

export const approaches = { formula, build: buildRows };

export const growth = measureGrowth(
  [
    { approach: formula, slot: 1 },
    { approach: buildRows, slot: 2 },
  ],
  (n) => ({ numRows: n }),
  [5, 10, 15, 20, 25, 30],
);
