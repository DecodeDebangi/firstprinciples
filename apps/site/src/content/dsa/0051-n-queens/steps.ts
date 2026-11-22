import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { answersGrid } from "../../concepts/51-backtracking-with-rules/steps";

export type Input = { n: number };
export const example: Input = { n: 4 };
export const fields: InputField[] = [{ key: "n", label: "n (board size)", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 5) return { error: "Use n from 1 to 5: at 6 the search makes over 150 calls." };
  return { input: raw };
}
const list = (xs: number[]) => (xs.length === 1 ? String(xs[0]) : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const solText = (cols: number[]) => cols.join(" ");

/** The shared search. `sets` decides how a square is checked: by scanning every queen, or with three set lookups. */
function search(n: number, sets: boolean, t: Parameters<Approach<Input>["run"]>[1]) {
  const L = sets ? { loop: 10, check: 11, record: 8, start: 20, end: 21 } : { loop: 7, check: 8, record: 5, start: 12, end: 13 };
  const cols: number[] = [], result: string[] = [];
  const colSet = new Set<number>(), down = new Set<number>(), up = new Set<number>();
  let calls = 0, asked = false;
  const board = (extra: Record<string, Tone> = {}) => {
    const rows = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (cols[r] === c ? "Q" : "·")));
    const tones: Record<string, Tone> = Object.fromEntries(cols.map((c, r) => [`${r},${c}`, "settled" as Tone]));
    return { rows, labels: true, tones: { ...tones, ...extra } };
  };
  const safeScan = (r: number, c: number) => {
    for (let pr = 0; pr < cols.length; pr++) { t.op(); const pc = cols[pr]; if (pc === c || pr - pc === r - c || pr + pc === r + c) return false; }
    if (!cols.length) t.op();
    return true;
  };
  const safeSets = (r: number, c: number) => { t.op(); return !colSet.has(c) && !down.has(r - c) && !up.has(r + c); };
  const place = (r: number, moved = false) => {
    calls++;
    if (r === n) {
      result.push(solText(cols));
      t.step({ line: L.record, array: [], board: board(Object.fromEntries(cols.map((c, rr) => [`${rr},${c}`, "found" as Tone]))), grid: answersGrid(result, "solutions", true), vars: { row: r, solutions: result.length },
        message: `All ${n} queens are placed and none attack each other: record solution ${result.length} (the queens' columns, row by row: ${solText(cols)}).` });
      return;
    }
    const safe: number[] = [], hit: number[] = [];
    for (let c = 0; c < n; c++) (sets ? safeSets(r, c) : safeScan(r, c)) ? safe.push(c) : hit.push(c);
    const tones: Record<string, Tone> = {};
    hit.forEach((c) => (tones[`${r},${c}`] = safe.length ? "discard" : "miss"));
    safe.forEach((c) => (tones[`${r},${c}`] = "compare"));
    const opts = [safe.length ? list(safe) : "None", hit.length ? list(hit) : "None", list(Array.from({ length: n }, (_, c) => c))].filter((o, i, a) => a.indexOf(o) === i);
    const ask = !asked && r > 0 && opts.length > 2 ? (asked = true, { ask: { q: `Queens sit at ${cols.map((c, rr) => `(${rr}, ${c})`).join(", ")}. Which columns of row ${r} are safe?`, options: opts, answer: 0 } }) : {};
    const how = sets ? "Each check is three set lookups: the column, r − c and r + c." : `Each check compares the square with all ${cols.length} queen${cols.length === 1 ? "" : "s"} above.`;
    const pre = moved ? `Back up: row ${r - 1}'s queen moves to column ${cols[r - 1]}. ` : "";
    t.step({ ...ask, line: safe.length ? L.check : L.loop, array: [], board: board(tones), grid: answersGrid(result, "solutions"), vars: { row: r, solutions: result.length },
      message: r === 0 ? `Row 0 is empty, so every column is safe. Put the first queen in column 0, and come back to try the others later.`
        : !safe.length ? `${pre}Row ${r}: every column is attacked by a queen above (red). A dead end: back up and try the next safe column in an earlier row. ${how}`
        : `${pre}Row ${r}: ${hit.length ? `column${hit.length === 1 ? "" : "s"} ${list(hit)} ${hit.length === 1 ? "is" : "are"} attacked; ` : ""}${safe.length === 1 ? `only column ${safe[0]} is safe` : `columns ${list(safe)} are safe, try them in turn`}. ${how}` });
    for (const c of safe) {
      const movedNow = c !== safe[0];
      cols.push(c); colSet.add(c); down.add(r - c); up.add(r + c);
      place(r + 1, movedNow);
      cols.pop(); colSet.delete(c); down.delete(r - c); up.delete(r + c);
    }
  };
  t.step({ line: L.start, array: [], board: board(), grid: answersGrid([], "solutions"), vars: { n },
    message: `Place ${n} queens so no two share a row, a column or a diagonal. Each row gets exactly one queen, so go row by row: try every safe column, recurse to the next row, then pick the queen back up.` });
  place(0);
  t.step({ line: L.end, array: [], board: board(), grid: answersGrid(result, "solutions"), vars: { solutions: result.length, calls }, done: result.length ? "found" : "notfound",
    message: `${result.length ? `${result.length} solution${result.length === 1 ? "" : "s"}` : "No solution"} from ${calls} calls. ${sets ? "Every square was checked with three lookups, O(1) each." : "Every square was checked against every queen above it: up to n comparisons each."}` });
}

const scan: Approach<Input> = {
  id: "scan",
  name: "Backtracking, checking every queen",
  code: `function solveNQueens(n)
    result, cols ← [], []  // queen column per row
    function place(r)
        if r = n
            result.push(copy(cols))
            return
        for c ← 0 to n - 1
            if safe(r, c)
                cols.push(c)
                place(r + 1)
                cols.pop()
    place(0)
    return result
function safe(r, c)
    for each index pr, value pc in cols
        if pc = c  // same column
            return false
        if pr - pc = r - c or pr + pc = r + c
            return false  // same diagonal
    return true
`,
  run({ n }, t) { search(n, false, t); },
};

const sets: Approach<Input> = {
  id: "sets",
  name: "Backtracking with column and diagonal sets",
  code: `function solveNQueens(n)
    result, cols ← [], []  // queen column per row
    colSet ← empty set
    downSet ← empty set  // r - c of each queen
    upSet ← empty set  // r + c of each queen
    function place(r)
        if r = n
            result.push(copy(cols))
            return
        for c ← 0 to n - 1
            if c in colSet or (r - c) in downSet
                continue
            if (r + c) in upSet
                continue
            add c, r - c, r + c to the three sets
            cols.push(c)
            place(r + 1)
            cols.pop()
            remove c, r - c, r + c from the sets
    place(0)
    return result
`,
  run({ n }, t) { search(n, true, t); },
};

export const approaches = { scan, sets };

export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: sets, slot: 3 }],
  (n) => ({ n }),
  [4, 5, 6, 7, 8],
);
