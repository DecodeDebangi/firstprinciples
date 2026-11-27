import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";
import { parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string; queries: string };
export const example: Input = { words: "ape, apple, maple", queries: "ap e, ma le, a x" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }, { key: "queries", label: "queries (prefix suffix)", kind: "raw" }];
type Q = { pref: string; suff: string };
const parseQ = (s: string): Q[] => s.split(/[,;\n]+/).map((x) => x.trim().split(/\s+/)).filter((p) => p.length === 2).map(([pref, suff]) => ({ pref: pref.toLowerCase(), suff: suff.toLowerCase() }));
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words), parts = raw.queries.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean), q = parseQ(raw.queries);
  if (!w.length || w.length > 4) return { error: "Give 1 to 4 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,5}$/.test(x))) return { error: "Use words of 1 to 5 letters a to z." };
  if (!q.length || q.length !== parts.length || q.length > 4) return { error: 'Give 1 to 4 queries like "ap e": a prefix, a space, a suffix.' };
  if (q.some((x) => !/^[a-z]{1,5}$/.test(x.pref) || !/^[a-z]{1,5}$/.test(x.suff))) return { error: "Use prefixes and suffixes of 1 to 5 letters a to z." };
  return { input: { words: w.join(", "), queries: q.map((x) => `${x.pref} ${x.suff}`).join(", ") } };
}
const results = (qs: Q[], out: number[]) => ({ title: "f(prefix, suffix)", entries: out.map((r, k) => [`${qs[k].pref}…${qs[k].suff}`, String(r)] as [string, string]) });

const scan: Approach<Input> = {
  id: "scan", name: "Check every word, from the last",
  code: `class WordFilter
    constructor(words)
        this.words ← words
    function f(pref, suff)
        for i from length(words) − 1 down to 0
            if words[i] starts with pref
                    and words[i] ends with suff
                return i
        return −1
`,
  run(raw, t) {
    const words = parseWords(raw.words), qs = parseQ(raw.queries), out: number[] = [];
    if (t.record) t.step({ line: 3, array: words, vars: {}, message: "Each query wants the largest position of a word that starts with the prefix and ends with the suffix. The direct way checks the words from the last one back." });
    for (const q of qs) {
      let ans = -1, checked = 0;
      for (let i = words.length - 1; i >= 0; i--) { t.op(q.pref.length + q.suff.length); checked++; if (words[i].startsWith(q.pref) && words[i].endsWith(q.suff)) { ans = i; break; } }
      out.push(ans);
      if (t.record) t.step({ line: ans >= 0 ? 8 : 9, array: words, tones: ans >= 0 ? { [ans]: "found" } : {}, map: results(qs, out), vars: { prefix: q.pref, suffix: q.suff, checked, answer: ans },
        message: ans >= 0 ? `"${q.pref}…${q.suff}": checked ${checked} word${checked === 1 ? "" : "s"} from the end; "${words[ans]}" at position ${ans} fits.` : `"${q.pref}…${q.suff}": checked all ${checked} words; none fits. −1.` });
    }
    if (t.record) t.step({ line: 9, array: words, map: results(qs, out), vars: {}, done: "found", message: `Answers: ${out.join(", ")}. Each query may check every word: O(n · L).` });
  },
};

const keys: Approach<Input> = {
  id: "trie", name: "One trie of suffix#word keys",
  code: `class WordFilter
    constructor(words)
        for each index i, word w in words
            for k from 0 to length(w)
                key ← w[k..end] + "#" + w
                add key to the trie
                every node on key's path: index ← i
    function f(pref, suff)
        node ← walk suff + "#" + pref from the root
        return node.index if node ≠ none, else −1
`,
  run(raw, t) {
    const words = parseWords(raw.words), qs = parseQ(raw.queries), out: number[] = [];
    const store = new Map<string, number>(); // every key prefix → largest index (the trie's nodes)
    const keyList: [string, number][] = [];
    let asked = 0;
    if (t.record) t.step({ line: 3, array: words, vars: {}, message: `Two conditions at once are hard for one trie. The trick: for every word, store keys made of one of its endings, a "#", then the whole word: "e#ape", "pe#ape", … A query for suffix s and prefix p then becomes one prefix walk: "s#p". (The trie of all these keys is too big to draw clearly, so its keys are listed instead.)` });
    words.forEach((w, i) => {
      const made: string[] = [];
      for (let k = 0; k <= w.length; k++) { const key = w.slice(k) + "#" + w; made.push(key); for (let j = 1; j <= key.length; j++) { t.op(); store.set(key.slice(0, j), i); } const at = keyList.findIndex(([x]) => x === key); if (at >= 0) keyList[at][1] = i; else keyList.push([key, i]); }
      if (t.record) t.step({ line: 7, array: words, tones: { [i]: "active" }, map: { title: "keys in the trie → index", entries: keyList.map(([k, v]) => [k, String(v)] as [string, string]) }, vars: { word: w, keys: made.length },
        message: `"${w}" (position ${i}) adds ${made.length} keys: ${made.join(", ")}. Every node on their paths records index ${i}; later words overwrite it, so a node always holds the largest index that reaches it.` });
    });
    for (const q of qs) {
      const k = q.suff + "#" + q.pref;
      t.op(k.length);
      const ans = store.get(k) ?? -1;
      out.push(ans);
      const matching = keyList.filter(([x]) => x.startsWith(k)).map(([x]) => x);
      const ask = t.record && asked < 1 && q.pref !== q.suff ? (asked++, { ask: { q: `Prefix "${q.pref}", suffix "${q.suff}". Which key does the query walk?`, options: [`"${k}"`, `"${q.pref}#${q.suff}"`, `"${q.pref}${q.suff}"`], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 10, array: words, tones: ans >= 0 ? { [ans]: "found" } : {}, map: results(qs, out), vars: { walk: k, answer: ans },
        message: ans >= 0 ? `Walk "${k}": it exists, starting the keys ${matching.join(", ")}. The node there holds index ${ans}, "${words[ans]}".` : `Walk "${k}": the trie has no such path, so no word fits. −1.` });
    }
    if (t.record) t.step({ line: 10, array: words, map: results(qs, out), vars: {}, done: "found", message: `Answers: ${out.join(", ")}. Building costs O(L²) per word (L + 1 keys of up to 2L + 1 letters); each query is one walk of O(L).` });
  },
};

export const approaches = { scan, trie: keys };
const w = (k: number) => [0, 1, 2].map((j) => String.fromCharCode(97 + (Math.floor(k / 4 ** j) % 4))).join("");
/** n words of 3 letters, then n queries that match nothing, the worst case for scanning. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: keys, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, k) => w(k)).join(", "), queries: Array.from({ length: n }, () => "z y").join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
