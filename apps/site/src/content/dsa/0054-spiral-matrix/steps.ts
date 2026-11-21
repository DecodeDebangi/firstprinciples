import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { gridError, gridText, key, parseGrid } from "../../concepts/35-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "8 1 6 3 / 4 9 2 7 / 5 0 6 1" };
export const fields: InputField[] = [{ key: "grid", label: "grid (rows split by /)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid);
  const e = gridError(g, 4, 5);
  return e ? { error: e } : { input: { grid: gridText(g) } };
}

const resultPanel = (res: number[]) => ({ grid: { title: "result", rows: [res.length ? res : [""]], dense: true } });

const withSeen: Approach<Input> = {
  id: "seen",
  name: "Walk and turn, marking visited cells",
  code: `function spiralOrder(grid)
    m, n ← length(grid), length(grid[0])
    seen ← m × n grid, all false
    directions ← [(0, 1), (1, 0), (0, -1), (-1, 0)]
    r, c, d ← 0, 0, 0
    result ← empty list
    repeat m · n times
        result.push(grid[r][c])
        seen[r][c] ← true
        dr, dc ← directions[d]
        nr, nc ← r + dr, c + dc
        inside ← 0 ≤ nr < m and 0 ≤ nc < n
        if not inside or seen[nr][nc]
            d ← (d + 1) % 4  // turn right
            dr, dc ← directions[d]
        r, c ← r + dr, c + dc
    return result
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length;
    const D: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]], NAMES = ["right", "down", "left", "up"];
    const seen: Record<string, Tone> = {}, res: number[] = [];
    let r = 0, c = 0, d = 0, asked = false;
    t.step({ line: 6, array: [], board: { rows: g, labels: true }, ...resultPanel(res), vars: { r, c, heading: "right" },
      message: `Walk like a robot: start at the top left heading right, and turn right whenever the next cell is off the grid or already visited. A second m × n grid, seen, remembers the visited cells.` });
    for (let k = 0; k < m * n; k++) {
      t.op();
      res.push(g[r][c]);
      seen[key(r, c)] = "visited";
      let [dr, dc] = D[d];
      const nr = r + dr, nc = c + dc;
      const inside = nr >= 0 && nr < m && nc >= 0 && nc < n;
      const blocked = !inside || !!seen[key(nr, nc)];
      t.step({ line: 8, array: [], board: { rows: g, labels: true, tones: { ...seen, [key(r, c)]: "active" } }, ...resultPanel(res), vars: { r, c, heading: NAMES[d] },
        message: `Take grid[${r}][${c}] = ${g[r][c]}, and mark it seen.` });
      if (k === m * n - 1) break;
      if (blocked) {
        const ask = !asked && !inside
          ? (asked = true, { ask: { q: `Heading ${NAMES[d]}, the next cell would be (${nr}, ${nc}). What now?`, options: [`Turn right, to head ${NAMES[(d + 1) % 4]}`, `Keep heading ${NAMES[d]}`, "Stop: the spiral is finished"], answer: 0 } }) : {};
        const why = inside ? `(${nr}, ${nc}) was already visited` : `(${nr}, ${nc}) is off the grid`;
        d = (d + 1) % 4;
        [dr, dc] = D[d];
        t.step({ ...ask, line: 14, array: [], board: { rows: g, labels: true, tones: { ...seen, [key(r, c)]: "active", [key(r + dr, c + dc)]: "compare" } }, ...resultPanel(res), vars: { r, c, heading: NAMES[d] },
          message: `Going ${NAMES[(d + 3) % 4]}, ${why}. Turn right: now heading ${NAMES[d]}, towards (${r + dr}, ${c + dc}).` });
      }
      r += dr; c += dc;
    }
    t.step({ line: 17, array: [], board: { rows: g, labels: true, tones: seen }, ...resultPanel(res), vars: { cells: m * n }, done: "found",
      message: `All ${m * n} cells, in spiral order. O(m · n) time, but the seen grid costs another m · n cells: O(m · n) extra space.` });
  },
};

const borders: Approach<Input> = {
  id: "borders",
  name: "Shrinking borders",
  code: `function spiralOrder(grid)
    top, bottom ← 0, length(grid) - 1
    left, right ← 0, length(grid[0]) - 1
    result ← empty list
    while top ≤ bottom and left ≤ right
        for c ← left to right  // top
            result.push(grid[top][c])
        top += 1
        for r ← top to bottom  // right
            result.push(grid[r][right])
        right -= 1
        if top ≤ bottom
            for c ← right down to left  // bottom
                result.push(grid[bottom][c])
            bottom -= 1
        if left ≤ right
            for r ← bottom down to top  // left
                result.push(grid[r][left])
            left += 1
    return result
`,
  run({ grid }, t) {
    const g = parseGrid(grid), m = g.length, n = g[0].length;
    let top = 0, bottom = m - 1, left = 0, right = n - 1;
    const seen: Record<string, Tone> = {}, res: number[] = [];
    const vars = () => ({ top, bottom, left, right });
    /** Cells still inside the borders get no tone; taken ones are grey. */
    const take = (r: number, c: number, line: number, side: string) => {
      t.op();
      res.push(g[r][c]);
      seen[key(r, c)] = "visited";
      t.step({ line, array: [], board: { rows: g, labels: true, tones: { ...seen, [key(r, c)]: "active" } }, ...resultPanel(res), vars: vars(),
        message: `${side}: take grid[${r}][${c}] = ${g[r][c]}.` });
    };
    const moved = (line: number, text: string) =>
      t.step({ line, array: [], board: { rows: g, labels: true, tones: seen }, ...resultPanel(res), vars: vars(), message: text });
    t.step({ line: 4, array: [], board: { rows: g, labels: true }, ...resultPanel(res), vars: vars(),
      message: `Four numbers mark the edges of the part not read yet: rows ${top} to ${bottom}, columns ${left} to ${right}. Read the outer ring clockwise, moving each edge in as its side is used up.` });
    let asked = 0;
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) take(top, c, 7, `Top row (row ${top})`);
      top++;
      moved(8, `The top row is used up: top moves down to ${top}.`);
      for (let r = top; r <= bottom; r++) take(r, right, 10, `Right column (column ${right})`);
      right--;
      moved(11, `The right column is used up: right moves left to ${right}.`);
      const rowLeft = top <= bottom;
      const ask1 = asked < 2 ? (asked++, { ask: { q: `top = ${top} and bottom = ${bottom}. Is there a bottom row left to read?`, options: ["Yes: top ≤ bottom", "No: top > bottom, skip it"], answer: rowLeft ? 0 : 1 } }) : {};
      t.step({ ...ask1, line: 12, array: [], board: { rows: g, labels: true, tones: seen }, ...resultPanel(res), vars: vars(),
        message: rowLeft ? `top ${top} ≤ bottom ${bottom}: a bottom row remains. Read it right to left.` : `top ${top} > bottom ${bottom}: no rows are left between them, so there's no bottom row. Reading one would take a row twice.` });
      if (rowLeft) {
        for (let c = right; c >= left; c--) take(bottom, c, 14, `Bottom row (row ${bottom})`);
        bottom--;
        moved(15, `The bottom row is used up: bottom moves up to ${bottom}.`);
      }
      const colLeft = left <= right;
      t.step({ line: 16, array: [], board: { rows: g, labels: true, tones: seen }, ...resultPanel(res), vars: vars(),
        message: colLeft ? `left ${left} ≤ right ${right}: a left column remains. Read it bottom to top${bottom < top ? ", though no rows are left in it" : ""}.` : `left ${left} > right ${right}: no columns are left, so there's no left column.` });
      if (colLeft) {
        for (let r = bottom; r >= top; r--) take(r, left, 18, `Left column (column ${left})`);
        left++;
        moved(19, `The left column is used up: left moves right to ${left}.`);
      }
    }
    t.step({ line: 20, array: [], board: { rows: g, labels: true, tones: seen }, ...resultPanel(res), vars: vars(), done: "found",
      message: `The borders have crossed, so every cell is read: O(m · n) time, and only four numbers besides the answer: O(1) extra space.` });
  },
};

export const approaches = { seen: withSeen, borders };
