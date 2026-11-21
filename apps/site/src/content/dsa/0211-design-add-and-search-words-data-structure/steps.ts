import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, buildPrepare, parseWords, wordPanel } from "../../concepts/42-tries/steps";

export type Input = { words: string; query: string };
export const example: Input = { words: "bad, bed, bid, mad, pat", query: ".a." };
export const fields: InputField[] = [
  { key: "words", label: "words added", kind: "text" },
  { key: "query", label: "search (. matches any letter)", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  const b = buildPrepare({ words: raw.words });
  if ("error" in b) return b;
  const q = raw.query.toLowerCase();
  if (!/^[a-z.]+$/.test(q)) return { error: "Search with letters a to z and dots." };
  if (q.length > 6) return { error: "Use at most 6 characters." };
  return { input: { words: b.input.words, query: q } };
}
const matches = (w: string, q: string) => w.length === q.length && [...q].every((c, i) => c === "." || c === w[i]);

const scanList: Approach<Input> = {
  id: "list",
  name: "Check every stored word",
  code: `function search(word)  // may contain '.'
    for each w in words
        if length(w) = length(word)
            ok ← true
            for i ← 0 to length(w) - 1
                if word[i] ≠ '.' and word[i] ≠ w[i]
                    ok ← false
                    break
            if ok
                return true
    return false
`,
  run({ words, query }, t) {
    const ws = parseWords(words);
    t.step({ line: 2, array: ws, ...wordPanel(query), vars: { search: query },
      message: `Compare "${query}" with each stored word, letter by letter. A '.' matches any letter.` });
    for (let k = 0; k < ws.length; k++) {
      const w = ws[k];
      t.op();
      if (w.length !== query.length) {
        t.step({ line: 3, array: ws, pointers: { w: k }, tones: { [k]: "discard" }, ...wordPanel(query), vars: { w },
          message: `"${w}" has a different length: skip it.` });
        continue;
      }
      let bad = -1;
      for (let i = 0; i < w.length; i++) { t.op(); if (query[i] !== "." && query[i] !== w[i]) { bad = i; break; } }
      if (bad < 0) {
        t.step({ line: 10, array: ws, pointers: { w: k }, tones: { [k]: "found" }, ...wordPanel(query), vars: { w }, done: "found",
          message: `"${w}" fits "${query}" at every position: return true.` });
        return;
      }
      t.step({ line: 7, array: ws, pointers: { w: k }, tones: { [k]: "miss" }, ...wordPanel(query, bad, "miss"), vars: { w, i: bad },
        message: `Position ${bad}: "${query}" needs '${query[bad]}', "${w}" has '${w[bad]}'. Not this word.` });
    }
    t.step({ line: 11, array: ws, ...wordPanel(query), vars: {}, done: "notfound",
      message: `No stored word fits: return false. Every search compares against all N words: O(N · L).` });
  },
};

const trieDfs: Approach<Input> = {
  id: "trie",
  name: "Trie, trying every child at a dot",
  code: `function search(word)  // may contain '.'
    return dfs(root, 0)
function dfs(node, i)
    if i = length(word)
        return node.isEnd
    ch ← word[i]
    if ch = '.'
        for each child in node.children
            if dfs(child, i + 1)
                return true
        return false
    if ch not in node.children
        return false
    return dfs(node.children[ch], i + 1)
`,
  run({ words, query }, t) {
    const trie = new Trie();
    parseWords(words).forEach((w) => trie.insert(w));
    const dead = new Set<string>();
    let asked = false;
    const view = (path: string[], cur: string, tone: Tone) =>
      trie.view({ ...Object.fromEntries([...dead].map((d) => [d, "discard" as Tone])), ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [cur]: tone }, { node: cur });
    t.step({ line: 2, array: [], trees: trie.view({}, { node: trie.root }), ...wordPanel(query), vars: { search: query },
      message: `Walk the trie letter by letter. A real letter has at most one child to follow. A '.' could be any letter, so try each child in turn, and come back if that branch fails (backtracking).` });
    const dfs = (node: string, i: number, path: string[]): boolean => {
      t.op();
      if (i === query.length) {
        const end = trie.ends.has(node);
        t.step({ line: 5, array: [], trees: view(path, node, end ? "found" : "miss"), ...wordPanel(query), vars: { i },
          message: end ? `All ${query.length} characters matched, and this node ends a word: found.` : `All characters matched, but no word ends here. Back up.` });
        if (!end) dead.add(node);
        return end;
      }
      const ch = query[i];
      if (ch === ".") {
        const kids = [...trie.kids.get(node)!.entries()].sort();
        const q = !asked && kids.length > 1 ? (asked = true, { ask: { q: `The search has a '.' here, and this node has ${kids.length} children (${kids.map(([c]) => c).join(", ")}). Which does it try?`, options: ["Each of them, one at a time, until one works", "Only the first", "None: a dot never matches"], answer: 0 } }) : {};
        t.step({ ...q, line: 8, array: [], trees: view(path, node, "compare"), ...wordPanel(query, i), vars: { i, ch },
          message: kids.length ? `'.' matches any letter: try each child (${kids.map(([c]) => c).join(", ")}) in turn.` : `'.' needs one more letter, but this node has no children. Fail.` });
        for (const [, kid] of kids) if (dfs(kid, i + 1, [...path, kid])) return true;
        if (node !== trie.root) dead.add(node);
        return false;
      }
      const kid = trie.child(node, ch);
      if (!kid) {
        t.step({ line: 13, array: [], trees: view(path, node, "miss"), ...wordPanel(query, i, "miss"), vars: { i, ch },
          message: `No '${ch}' child here: this branch fails. Back up.` });
        if (node !== trie.root) dead.add(node);
        return false;
      }
      t.step({ line: 14, array: [], trees: view([...path, kid], kid, "compare"), ...wordPanel(query, i), vars: { i, ch },
        message: `'${ch}' is there: follow it.` });
      return dfs(kid, i + 1, [...path, kid]);
    };
    const ok = dfs(trie.root, 0, []);
    t.step({ line: 2, array: [], trees: trie.view(Object.fromEntries([...dead].map((d) => [d, "discard" as Tone]))), ...wordPanel(query), vars: { found: String(ok) }, done: ok ? "found" : "notfound",
      message: ok ? `Return true. Letters cost one step each; only dots branch, and failed branches are dropped as soon as a letter doesn't fit.` : `Every branch failed: return false. Without dots this is O(L); each dot can multiply the branches tried by up to 26.` });
  },
};

export const approaches = { list: scanList, trie: trieDfs };

/** n stored five-letter words, and one search with no dots that matches none of them. */
const word5 = (i: number) => "a" + Array.from({ length: 4 }, (_, k) => String.fromCharCode(97 + (Math.floor(i / 26 ** k) % 26))).join("");
export const growth = measureGrowth(
  [{ approach: scanList, slot: 1 }, { approach: trieDfs, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, i) => word5(i)).join(", "), query: "aaaaz" }),
  [8, 16, 32, 48, 64],
);
