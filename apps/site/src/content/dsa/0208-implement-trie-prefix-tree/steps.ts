import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, insertSteps, searchSteps, wordPanel } from "../../concepts/42-tries/steps";

/** Operations like "insert cat, search ca, startsWith ca". */
export type Input = { ops: string };
export const example: Input = { ops: "insert cat, insert car, search ca, startsWith ca, insert ca, search ca" };
export const fields: InputField[] = [{ key: "ops", label: "operations", kind: "raw" }];
type Op = { kind: "insert" | "search" | "startsWith"; word: string };
export const parseOps = (s: string): Op[] =>
  s.split(/[,;\n]+/).map((x) => x.trim().split(/\s+/)).filter((p) => p.length === 2).map(([k, w]) => ({ kind: k as Op["kind"], word: w.toLowerCase() }));
export function prepare(raw: Input): Prepared<Input> {
  const parts = raw.ops.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  const ops = parseOps(raw.ops);
  if (!ops.length || ops.length !== parts.length || ops.some((o) => !["insert", "search", "startsWith"].includes(o.kind)))
    return { error: 'Write operations like "insert cat, search ca, startsWith ca", separated by commas.' };
  if (ops.some((o) => !/^[a-z]+$/.test(o.word))) return { error: "Use words of the letters a to z." };
  if (ops.length > 7) return { error: "Use at most 7 operations." };
  const t = new Trie(); ops.filter((o) => o.kind === "insert").forEach((o) => t.insert(o.word));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6) return { error: "Those words branch too much to fit; use words that share beginnings." };
  return { input: { ops: ops.map((o) => `${o.kind} ${o.word}`).join(", ") } };
}
const results = (r: string[]) => ({ title: "results", entries: r.map((x, k) => [String(k + 1), x] as [string, string]) });

const asList: Approach<Input> = {
  id: "list",
  name: "Keep a plain list of words",
  code: `words ← empty list
function insert(word)
    words.push(word)
function search(word)
    for each w in words
        if w = word
            return true
    return false
function startsWith(prefix)
    for each w in words
        if w starts with prefix
            return true
    return false
`,
  run({ ops }, t) {
    const words: string[] = [], out: string[] = [];
    t.step({ line: 1, array: [], map: results(out), vars: {},
      message: `The simplest store: a list. Inserting is quick, but every question has to look through the words one by one.` });
    for (const op of parseOps(ops)) {
      if (op.kind === "insert") {
        t.op(); words.push(op.word); out.push(`insert ${op.word}: done`);
        t.step({ line: 3, array: [...words], tones: { [words.length - 1]: "found" }, map: results(out), vars: { op: `insert ${op.word}` },
          message: `Add "${op.word}" to the end of the list.` });
        continue;
      }
      const pre = op.kind === "startsWith";
      let hit = -1;
      for (let i = 0; i < words.length; i++) {
        t.op(Math.min(op.word.length, words[i].length) + 1);
        const ok = pre ? words[i].startsWith(op.word) : words[i] === op.word;
        if (ok) { hit = i; break; }
        t.step({ line: pre ? 11 : 6, array: [...words], pointers: { w: i }, tones: { [i]: "miss" }, map: results(out), vars: { op: `${op.kind} ${op.word}` },
          message: `"${words[i]}" ${pre ? `doesn't start with "${op.word}"` : `isn't "${op.word}"`}. Next.` });
      }
      out.push(`${op.kind} ${op.word}: ${hit >= 0}`);
      t.step({ line: hit >= 0 ? (pre ? 12 : 7) : (pre ? 13 : 8), array: [...words], ...(hit >= 0 ? { pointers: { w: hit }, tones: { [hit]: "found" as Tone } } : {}), map: results(out), vars: { op: `${op.kind} ${op.word}` },
        message: hit >= 0 ? `"${words[hit]}" ${pre ? `starts with "${op.word}"` : "matches"}: return true.` : `No word ${pre ? `starts with "${op.word}"` : `is "${op.word}"`}: return false, after checking all ${words.length}.` });
    }
    t.step({ line: 1, array: [...words], map: results(out), vars: {}, done: "found",
      message: `Each search or startsWith may compare against every stored word: O(n · L) for n words of length up to L.` });
  },
};

const asTrie: Approach<Input> = {
  id: "trie",
  name: "A trie",
  code: `root ← new node  // the empty trie
function insert(word)
    node ← root
    for each ch in word
        if ch not in node.children
            node.children[ch] ← new node
        node ← node.children[ch]
    node.isEnd ← true
function find(s)  // the node that s leads to
    node ← root
    for each ch in s
        if ch not in node.children
            return none
        node ← node.children[ch]
    return node
function search(word)
    node ← find(word)
    return node ≠ none and node.isEnd
function startsWith(prefix)
    return find(prefix) ≠ none
`,
  run({ ops }, t) {
    const trie = new Trie(), out: string[] = [];
    t.step({ line: 1, array: [], trees: trie.view({}, { node: trie.root }), ...wordPanel(""), map: results(out), vars: {},
      message: `A trie shares every common beginning. search and startsWith both walk the same path with find; they differ only in whether the last node must be marked "end".` });
    let first = true;
    for (const op of parseOps(ops)) {
      const v = { op: `${op.kind} ${op.word}` };
      if (op.kind === "insert") {
        insertSteps(trie, op.word, t, { create: 6, follow: 7, end: 8 }, v, first, () => ({ map: results(out) }));
        first = false;
        out.push(`insert ${op.word}: done`);
        continue;
      }
      // The step that answers shows the answer in the results panel too.
      const label = `${op.kind} ${op.word}`;
      const r = searchSteps(trie, op.word, t, { missing: 13, follow: 14, end: op.kind === "search" ? 18 : 20 }, op.kind === "startsWith", v,
        (res) => ({ map: results(res === undefined ? out : [...out, `${label}: ${res}`]) }), false);
      const ok = op.kind === "search" ? r === "word" : r !== "none";
      out.push(`${label}: ${ok}`);
    }
    t.step({ line: 1, array: [], trees: trie.view(), ...wordPanel(""), map: results(out), vars: {}, done: "found",
      message: `Every operation took one step per letter of its word: O(L), however many words are stored.` });
  },
};

export const approaches = { list: asList, trie: asTrie };

/** n stored five-letter words, then 5 searches for words that aren't there. */
const word5 = (i: number) => Array.from({ length: 5 }, (_, k) => String.fromCharCode(97 + (Math.floor(i / 26 ** k) % 26))).join("");
export const growth = measureGrowth(
  [{ approach: asList, slot: 1 }, { approach: asTrie, slot: 3 }],
  (n) => ({ ops: [...Array.from({ length: n }, (_, i) => `insert ${word5(i)}`), ...Array.from({ length: 5 }, (_, i) => `search ${word5(n + i)}`)].join(", ") }),
  [8, 16, 32, 48, 64],
);
