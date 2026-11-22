import { CallTree, measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";
import { answersGrid } from "../../concepts/51-backtracking-with-rules/steps";

export type Input = { candidates: number[]; target: number };
export const example: Input = { candidates: [3, 1, 2, 1, 3], target: 5 };
export const fields: InputField[] = [
  { key: "candidates", label: "candidates (repeats allowed)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];
/** Calls the search without the skip rule makes, to keep custom trees small enough to draw. */
export function callsWithoutSkip(c: number[], target: number) {
  const s = [...c].sort((a, b) => a - b);
  let calls = 0;
  const go = (start: number, rem: number) => { calls++; if (rem === 0 || calls > 60) return; for (let i = start; i < s.length && s[i] <= rem; i++) go(i + 1, rem - s[i]); };
  go(0, target);
  return calls;
}
export function prepare(raw: Input): Prepared<Input> {
  const c = raw.candidates;
  if (!c.length || c.length > 6) return { error: "Use 1 to 6 candidates." };
  if (c.some((x) => !Number.isInteger(x) || x < 1 || x > 20)) return { error: "Candidates must be whole numbers from 1 to 20." };
  if (!Number.isInteger(raw.target) || raw.target < 1 || raw.target > 30) return { error: "Use a target from 1 to 30." };
  if (callsWithoutSkip(c, raw.target) > 36) return { error: "That tree has too many calls to draw. Try fewer candidates or a smaller target." };
  return { input: raw };
}
const sumText = (p: number[]) => (p.length > 1 ? p.join(" + ") : String(p[0]));

/** One search, with or without the same-depth skip rule. */
function search(c0: number[], target: number, skip: boolean, t: Parameters<Approach<Input>["run"]>[1], lines: { record: number; repeat: number; loop: number; skipLine: number; intro: number; end: number }) {
  const c = [...c0].sort((a, b) => a - b);
  const tree = new CallTree(), seen = new Set<string>(), result: string[] = [], path: number[] = [], label = new Map<string, string>();
  let repeats = 0, skipped = 0, asked = false;
  const go = (parent: string | null, start: number, rem: number) => {
    const id = tree.add(parent, parent ? path[path.length - 1] : "·");
    label.set(id, `[${path.join(", ")}]`);
    const vars = { path: `[${path.join(", ")}]`, remaining: rem };
    if (rem === 0) {
      const k = path.join("+"), dup = seen.has(k);
      if (dup) repeats++; else { seen.add(k); result.push(k); }
      tree.log({ id, kind: dup ? "prune" : "solution", line: dup ? lines.repeat : lines.record, note: dup ? "again" : "✓", vars, grid: answersGrid(result, "answers", !dup),
        message: dup ? `${sumText(path)} = ${target} again, using another copy of an equal number: a repeat, so it's dropped.` : `${sumText(path)} = ${target}: record it.` });
      return;
    }
    const tried: number[] = [], cut: number[] = [];
    let over = 0;
    for (let i = start; i < c.length; i++) { if (c[i] > rem) { over = c.length - i; break; } (skip && i > start && c[i] === c[i - 1] ? cut : tried).push(i); }
    skipped += cut.length;
    const opts = [tried.map((i) => c[i]).join(", ") || "None", c.slice(start, start + tried.length + cut.length).join(", ")].filter((o, i, a) => a.indexOf(o) === i);
    const ask = skip && !asked && cut.length && opts.length > 1 ? (asked = true, { ask: { q: `${rem} still needed, and the numbers from here are ${c.slice(start).join(", ")}. Which does the loop try?`, options: opts, answer: 0 } }) : {};
    const parts = [
      `${path.length ? `${sumText(path)}: ` : ""}${rem} still needed.`,
      tried.length ? `Try ${tried.map((i) => c[i]).join(", ")}.` : "",
      cut.length ? `Skip the repeated ${[...new Set(cut.map((i) => c[i]))].join(" and ")}: an equal value at the same depth would repeat the branch before it.` : "",
      over ? `${over === c.length - start ? "Everything left is" : over === 1 ? "The last number is" : `The last ${over} are`} bigger than ${rem}: break.` : "",
      !tried.length && !over ? "No numbers are left: a dead end." : "",
    ];
    tree.log({ id, kind: tried.length ? "call" : "prune", line: tried.length ? lines.loop : over ? lines.loop + 2 : lines.loop, note: String(rem), vars, ...ask, message: parts.filter(Boolean).join(" ") });
    for (let i = start; i < c.length; i++) {
      if (c[i] > rem) break;
      if (skip && i > start && c[i] === c[i - 1]) continue;
      path.push(c[i]); go(id, i + 1, rem - c[i]); path.pop();
    }
  };
  go(null, 0, target);
  tree.replay(t, {
    intro: { line: lines.intro, message: skip
      ? `Sorted: ${c.join(", ")}. Each number can be used once. In each call's loop, only the first of a run of equal numbers is tried, and the loop stops at the first number bigger than what's still needed.`
      : `Sorted: ${c.join(", ")}. Each number can be used once, so a call continues from the next index. The loop stops at the first number bigger than what's still needed. Equal numbers are treated as different, so a set drops repeated answers.`,
      grid: answersGrid([], "answers"), vars: { target } },
    finish: () => ({ line: lines.end, message: skip
      ? `${result.length} answer${result.length === 1 ? "" : "s"} from ${tree.nodes.length} calls. The skip rule cut ${skipped} branch${skipped === 1 ? "" : "es"} before they started, so no answer was built twice.`
      : `${result.length} answer${result.length === 1 ? "" : "s"} from ${tree.nodes.length} calls, and ${repeats} answer${repeats === 1 ? " was" : "s were"} built again and dropped. Every repeat means a whole branch that was searched for nothing.`,
      grid: answersGrid(result, "answers"), vars: { calls: tree.nodes.length }, done: result.length ? "found" : "notfound" }),
    stackLabel: (id) => `path ${label.get(id)}`,
  });
}

const dedupe: Approach<Input> = {
  id: "dedupe",
  name: "Search every pick, drop repeated answers",
  code: `function combinationSum2(c, target)
    sort c
    seen, result, path ← empty set, [], []
    function backtrack(start, rem)
        if rem = 0
            if path not in seen  // else a repeat
                seen.add(copy(path))
                result.push(copy(path))
            return
        for i ← start to length(c) - 1
            if c[i] > rem
                break  // the rest are bigger
            path.push(c[i])
            backtrack(i + 1, rem - c[i])  // once
            path.pop()
    backtrack(0, target)
    return result
`,
  run({ candidates, target }, t) { search(candidates, target, false, t, { record: 8, repeat: 6, loop: 10, skipLine: 0, intro: 2, end: 17 }); },
};

const skip: Approach<Input> = {
  id: "skip",
  name: "Sort, then skip equal numbers at the same depth",
  code: `function combinationSum2(c, target)
    sort c  // equal numbers side by side
    result, path ← [], []
    function backtrack(start, rem)
        if rem = 0
            result.push(copy(path))
            return
        for i ← start to length(c) - 1
            if c[i] > rem
                break  // the rest are bigger
            if i > start and c[i] = c[i - 1]
                continue  // same value, same depth
            path.push(c[i])
            backtrack(i + 1, rem - c[i])  // once
            path.pop()
    backtrack(0, target)
    return result
`,
  run({ candidates, target }, t) { search(candidates, target, true, t, { record: 6, repeat: 6, loop: 8, skipLine: 11, intro: 2, end: 17 }); },
};

export const approaches = { dedupe, skip };

/** n ones and a target of n / 2: many ways to pick the same answer. */
export const growth = measureGrowth(
  [{ approach: dedupe, slot: 1 }, { approach: skip, slot: 3 }],
  (n) => ({ candidates: Array(n).fill(1), target: Math.floor(n / 2) }),
  [2, 4, 6, 8, 10, 12],
);
