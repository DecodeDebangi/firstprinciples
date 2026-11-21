import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { UnionFind, parseLinks, unionSteps } from "../../concepts/43-union-find/steps";
import { graphOf } from "../0547-number-of-provinces/steps";

export type Input = { n: number; links: string };
export const example: Input = { n: 7, links: "0-1, 0-2, 1-2, 3-4, 3-5, 4-5" };
export const fields: InputField[] = [
  { key: "n", label: "computers n", kind: "number" },
  { key: "links", label: "cables (0-1, …)", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.n < 1 || raw.n > 7) return { error: "Use 1 to 7 computers so the drawing fits." };
  const l = parseLinks(raw.links);
  if (l.some(([a, b]) => a >= raw.n || b >= raw.n || a === b)) return { error: `Computers are numbered 0 to ${raw.n - 1}, and a cable joins two different ones.` };
  if (l.length > 10) return { error: "Use at most 10 cables." };
  return { input: { n: raw.n, links: l.map(([a, b]) => `${a}-${b}`).join(", ") } };
}

const dfsGroups: Approach<Input> = {
  id: "dfs",
  name: "Count groups with depth-first search",
  code: `function makeConnected(n, connections)
    if length(connections) < n - 1
        return -1  // not enough cables
    groups ← 0
    for each computer c not yet visited
        groups += 1
        visit everything reachable from c  // DFS
    return groups - 1
`,
  run({ n, links }, t) {
    const l = parseLinks(links);
    t.op();
    if (l.length < n - 1) {
      t.step({ line: 3, array: [], graphs: graphOf(n, links), vars: { cables: l.length, needed: n - 1 }, done: "notfound",
        message: `Connecting ${n} computers needs at least ${n - 1} cables, and there are only ${l.length}. Return -1.` });
      return;
    }
    const adj = new Map<number, number[]>(Array.from({ length: n }, (_, i) => [i, []]));
    for (const [a, b] of l) { adj.get(a)!.push(b); adj.get(b)!.push(a); }
    const seen = Array(n).fill(false), notes: Record<number, string> = {};
    let groups = 0, asked = false;
    t.step({ line: 4, array: [], graphs: graphOf(n, links), vars: { cables: l.length, needed: n - 1 },
      message: `${l.length} cables, and ${n - 1} are enough to connect ${n} computers, so it's possible. Each move joins two groups, so the answer is the number of groups minus one. Count them.` });
    for (let c = 0; c < n; c++) {
      t.op();
      if (seen[c]) continue;
      groups++;
      const stack = [c]; seen[c] = true;
      while (stack.length) { const x = stack.pop()!; notes[x] = `G${groups}`; for (const y of adj.get(x)!) { t.op(); if (!seen[y]) { seen[y] = true; stack.push(y); } } }
      const q = !asked && groups > 1 ? (asked = true, { ask: { q: `Computer ${c} wasn't reached by earlier searches. What does that mean?`, options: ["It starts a new group", "It's in the first group", "It has no cables"], answer: 0 } }) : {};
      const tones = Object.fromEntries(Object.entries(notes).map(([k, g]) => [k, (g === `G${groups}` ? "found" : "settled") as Tone]));
      t.step({ ...q, line: 7, array: [], graphs: graphOf(n, links, tones, notes), vars: { groups },
        message: `Computer ${c} starts group ${groups}; the search reaches ${Object.entries(notes).filter(([, g]) => g === `G${groups}`).map(([k]) => k).join(", ")}.` });
    }
    t.step({ line: 8, array: [], graphs: graphOf(n, links, {}, notes), vars: { groups, moves: groups - 1 }, done: "found",
      message: `${groups} group${groups === 1 ? "" : "s"}: ${groups - 1} move${groups === 2 ? "" : "s"} join them into one network. Spare cables always exist, because there are enough cables in total. O(n + m) for n computers and m cables.` });
  },
};

const ufGroups: Approach<Input> = {
  id: "unionFind",
  name: "Count groups with union-find",
  code: `function makeConnected(n, connections)
    if length(connections) < n - 1
        return -1  // not enough cables
    groups ← n
    for each a, b in connections
        if union(a, b)  // joined two groups
            groups -= 1
    return groups - 1
`,
  run({ n, links }, t) {
    const l = parseLinks(links), uf = new UnionFind(n, true, true);
    t.op();
    if (l.length < n - 1) {
      t.step({ line: 3, array: [], trees: uf.view(), grid: uf.panel(), vars: { cables: l.length, needed: n - 1 }, done: "notfound",
        message: `Connecting ${n} computers needs at least ${n - 1} cables, and there are only ${l.length}. Return -1.` });
      return;
    }
    t.step({ line: 4, array: [], trees: uf.view(), grid: uf.panel(), vars: { groups: n },
      message: `Enough cables. Start with every computer as its own group, and merge groups cable by cable. A cable between two computers already in one group is spare: it can be moved.` });
    let spare = 0;
    l.forEach(([a, b], k) => { if (!unionSteps(uf, a, b, t, { find: 6, same: 6, link: 7 }, () => ({}), k === 2)) spare++; });
    const g = uf.groups();
    t.step({ line: 8, array: [], trees: uf.view(), grid: uf.panel(), vars: { groups: g, spare, moves: g - 1 }, done: "found",
      message: `${g} group${g === 1 ? "" : "s"} and ${spare} spare cable${spare === 1 ? "" : "s"}: moving ${g - 1} of them joins everything. O(n + m), with each union almost O(1).` });
  },
};

export const approaches = { dfs: dfsGroups, unionFind: ufGroups };
