import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gridError, gridText, parseGrid } from "../../concepts/35-grids/steps";
import { DIRS4, key, type Cell } from "../../concepts/50-searching-grids/steps";

export type Input = { grid: string };
export const example: Input = { grid: "1 2 2 3 5 / 3 2 3 4 4 / 2 4 5 3 1 / 6 7 1 4 5" };
export const fields: InputField[] = [{ key: "grid", label: "heights (rows split by /)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const g = parseGrid(raw.grid), e = gridError(g, 4, 5);
  if (e) return { error: e };
  if (g.flat().some((v) => v < 0 || v > 9)) return { error: "Use heights from 0 to 9." };
  return { input: { grid: gridText(g) } };
}
const both = (p: Set<string>, a: Set<string>) => [...p].filter((k) => a.has(k));
const answerText = (cells: string[]) => cells.map((k) => `(${k.replace(",", ", ")})`).join(" ");

const fromEveryCell: Approach<Input> = {
  id: "everyCell",
  name: "From every cell, follow the water downhill",
  code: `function pacificAtlantic(heights)
    result ← empty list
    for each cell (r, c)
        reach ← cells water from (r, c) flows to
        if reach touches the top or left edge
            and it touches the bottom or right edge
            result.push((r, c))
    return result
`,
  run({ grid }, t) {
    const g = parseGrid(grid), R = g.length, C = g[0].length, res: string[] = [];
    t.step({ line: 2, array: [], board: { rows: g, labels: true }, vars: {},
      message: `Water flows from a cell to a neighbour that's no higher. The Pacific touches the top and left edges, the Atlantic the bottom and right. For every cell, search where its water can flow, and check whether that reaches both.` });
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const seen = new Set([key(r, c)]), st: Cell[] = [[r, c]];
      let pac = false, atl = false;
      while (st.length) {
        const [a, b] = st.pop()!;
        if (a === 0 || b === 0) pac = true;
        if (a === R - 1 || b === C - 1) atl = true;
        for (const [dr, dc] of DIRS4) { t.op(); const x = a + dr, y = b + dc; if (x < 0 || y < 0 || x >= R || y >= C || seen.has(key(x, y)) || g[x][y] > g[a][b]) continue; seen.add(key(x, y)); st.push([x, y]); }
      }
      if (pac && atl) res.push(key(r, c));
      t.step({ line: pac && atl ? 7 : 4, array: [], board: { rows: g, labels: true, tones: { ...Object.fromEntries([...seen].map((k) => [k, "compare" as Tone])), ...Object.fromEntries(res.map((k) => [k, "found" as Tone])), [key(r, c)]: pac && atl ? "found" : "active" } }, vars: { r, c, found: res.length },
        message: `From (${r}, ${c}) the water reaches ${seen.size} cell${seen.size === 1 ? "" : "s"}: ${pac ? "the Pacific" : "not the Pacific"} and ${atl ? "the Atlantic" : "not the Atlantic"}.${pac && atl ? " Keep it." : ""}` });
    }
    t.step({ line: 8, array: [], board: { rows: g, labels: true, tones: Object.fromEntries(res.map((k) => [k, "found" as Tone])) }, vars: { answer: answerText(res) }, done: "found",
      message: `${res.length} cell${res.length === 1 ? "" : "s"} reach both oceans. But each of the m · n cells ran its own search over up to m · n cells: O((m · n)²).` });
  },
};

const reverse: Approach<Input> = {
  id: "reverse",
  name: "Search uphill from each ocean",
  code: `function pacificAtlantic(heights)
    pac ← climb(cells on the top or left edge)
    atl ← climb(cells on the bottom or right edge)
    return cells in both pac and atl
function climb(starts)  // follow water backwards
    seen ← starts
    queue ← starts
    while queue not empty
        r, c ← queue.popFront()
        for each neighbour (nr, nc) of (r, c)
            if not seen and height ≥ heights[r][c]
                seen.add((nr, nc))
                queue.push((nr, nc))
    return seen
`,
  run({ grid }, t) {
    const g = parseGrid(grid), R = g.length, C = g[0].length;
    let asked = false;
    const climb = (starts: Cell[], name: string, tone: Tone, other?: Set<string>) => {
      const seen = new Set(starts.map(([r, c]) => key(r, c)));
      let layer = starts;
      const paint = () => ({ ...(other ? Object.fromEntries([...other].map((k) => [k, "side-a" as Tone])) : {}), ...Object.fromEntries([...seen].map((k) => [k, (other?.has(k) ? "found" : tone) as Tone])) });
      t.step({ line: name === "Pacific" ? 2 : 3, array: [], board: { rows: g, labels: true, tones: paint() }, vars: { ocean: name, reached: seen.size },
        message: `Start from every cell on the ${name}'s edges: water there flows straight into the ${name}.` });
      while (layer.length) {
        const next: Cell[] = [];
        for (const [r, c] of layer) for (const [dr, dc] of DIRS4) {
          t.op();
          const x = r + dr, y = c + dc;
          if (x < 0 || y < 0 || x >= R || y >= C || seen.has(key(x, y)) || g[x][y] < g[r][c]) continue;
          seen.add(key(x, y)); next.push([x, y]);
        }
        if (!next.length) break;
        const q = !asked && name === "Pacific" ? (asked = true, { ask: { q: `Walking the water's path backwards from the ocean, when can the search step onto a neighbouring cell?`, options: ["When the neighbour is at least as high", "When the neighbour is lower", "Always"], answer: 0 } }) : {};
        t.step({ ...q, line: 12, array: [], board: { rows: g, labels: true, tones: { ...paint(), ...Object.fromEntries(next.map(([a, b]) => [key(a, b), "active" as Tone])) } }, vars: { ocean: name, reached: seen.size },
          message: `Climb to ${next.length} more cell${next.length === 1 ? "" : "s"} at least as high as a cell already reached: water from them can flow down into the ${name}.` });
        layer = next;
      }
      return seen;
    };
    const pacStarts: Cell[] = [], atlStarts: Cell[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { if (r === 0 || c === 0) pacStarts.push([r, c]); if (r === R - 1 || c === C - 1) atlStarts.push([r, c]); }
    t.step({ line: 1, array: [], board: { rows: g, labels: true }, vars: {},
      message: `Instead of following water down from every cell, start from the oceans and walk the water's path backwards: uphill, onto neighbours at least as high. One search per ocean finds every cell that drains into it.` });
    const pac = climb(pacStarts, "Pacific", "side-a");
    const atl = climb(atlStarts, "Atlantic", "side-b", pac);
    const res = both(pac, atl);
    t.step({ line: 4, array: [], board: { rows: g, labels: true, tones: Object.fromEntries(res.map((k) => [k, "found" as Tone])) }, vars: { answer: answerText(res) }, done: "found",
      message: `Cells reached by both searches drain into both oceans: ${res.length} of them. Each search visits each cell once: O(m · n).` });
  },
};

export const approaches = { everyCell: fromEveryCell, reverse };

/** A flat n × n grid: water flows everywhere, so every forward search covers the whole grid. */
export const growth = measureGrowth(
  [{ approach: fromEveryCell, slot: 1 }, { approach: reverse, slot: 3 }],
  (n) => ({ grid: gridText(Array.from({ length: n }, () => Array(n).fill(1))) }),
  [2, 3, 4, 5, 6],
);
