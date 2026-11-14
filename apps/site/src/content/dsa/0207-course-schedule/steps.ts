import type { Approach, GraphData, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** prereqs as flat pairs (a, b): to take course a, first take course b. */
export type Input = { n: number; prereqs: number[] };

export const example: Input = { n: 6, prereqs: [2, 0, 2, 1, 3, 2, 4, 2, 5, 3, 5, 4] };

export const fields: InputField[] = [
  { key: "n", label: "courses n", kind: "number" },
  { key: "prereqs", label: "prereqs (a, b: b first)", kind: "numbers" },
];

export function prepare(raw: Input): Prepared<Input> {
  const { n, prereqs: p } = raw;
  if (!Number.isInteger(n) || n < 1 || n > 8) return { error: "Use 1 to 8 courses so the graph fits." };
  if (p.length % 2) return { error: "Prerequisites come in pairs: a, b means b before a." };
  if (p.length > 24) return { error: "Use at most 12 prerequisites." };
  if (p.some((v) => !Number.isInteger(v) || v < 0 || v >= n)) return { error: `Courses are numbered 0 to ${n - 1}.` };
  const seen = new Set<string>();
  for (let i = 0; i < p.length; i += 2) {
    if (p[i] === p[i + 1]) return { error: `Course ${p[i]} can't be its own prerequisite here.` };
    if (seen.has(`${p[i]},${p[i + 1]}`)) return { error: `The pair ${p[i]}, ${p[i + 1]} is listed twice.` };
    seen.add(`${p[i]},${p[i + 1]}`);
  }
  return { input: raw };
}

const pairs = (flat: number[]) => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]] as const);

/** Edges b → a ("b before a"), adjacency lists and a drawing helper. */
function setup({ n, prereqs }: Input) {
  const after: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of pairs(prereqs)) after[b].push(a);
  const nodes = Array.from({ length: n }, (_, i) => ({ id: String(i), label: i }));
  const edges = pairs(prereqs).map(([a, b]) => ({ a: String(b), b: String(a) }));
  const draw = (tones: Record<number, Tone>, notes: Record<number, string>, edgeTones: Record<string, Tone> = {}, at?: number): GraphData[] =>
    [{ nodes, edges, directed: true, tones, notes, edgeTones, pointers: at === undefined ? {} : { now: String(at) } }];
  return { after, draw };
}

const kahn: Approach<Input> = {
  id: "kahn",
  name: "Take what's ready (Kahn's algorithm)",
  code: `// queue: join at back, leave from front
function canFinish(n, prereqs)
    after ← n empty lists
    indeg ← array of n, all 0  // prereqs left
    for each (a, b) in prereqs
        after[b].push(a); indeg[a] += 1
    ready ← queue of every i with indeg[i] = 0
    taken ← 0
    while ready not empty
        b ← ready.popFront()
        taken += 1
        for each a in after[b]
            indeg[a] -= 1  // one prerequisite done
            if indeg[a] = 0
                ready.push(a)
    return taken = n
`,
  run(input, t) {
    const { n } = input;
    const G = setup(input);
    const indeg = Array(n).fill(0);
    for (const [a] of pairs(input.prereqs)) { t.op(); indeg[a]++; }
    const ready: number[] = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) ready.push(i);
    const taken: number[] = [];
    const usedEdges: Record<string, Tone> = {};
    const notes = () => Object.fromEntries(indeg.map((d, i) => [i, taken.includes(i) ? `#${taken.indexOf(i) + 1}` : `needs ${d}`]));
    const tones = (extra: Record<number, Tone> = {}) => {
      const out: Record<number, Tone> = {};
      for (const r of ready) out[r] = "side-b";
      for (const k of taken) out[k] = "settled";
      return { ...out, ...extra };
    };
    const panel = () => ({ stack: [...ready].reverse().map((r) => `course ${r}`), stackTitle: "Ready, front first" });
    t.step({ line: 7, array: [], graphs: G.draw(tones(), notes(), usedEdges), ...panel(), vars: { taken: 0, of: n },
      message: `An arrow b → a means "take b before a". Count each course's prerequisites (under each node). Courses that need nothing, ${ready.length ? ready.join(", ") : "none"}, are ready to take now.` });
    while (ready.length) {
      const ask = ready.length > 1 ? { q: `Ready: ${ready.join(", ")}. Which course is taken next?`, options: [`${ready[0]}, the first one ready`, `${ready[ready.length - 1]}, the last one ready`], answer: 0 } : undefined;
      const b = ready.shift()!;
      t.op();
      taken.push(b);
      const unlocked: number[] = [];
      const fresh: Record<string, Tone> = {};
      for (const a of G.after[b]) {
        t.op();
        indeg[a]--;
        fresh[`${b}>${a}`] = "active";
        usedEdges[`${b}>${a}`] = "settled";
        if (indeg[a] === 0) { ready.push(a); unlocked.push(a); }
      }
      t.step({ ...(ask ? { ask } : {}), line: G.after[b].length ? 13 : 11, array: [], graphs: G.draw(tones({ [b]: "found" }), notes(), { ...usedEdges, ...fresh }, b), ...panel(), vars: { taken: taken.length, of: n },
        message: `Take course ${b} (#${taken.length}). ${G.after[b].length ? `It was a prerequisite of ${G.after[b].join(", ")}: one fewer each.` : "Nothing depends on it."}${unlocked.length ? ` Now ready: ${unlocked.join(", ")}.` : ""}` });
    }
    const ok = taken.length === n;
    const stuck = Array.from({ length: n }, (_, i) => i).filter((i) => !taken.includes(i));
    t.step({ line: 16, array: [], graphs: G.draw(tones(Object.fromEntries(stuck.map((s) => [s, "miss" as Tone]))), notes(), usedEdges), ...panel(), vars: { taken: taken.length, of: n }, done: ok ? "found" : "notfound",
      message: ok ? `All ${n} courses taken, in the order shown: a valid plan exists. Return true. Each course and each prerequisite is handled once: O(V + E).`
        : `Stuck after ${taken.length}: courses ${stuck.join(", ")} still wait on each other. They form a cycle, so they can never be taken. Return false.` });
  },
};

