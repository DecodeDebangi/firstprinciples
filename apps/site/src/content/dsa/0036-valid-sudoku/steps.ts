import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { key } from "../../concepts/35-grids/steps";

/** Nine rows of nine characters, digits 1-9 or "." for an empty cell, separated by "/". */
export type Input = { board: string };
export const example: Input = {
  board: "5...7.... / ..3...8.. / .9......2 / ...6..... / 4....1... / .......3. / ....2...5 / .6....... / .....9.5.",
};
export const fields: InputField[] = [{ key: "board", label: "board (9 rows of 9, . for empty, split by /)", kind: "text" }];
export const parseBoard = (s: string) => s.split("/").map((r) => r.replace(/[\s,]/g, "")).filter(Boolean).map((r) => r.split(""));
export function prepare(raw: Input): Prepared<Input> {
  const b = parseBoard(raw.board);
  if (b.length !== 9 || b.some((r) => r.length !== 9)) return { error: "Give 9 rows of 9 characters each, separated by /." };
  if (b.some((r) => r.some((ch) => !/^[1-9.]$/.test(ch)))) return { error: "Use the digits 1 to 9, and . for an empty cell." };
  return { input: { board: b.map((r) => r.join("")).join(" / ") } };
}

const boxOf = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
const view = (b: string[][]) => b.map((row) => row.map((ch) => (ch === "." ? "·" : ch)));
/** Light shading for every cell in (r, c)'s row, column and box. */
function area(r: number, c: number) {
  const t: Record<string, Tone> = {};
  for (let k = 0; k < 9; k++) { t[key(r, k)] = "side-a"; t[key(k, c)] = "side-a"; }
  const br = r - (r % 3), bc = c - (c % 3);
  for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) t[key(i, j)] = "side-b";
  return t;
}
/** Filled cells checked so far, faded. */
const checked = (list: [number, number][]) => Object.fromEntries(list.map(([r, c]) => [key(r, c), "visited" as Tone]));

const scan: Approach<Input> = {
  id: "scan",
  name: "Scan each digit's row, column and box",
  code: `function isValidSudoku(board)
    for r ← 0 to 8
        for c ← 0 to 8
            v ← board[r][c]
            if v = '.'
                continue
            for k ← 0 to 8
                if k ≠ c and board[r][k] = v
                    return false
                if k ≠ r and board[k][c] = v
                    return false
            br, bc ← r - r % 3, c - c % 3
            for each other cell (i, j) in that box
                if board[i][j] = v
                    return false
    return true
`,
  run({ board }, t) {
    const b = parseBoard(board), rows = view(b), done: [number, number][] = [];
    t.step({ line: 2, array: [], board: { rows, labels: true, dense: true }, vars: {},
      message: `A board is valid when no digit repeats within a row, a column or one of the nine 3 × 3 boxes. Empty cells don't matter. The direct check: for every digit, look through the other cells of its row, column and box.` });
    let asked = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = b[r][c];
        if (v === ".") { t.op(); continue; }
        let clash: [number, number, string] | null = null;
        for (let k = 0; k < 9 && !clash; k++) {
          t.op(2);
          if (k !== c && b[r][k] === v) clash = [r, k, `row ${r}`];
          else if (k !== r && b[k][c] === v) clash = [k, c, `column ${c}`];
        }
        const br = r - (r % 3), bc = c - (c % 3);
        for (let i = br; i < br + 3 && !clash; i++) for (let j = bc; j < bc + 3 && !clash; j++) {
          t.op();
          if ((i !== r || j !== c) && b[i][j] === v) clash = [i, j, `box ${boxOf(r, c)}`];
        }
        const ask = !asked && clash
          ? (asked = true, { ask: { q: `Checking the ${v} at (${r}, ${c}). Is there another ${v} in its row, column or box?`, options: [`Yes: the board is invalid`, "No: move on"], answer: 0 } }) : {};
        if (clash) {
          const [i, j, where] = clash;
          t.step({ ...ask, line: where.startsWith("row") ? 9 : where.startsWith("column") ? 11 : 15, array: [], board: { rows, labels: true, dense: true, tones: { ...area(r, c), ...checked(done), [key(r, c)]: "miss", [key(i, j)]: "miss" } }, vars: { r, c, v }, done: "notfound",
            message: `The ${v} at (${r}, ${c}) has another ${v} at (${i}, ${j}), in the same ${where}. Return false.` });
          return;
        }
        t.step({ line: 13, array: [], board: { rows, labels: true, dense: true, tones: { ...area(r, c), ...checked(done), [key(r, c)]: "active" } }, vars: { r, c, v, box: boxOf(r, c) },
          message: `The ${v} at (${r}, ${c}): its row and column (shaded) and its box ${boxOf(r, c)} (darker) have no other ${v}. That took up to 8 + 8 + 8 = 24 checks.` });
        done.push([r, c]);
      }
    }
    t.step({ line: 16, array: [], board: { rows, labels: true, dense: true, tones: checked(done) }, vars: { digits: done.length }, done: "found",
      message: `No digit repeats anywhere: the board is valid. Each of the ${done.length} digits cost up to 24 checks.` });
  },
};

