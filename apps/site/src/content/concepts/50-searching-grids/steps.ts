import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ grid: string }>["run"]>[1];
export type Cell = [number, number];
export const key = (r: number, c: number) => `${r},${c}`;
export const DIRS4: Cell[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
export const DIRS8: Cell[] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

/** A grid typed as rows of characters split by "/" or spaces: "S.#/..." */
export const parseCharGrid = (s: string) => s.split(/[\s/]+/).filter(Boolean).map((r) => [...r]);
export function charGridError(g: string[][], allowed: string, maxR = 5, maxC = 6): string | null {
  if (!g.length) return "Type at least one row.";
  if (g.some((r) => r.length !== g[0].length)) return "Every row must be the same length.";
  if (g.length > maxR || g[0].length > maxC) return `Use at most ${maxR} rows of ${maxC} so the grid fits.`;
  if (g.flat().some((ch) => !allowed.includes(ch))) return `Use only these characters: ${[...allowed].join(" ")}.`;
  return null;
}

/**
 * Breadth-first search from several starting cells at once, drawn one layer (one distance) per step.
 * Returns each reached cell's distance. Shared with LC 994, 1091 and 417.
 */
export function bfsLayers(o: {
  t: T;
  rows: (string | number)[][];
  sources: Cell[];
  open: (r: number, c: number) => boolean;
  dirs?: Cell[];
  line: number;
  /** What to write in a reached cell; by default its distance. */
  mark?: (d: number, r: number, c: number) => string | number;
  layerMsg: (d: number, cells: Cell[]) => string;
  stopAt?: Cell;
  ask?: boolean;
}) {
  const { t, sources, dirs = DIRS4 } = o, R = o.rows.length, C = o.rows[0].length;
  const view = o.rows.map((r) => [...r]);
  const dist = new Map<string, number>(), tones: Record<string, Tone> = {};
  let layer: Cell[] = [];
  for (const [r, c] of sources) if (!dist.has(key(r, c))) { dist.set(key(r, c), 0); layer.push([r, c]); view[r][c] = o.mark ? o.mark(0, r, c) : 0; }
  let d = 0, asked = !o.ask;
  while (layer.length) {
    for (const [r, c] of layer) tones[key(r, c)] = "found";
    const reachedStop = o.stopAt && dist.has(key(...o.stopAt));
    const q = !asked && d === 1 ? (asked = true, { ask: { q: `${layer.length} cell${layer.length === 1 ? " is" : "s are"} reached at step 1. When are their own neighbours reached?`, options: ["At step 2, all together", "Right now, one at a time", "Only after the whole grid is checked"], answer: 0 } }) : {};
    t.step({ ...q, line: o.line, array: [], board: { rows: view.map((r) => [...r]), labels: true, tones: { ...tones } }, vars: { distance: d, reached: dist.size }, message: o.layerMsg(d, layer) });
    for (const [r, c] of layer) tones[key(r, c)] = "visited";
    if (reachedStop) break;
    const next: Cell[] = [];
    for (const [r, c] of layer) for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      t.op();
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || dist.has(key(nr, nc)) || !o.open(nr, nc)) continue;
      dist.set(key(nr, nc), d + 1);
      view[nr][nc] = o.mark ? o.mark(d + 1, nr, nc) : d + 1;
      next.push([nr, nc]);
    }
    layer = next; d++;
  }
  return { dist, view, tones };
}

/** Depth-first flood fill from one cell, one step per cell added. Returns the cells. Shared with LC 695. */
export function floodSteps(o: { t: T; rows: (string | number)[][]; start: Cell; open: (r: number, c: number) => boolean; seen: Set<string>; base: Record<string, Tone>; line: number; label: string }) {
  const { t, rows, seen } = o, R = rows.length, C = rows[0].length, stack: Cell[] = [o.start], got: Cell[] = [];
  seen.add(key(...o.start));
  while (stack.length) {
    const [r, c] = stack.pop()!;
    got.push([r, c]);
    t.op();
    const tones = { ...o.base, ...Object.fromEntries(got.map(([a, b]) => [key(a, b), "settled" as Tone])), [key(r, c)]: "active" as Tone };
    t.step({ line: o.line, array: [], board: { rows, labels: true, tones }, stack: stack.map(([a, b]) => `(${a}, ${b})`), stackTitle: "cells to visit", vars: { [o.label]: got.length },
      message: `Visit (${r}, ${c}): the ${o.label} is now ${got.length}. Push its unvisited land neighbours to visit next.` });
    for (const [dr, dc] of DIRS4) {
      const nr = r + dr, nc = c + dc;
      t.op();
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen.has(key(nr, nc)) || !o.open(nr, nc)) continue;
      seen.add(key(nr, nc)); stack.push([nr, nc]);
    }
  }
  return got;
}

