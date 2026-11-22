import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { answersGrid } from "../../concepts/51-backtracking-with-rules/steps";

export type Input = { n: number };
export const example: Input = { n: 3 };
export const fields: InputField[] = [{ key: "n", label: "n (pairs)", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 3) return { error: "Use n from 1 to 3: at 4 the tree has too many calls to draw." };
  return { input: raw };
}
/** Walks s left to right; null if valid, else the index where it fails (s.length if it ends unbalanced). */
export function firstFault(s: string, op: () => void = () => {}) {
  let bal = 0;
  for (let i = 0; i < s.length; i++) { op(); bal += s[i] === "(" ? 1 : -1; if (bal < 0) return i; }
  return bal === 0 ? null : s.length;
}

const all: Approach<Input> = {
  id: "all",
  name: "Build every bracket string, keep the valid ones",
  code: `function generateParenthesis(n)
    result ← []
    for each string s of 2n brackets  // 2^(2n)
        if valid(s)
            result.push(s)
    return result
function valid(s)
    balance ← 0
    for each ch in s
        if ch = "("
            balance += 1
        else
            balance -= 1
        if balance < 0
            return false  // closed too early
    return balance = 0
`,
  run({ n }, t) {
    const L = 2 * n, total = 2 ** L, result: string[] = [];
    let asked = false;
    t.step({ line: 2, array: [], grid: answersGrid([], "valid"), vars: { n, strings: total },
      message: `Each of the ${L} positions is "(" or ")": ${total} strings in all. Check each one, walking left to right with a balance: +1 for "(", −1 for ")". It must never drop below 0 and must end at 0.` });
    for (let g = 0; g < total; g += 8) {
      const batch: string[] = [], tones: Record<string, Tone> = {};
      for (let k = g; k < Math.min(total, g + 8); k++) {
        let s = "";
        for (let b = L - 1; b >= 0; b--) s += (k >> b) & 1 ? ")" : "(";
        const ok = firstFault(s, () => t.op()) === null;
        tones[`${Math.floor(batch.length / 4)},${batch.length % 4}`] = ok ? "found" : "discard";
        batch.push(s);
        if (ok) result.push(s);
      }
      const isGood = (i: number) => tones[`${Math.floor(i / 4)},${i % 4}`] === "found";
      const good = batch.filter((_, i) => isGood(i)).length;
      const opts = [...new Set([String(good), String(good + 1), String(Math.max(0, good - 1) === good ? good + 2 : good - 1)])];
      const ask = !asked && good > 0 && opts.length > 2 ? (asked = true, { ask: { q: `Which of these are valid: ${batch.join("  ")}? How many?`, options: opts, answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: [], grid: { title: `strings ${g + 1} to ${g + batch.length} of ${total}`, rows: [batch.slice(0, 4), batch.slice(4)].filter((r) => r.length), tones }, vars: { checked: g + batch.length, valid: result.length },
        message: good ? `${good} of these ${batch.length} pass${good === 1 ? "es" : ""}: ${batch.filter((_, i) => isGood(i)).join(", ")}. The rest close a bracket that was never opened, or leave some open.` : `None of these ${batch.length} is valid: each closes a bracket that was never opened, or leaves some open.` });
    }
    t.step({ line: 6, array: [], grid: answersGrid(result, "valid"), vars: { valid: result.length, checked: total }, done: "found",
      message: `${result.length} valid out of ${total}. Checking all 2^(2n) strings at 2n steps each is O(n · 4ⁿ), and almost all of them are thrown away.` });
  },
};

const rules: Approach<Input> = {
  id: "rules",
  name: "Backtracking: only add a bracket that can still work",
  code: `function generateParenthesis(n)
    result ← []
    function backtrack(s, open, close)
        if length(s) = 2 * n
            result.push(s)
            return
        if open < n  // a "(" is still left
            backtrack(s + "(", open + 1, close)
        if close < open  // a ")" has a match
            backtrack(s + ")", open, close + 1)
    backtrack("", 0, 0)
    return result
`,
  run({ n }, t) {
    const tree = new CallTree(), result: string[] = [], label = new Map<string, string>();
    let asked = false;
    const go = (parent: string | null, s: string, open: number, close: number) => {
      const id = tree.add(parent, parent ? s.at(-1)! : "·");
      label.set(id, `"${s}"`);
      const vars = { s: `"${s}"`, open, close };
      if (s.length === 2 * n) {
        result.push(s);
        tree.log({ id, kind: "solution", line: 5, note: s, vars, grid: answersGrid(result, "valid", true), message: `"${s}" has all ${2 * n} brackets: record it.` });
        return;
      }
      const canOpen = open < n, canClose = close < open;
      const options = ['Only "("', 'Only ")"', "Either one"];
      const answer = canOpen && canClose ? 2 : canOpen ? 0 : 1;
      const ask = !asked && s && !(canOpen && canClose) ? (asked = true, { ask: { q: `"${s}" uses ${open} "(" and ${close} ")", with n = ${n}. What can come next?`, options, answer } }) : {};
      const why = [canOpen ? `a "(" (only ${open} of ${n} used)` : "", canClose ? `a ")" (${open - close} open to match)` : ""].filter(Boolean).join(" or ");
      const no = !canOpen ? ` No "(": all ${n} are used.` : !canClose ? ` No ")": ${open === 0 ? "nothing is open yet" : "every open one is already matched"}.` : "";
      tree.log({ id, kind: "call", line: canOpen ? 7 : 9, note: s || "start", vars, ...ask, message: `${s ? `"${s}"` : "Empty"}: add ${why}.${no}` });
      if (canOpen) go(id, s + "(", open + 1, close);
      if (canClose) go(id, s + ")", open, close + 1);
    };
    go(null, "", 0, 0);
    tree.replay(t, {
      intro: { line: 11, message: `Build the string one bracket at a time, and only add one that can still lead to a valid string: "(" while fewer than ${n} are used, ")" while it has an open "(" to match. Then every full string is valid, so there's nothing to check.`, grid: answersGrid([], "valid"), vars: { n } },
      finish: () => ({ line: 12, message: `${result.length} valid strings from ${tree.nodes.length} calls, and no call was wasted on a string that couldn't work. The calls grow with the number of answers, far more slowly than the 4ⁿ strings the first approach checks.`, grid: answersGrid(result, "valid"), vars: { calls: tree.nodes.length }, done: "found" }),
      stackLabel: (id) => `s ${label.get(id)}`,
    });
  },
};

export const approaches = { all, rules };

export const growth = measureGrowth(
  [{ approach: all, slot: 1 }, { approach: rules, slot: 3 }],
  (n) => ({ n }),
  [1, 2, 3, 4, 5, 6, 7],
);