const sets: Approach<Input> = {
  id: "sets",
  name: "One pass with a set per row, column and box",
  code: `function isValidSudoku(board)
    rows ← 9 empty sets
    cols ← 9 empty sets
    boxes ← 9 empty sets
    for r ← 0 to 8
        for c ← 0 to 8
            v ← board[r][c]
            if v = '.'
                continue
            b ← floor(r / 3) · 3 + floor(c / 3)
            seen ← v in rows[r] or v in cols[c]
            if seen or v in boxes[b]
                return false
            rows[r].add(v)
            cols[c].add(v)
            boxes[b].add(v)
    return true
`,
  run({ board }, t) {
    const b = parseBoard(board), rows = view(b), done: [number, number][] = [];
    const R = Array.from({ length: 9 }, () => new Set<string>()), C = Array.from({ length: 9 }, () => new Set<string>()), B = Array.from({ length: 9 }, () => new Set<string>());
    const panel = (r: number, c: number, hl?: string) => ({
      title: "the three sets for this cell",
      entries: [[`rows[${r}]`, [...R[r]].join(", ") || "empty"], [`cols[${c}]`, [...C[c]].join(", ") || "empty"], [`boxes[${boxOf(r, c)}]`, [...B[boxOf(r, c)]].join(", ") || "empty"]] as [string, string][],
      highlight: hl,
    });
    t.step({ line: 4, array: [], board: { rows, labels: true, dense: true }, vars: {},
      message: `Instead of searching, remember. Keep a set of the digits seen in each row, each column and each box: 27 sets. Each digit then needs three lookups.` });
    let asked = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        t.op();
        const v = b[r][c];
        if (v === ".") continue;
        const bx = boxOf(r, c);
        t.op(3);
        const where = R[r].has(v) ? `rows[${r}]` : C[c].has(v) ? `cols[${c}]` : B[bx].has(v) ? `boxes[${bx}]` : null;
        const ask = asked === 0 && r >= 3 && c >= 3 && !where
          ? (asked++, { ask: { q: `Which box is the cell (${r}, ${c}) in?`, options: [String(bx), String((bx + 1) % 9), String((bx + 3) % 9)], answer: 0 } })
          : asked === 1 && where
            ? (asked++, { ask: { q: `${v} at (${r}, ${c}): rows[${r}] = {${[...R[r]].join(", ")}}, cols[${c}] = {${[...C[c]].join(", ")}}, boxes[${bx}] = {${[...B[bx]].join(", ")}}. Is ${v} already in one of them?`, options: ["Yes: return false", "No: add it to all three"], answer: 0 } })
            : {};
        if (where) {
          t.step({ ...ask, line: 13, array: [], board: { rows, labels: true, dense: true, tones: { ...area(r, c), ...checked(done), [key(r, c)]: "miss" } }, map: panel(r, c, where), vars: { r, c, v, b: bx }, done: "notfound",
            message: `${v} is already in ${where}: another ${v} shares this cell's ${where.startsWith("rows") ? "row" : where.startsWith("cols") ? "column" : "box"}. Return false.` });
          return;
        }
        R[r].add(v); C[c].add(v); B[bx].add(v);
        t.step({ ...ask, line: 16, array: [], board: { rows, labels: true, dense: true, tones: { ...area(r, c), ...checked(done), [key(r, c)]: "active" } }, map: panel(r, c), vars: { r, c, v, b: bx },
          message: `${v} at (${r}, ${c}) is in box floor(${r} / 3) · 3 + floor(${c} / 3) = ${bx}. It's in none of its three sets, so add it to all three.` });
        done.push([r, c]);
      }
    }
    t.step({ line: 17, array: [], board: { rows, labels: true, dense: true, tones: checked(done) }, vars: { digits: done.length }, done: "found",
      message: `Every digit was new to its row, column and box: valid. One pass, three lookups per digit.` });
  },
};

export const approaches = { scan, sets };
