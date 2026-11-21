import { measureGrowth, type Approach, type GraphData, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { UnionFind, pathText, unionSteps } from "../../concepts/43-union-find/steps";

export type Input = { eqs: string };
export const example: Input = { eqs: "a==b, c==d, b!=c, d==a" };
export const fields: InputField[] = [{ key: "eqs", label: "equations (a==b, b!=c, …)", kind: "text" }];
type Eq = { x: string; y: string; same: boolean };
export const parseEqs = (s: string): Eq[] => [...s.matchAll(/([a-z])\s*(==|!=)\s*([a-z])/g)].map((m) => ({ x: m[1], y: m[3], same: m[2] === "==" }));
export function prepare(raw: Input): Prepared<Input> {
  const e = parseEqs(raw.eqs.toLowerCase());
  const parts = raw.eqs.split(",").map((x) => x.trim()).filter(Boolean);
  if (!e.length || e.length !== parts.length) return { error: 'Write equations like "a==b, b!=c", separated by commas.' };
  if (e.length > 7) return { error: "Use at most 7 equations." };
  if (new Set(e.flatMap((q) => [q.x, q.y])).size > 7) return { error: "Use at most 7 different letters so the drawing fits." };
  return { input: { eqs: e.map((q) => `${q.x}${q.same ? "==" : "!="}${q.y}`).join(", ") } };
}
const lettersOf = (e: Eq[]) => [...new Set(e.flatMap((q) => [q.x, q.y]))].sort();

const searchEach: Approach<Input> = {
  id: "search",
  name: "Search the graph for each !=",
  code: `function equationsPossible(equations)
    graph ← an edge for every "x==y"
    for each "x!=y" in equations
        if y can be reached from x in graph
            return false
    return true
`,
  run({ eqs }, t) {
    const e = parseEqs(eqs), L = lettersOf(e), adj = new Map<string, string[]>(L.map((c) => [c, []]));
    for (const q of e) if (q.same) { adj.get(q.x)!.push(q.y); adj.get(q.y)!.push(q.x); }
    const graph = (tones: Record<string, Tone> = {}): GraphData[] => [{
      nodes: L.map((c) => ({ id: c, label: c })), edges: e.filter((q) => q.same && q.x !== q.y).map((q) => ({ a: q.x, b: q.y })), tones,
    }];
    t.step({ line: 2, array: [], graphs: graph(), vars: {},
      message: `Draw an edge for every "==": letters joined by a path must all be equal. Then each "x!=y" fails if x and y are joined.` });
    let asked = false;
    for (const q of e.filter((z) => !z.same)) {
      const seen = new Set([q.x]), stack = [q.x];
      while (stack.length) { const a = stack.pop()!; for (const b of adj.get(a)!) { t.op(); if (!seen.has(b)) { seen.add(b); stack.push(b); } } }
      t.op();
      const clash = seen.has(q.y);
      const ask = !asked ? (asked = true, { ask: { q: `${q.x}!=${q.y}: can ${q.y} be reached from ${q.x} using the == edges?`, options: ["Yes: they must be equal, so it's impossible", "No: they can differ"], answer: clash ? 0 : 1 } }) : {};
      const tones = Object.fromEntries([...seen].map((c) => [c, "visited" as Tone]));
      if (clash) {
        t.step({ ...ask, line: 5, array: [], graphs: graph({ ...tones, [q.x]: "miss", [q.y]: "miss" }), vars: { check: `${q.x}!=${q.y}` }, done: "notfound",
          message: `From ${q.x} the == edges reach ${[...seen].sort().join(", ")}, including ${q.y}. So ${q.x} must equal ${q.y}, but the equation says they differ. Return false.` });
        return;
      }
      t.step({ ...ask, line: 4, array: [], graphs: graph({ ...tones, [q.x]: "compare", [q.y]: "found" }), vars: { check: `${q.x}!=${q.y}` },
        message: `From ${q.x} the search reaches only ${[...seen].sort().join(", ")}, not ${q.y}. ${q.x}!=${q.y} is fine.` });
    }
    t.step({ line: 6, array: [], graphs: graph(), vars: {}, done: "found",
      message: `Every != pair can differ: return true. But each != ran its own search, O(letters + equations) each: O(n²) for n equations in the worst case.` });
  },
};

const withUnion: Approach<Input> = {
  id: "unionFind",
  name: "Union-find: join the ==, then check the !=",
  code: `function equationsPossible(equations)
    for each "x==y" in equations
        union(x, y)
    for each "x!=y" in equations
        if find(x) = find(y)
            return false
    return true
`,
  run({ eqs }, t) {
    const e = parseEqs(eqs), L = lettersOf(e), idx = new Map(L.map((c, i) => [c, i]));
    const uf = new UnionFind(L.length, true, true, L);
    t.step({ line: 2, array: [], trees: uf.view(), grid: uf.panel(), vars: {},
      message: `Each "==" says two letters belong to the same group: union them first. Afterwards, a "!=" between letters in one group is impossible.` });
    let k = 0;
    for (const q of e.filter((z) => z.same)) unionSteps(uf, idx.get(q.x)!, idx.get(q.y)!, t, { find: 3, same: 3, link: 3 }, () => ({}), k++ === 1, ["x", "y"]);
    let asked = false;
    for (const q of e.filter((z) => !z.same)) {
      t.op();
      const a = idx.get(q.x)!, b = idx.get(q.y)!, fa = uf.find(a), fb = uf.find(b), clash = fa.root === fb.root;
      const ask = !asked ? (asked = true, { ask: { q: `${q.x}!=${q.y}: find(${q.x}) is ${L[fa.root]} and find(${q.y}) is ${L[fb.root]}. Is that a contradiction?`, options: ["Yes: same root, so they must be equal", "No: different groups can differ"], answer: clash ? 0 : 1 } }) : {};
      t.step({ ...ask, line: clash ? 6 : 5, array: [], trees: uf.view({ [a]: clash ? "miss" : "compare", [b]: clash ? "miss" : "compare", [fa.root]: clash ? "miss" : "active", [fb.root]: clash ? "miss" : "active" }), grid: uf.panel(), vars: { check: `${q.x}!=${q.y}`, "find(x)": L[fa.root], "find(y)": L[fb.root] },
        ...(clash ? { done: "notfound" as const } : {}),
        message: clash
          ? `${pathText(uf, fa.path)} and ${pathText(uf, fb.path)}: both reach root ${L[fa.root]}, so ${q.x} and ${q.y} must be equal. The != can't hold: return false.`
          : `${q.x} is in ${L[fa.root]}'s group and ${q.y} in ${L[fb.root]}'s: they can differ.` });
      if (clash) return;
    }
    t.step({ line: 7, array: [], trees: uf.view(), grid: uf.panel(), vars: {}, done: "found",
      message: `No != joins two letters of the same group: return true. One union per == and two finds per !=, each almost O(1): O(n).` });
  },
};

export const approaches = { search: searchEach, unionFind: withUnion };

/** A chain a==b==c… of equations, then that many != checks between letters at the far ends. */
const letter = (i: number) => String.fromCharCode(97 + (i % 26));
export const growth = measureGrowth(
  [{ approach: searchEach, slot: 1 }, { approach: withUnion, slot: 3 }],
  (n) => ({ eqs: [...Array.from({ length: n }, (_, i) => `${letter(i)}==${letter(i + 1)}`), ...Array.from({ length: n }, () => `a!=z`)].join(", ") }),
  [2, 4, 8, 12, 16],
);
