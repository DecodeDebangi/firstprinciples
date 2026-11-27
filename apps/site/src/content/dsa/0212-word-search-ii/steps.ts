import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";
import { DIRS, boardError, boardView, parseBoard } from "../0079-word-search/steps";

export type Input = { board: string; words: string };
export const example: Input = { board: "seed, eats, dote", words: "eats, seat, dote, toe, east" };
export const fields: InputField[] = [{ key: "board", label: "board (rows)", kind: "raw" }, { key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const e = boardError(raw.board); if (e) return { error: e };
  const w = parseWords(raw.words);
  if (!w.length || w.length > 6) return { error: "Give 1 to 6 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,5}$/.test(x))) return { error: "Use words of 1 to 5 letters a to z." };
  const t = new Trie(); w.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 20) return { error: "Those words branch too much for the trie to fit; use words that share beginnings." };
  return { input: { board: parseBoard(raw.board).map((r) => r.join("")).join(", "), words: [...new Set(w)].join(", ") } };
}
const list = (a: string[]) => `[${a.join(", ")}]`;

/** Word Search for one word, counting operations; returns the path if found. */
function exist(b: string[][], w: string, t: Parameters<Approach<Input>["run"]>[1]): [number, number][] | null {
  const R = b.length, C = b[0].length, path: [number, number][] = [];
  const dfs = (r: number, c: number, i: number): boolean => {
    t.op();
    if (i === w.length) return true;
    if (r < 0 || c < 0 || r >= R || c >= C || b[r][c] !== w[i]) return false;
    path.push([r, c]); b[r][c] = "#";
    for (const [dr, dc] of DIRS) if (dfs(r + dr, c + dc, i + 1)) { b[r][c] = w[i]; return true; }
    b[r][c] = w[i]; path.pop(); return false;
  };
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (dfs(r, c, 0)) return path;
  return null;
}

const each: Approach<Input> = {
  id: "each", name: "Run Word Search once per word",
  code: `function findWords(board, words)
    found ← []
    for each w in words
        if exist(board, w)  // Word Search, per word
            found.push(w)
    return found
`,
  run(raw, t) {
    const b = parseBoard(raw.board), orig = parseBoard(raw.board), words = parseWords(raw.words), found: string[] = [];
    if (t.record) t.step({ line: 3, array: [], board: boardView(orig, []), vars: { found: "[]" }, message: `Search the board separately for each of the ${words.length} words, with the backtracking search from Word Search.` });
    for (const w of words) {
      const before = (t as unknown as { ops: number }).ops;
      const p = exist(b, w, t);
      const cost = (t as unknown as { ops: number }).ops - before;
      if (p) found.push(w);
      if (t.record) t.step({ line: p ? 5 : 4, array: [], board: boardView(orig, p ?? [], "found"), vars: { word: w, "steps for it": cost, found: list(found) },
        message: p ? `"${w}" is on the board. Its search took ${cost} steps.` : `"${w}" isn't on the board; finding that out took ${cost} steps.` });
    }
    if (t.record) t.step({ line: 6, array: [], board: boardView(orig, []), vars: { found: list(found) }, done: "found",
      message: `Found ${list(found)}. Every word walked the board from scratch, even words sharing a beginning: the work grows with the number of words.` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "One search for all words, following a trie",
  code: `function findWords(board, words)
    root ← a trie of words  // ✓ marks whole words
    found ← []
    for each cell (r, c) in board
        dfs(r, c, root)
    return found
function dfs(r, c, node)
    if (r, c) is off the board
        return
    ch ← board[r][c]
    if node has no child ch  // also catches "#"
        return
    next ← node.child[ch]
    if next ends a word
        found.push(that word)
        unmark next  // so it's reported once
    board[r][c] ← "#"
    for each neighbour (nr, nc) of (r, c)
        dfs(nr, nc, next)
    board[r][c] ← ch  // undo
`,
  run(raw, t) {
    const b = parseBoard(raw.board), orig = parseBoard(raw.board), words = parseWords(raw.words), R = b.length, C = b[0].length;
    const tr = new Trie(), word = new Map<string, string>(), found: string[] = [];
    words.forEach((w) => word.set(tr.insert(w), w));
    t.op(words.join("").length);
    const path: [number, number][] = [], nodes: string[] = [];
    let asked = 0;
    const show = (last: Tone = "active") => ({ trees: tr.view({ ...Object.fromEntries(nodes.map((n) => [n, "visited" as Tone])), ...(nodes.length ? { [nodes[nodes.length - 1]]: last === "found" ? "found" : "compare" } : {}) }), board: boardView(orig, path, last) });
    if (t.record) t.step({ line: 2, array: [], ...show(), vars: { found: "[]" }, message: `Put all the words in a trie. Then one backtracking search from each cell follows the board and the trie together: a path continues only while its letters are the beginning of some word. Words sharing a beginning share the work.` });
    const dfs = (r: number, c: number, node: string) => {
      t.op();
      if (r < 0 || c < 0 || r >= R || c >= C) return;
      const ch = b[r][c], next = ch === "#" ? undefined : tr.child(node, ch);
      if (!next) {
        if (t.record && nodes.length && ch !== "#") t.step({ line: 12, array: [], trees: tr.view(Object.fromEntries(nodes.map((n) => [n, "visited" as Tone]))), board: boardView(orig, [...path, [r, c]], "miss"), vars: { prefix: path.map(([a, d]) => orig[a][d]).join(""), found: list(found) },
          message: `No word starts with "${path.map(([a, d]) => orig[a][d]).join("")}${ch}": the trie has no '${ch}' here, so this direction is dropped.` });
        return;
      }
      path.push([r, c]); nodes.push(next); b[r][c] = "#";
      const pre = path.map(([a, d]) => orig[a][d]).join("");
      const ends = word.has(next) && tr.ends.has(next);
      if (ends) { found.push(word.get(next)!); tr.ends.delete(next); }
      const ask = t.record && asked < 2 && pre.length === 2 ? (asked++, { ask: { q: `The path spells "${pre}", and the trie has a node for it. Does the search keep going from here?`, options: ["Yes: some word starts with it", "No: only whole words matter"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: ends ? 15 : 17, array: [], ...show(ends ? "found" : "active"), vars: { prefix: pre, found: list(found) },
        message: ends ? `"${pre}" is a whole word (✓): add it to the answer and remove the mark, so it isn't reported twice. Longer words may still start here, so keep going.` : `"${pre}" begins ${[...word.values()].filter((w) => w.startsWith(pre)).map((w) => `"${w}"`).join(" and ")}: keep going.` });
      for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, next);
      b[r][c] = ch; path.pop(); nodes.pop();
    };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) dfs(r, c, tr.root);
    if (t.record) t.step({ line: 6, array: [], trees: tr.view(), board: boardView(orig, []), vars: { found: list(found) }, done: "found",
      message: `Found ${list(found)} in one pass over the board. A path stops as soon as no word starts with it, and words with a common beginning were searched together.` });
  },
};

export const approaches = { each, trie };
/** A 4 × 4 board and n words that all share a long beginning, which the board spells. */
export const growth = measureGrowth(
  [{ approach: each, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ board: "abcd, hgfe, ijkl, ponm", words: Array.from({ length: n }, (_, k) => "abcdefg" + String.fromCharCode(97 + (k % 26)) + String.fromCharCode(97 + Math.floor(k / 26))).join(", ") }),
  [2, 4, 8, 16, 32, 64],
);
