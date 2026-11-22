import { CallTree, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";
import { answersGrid } from "../../concepts/51-backtracking-with-rules/steps";

export type Input = { digits: string };
export const example: Input = { digits: "58" };
export const fields: InputField[] = [{ key: "digits", label: "digits (2 to 9)", kind: "text" }];
export const KEYS: Record<string, string> = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };
/** Calls the search makes: 1 for the root, plus one per prefix. */
export const callsFor = (d: string) => { let calls = 1, layer = 1; for (const ch of d) { layer *= KEYS[ch].length; calls += layer; } return calls; };
export function prepare(raw: Input): Prepared<Input> {
  if (!/^[2-9]{0,3}$/.test(raw.digits)) return { error: "Use up to 3 digits, each from 2 to 9." };
  if (callsFor(raw.digits) > 40) return { error: `That makes ${callsFor(raw.digits)} calls, too many to draw. Try fewer 7s and 9s (they have 4 letters).` };
  return { input: raw };
}
const keyText = (d: string) => [...d].map((ch) => `${ch} → ${KEYS[ch]}`).join(", ");

const expand: Approach<Input> = {
  id: "expand",
  name: "Grow the list one digit at a time",
  code: `function letterCombinations(digits)
    if digits is empty
        return []
    result ← [""]
    for each digit d in digits
        next ← []
        for each s in result
            for each letter ch on key d
                next.push(s + ch)
        result ← next
    return result
`,
  run({ digits }, t) {
    if (!digits) {
      t.step({ line: 3, array: [], grid: answersGrid([], "combinations"), vars: {}, done: "notfound", message: "No digits, so there are no combinations: return an empty list." });
      return;
    }
    let result = [""];
    t.step({ line: 4, array: [...digits], grid: answersGrid(["\"\""], "so far"), vars: { keys: keyText(digits) },
      message: `Start from one empty string. Each digit then extends every string so far by each of its letters.` });
    [...digits].forEach((d, i) => {
      const before = result.length, letters = KEYS[d];
      const next: string[] = [];
      for (const s of result) for (const ch of letters) { t.op(s.length + 1); next.push(s + ch); }
      const ask = i > 0 ? { ask: { q: `There are ${before} strings so far, and key ${d} has ${letters.length} letters. How many strings after this digit?`, options: [...new Set([String(before * letters.length), String(before + letters.length), String(letters.length)])], answer: 0 } } : {};
      result = next;
      t.step({ ...ask, line: 10, array: [...digits], pointers: { d: i }, tones: { [i]: "active" }, grid: answersGrid(result, "so far"), vars: { d, letters, count: result.length },
        message: `Digit ${d} has letters ${letters.split("").join(", ")}. ${before === 1 ? "The one string" : `Each of the ${before} strings`} gets each letter added: ${before} × ${letters.length} = ${result.length}.` });
    });
    t.step({ line: 11, array: [...digits], grid: answersGrid(result, "combinations"), vars: { count: result.length }, done: "found",
      message: `${result.length} combinations. With n digits and up to 4 letters per key that's up to 4ⁿ strings of length n: O(n · 4ⁿ) time, and every list in between is kept.` });
  },
};

const backtrack: Approach<Input> = {
  id: "backtrack",
  name: "Backtracking: one letter per depth",
  code: `function letterCombinations(digits)
    if digits is empty
        return []
    result, path ← [], ""
    function backtrack(i)
        if i = length(digits)
            result.push(path)
            return
        for each letter ch on key digits[i]
            path ← path + ch  // choose
            backtrack(i + 1)  // explore
            remove the last letter of path  // undo
    backtrack(0)
    return result
`,
  run({ digits }, t) {
    if (!digits) {
      t.step({ line: 3, array: [], grid: answersGrid([], "combinations"), vars: {}, done: "notfound", message: "No digits, so there are no combinations: return an empty list." });
      return;
    }
    const tree = new CallTree(), result: string[] = [], label = new Map<string, string>();
    let path = "", asked = false;
    const go = (parent: string | null, i: number) => {
      const id = tree.add(parent, parent ? path.at(-1)! : "·");
      label.set(id, `"${path}"`);
      if (i === digits.length) {
        result.push(path);
        tree.log({ id, kind: "solution", line: 7, note: path, vars: { path: `"${path}"`, i }, grid: answersGrid(result, "combinations", true),
          message: `All ${digits.length} digit${digits.length === 1 ? " has" : "s have"} a letter: record "${path}".` });
        return;
      }
      const d = digits[i], letters = KEYS[d];
      const prev = i > 0 ? KEYS[digits[i - 1]] : "";
      const ask = !asked && i > 0 ? (asked = true, { ask: { q: `The path is "${path}" and the next digit is ${d}. Which letters can come next?`, options: [...new Set([letters.split("").join(", "), prev.split("").join(", "), "abcdefghijklmnopqrstuvwxyz".slice(0, letters.length).split("").join(", ")])].filter(Boolean), answer: 0 } }) : {};
      tree.log({ id, kind: "call", line: 9, note: path || "start", vars: { path: `"${path}"`, i, digit: d }, ...(ask.ask && ask.ask.options.length > 1 ? ask : {}),
        message: `${path ? `Path "${path}". ` : ""}Digit ${i + 1} is ${d}: try each of its letters, ${letters.split("").join(", ")}, in turn.` });
      for (const ch of letters) { path += ch; go(id, i + 1); path = path.slice(0, -1); }
    };
    go(null, 0);
    tree.replay(t, {
      intro: { line: 13, message: `Each depth of the search picks the letter for one digit (${keyText(digits)}). A path that has a letter for every digit is one combination.`, grid: answersGrid([], "combinations"), vars: {} },
      finish: () => ({ line: 14, message: `${result.length} combinations from ${tree.nodes.length} calls. Each answer costs n to build: O(n · 4ⁿ) time, but only the current path and n calls deep of extra space: O(n).`, grid: answersGrid(result, "combinations"), vars: { count: result.length }, done: "found" }),
      stackLabel: (id) => `path ${label.get(id)}`,
    });
  },
};

export const approaches = { expand, backtrack };
