import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string };
export const example: Input = { words: "race, car, ecar, a, ra" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words);
  if (w.length < 2 || w.length > 6) return { error: "Give 2 to 6 words, separated by commas." };
  if (new Set(w).size !== w.length) return { error: "Use different words." };
  if (w.some((x) => !/^[a-z]{1,6}$/.test(x))) return { error: "Use words of 1 to 6 letters a to z." };
  return { input: { words: w.join(", ") } };
}
const isPal = (s: string) => s === [...s].reverse().join("");
const rev = (s: string) => [...s].reverse().join("");
const pairsText = (words: string[], out: [number, number][]) => out.map(([i, j]) => `${words[i]}+${words[j]}`).join(", ") || "none";
const key = (out: [number, number][]) => out.map(([i, j]) => `(${i},${j})`).sort().join(" ");

const allPairs: Approach<Input> = {
  id: "pairs", name: "Join every ordered pair and check it",
  code: `function palindromePairs(words)
    out ← []
    for each position i
        for each position j ≠ i
            if isPal(words[i] + words[j])
                out.push((i, j))
    return out
// isPal(s): s reads the same backwards
`,
  run(raw, t) {
    const words = parseWords(raw.words), out: [number, number][] = [];
    if (t.record) t.step({ line: 2, array: words, vars: { pairs: "none" }, message: "Two words form a palindrome pair if writing one right after the other gives a string that reads the same backwards. The direct way joins every ordered pair and checks it." });
    words.forEach((a, i) => {
      const found: string[] = [];
      words.forEach((b, j) => { if (i === j) return; t.op(a.length + b.length); if (isPal(a + b)) { out.push([i, j]); found.push(a + b); } });
      if (t.record) t.step({ line: 6, array: words, tones: { [i]: "active" }, vars: { first: a, pairs: pairsText(words, out), key: key(out) },
        message: `"${a}" first, then each other word: ${found.length ? `${found.map((f) => `"${f}"`).join(" and ")} read${found.length === 1 ? "s" : ""} the same backwards` : "no joined string reads the same backwards"}.` });
    });
    if (t.record) t.step({ line: 7, array: words, vars: { pairs: pairsText(words, out), key: key(out) }, done: "found", message: `${out.length} pair${out.length === 1 ? "" : "s"}. Every ordered pair was joined and checked: O(n² · L).` });
  },
};

const splits: Approach<Input> = {
  id: "split", name: "Split each word, look up the reversed rest",
  code: `function palindromePairs(words)
    index ← map: reverse(w) → its position
    out ← []
    for each position i, word w in words
        for k from 0 to length(w)
            left, right ← w[0..k − 1], w[k..end]
            j ← index[right]  // reverse of right
            if j ≠ none and j ≠ i and isPal(left)
                out.push((j, i))  // words[j] + w
            j ← index[left]
            if k < length(w) and j ≠ none and j ≠ i
                if isPal(right)
                    out.push((i, j))
    return out
// isPal(s): s reads the same backwards
`,
  run(raw, t) {
    const words = parseWords(raw.words), index = new Map(words.map((w, i) => [rev(w), i])), out: [number, number][] = [];
    t.op(words.join("").length);
    let asked = 0;
    const mapPanel = { title: "reverse(w) → position", entries: [...index].map(([k, v]) => [k, String(v)] as [string, string]) };
    if (t.record) t.step({ line: 2, array: words, map: mapPanel, vars: { pairs: "none" },
      message: `Think about where the middle of a palindrome pair falls. If x + w is a palindrome and x is the shorter, x must be w's ending, reversed, and the rest of w must itself read the same both ways. So cut each word at every point, check the part that would sit in the middle, and look up the other part reversed.` });
    words.forEach((w, i) => {
      const found: string[] = [];
      for (let k = 0; k <= w.length; k++) {
        const left = w.slice(0, k), right = w.slice(k);
        t.op(w.length);
        const j1 = index.get(right);
        if (j1 !== undefined && j1 !== i && isPal(left)) { out.push([j1, i]); found.push(`"${words[j1]}" + "${w}" (cut ${left ? `"${left}"` : "nothing"} | "${right}": "${left || "nothing"}" reads the same both ways, and "${right}" reversed is "${words[j1]}")`); }
        const j2 = index.get(left);
        if (k < w.length && j2 !== undefined && j2 !== i && isPal(right)) { out.push([i, j2]); found.push(`"${w}" + "${words[j2]}" (cut "${left}" | "${right}": "${right}" reads the same both ways, and "${left}" reversed is "${words[j2]}")`); }
      }
      const ask = t.record && asked < 1 && found.length ? (asked++, { ask: { q: `In "${w}", which part of a cut has to read the same both ways for a pair?`, options: ["The part that ends up in the middle of the joined string", "Both parts", "Neither"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: found.length ? 13 : 5, array: words, tones: { [i]: "active", ...Object.fromEntries(out.filter(([a, b]) => a === i || b === i).flatMap(([a, b]) => [[a === i ? b : a, "found" as Tone]])) }, map: mapPanel, grid: { title: `cuts of "${w}"`, rows: [[...Array(w.length + 1)].map((_, k) => `${w.slice(0, k) || "·"}|${w.slice(k) || "·"}`)] }, vars: { word: w, pairs: pairsText(words, out), key: key(out) },
        message: found.length ? `"${w}": ${found.join("; ")}.` : `"${w}": tried all ${w.length + 1} cuts. No cut has a middle part that reads the same both ways with the other part, reversed, in the list.` });
    });
    if (t.record) t.step({ line: 14, array: words, map: mapPanel, vars: { pairs: pairsText(words, out), key: key(out) }, done: "found", message: `${out.length} pair${out.length === 1 ? "" : "s"}. Each word tries L + 1 cuts with an O(L) check each: O(n · L²), instead of joining every pair.` });
  },
};

export const approaches = { pairs: allPairs, split: splits };
/** n words of 4 letters. */
export const growth = measureGrowth(
  [{ approach: allPairs, slot: 1 }, { approach: splits, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, k) => [0, 1, 2, 3].map((j) => String.fromCharCode(97 + (Math.floor(k / 5 ** j) % 5))).join("")).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
