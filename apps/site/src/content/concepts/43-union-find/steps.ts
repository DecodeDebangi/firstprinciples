import type { Approach, ArrayStep, InputField, Prepared, Tone, TreeData } from "@firstprinciples/ui";

type T = Parameters<Approach<{ n: number }>["run"]>[1];

/** Union-find over items 0 … n − 1, drawn as a forest. `bySize` and `compress` switch the two optimisations on. */
export class UnionFind {
  parent: number[];
  size: number[];
  constructor(public n: number, public bySize = false, public compress = false, public names?: string[]) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array(n).fill(1);
  }
  label(i: number) { return this.names ? this.names[i] : String(i); }
  /** The forest: every item is a node under its parent; roots sit side by side. */
  view(tones: Record<number, Tone> = {}): TreeData[] {
    const kids = (i: number) => this.parent.map((p, j) => (p === i && j !== i ? `u${j}` : null)).filter((x): x is string => x !== null);
    return [{
      root: null,
      roots: this.parent.map((p, i) => (p === i ? `u${i}` : null)).filter((x): x is string => x !== null),
      nodes: this.parent.map((_, i) => ({ id: `u${i}`, val: this.label(i), left: null, right: null, kids: kids(i) })),
      tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`u${i}`, tn])),
      layout: "compact",
    }];
  }
  /** The parent array (and sizes, when union by size is on) as a panel. */
  panel(hl: number[] = []): ArrayStep["grid"] {
    const rows: (number | string)[][] = [this.parent.map((p) => this.label(p))];
    const rowLabels = ["parent"];
    if (this.bySize) { rows.push(this.parent.map((p, i) => (p === i ? this.size[i] : ""))); rowLabels.push("size"); }
    return { title: "parent of each item", rows, rowLabels, colLabels: this.parent.map((_, i) => this.label(i)), dense: true, tones: Object.fromEntries(hl.map((i) => [`0,${i}`, "compare" as Tone])) };
  }
  /** Follows parents to the root; with `compress`, points every node on the way straight at the root. Silent. */
  find(x: number, t?: T): { root: number; path: number[] } {
    const path = [x];
    while (this.parent[path[path.length - 1]] !== path[path.length - 1]) { t?.op(); path.push(this.parent[path[path.length - 1]]); }
    const root = path[path.length - 1];
    if (this.compress) for (const p of path) this.parent[p] = root;
    return { root, path };
  }
  groups() { return new Set(this.parent.map((_, i) => this.findRoot(i))).size; }
  findRoot(x: number) { while (this.parent[x] !== x) x = this.parent[x]; return x; }
}

export const pathText = (uf: UnionFind, path: number[]) => path.map((p) => uf.label(p)).join(" → ");

/**
 * union(a, b) drawn as steps: the two finds, then the link. Returns false when they were already together.
 * Shared with the union-find problems.
 */
export function unionSteps(uf: UnionFind, a: number, b: number, t: T, lines: { find: number; same: number; link: number }, extra: () => Record<string, unknown> = () => ({}), ask = false, names: [string, string] = ["a", "b"]) {
  const [A, B] = names;
  t.op();
  const fa = uf.find(a, t), fb = uf.find(b, t);
  const pathTones: Record<number, Tone> = {};
  fa.path.forEach((p) => (pathTones[p] = "compare"));
  fb.path.forEach((p) => (pathTones[p] = "compare"));
  pathTones[fa.root] = "active"; pathTones[fb.root] = "active";
  const compressed = uf.compress && (fa.path.length > 2 || fb.path.length > 2);
  const L = (i: number) => uf.label(i);
  t.step({ ...extra(), line: lines.find, array: [], trees: uf.view(pathTones), grid: uf.panel([...fa.path, ...fb.path]), vars: { [A]: L(a), [B]: L(b), [`find(${A})`]: L(fa.root), [`find(${B})`]: L(fb.root) },
    message: `find(${L(a)}): ${pathText(uf, fa.path)}${fa.path.length === 1 ? " (its own root)" : ""}. find(${L(b)}): ${pathText(uf, fb.path)}${fb.path.length === 1 ? " (its own root)" : ""}.${compressed ? " Path compression points every item passed straight at its root, so the next find is one step." : ""}` });
  if (fa.root === fb.root) {
    t.step({ ...extra(), line: lines.same, array: [], trees: uf.view({ [fa.root]: "found" }), grid: uf.panel(), vars: { [A]: L(a), [B]: L(b), root: L(fa.root) },
      message: `Both have root ${L(fa.root)}: ${L(a)} and ${L(b)} are already in the same group. Nothing to join.` });
    return false;
  }
  let ra = fa.root, rb = fb.root;
  if (uf.bySize && uf.size[ra] < uf.size[rb]) [ra, rb] = [rb, ra];
  const q = ask ? { ask: { q: uf.bySize ? `Root ${L(fa.root)}'s group has ${uf.size[fa.root]} item${uf.size[fa.root] > 1 ? "s" : ""} and root ${L(fb.root)}'s has ${uf.size[fb.root]}. Which root goes under the other?` : `The roots are ${L(fa.root)} and ${L(fb.root)}. What does union do?`, options: uf.bySize ? [`${L(rb)} goes under ${L(ra)}`, `${L(ra)} goes under ${L(rb)}`] : [`Point root ${L(fa.root)} at root ${L(fb.root)}`, `Point ${L(a)} at ${L(b)}`, "Copy every item into one list"], answer: 0 } } : {};
  if (uf.bySize) { uf.parent[rb] = ra; uf.size[ra] += uf.size[rb]; } else { uf.parent[fa.root] = fb.root; ra = fb.root; rb = fa.root; }
  t.step({ ...extra(), ...q, line: lines.link, array: [], trees: uf.view({ [rb]: "found", [ra]: "settled" }), grid: uf.panel([rb]), vars: { [A]: L(a), [B]: L(b), groups: uf.groups() },
    message: uf.bySize
      ? `Different roots, so join the groups: the smaller tree's root ${L(rb)} now points at ${L(ra)}, whose group has ${uf.size[ra]} items. Hanging small under big keeps the trees shallow.`
      : `Different roots, so join the groups: root ${L(rb)} now points at root ${L(ra)}. Only one entry of parent changes, however big the groups are.` });
  return true;
}

