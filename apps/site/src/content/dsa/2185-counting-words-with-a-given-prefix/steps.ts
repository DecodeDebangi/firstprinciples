import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { parseWords, wordPanel } from "../../concepts/42-tries/steps";
import { CountTrie } from "../../concepts/68-trie-counts/steps";

export type Input = { words: string; pref: string };
export const example: Input = { words: "cart, care, dog, carp, cat", pref: "car" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }, { key: "pref", label: "prefix", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words), p = raw.pref.toLowerCase();
  if (!w.length || w.length > 6 || w.some((x) => !/^[a-z]{1,6}$/.test(x))) return { error: "Give 1 to 6 words of 1 to 6 letters a to z." };
  if (!/^[a-z]{1,6}$/.test(p)) return { error: "Use a prefix of 1 to 6 letters a to z." };
  const t = new CountTrie(); w.forEach((x) => t.add(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 20) return { error: "Those words branch too much for the trie to fit." };
  return { input: { words: w.join(", "), pref: p } };
}

const trie: Approach<Input> = {
  id: "trie", name: "Build a counting trie, then read one count",
  code: `function prefixCount(words, pref)
    for each w in words
        insert w, adding 1 to every node's count
    node ← walk pref from the root
    return node.count if node ≠ none, else 0
`,
  run({ words, pref }, t) {
    const w = parseWords(words), tr = new CountTrie();
    w.forEach((x) => { tr.add(x); t.op(x.length); });
    if (t.record) t.step({ line: 3, array: w, trees: tr.countView(), vars: {}, message: "A counting trie (see Tries that count) knows how many words pass through every node. Build one, then read the count where the prefix ends." });
    const path = tr.path(pref); t.op(pref.length);
    const ans = path ? tr.cnt(path[path.length - 1]) : 0;
    if (t.record) t.step({ line: 5, array: w, trees: tr.countView(Object.fromEntries((path ?? []).map((p, k, a) => [p, (k === a.length - 1 ? "found" : "visited") as Tone]))), ...wordPanel(pref), vars: { answer: ans }, done: "found",
      message: `${path ? `Walk "${pref}" and read ×${ans}` : `The path for "${pref}" leaves the trie`}: ${ans} word${ans === 1 ? "" : "s"}. But building the trie read every letter of every word, more than one question needs.` });
  },
};

const check: Approach<Input> = {
  id: "check", name: "Check how each word starts",
  code: `function prefixCount(words, pref)
    count ← 0
    for each w in words
        if w starts with pref
            count ← count + 1
    return count
`,
  run({ words, pref }, t) {
    const w = parseWords(words); let count = 0;
    let asked = 0;
    if (t.record) t.step({ line: 2, array: w, vars: { count }, message: `For one prefix, compare the first ${pref.length} letters of each word with it, and stop comparing a word at its first different letter.` });
    w.forEach((x, i) => {
      let k = 0; while (k < pref.length && k < x.length && x[k] === pref[k]) { t.op(); k++; } t.op();
      const ok = k === pref.length;
      const ask = t.record && asked < 1 && !ok && k > 0 ? (asked++, { ask: { q: `"${x}" matches "${pref.slice(0, k)}" and then differs. Does it count?`, options: ["No: every letter of the prefix must match", "Yes: most letters match"], answer: 0 } }) : {};
      if (ok) count++;
      if (t.record) t.step({ ...ask, line: ok ? 5 : 4, array: w, tones: { [i]: ok ? "found" : "discard" }, vars: { word: x, count }, message: ok ? `"${x}" starts with "${pref}": count it.` : `"${x}" ${k ? `matches "${pref.slice(0, k)}" but then has '${x[k] ?? "nothing"}'` : `starts with '${x[0]}'`}: skip it.` });
    });
    if (t.record) t.step({ line: 6, array: w, vars: { answer: count }, done: "found", message: `${count}. At most p letters per word: O(n · p), which for a single question is less than building a trie.` });
  },
};

export const approaches = { trie, check };
export const growth = measureGrowth(
  [{ approach: trie, slot: 1 }, { approach: check, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, k) => "abcdefgh".slice(0, 4) + String.fromCharCode(97 + (k % 26)) + "xyz").join(", "), pref: "abc" }),
  [8, 16, 32, 64, 128, 256],
);
