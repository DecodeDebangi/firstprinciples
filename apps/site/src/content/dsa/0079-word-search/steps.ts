import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** A letter grid written as rows separated by commas, e.g. "seed, eats, dote". Shared with LeetCode 212. */
export const parseBoard = (s: string) => s.toLowerCase().split(/[,;\n]+/).map((r) => r.trim().replace(/\s+/g, "")).filter(Boolean).map((r) => [...r]);
export function boardError(s: string): string | null {
  const b = parseBoard(s);
  if (!b.length) return "Give the board as rows of letters separated by commas, like: seed, eats, dote.";
  if (b.some((r) => r.length !== b[0].length)) return "Every row needs the same number of letters.";
  if (b.length > 5 || b[0].length > 5) return "Use at most 5 rows of at most 5 letters so the board fits.";
  if (b.some((r) => r.some((c) => !/[a-z]/.test(c)))) return "Use the letters a to z.";
  return null;
}
export const DIRS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const key = (r: number, c: number) => `${r},${c}`;
/** The board with the current path coloured: earlier letters settled, the newest one active (or missed). */
export const boardView = (b: string[][], path: [number, number][], last: Tone = "active", extra: Record<string, Tone> = {}) =>
  ({ rows: b.map((r) => r.map((c) => c.toUpperCase())), labels: true, tones: { ...extra, ...Object.fromEntries(path.map(([r, c], i) => [key(r, c), (i === path.length - 1 ? last : "settled") as Tone])) } });
const pathText = (b: string[][], path: [number, number][]) => path.map(([r, c]) => b[r][c]).join("→") || "—";