/* ---------- The read's animations ---------- */
export type UfInput = { n: number; links: string };
export const parseLinks = (s: string): [number, number][] =>
  [...s.matchAll(/(\d+)\s*-\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
export const ufFields: InputField[] = [
  { key: "n", label: "items n", kind: "number" },
  { key: "links", label: "unions (like 0-1, 2-3)", kind: "text" },
];
export function ufPrepare(raw: UfInput): Prepared<UfInput> {
  if (raw.n < 2 || raw.n > 7) return { error: "Use 2 to 7 items so the forest fits." };
  const l = parseLinks(raw.links);
  if (!l.length) return { error: 'Give unions like "0-1, 2-3".' };
  if (l.length > 7) return { error: "Use at most 7 unions." };
  if (l.some(([a, b]) => a >= raw.n || b >= raw.n)) return { error: `Items are numbered 0 to ${raw.n - 1}.` };
  return { input: { n: raw.n, links: l.map(([a, b]) => `${a}-${b}`).join(", ") } };
}
export const basicExample: UfInput = { n: 6, links: "0-1, 2-3, 1-3, 4-5, 0-2" };
export const optExample: UfInput = { n: 6, links: "0-1, 1-2, 2-3, 3-4, 0-4" };

const basicCode = `parent ← [0, 1, …, n - 1]  // all roots
function find(x)
    while parent[x] ≠ x
        x ← parent[x]
    return x
function union(a, b)
    ra, rb ← find(a), find(b)
    if ra = rb
        return  // already together
    parent[ra] ← rb
`;
const optCode = `parent ← [0, 1, …, n - 1]  // all roots
size ← array of n, all 1
function find(x)
    if parent[x] ≠ x
        parent[x] ← find(parent[x])  // compress
    return parent[x]
function union(a, b)
    ra, rb ← find(a), find(b)
    if ra = rb
        return  // already together
    if size[ra] < size[rb]
        swap ra and rb
    parent[rb] ← ra  // small under big
    size[ra] += size[rb]
`;

function runUnions({ n, links }: UfInput, t: T, opt: boolean) {
  const uf = new UnionFind(n, opt, opt);
  t.step({ line: 1, array: [], trees: uf.view(), grid: uf.panel(), vars: { groups: n },
    message: opt
      ? `The same operations with two improvements: union hangs the smaller tree under the bigger one, and find points every item it passes straight at the root.`
      : `Every item starts as its own group: its own root, parent[i] = i. A group is a tree, and its root names the group.` });
  parseLinks(links).forEach(([a, b], k) => unionSteps(uf, a, b, t, opt ? { find: 8, same: 10, link: 13 } : { find: 7, same: 9, link: 10 }, () => ({}), k === 1));
  const heights = uf.parent.map((_, i) => { let h = 0, x = i; while (uf.parent[x] !== x) { x = uf.parent[x]; h++; } return h; });
  t.step({ line: 1, array: [], trees: uf.view(), grid: uf.panel(), vars: { groups: uf.groups(), "longest find": Math.max(...heights) }, done: "found",
    message: `${uf.groups()} group${uf.groups() === 1 ? "" : "s"}. The deepest item is ${Math.max(...heights)} step${Math.max(...heights) === 1 ? "" : "s"} from its root, and a find costs that many steps.${opt ? " With both improvements the trees stay almost flat, so every operation is nearly O(1)." : " Without care, unions can build a long chain, and finds become O(n)."}` });
}

const basic: Approach<UfInput> = { id: "basic", name: "Parent pointers", code: basicCode, run(input, t) { runUnions(input, t, false); } };
const optimised: Approach<UfInput> = { id: "optimised", name: "Union by size, path compression", code: optCode, run(input, t) { runUnions(input, t, true); } };

export const basicApproaches = { basic };
export const optApproaches = { optimised };
export const plainApproaches = { basic: { ...basic, id: "chain" } as Approach<UfInput> };
