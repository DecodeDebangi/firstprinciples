import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { charGridError, key, parseCharGrid } from "../../concepts/50-searching-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "101100 111110 011111 110111" };
export const fields: InputField[] = [{ key: "grid", label: "grid (1 filled, 0 empty)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "01");
  return e ? { error: e } : { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
type Rect = { top: number; bottom: number; left: number; right: number; area: number };
const none: Rect = { top: 0, bottom: -1, left: 0, right: -1, area: 0 };
const cellsOf = (b: Rect, tone: Tone) => { const o: Record<string, Tone> = {}; for (let r = b.top; r <= b.bottom; r++) for (let c = b.left; c <= b.right; c++) o[key(r, c)] = tone; return o; };
const empties = (g: string[][]) => Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), ch === "0" ? "discard" : ""])).filter(([, v]) => v)) as Record<string, Tone>;
const dims = (b: Rect) => `${b.bottom - b.top + 1} tall × ${b.right - b.left + 1} wide`;

const corners: Approach<Input> = {
  id: "corners",
  name: "From every corner, grow upward",
  code: `function maximalRectangle(grid)
    width ← grid of 0s, the same size
    for each cell (r, c) holding 1
        width[r][c] ← 1 + (width[r][c - 1], or 0)
    best ← 0
    for each cell (r, c)  // bottom-right corner
        w ← width[r][c]
        for up ← r down to 0  // top row
            w ← min(w, width[up][c])
            if w = 0
                break
            best ← max(best, w · (r - up + 1))
    return best
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), R = g.length, C = g[0].length;
    const W = g.map((row) => row.map(() => 0));
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { t.op(); if (g[r][c] === "1") W[r][c] = 1 + (c ? W[r][c - 1] : 0); }
    t.step({ line: 4, array: [], board: { rows: W.map((row) => row.map((v) => v || "")), labels: true, tones: empties(g) }, vars: {},
      message: `First, for every filled cell, count the 1s in a row ending at it, reading left to right: its "width". A rectangle with its bottom-right corner at a cell can be at most that wide.` });
    let best = none;
    for (let r = 0; r < R; r++) {
      let rowBest = none;
      for (let c = 0; c < C; c++) {
        let w = Infinity;
        for (let up = r; up >= 0; up--) { t.op(); w = Math.min(w, W[up][c]); if (w === 0) break; const area = w * (r - up + 1); if (area > rowBest.area) rowBest = { top: up, bottom: r, left: c - w + 1, right: c, area }; }
      }
      const better = rowBest.area > best.area;
      if (better) best = rowBest;
      t.step({ line: 12, array: [], board: { rows: W.map((row) => row.map((v) => v || "")), labels: true, tones: { ...empties(g), ...cellsOf(rowBest, better ? "found" : "compare") } }, vars: { "bottom row": r, "row best": rowBest.area, best: best.area },
        message: rowBest.area ? `Corners in row ${r}: each one grows upward row by row, keeping the narrowest width so far. The biggest here is ${dims(rowBest)} = ${rowBest.area}.${better ? " The best so far." : ` Not better than ${best.area}.`}` : `Row ${r} is all 0s: no rectangle ends here.` });
    }
    t.step({ line: 13, array: [], board: { rows: g, labels: true, tones: { ...empties(g), ...cellsOf(best, "settled") } }, vars: { best: best.area }, done: "found",
      message: `The largest rectangle of 1s has area ${best.area}. Each of the rows × cols corners can grow up through every row above it: O(rows² · cols).` });
  },
};

/** The largest rectangle in one histogram, with its position. Counts one operation per push or pop. */
function largest(h: number[], op: () => void) {
  const st: number[] = [];
  let best = { left: 0, right: -1, height: 0, area: 0 };
  for (let i = 0; i <= h.length; i++) {
    const x = i < h.length ? h[i] : 0;
    while (st.length && h[st[st.length - 1]] >= x) { op(); const j = st.pop()!, left = st.length ? st[st.length - 1] + 1 : 0; if (h[j] * (i - left) > best.area) best = { left, right: i - 1, height: h[j], area: h[j] * (i - left) }; }
    op(); st.push(i);
  }
  return best;
}

const histograms: Approach<Input> = {
  id: "histograms",
  name: "A histogram for every row",
  code: `function maximalRectangle(grid)
    heights ← array of cols, all 0
    best ← 0
    for each row r in grid
        for c ← 0 to cols - 1
            if grid[r][c] = 1
                heights[c] += 1
            else
                heights[c] ← 0
        best ← max(best, largestRectangle(heights))
    return best
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), R = g.length, C = g[0].length, h = Array(C).fill(0);
    let best = none, asked = false;
    const hGrid = (r: number) => ({ title: `heights: 1s stacked up to row ${r}`, rows: [[...h]] });
    t.step({ line: 2, array: [], board: { rows: g, labels: true, tones: empties(g) }, vars: {},
      message: `Treat each row as the floor of a histogram: each column's bar is how many 1s are stacked straight up from that row. The largest rectangle of 1s sits on some row, so solve Largest Rectangle in Histogram once per row.` });
    for (let r = 0; r < R; r++) {
      const prev = [...h];
      for (let c = 0; c < C; c++) { t.op(); h[c] = g[r][c] === "1" ? h[c] + 1 : 0; }
      const z = g[r].findIndex((ch, c) => ch === "0" && prev[c] > 0);
      const q = !asked && z >= 0 ? (asked = true, { ask: { q: `Row ${r}: column ${z} holds 0, and its bar was ${prev[z]} tall. What is its new height?`, options: ["0: the stack of 1s is broken", `${prev[z]}: it stays`, `${prev[z] + 1}`], answer: 0 } }) : {};
      const b = largest(h, () => t.op());
      const rect: Rect = b.area ? { top: r - b.height + 1, bottom: r, left: b.left, right: b.right, area: b.area } : none;
      const better = rect.area > best.area;
      if (better) best = rect;
      t.step({ ...q, line: 10, array: [], board: { rows: g, labels: true, tones: { ...empties(g), ...cellsOf(rect, better ? "found" : "compare") } }, grid: hGrid(r), vars: { row: r, "row best": rect.area, best: best.area },
        message: `Row ${r}: heights [${h.join(", ")}]. ${rect.area ? `The stack pass finds a ${dims(rect)} rectangle, area ${rect.area}.${better ? " The best so far." : ` Not better than ${best.area}.`}` : "Every bar is 0: no rectangle sits on this row."}` });
    }
    t.step({ line: 11, array: [], board: { rows: g, labels: true, tones: { ...empties(g), ...cellsOf(best, "settled") } }, grid: hGrid(R - 1), vars: { best: best.area }, done: "found",
      message: `The largest rectangle of 1s has area ${best.area}. Each row updates the heights in O(cols) and runs one O(cols) stack pass: O(rows · cols) in total.` });
  },
};

export const approaches = { corners, histograms };

/** An n × n grid of 1s: every corner grows all the way up. */
export const growth = measureGrowth(
  [{ approach: corners, slot: 1 }, { approach: histograms, slot: 3 }],
  (n) => ({ grid: Array(n).fill("1".repeat(n)).join(" ") }),
  [3, 6, 9, 12, 15],
);
