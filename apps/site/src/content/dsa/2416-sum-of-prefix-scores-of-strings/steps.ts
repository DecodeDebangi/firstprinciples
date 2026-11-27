import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { parseWords } from "../../concepts/42-tries/steps";
import { CountTrie, wordsFields, wordsPrepare, type WordsInput } from "../../concepts/68-trie-counts/steps";

export type Input = WordsInput;
export const example: Input = { words: "car, cat, cart, dog" };
export const fields = wordsFields;
export const prepare = (raw: Input): Prepared<Input> => wordsPrepare(raw);
const list = (a: (number | string)[]) => `[${a.join(", ")}]`;

const prefixMap: Approach<Input> = {
  id: "map", name: "Count every prefix in a map",
  code: `function sumPrefixScores(words)
    seen ← empty map  // prefix → how many words
    for each w in words
        for k from 1 to length(w)
            p ← w[0..k − 1]  // copies k letters
            seen[p] ← (seen[p] or 0) + 1
    out ← []
    for each w in words
        score ← 0
        for k from 1 to length(w)
            score ← score + seen[w[0..k − 1]]
        out.push(score)
    return out
`,
  run(raw, t) {
    const words = parseWords(raw.words), seen = new Map<string, number>(), out: number[] = [];
    const entries = () => [...seen].map(([k, v]) => [k, String(v)] as [string, string]);
    if (t.record) t.step({ line: 2, array: [], map: { title: "seen", entries: [] }, vars: {}, message: "A word's score adds up, for each of its prefixes, how many words start with that prefix. First count every prefix of every word in a map." });
    for (const w of words) {
      for (let k = 1; k <= w.length; k++) { t.op(k); const p = w.slice(0, k); seen.set(p, (seen.get(p) ?? 0) + 1); }
      if (t.record) t.step({ line: 6, array: [], map: { title: "seen", entries: entries() }, vars: { word: w, prefixes: w.length }, message: `"${w}" adds its ${w.length} prefixes: ${[...w].map((_, k) => w.slice(0, k + 1)).join(", ")}. Each one is copied out letter by letter to use as a key.` });
    }
    for (const w of words) {
      let s = 0; const parts: number[] = [];
      for (let k = 1; k <= w.length; k++) { t.op(k); const c = seen.get(w.slice(0, k))!; s += c; parts.push(c); }
      out.push(s);
      if (t.record) t.step({ line: 12, array: [], map: { title: "seen", entries: entries() }, vars: { word: w, score: s, out: list(out) }, message: `"${w}": ${parts.join(" + ")} = ${s}.` });
    }
    if (t.record) t.step({ line: 13, array: [], map: { title: "seen", entries: entries() }, vars: { out: list(out) }, done: "found", message: `${list(out)}. Copying each prefix of a word of length L costs 1 + 2 + … + L letters: O(L²) per word.` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie that counts words through each node",
  code: `function sumPrefixScores(words)
    for each w in words
        insert(w)  // counts on every node
    out ← []
    for each w in words
        node, score ← root, 0
        for each letter c in w
            node ← node.child[c]
            score ← score + node.count
        out.push(score)
    return out
`,
  run(raw, t) {
    const words = parseWords(raw.words), tr = new CountTrie(), out: number[] = [];
    let asked = 0;
    if (t.record) t.step({ line: 2, array: [], trees: tr.countView(), vars: {}, message: "A trie node's count is how many words start with the letters on its path, which is exactly what a score adds up. So insert every word, counting as it goes, then walk each word's path adding up the counts." });
    for (const w of words) {
      let n = tr.root; const path: string[] = [];
      for (const ch of w) { t.op(); n = tr.child(n, ch) ?? tr.make(ch, n); tr.count.set(n, tr.cnt(n) + 1); path.push(n); }
      tr.endCount.set(n, (tr.endCount.get(n) ?? 0) + 1); tr.ends.add(n);
      if (t.record) t.step({ line: 3, array: [], trees: tr.countView(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), vars: { word: w }, message: `Insert "${w}": each of its ${w.length} nodes counts one more word.` });
    }
    for (const w of words) {
      let n = tr.root, s = 0; const path: string[] = [], parts: number[] = [];
      for (const ch of w) { t.op(); n = tr.child(n, ch)!; s += tr.cnt(n); parts.push(tr.cnt(n)); path.push(n); }
      const ask = t.record && asked < 1 ? (asked++, { ask: { q: `The counts along "${w}" are ${parts.join(", ")}. What is its score?`, options: [...new Set([s, parts[parts.length - 1], w.length].map(String))], answer: 0 } }) : {};
      out.push(s);
      if (t.record) t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 9, array: [], trees: tr.countView(Object.fromEntries(path.map((p) => [p, "compare" as Tone]))), vars: { word: w, score: s, out: list(out) }, message: `"${w}": walk its path adding the counts, ${parts.join(" + ")} = ${s}.` });
    }
    if (t.record) t.step({ line: 11, array: [], trees: tr.countView(), vars: { out: list(out) }, done: "found", message: `${list(out)}. Every word is walked twice, one step per letter: O(total letters).` });
  },
};

export const approaches = { map: prefixMap, trie };
/** Four words of length n that share their first half. */
export const growth = measureGrowth(
  [{ approach: prefixMap, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ words: ["a", "b", "c", "d"].map((c) => "x".repeat(n / 2) + c.repeat(n / 2)).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