/* ---------- The read's animations ---------- */
export type GridInput = { grid: string };
export const layersExample: GridInput = { grid: "S..#. ..#.. ....S #.#.. ....." };
export const layersFields: InputField[] = [{ key: "grid", label: "grid (S start, . open, # wall)", kind: "text" }];
export function layersPrepare(raw: GridInput): Prepared<GridInput> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "S.#");
  if (e) return { error: e };
  if (!g.flat().includes("S")) return { error: "Mark at least one start with S." };
  return { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
const layers: Approach<GridInput> = {
  id: "layers",
  name: "BFS from every start at once",
  code: `function distances(grid)  // from the nearest S
    queue ← every S cell, at distance 0
    while queue not empty
        r, c ← queue.popFront()
        for each neighbour (nr, nc) of (r, c)
            if (nr, nc) is open and not reached
                dist[nr][nc] ← dist[r][c] + 1
                queue.push((nr, nc))
    return dist
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid), sources: Cell[] = [];
    g.forEach((row, r) => row.forEach((ch, c) => { if (ch === "S") sources.push([r, c]); }));
    const base = g.map((row) => row.map((ch) => (ch === "#" ? "#" : "")));
    const walls = Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), ch === "#" ? "discard" : ""])).filter(([, v]) => v)) as Record<string, Tone>;
    t.step({ line: 2, array: [], board: { rows: base, labels: true, tones: walls }, vars: {},
      message: `How far is every open cell from the nearest start? Put all ${sources.length} starts in the queue first, at distance 0. BFS then spreads from all of them together, one ring at a time, so each cell is first reached from its nearest start.` });
    const { dist } = bfsLayers({ t, rows: base, sources, open: (r, c) => g[r][c] !== "#", line: 7, ask: true,
      layerMsg: (d, cells) => d === 0 ? `Distance 0: the ${cells.length} start${cells.length === 1 ? "" : "s"}.` : `Distance ${d}: ${cells.length} cell${cells.length === 1 ? "" : "s"}, each one step from a cell at distance ${d - 1}.` });
    const open = g.flat().filter((ch) => ch !== "#").length;
    t.step({ line: 9, array: [], board: { rows: g.map((row, r) => row.map((ch, c) => (ch === "#" ? "#" : dist.has(key(r, c)) ? dist.get(key(r, c))! : "∞"))), labels: true, tones: walls }, vars: { reached: dist.size, open }, done: "found",
      message: `Done. ${dist.size} of ${open} open cells were reached${dist.size < open ? "; the rest (∞) are walled off" : ""}. Every cell entered the queue once and checked 4 neighbours: O(rows · columns), however many starts there are.` });
  },
};

export type AreaInput = { grid: string };
export const areaExample: AreaInput = { grid: "11000 10011 00011 11000" };
export const areaFields: InputField[] = [{ key: "grid", label: "grid (1 land, 0 water)", kind: "text" }];
export function areaPrepare(raw: AreaInput): Prepared<AreaInput> {
  const g = parseCharGrid(raw.grid), e = charGridError(g, "01");
  return e ? { error: e } : { input: { grid: g.map((r) => r.join("")).join(" ") } };
}
const area: Approach<AreaInput> = {
  id: "area",
  name: "Flood-fill one island",
  code: `function area(grid, r, c)  // the island at (r, c)
    stack ← [(r, c)]
    mark (r, c) seen
    size ← 0
    while stack not empty
        r, c ← stack.pop()
        size += 1
        for each neighbour (nr, nc) of (r, c)
            if (nr, nc) is land and not seen
                mark (nr, nc) seen
                stack.push((nr, nc))
    return size
`,
  run({ grid }, t) {
    const g = parseCharGrid(grid);
    const base: Record<string, Tone> = Object.fromEntries(g.flatMap((row, r) => row.map((ch, c) => [key(r, c), (ch === "0" ? "discard" : "visited") as Tone])));
    let start: Cell | null = null;
    g.forEach((row, r) => row.forEach((ch, c) => { if (!start && ch === "1") start = [r, c]; }));
    if (!start) { t.step({ line: 12, array: [], board: { rows: g, labels: true, tones: base }, vars: { size: 0 }, done: "notfound", message: `There's no land at all.` }); return; }
    const s = start as Cell;
    t.step({ line: 2, array: [], board: { rows: g, labels: true, tones: base }, vars: {},
      message: `Measure the island containing (${s[0]}, ${s[1]}): visit it, then every land cell joined to it up, down, left or right. A stack holds cells waiting to be visited, and "seen" stops any cell being counted twice.` });
    const got = floodSteps({ t, rows: g, start: s, open: (r, c) => g[r][c] === "1", seen: new Set(), base, line: 7, label: "size" });
    t.step({ line: 12, array: [], board: { rows: g, labels: true, tones: { ...base, ...Object.fromEntries(got.map(([a, b]) => [key(a, b), "found" as Tone])) } }, vars: { size: got.length }, done: "found",
      message: `The island has ${got.length} cell${got.length === 1 ? "" : "s"}. Each was pushed once and checked its 4 neighbours: O(size of the island).` });
  },
};

export const layersApproaches = { layers };
export const areaApproaches = { area };
