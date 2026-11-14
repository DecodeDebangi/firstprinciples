import { CallTree, measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

/** Combination sum: every way to pick numbers (reuse allowed) that add up to the target. */
export type Input = { candidates: number[]; target: number };

export const example: Input = { candidates: [2, 3, 5], target: 6 };

export const fields: InputField[] = [
  { key: "candidates", label: "candidates (distinct)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

/** Calls the unpruned search makes, to keep custom trees small enough to draw. */
function unprunedCalls(c: number[], target: number) {
  let calls = 0;
  const go = (start: number, rem: number) => { calls++; if (rem <= 0 || calls > 40) return; for (let i = start; i < c.length; i++) go(i, rem - c[i]); };
  go(0, target);
  return calls;
}

export function prepare(raw: Input): Prepared<Input> {
  const c = raw.candidates;
  if (!c.length || c.length > 4) return { error: "Use 1 to 4 candidates." };
  if (c.some((x) => !Number.isInteger(x) || x < 2)) return { error: "Candidates must be whole numbers of at least 2 (a 1 makes the tree explode)." };
  if (new Set(c).size !== c.length) return { error: "Candidates must be distinct." };
  if (!Number.isInteger(raw.target) || raw.target < 1 || raw.target > 12) return { error: "Use a target from 1 to 12." };
  if (unprunedCalls(c, raw.target) > 31) return { error: "That tree has more than 31 calls, too many to draw. Try a smaller target or bigger candidates." };
  return { input: raw };
}

const sumOf = (p: number[]) => p.reduce((a, b) => a + b, 0);
/** "2 + 3 = 5", or "Just 3" for a single pick. */
const expr = (p: number[]) => (p.length > 1 ? `${p.join(" + ")} = ${sumOf(p)}` : `Just ${p[0]}`);
const resultGrid = (r: number[][], fresh = false) => ({ title: `answers (${r.length})`, rows: [r.length ? r.map((p) => p.join("+")) : ["—"]], tones: fresh && r.length ? { [`0,${r.length - 1}`]: "found" as const } : {} });

const explore: Approach<Input> = {
  id: "explore",
  name: "Choose, explore, undo (no pruning)",
  code: `function combinationSum(c, target)
  result, path ← [], []
  function backtrack(start, rem)
    if rem = 0
      result.push(copy(path))  // an answer
      return
    if rem < 0
      return  // overshot: dead end
    for i ← start to length(c) - 1
      path.push(c[i])  // choose
      backtrack(i, rem - c[i])  // reuse is ok
      path.pop()  // undo
  backtrack(0, target)
  return result
`,
  run({ candidates: c, target }, t) {
    const tree = new CallTree();
    const result: number[][] = [];
    const path: number[] = [];
    const label = new Map<string, string>();
    const go = (parent: string | null, start: number, rem: number) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "·");
      label.set(id, path.length ? path.join("+") : "start");
      const vars = { path: `[${path.join(", ")}]`, sum: sumOf(path), remaining: rem };
      if (rem === 0) {
        result.push([...path]);
        tree.log({ id, kind: "solution", line: 5, note: "✓", vars, grid: resultGrid(result, true), message: `${path.length > 1 ? path.join(" + ") : `${path[0]} alone`} makes exactly ${target}: record it, then return.` });
        return;
      }
      if (rem < 0) {
        tree.log({ id, kind: "prune", line: 8, note: "✗", vars,
          ask: { q: `The path ${path.join(" + ")} adds up to ${sumOf(path)}, more than ${target}. What now?`, options: ["Dead end: return", "Keep adding numbers"], answer: 0 },
          message: `${expr(path)}: over ${target} by ${-rem}. A dead end. This call was wasted: it only found out after choosing.` });
        return;
      }
      tree.log({ id, kind: "call", line: 9, note: String(rem), vars,
        message: path.length ? `${expr(path)}: ${rem} still needed. Try each candidate from ${c[start]} on.` : `${target} still needed. Try each candidate as the first choice.` });
      for (let i = start; i < c.length; i++) {
        path.push(c[i]);
        go(id, i, rem - c[i]);
        path.pop();
      }
    };
    go(null, 0, target);
    tree.replay(t, {
      intro: { line: 13, message: `Find every way to add candidates up to ${target}, reusing any of them. Each call tries each candidate (from its own index on, so 2+3 and 3+2 aren't both counted), recurses, then undoes. Numbers under a call show how much is still needed.`, grid: resultGrid([]), vars: { target } },
      finish: () => ({ line: 14, message: `${result.length} answer${result.length === 1 ? "" : "s"} from ${tree.nodes.length} calls, ${tree.events.filter((e) => e.kind === "prune").length} of them dead ends that only failed after overshooting.`, grid: resultGrid(result), vars: { calls: tree.nodes.length }, done: "found" }),
      stackLabel: (id) => label.get(id)!,
    });
  },
};

const prune: Approach<Input> = {
  id: "prune",
  name: "Sort, then prune early",
  code: `function combinationSum(c, target)
  c.sort()  // small to large
  result, path ← [], []
  function backtrack(start, rem)
    if rem = 0
      result.push(copy(path))
      return
    for i ← start to length(c) - 1
      if c[i] > rem
        break  // the rest are bigger still
      path.push(c[i])
      backtrack(i, rem - c[i])
      path.pop()
  backtrack(0, target)
  return result
`,
  run({ candidates, target }, t) {
    const c = [...candidates].sort((a, b) => a - b);
    const tree = new CallTree();
    const result: number[][] = [];
    const path: number[] = [];
    const label = new Map<string, string>();
    const go = (parent: string | null, start: number, rem: number) => {
      const id = tree.add(parent, parent ? path[path.length - 1] : "·");
      label.set(id, path.length ? path.join("+") : "start");
      const vars = { path: `[${path.join(", ")}]`, sum: sumOf(path), remaining: rem };
      if (rem === 0) {
        result.push([...path]);
        tree.log({ id, kind: "solution", line: 6, note: "✓", vars, grid: resultGrid(result, true), message: `${path.length > 1 ? path.join(" + ") : `${path[0]} alone`} makes exactly ${target}: record it.` });
        return;
      }
      const fits = c.slice(start).filter((x) => x <= rem);
      const cut = c.slice(start).filter((x) => x > rem);
      const ask = path.length && c.slice(start).length > 1
        ? { q: `${rem} still needed, and the candidates from here are ${c.slice(start).join(", ")}. Which are worth trying?`, options: [...new Set([fits.length ? fits.join(", ") : "None of them", c.slice(start).join(", ")])], answer: 0 }
        : undefined;
      tree.log({ id, kind: fits.length ? "call" : "prune", line: fits.length ? 8 : 10, note: String(rem), vars, ...(ask && ask.options.length > 1 ? { ask } : {}),
        message: [`${path.length ? `${expr(path)}: ` : ""}${rem} still needed.`, fits.length ? `Try ${fits.join(", ")}.` : "", cut.length ? `${cut.join(", ")} ${cut.length === 1 ? "is" : "are"} bigger than ${rem}: break before calling. The list is sorted, so nothing after can fit either.` : ""].filter(Boolean).join(" ") });
      for (let i = start; i < c.length; i++) {
        if (c[i] > rem) break;
        path.push(c[i]);
        go(id, i, rem - c[i]);
        path.pop();
      }
    };
    go(null, 0, target);
    tree.replay(t, {
      intro: { line: 2, message: "Same search, with one change: sort the candidates first. Then, the moment one is bigger than what's still needed, every later one is too, so the loop stops before making any of those calls.", grid: resultGrid([]), vars: { target } },
      finish: () => ({ line: 15, message: `The same ${result.length} answer${result.length === 1 ? "" : "s"} from ${tree.nodes.length} calls: no call ever overshoots. Pruning cut every dead-end branch before it started.`, grid: resultGrid(result), vars: { calls: tree.nodes.length }, done: "found" }),
      stackLabel: (id) => label.get(id)!,
    });
  },
};

export const approaches = { explore, prune };

/** x is the target, candidates fixed at 2, 3, 5. */
export const growth = measureGrowth([{ approach: explore, slot: 1 }, { approach: prune, slot: 2 }], (n) => ({ candidates: [2, 3, 5], target: n }), [4, 8, 12, 16, 20, 24]);
