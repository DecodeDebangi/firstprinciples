import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string };
export const example: Input = { words: "c, ca, cat, cats, cab, d, do, dot, dotty" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = [...new Set(parseWords(raw.words))];
  if (!w.length) return { error: "Give at least one word." };
  if (w.some((x) => !/^[a-z]+$/.test(x))) return { error: "Use the letters a to z only." };
  if (w.length > 9 || w.some((x) => x.length > 6)) return { error: "Use at most 9 words of up to 6 letters." };
  const t = new Trie(); w.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 7) return { error: "Those words branch too much to fit; use words that share beginnings." };
  return { input: { words: w.join(", ") } };
}
/** Longer wins; for equal lengths, the one earlier in the alphabet. */
const better = (a: string, b: string) => a.length > b.length || (a.length === b.length && a < b);

const prefixSet: Approach<Input> = {
  id: "prefixSet",
  name: "Check every prefix in a set",
  code: `function longestWord(words)
    set ← all the words
    best ← ""
    for each w in words
        ok ← true
        for k ← 1 to length(w) - 1
            if w[0..k-1] not in set
                ok ← false
                break
        if ok and w is better than best
            best ← w
    return best
`,
  run({ words }, t) {
    const ws = parseWords(words), set = new Set(ws);
    let best = "";
    t.step({ line: 3, array: ws, vars: { best: '""' },
      message: `A word can be built one letter at a time if every shorter beginning of it is also in the list. Put the words in a set, then check each word's beginnings. "Better" means longer, or as long but earlier in the alphabet.` });
    let asked = false;
    ws.forEach((w, i) => {
      let missing = "";
      for (let k = 1; k < w.length; k++) { t.op(k); if (!set.has(w.slice(0, k))) { missing = w.slice(0, k); break; } }
      const ok = !missing, wins = ok && better(w, best);
      const ask = !asked && w.length > 2 ? (asked = true, { ask: { q: `Can "${w}" be built one letter at a time?`, options: [missing ? `No: "${missing}" isn't a word` : "Yes: every beginning is a word", missing ? "Yes: every beginning is a word" : "No: a beginning is missing"], answer: 0 } }) : {};
      if (wins) best = w;
      t.step({ ...ask, line: missing ? 8 : wins ? 11 : 10, array: ws, pointers: { w: i }, tones: { [i]: missing ? "miss" : wins ? "found" : "compare" }, vars: { w, best: `"${best}"` },
        message: missing ? `"${w}" can't be built: "${missing}" isn't in the list.` : wins ? `Every beginning of "${w}" is a word, and it beats the best so far: best = "${w}".` : `"${w}" can be built, but it isn't better than "${best}".` });
    });
    t.step({ line: 12, array: ws, vars: { best: `"${best}"` }, done: "found",
      message: `Answer: "${best}". Each word built and looked up each of its beginnings, which costs up to L² per word: O(N · L²).` });
  },
};

const trieDfs: Approach<Input> = {
  id: "trie",
  name: "Walk the trie through end marks only",
  code: `function longestWord(words)
    insert every word into the trie
    best ← ""
    function dfs(node, path)
        if length(path) > length(best)
            best ← path
        for each ch, child in node.children, a to z
            if child.isEnd
                dfs(child, path + ch)
    dfs(root, "")
    return best
`,
  run({ words }, t) {
    const ws = parseWords(words), trie = new Trie();
    ws.forEach((w) => { t.op(w.length); trie.insert(w); });
    let best = "";
    const seen: string[] = [];
    t.step({ line: 3, array: [], trees: trie.view({}, { node: trie.root }), vars: { best: '""' },
      message: `In a trie, a word can be built letter by letter exactly when every node on its path is marked "end". So explore only through marked nodes, children in alphabetical order, and remember the deepest one reached.` });
    let asked = false;
    const dfs = (node: string, path: string) => {
      if (path.length > best.length) best = path;
      seen.push(node);
      t.step({ line: path.length && best === path ? 6 : 4, array: [], trees: trie.view({ ...Object.fromEntries(seen.map((s) => [s, "visited" as Tone])), [node]: "found" }, { node }), vars: { path: `"${path}"`, best: `"${best}"` },
        message: path ? `"${path}" is a word${best === path ? `, and the longest so far: best = "${path}"` : `, but no longer than "${best}"`}.` : `Start at the root.` });
      for (const [ch, kid] of [...trie.kids.get(node)!.entries()].sort()) {
        t.op();
        const end = trie.ends.has(kid);
        const q = !asked && !end ? (asked = true, { ask: { q: `"${path + ch}" isn't a word in the list. Should the walk go below it?`, options: ["No: nothing below it can be built letter by letter", "Yes: a longer word might still work"], answer: 0 } }) : {};
        if (!end) {
          t.step({ ...q, line: 8, array: [], trees: trie.view({ ...Object.fromEntries(seen.map((s) => [s, "visited" as Tone])), [kid]: "miss" }, { node }), vars: { path: `"${path}"`, best: `"${best}"` },
            message: `"${path + ch}" isn't marked "end", so every word below it is missing a step. Skip that whole branch.` });
          continue;
        }
        dfs(kid, path + ch);
      }
    };
    dfs(trie.root, "");
    t.step({ line: 11, array: [], trees: trie.view(Object.fromEntries(seen.map((s) => [s, "settled" as Tone]))), vars: { best: `"${best}"` }, done: "found",
      message: `Answer: "${best}". Children were tried from a to z and best only changes for something strictly longer, so ties go to the earlier word. Building the trie and walking it each touch every letter once: O(N · L).` });
  },
};

export const approaches = { prefixSet, trie: trieDfs };

/** A chain a, aa, aaa, … of n words: every word can be built, and each has many beginnings to check. */
export const growth = measureGrowth(
  [{ approach: prefixSet, slot: 1 }, { approach: trieDfs, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, i) => "a".repeat(i + 1)).join(", ") }),
  [4, 8, 16, 24, 32],
);
