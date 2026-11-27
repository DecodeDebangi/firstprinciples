import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string };
export const example: Input = { words: "ab, abab, b, bab, abcab" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words);
  if (w.length < 2 || w.length > 6) return { error: "Give 2 to 6 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,5}$/.test(x))) return { error: "Use words of 1 to 5 letters a to z." };
  const t = new Trie(); w.forEach((x) => t.insert([...x].map((c, k) => c + x[x.length - 1 - k]).join("|")));
  return { input: { words: w.join(", ") } };
}
const both = (u: string, w: string) => w.startsWith(u) && w.endsWith(u);

const pairs: Approach<Input> = {
  id: "pairs", name: "Check every earlier word",
  code: `function countPrefixSuffixPairs(words)
    total ← 0
    for j from 0 to length(words) − 1
        for i from 0 to j − 1
            if words[i] starts and ends words[j]
                total ← total + 1
    return total
`,
  run(raw, t) {
    const w = parseWords(raw.words); let total = 0;
    if (t.record) t.step({ line: 2, array: w, vars: { total }, message: "Count the pairs (i, j), i before j, where words[i] is both the start and the end of words[j]. The direct way checks every earlier word against each word." });
    w.forEach((b, j) => {
      const hit: string[] = [];
      for (let i = 0; i < j; i++) { t.op(w[i].length * 2); if (both(w[i], b)) { total++; hit.push(w[i]); } }
      if (t.record) t.step({ line: 6, array: w, tones: { [j]: "active", ...Object.fromEntries(w.map((x, i) => [i, x]).filter(([i, x]) => (i as number) < j && hit.includes(x as string)).map(([i]) => [i as number, "found" as Tone])) }, vars: { word: b, total },
        message: j === 0 ? `"${b}" is first: nothing earlier to check.` : `"${b}": checked the ${j} earlier word${j === 1 ? "" : "s"}; ${hit.length ? `${hit.map((h) => `"${h}"`).join(" and ")} both start and end it` : "none both starts and ends it"}.` });
    });
    if (t.record) t.step({ line: 7, array: w, vars: { total }, done: "found", message: `${total} pair${total === 1 ? "" : "s"}. Every pair was checked: O(n² · L).` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie of (first, last) letter pairs",
  code: `function countPrefixSuffixPairs(words)
    total ← 0
    for each w in words  // in order
        node ← root
        for k from 0 to length(w) − 1
            key ← (w[k], w[length(w) − 1 − k])
            node ← node.child[key], made if missing
            total ← total + node.ends
        node.ends ← node.ends + 1
    return total
`,
  run(raw, t) {
    const w = parseWords(raw.words), tr = new Trie(), ends = new Map<string, number>();
    let total = 0, asked = 0;
    const view = (tones: Record<string, Tone> = {}) => tr.view(tones, {}, Object.fromEntries([...ends].map(([id, c]) => [id, `×${c}`])));
    if (t.record) t.step({ line: 2, array: w, trees: view(), vars: { total }, message: `Pair the k-th letter from the start with the k-th from the end: "abcab" becomes ab, ba, cc, ba, ab. A word u starts and ends w exactly when u's pairs are the first pairs of w's. So a trie of these pairs, with a count of how many words end at each node, answers the question in one walk per word.` });
    w.forEach((b, j) => {
      let n = tr.root; const path: string[] = []; let add = 0;
      for (let k = 0; k < b.length; k++) { t.op(); const key = b[k] + b[b.length - 1 - k]; n = tr.child(n, key) ?? tr.make(key, n); path.push(n); add += ends.get(n) ?? 0; }
      const ask = t.record && asked < 1 && add > 0 ? (asked++, { ask: { q: `"${b}" walks its pairs (${[...b].map((c, k) => c + b[b.length - 1 - k]).join(", ")}) and passes nodes where ${add} earlier word${add === 1 ? " ends" : "s end"}. How many pairs does it add?`, options: [String(add), "1", "0"].filter((x, i, a) => a.indexOf(x) === i), answer: 0 } }) : {};
      total += add; ends.set(n, (ends.get(n) ?? 0) + 1); tr.ends.add(n);
      if (t.record) t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 9, array: w, tones: { [j]: "active" }, trees: view(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), vars: { word: b, pairs: [...b].map((c, k) => c + b[b.length - 1 - k]).join(" "), total },
        message: `"${b}" as pairs: ${[...b].map((c, k) => c + b[b.length - 1 - k]).join(", ")}. Along its path, ${add ? `${add} earlier word${add === 1 ? " ends" : "s end"}: each starts and ends "${b}"` : "no earlier word ends"}. Then mark its own end (×).` });
    });
    if (t.record) t.step({ line: 10, array: w, trees: view(), vars: { total }, done: "found", message: `${total} pair${total === 1 ? "" : "s"}. One walk per word, one step per letter: O(total letters).` });
  },
};

export const approaches = { pairs, trie };
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, k) => "ab".repeat(1 + (k % 3))).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
