import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string };
export const example: Input = { words: "go, at, goat, to, gate, togo" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = [...new Set(parseWords(raw.words))];
  if (!w.length || w.length > 7) return { error: "Give 1 to 7 different words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,6}$/.test(x))) return { error: "Use words of 1 to 6 letters a to z." };
  const t = new Trie(); w.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 20) return { error: "Those words branch too much for the trie to fit; use words that share beginnings." };
  return { input: { words: w.join(", ") } };
}
const list = (a: string[]) => `[${a.join(", ")}]`;

const recursive: Approach<Input> = {
  id: "recursive", name: "Try every split, recursively",
  code: `function findAllConcatenatedWords(words)
    dict ← set of words
    out ← []
    for each w in words
        if canForm(w, 0, 0)
            out.push(w)
    return out
function canForm(w, start, pieces)
    if start = length(w)
        return pieces ≥ 2
    for end from start + 1 to length(w)
        if w[start..end − 1] is in dict
            if canForm(w, end, pieces + 1)
                return true
    return false
`,
  run(raw, t) {
    const words = parseWords(raw.words), dict = new Set(words), out: string[] = [];
    if (t.record) t.step({ line: 2, array: words, vars: { found: "[]" }, message: "A word counts if it can be cut into two or more pieces that are all words from the list. The direct way tries every first piece that is a word, then cuts the rest the same way, backing up when a cut leads nowhere." });
    for (const w of words) {
      let tries = 0, pieces: string[] | null = null;
      const go = (s: number, cur: string[]): boolean => {
        t.op();
        if (s === w.length) { if (cur.length >= 2) { pieces = [...cur]; return true; } return false; }
        for (let e = s + 1; e <= w.length; e++) { t.op(e - s); tries++; const p = w.slice(s, e); if (dict.has(p)) { cur.push(p); if (go(e, cur)) return true; cur.pop(); } }
        return false;
      };
      const ok = go(0, []);
      if (ok) out.push(w);
      if (t.record) t.step({ line: ok ? 6 : 5, array: words, tones: { [words.indexOf(w)]: ok ? "found" : "discard" }, vars: { word: w, "cuts tried": tries, found: list(out) },
        message: ok ? `"${w}" = ${(pieces as unknown as string[]).map((p) => `"${p}"`).join(" + ")}, found after ${tries} cut${tries === 1 ? "" : "s"}.` : `"${w}": ${tries} cut${tries === 1 ? "" : "s"} tried; no way to make it from two or more listed words.` });
    }
    if (t.record) t.step({ line: 7, array: words, vars: { found: list(out) }, done: "found", message: `${list(out)}. Each word's rest is cut again and again from scratch: the same tail can be retried many times, which grows exponentially for words like "aaaa…".` });
  },
};

const trieDp: Approach<Input> = {
  id: "trie", name: "Shorter words in a trie, and which positions a cut can reach",
  code: `function findAllConcatenatedWords(words)
    sort words by length  // shorter ones first
    out ← []
    for each w in words
        if canSplit(w)
            out.push(w)
        insert w into the trie  // for longer words
    return out
function canSplit(w)  // into words in the trie
    ok ← list of length(w) + 1 falses
    ok[0] ← true
    for i from 0 to length(w) − 1
        if ok[i]  // a cut can land at position i
            node ← root
            for j from i to length(w) − 1
                node ← node.child[w[j]]
                if node = none
                    leave this inner loop
                if node ends a word
                    ok[j + 1] ← true
    return ok[length(w)]
`,
  run(raw, t) {
    const words = parseWords(raw.words).sort((a, b) => { t.op(); return a.length - b.length || (a < b ? -1 : 1); }), tr = new Trie(), out: string[] = [];
    let asked = 0;
    const grid = (w: string, ok: boolean[], extra: Record<string, Tone> = {}) => ({ title: `cuts in "${w}"`, rows: [[...w, ""], ok.map((x) => (x ? "✓" : "·"))], rowLabels: ["letter", "cut ok"], colLabels: ok.map((_, k) => k), tones: { ...Object.fromEntries(ok.map((x, k) => [`1,${k}`, (x ? "found" : "discard") as Tone]).filter(([, x]) => x === "found")), ...extra } });
    if (t.record) t.step({ line: 2, array: [], trees: tr.view(), vars: { order: words.join(", ") }, message: `Sort by length: a word can only be made of shorter words. Go through them shortest first, keeping the words seen so far in a trie. For each word, mark which positions a run of cuts can reach; reaching the end means it can be split.` });
    for (const w of words) {
      const ok = Array(w.length + 1).fill(false); ok[0] = true;
      if (tr.nodes.length > 1) {
        for (let i = 0; i < w.length; i++) {
          if (!ok[i]) continue;
          let node: string | undefined = tr.root; const path: string[] = [], newly: number[] = [];
          for (let j = i; j < w.length; j++) { t.op(); node = tr.child(node!, w[j]); if (!node) break; path.push(node); if (tr.ends.has(node) && !ok[j + 1]) { ok[j + 1] = true; newly.push(j + 1); } }
          const ask = t.record && asked < 1 && newly.length ? (asked++, { ask: { q: `A cut can land at position ${i} of "${w}". Walking the trie from there, a word ends after "${w.slice(i, newly[0])}". What does that mark?`, options: [`Position ${newly[0]} can be reached too`, `"${w}" is finished`, "Nothing"], answer: 0 } }) : {};
          if (t.record) t.step({ ...ask, line: 20, array: [], trees: tr.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])) }), grid: grid(w, ok, Object.fromEntries(Array.from({ length: path.length }, (_, k) => [`0,${i + k}`, "compare" as Tone]))), vars: { word: w, from: i },
            message: newly.length ? `From position ${i}, walk the trie along "${w.slice(i)}": words end after ${newly.map((e) => `"${w.slice(i, e)}"`).join(" and ")}, so position${newly.length === 1 ? "" : "s"} ${newly.join(", ")} can be reached.` : `From position ${i}, the trie follows "${w.slice(i, i + path.length)}" but no word ends that lands anywhere new.` });
        }
      }
      const can = ok[w.length] && tr.nodes.length > 1;
      if (can) out.push(w);
      if (t.record) t.step({ line: can ? 6 : 7, array: [], trees: tr.view(), grid: grid(w, ok), vars: { word: w, found: list(out) },
        message: tr.nodes.length === 1 ? `"${w}" is the shortest: nothing to make it from. Add it to the trie.` : can ? `The end of "${w}" can be reached: it's made of shorter words. Add it to the answer, and to the trie.` : `The end of "${w}" can't be reached. Add it to the trie for longer words.` });
      tr.insert(w); t.op(w.length);
    }
    if (t.record) t.step({ line: 8, array: [], trees: tr.view(), vars: { found: list(out) }, done: "found", message: `${list(out)}. Each word checks each reachable position with one trie walk: O(L²) per word, with nothing retried.` });
  },
};

export const approaches = { recursive, trie: trieDp };
/** a, aa, …, a^(n−1), and a^n b: every cut of the last word works until its final letter. */
export const growth = measureGrowth(
  [{ approach: recursive, slot: 1 }, { approach: trieDp, slot: 3 }],
  (n) => ({ words: [...Array.from({ length: n - 1 }, (_, k) => "a".repeat(k + 1)), "a".repeat(n) + "b"].join(", ") }),
  [4, 6, 8, 10, 12, 14],
);