export type Input = { board: string; word: string };
export const example: Input = { board: "seed, eats, dote", word: "eats" };
export const fields: InputField[] = [{ key: "board", label: "board (rows)", kind: "raw" }, { key: "word", label: "word", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const e = boardError(raw.board); if (e) return { error: e };
  if (!/^[a-z]{1,6}$/i.test(raw.word)) return { error: "Use a word of 1 to 6 letters a to z." };
  return { input: { board: parseBoard(raw.board).map((r) => r.join("")).join(", "), word: raw.word.toLowerCase() } };
}

const everyPath: Approach<Input> = {
  id: "paths", name: "Build every path, then check its letters",
  code: `function exist(board, word)
    for each cell (r, c) in board
        for each path from (r, c) as long as word
            // each step goes to an unused neighbour
            if the path's letters spell word
                return true
    return false
`,
  run(raw, t) {
    const b = parseBoard(raw.board), w = raw.word, R = b.length, C = b[0].length;
    if (t.record) t.step({ line: 2, array: [], board: boardView(b, []), vars: { word: w }, message: `Walk from each cell to unused neighbours, one cell at a time, until the path is ${w.length} long, and only then compare its letters with "${w}". Nothing is checked on the way.` });
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      let paths = 0, hit: [number, number][] | null = null;
      const used = new Set<string>();
      const go = (rr: number, cc: number, path: [number, number][]) => {
        if (hit) return;
        t.op();
        if (path.length === w.length) { paths++; if (path.map(([a, d]) => b[a][d]).join("") === w) hit = [...path]; return; }
        for (const [dr, dc] of DIRS) { const nr = rr + dr, nc = cc + dc; if (nr < 0 || nc < 0 || nr >= R || nc >= C || used.has(key(nr, nc))) continue; used.add(key(nr, nc)); path.push([nr, nc]); go(nr, nc, path); path.pop(); used.delete(key(nr, nc)); }
      };
      used.add(key(r, c)); go(r, c, [[r, c]]);
      if (hit) {
        if (t.record) t.step({ line: 6, array: [], board: boardView(b, hit, "found"), vars: { word: w, start: `(${r}, ${c})`, "paths built": paths, found: "true" }, done: "found",
          message: `From (${r}, ${c}), after building ${paths} path${paths === 1 ? "" : "s"}, one spells "${w}": ${pathText(b, hit)}. Return true.` });
        return;
      }
      if (t.record) t.step({ line: 3, array: [], board: boardView(b, [[r, c]], "miss"), vars: { word: w, start: `(${r}, ${c})`, "paths built": paths },
        message: `From (${r}, ${c}) ('${b[r][c]}'): built ${paths} complete path${paths === 1 ? "" : "s"}, none spelling "${w}".${b[r][c] !== w[0] ? ` Every one was doomed from the first letter, since '${b[r][c]}' isn't '${w[0]}'.` : ""}` });
    }
    if (t.record) t.step({ line: 7, array: [], board: boardView(b, []), vars: { word: w, found: "false" }, done: "notfound", message: `No path spells "${w}". Return false. Most of the work went into paths that were wrong from an early letter.` });
  },
};

const backtrack: Approach<Input> = {
  id: "backtrack", name: "Backtracking: stop at the first wrong letter",
  code: `function exist(board, word)
    for each cell (r, c) in board
        if dfs(r, c, 0)
            return true
    return false
function dfs(r, c, i)  // match word[i] at (r, c)?
    if i = length(word)
        return true
    if (r, c) is off the board
        return false
    if board[r][c] ≠ word[i]  // also catches "#"
        return false
    board[r][c] ← "#"  // used on this path
    for each neighbour (nr, nc) of (r, c)
        if dfs(nr, nc, i + 1)
            board[r][c] ← word[i]
            return true
    board[r][c] ← word[i]  // undo
    return false
`,
  run(raw, t) {
    // b is searched and marked with "#"; orig is the untouched board, for drawing.
    const b = parseBoard(raw.board), orig = parseBoard(raw.board), w = raw.word, R = b.length, C = b[0].length, path: [number, number][] = [];
    let asked = 0;
    if (t.record) t.step({ line: 2, array: [], board: boardView(orig, []), vars: { word: w, path: "—" }, message: `Grow the path one letter at a time, and give up on it as soon as a letter doesn't match. Each cell is marked while it's on the path, so it can't be used twice, and unmarked when the path backs out of it.` });
    const dfs = (r: number, c: number, i: number): boolean => {
      t.op();
      if (i === w.length) return true;
      if (r < 0 || c < 0 || r >= R || c >= C) return false;
      if (b[r][c] !== w[i]) {
        if (t.record && i > 0) t.step({ line: 12, array: [], board: boardView(orig, [...path, [r, c]], "miss"), vars: { word: w, need: w[i], path: w.slice(0, i) },
          message: b[r][c] === "#" ? `(${r}, ${c}) is already on the path: it can't be used twice. Try the next direction.` : `(${r}, ${c}) is '${b[r][c]}', not '${w[i]}': give up on this direction straight away.` });
        return false;
      }
      path.push([r, c]); b[r][c] = "#";
      const ask = t.record && asked < 2 && i > 0 && i < w.length - 1 ? (asked++, { ask: { q: `The path spells "${w.slice(0, i + 1)}". Where does the search look for '${w[i + 1]}'?`, options: [`In the neighbours of (${r}, ${c})`, "Anywhere on the board", `Back at the first letter`], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 13, array: [], board: boardView(orig, path), vars: { word: w, path: w.slice(0, i + 1) },
        message: i === w.length - 1 ? `(${r}, ${c}) is '${w[i]}', the last letter: the whole word matches.` : `(${r}, ${c}) is '${w[i]}', letter ${i + 1} of "${w}": the path is now "${w.slice(0, i + 1)}". Mark it used and try its neighbours for '${w[i + 1]}'.` });
      for (const [dr, dc] of DIRS) if (dfs(r + dr, c + dc, i + 1)) { b[r][c] = w[i]; return true; }
      b[r][c] = w[i]; path.pop();
      if (t.record && i > 0) t.step({ line: 18, array: [], board: boardView(orig, path), vars: { word: w, path: w.slice(0, i) },
        message: `No neighbour of (${r}, ${c}) continues "${w.slice(0, i + 1)}". Unmark it and back up to "${w.slice(0, i)}".` });
      return false;
    };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (dfs(r, c, 0)) {
        if (t.record) t.step({ line: 4, array: [], board: boardView(orig, path, "found"), vars: { word: w, path: w, found: "true" }, done: "found",
          message: `Every letter of "${w}" matched along a path from (${r}, ${c}). Return true. Wrong directions were dropped after one letter, not after building whole paths.` });
        return;
      }
    }
    if (t.record) t.step({ line: 5, array: [], board: boardView(orig, []), vars: { word: w, found: "false" }, done: "notfound", message: `No cell starts a path that spells "${w}". Return false.` });
  },
};

export const approaches = { paths: everyPath, backtrack };
/** A 4 × 4 board of different letters; the word follows a snake through it, then asks for a letter that isn't there. */
export const growth = measureGrowth(
  [{ approach: everyPath, slot: 1 }, { approach: backtrack, slot: 3 }],
  (n) => ({ board: "abcd, efgh, ijkl, mnop", word: "abcdhgfe".slice(0, n - 1) + "z" }),
  [2, 3, 4, 5, 6, 7],
);