const dfs: Approach<Input> = {
  id: "dfs",
  name: "Depth-first cycle check (three states)",
  code: `function canFinish(n, prereqs)
    after ← n empty lists
    for each (a, b) in prereqs
        after[b].push(a)  // b comes before a
    state ← n zeros  // 0 new, 1 open, 2 done
    function hasCycle(b)
        if state[b] = 1
            return true  // back on our own path
        if state[b] = 2
            return false  // checked already
        state[b] ← 1
        for each a in after[b]
            if hasCycle(a)
                return true
        state[b] ← 2
        return false
    return no i in 0 to n - 1 has hasCycle(i)
`,
  run(input, t) {
    const { n } = input;
    const G = setup(input);
    const state = Array(n).fill(0);
    const path: number[] = [];
    const edgeT: Record<string, Tone> = {};
    const tones = (extra: Record<number, Tone> = {}) => {
      const out: Record<number, Tone> = {};
      state.forEach((s, i) => { if (s === 1) out[i] = "side-a"; else if (s === 2) out[i] = "settled"; });
      return { ...out, ...extra };
    };
    const notes = () => Object.fromEntries(state.map((s, i) => [i, s === 0 ? "" : s === 1 ? "on path" : "done"]).filter(([, v]) => v));
    const panel = () => ({ stack: path.map((p) => `has_cycle(${p})`) });
    t.step({ line: 5, array: [], graphs: G.draw(tones(), notes()), ...panel(), vars: { },
      message: "A plan exists exactly when the arrows have no cycle. Walk forward from each course depth-first. Mark a course \"on path\" while exploring after it, and \"done\" once everything after it is cycle-free. Reaching an \"on path\" course again means a cycle." });
    let cycle = false;
    const go = (b: number, from?: number): boolean => {
      t.op();
      if (state[b] === 1) {
        if (from !== undefined) edgeT[`${from}>${b}`] = "miss";
        t.step({ ask: { q: `From ${from}, the arrow leads to ${b}, which is still on the current path. What does that mean?`, options: ["A cycle: return true", "Already checked: skip it"], answer: 0 },
          line: 8, array: [], graphs: G.draw(tones({ [b]: "miss" }), notes(), edgeT, b), ...panel(), vars: { course: b },
          message: `${b} is already on the current path (${[...path, b].join(" → ")}): the arrows loop back. A cycle, so these courses can never all be taken.` });
        return true;
      }
      if (state[b] === 2) {
        if (from !== undefined) {
          edgeT[`${from}>${b}`] = "visited";
          t.step({ ask: { q: `From ${from}, the arrow leads to ${b}, which is already done. What does that mean?`, options: ["Already checked: skip it", "A cycle: return true"], answer: 0 },
            line: 10, array: [], graphs: G.draw(tones({ [b]: "compare" }), notes(), edgeT, b), ...panel(), vars: { course: b },
            message: `${b} is done: everything after it was already checked and has no cycle. Skip it.` });
        }
        return false;
      }
      state[b] = 1;
      path.push(b);
      if (from !== undefined) edgeT[`${from}>${b}`] = "active";
      t.step({ line: 11, array: [], graphs: G.draw(tones({ [b]: "active" }), notes(), edgeT, b), ...panel(), vars: { course: b },
        message: `Visit ${b}: mark it on the path.${G.after[b].length ? ` Courses after it: ${G.after[b].join(", ")}.` : " Nothing comes after it."}` });
      for (const a of G.after[b]) if (go(a, b)) return true;
      state[b] = 2;
      path.pop();
      if (from !== undefined) edgeT[`${from}>${b}`] = "settled";
      t.step({ line: 15, array: [], graphs: G.draw(tones({ [b]: "found" }), notes(), edgeT, b), ...panel(), vars: { course: b },
        message: `Everything after ${b} is cycle-free: mark ${b} done.` });
      return false;
    };
    for (let i = 0; i < n && !cycle; i++) { if (state[i] === 2) { t.op(); continue; } cycle = go(i); }
    t.step({ line: 17, array: [], graphs: G.draw(tones(), notes(), edgeT), ...panel(), vars: {}, done: cycle ? "notfound" : "found",
      message: cycle ? "A cycle was found: return false." : `Every course is done and no cycle was found: return true. Each course is visited once and each arrow followed once: O(V + E).` });
  },
};

export const approaches = { kahn, dfs };
