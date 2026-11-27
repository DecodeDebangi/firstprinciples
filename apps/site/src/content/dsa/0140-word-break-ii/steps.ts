import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { s: string; dict: string };
export const example: Input = { s: "icecreamcone", dict: "ice, cream, icecream, cone, creamcone" };
export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }, { key: "dict", label: "dictionary", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.toLowerCase(), d = [...new Set(parseWords(raw.dict))];
  if (!/^[a-z]{1,14}$/.test(s)) return { error: "Use a string s of 1 to 14 letters a to z." };
  if (!d.length || d.length > 6 || d.some((x) => !/^[a-z]{1,9}$/.test(x))) return { error: "Give 1 to 6 dictionary words of 1 to 9 letters." };
  const t = new Trie(); d.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 26) return { error: "Those words branch too much for the trie to fit." };
  return { input: { s, dict: d.join(", ") } };
}
const sGrid = (s: string, tones: Record<string, Tone> = {}) => ({ title: "s", rows: [[...s]], colLabels: [...s].map((_, k) => k), tones });

const plain: Approach<Input> = {
  id: "plain", name: "Try every first word, recursively",
  code: `function wordBreak(s, wordDict)
    words ← set of wordDict
    return build(0)
function build(i)  // every sentence for s[i..end]
    if i = length(s)
        return [""]
    out ← []
    for j from i to length(s) − 1
        w ← s[i..j]
        if w is in words
            for each rest in build(j + 1)
                if rest = ""
                    out.push(w)
                else
                    out.push(w + " " + rest)
    return out
`,
  run({ s, dict }, t) {
    const words = new Set(parseWords(dict)), calls = new Map<number, number>();
    const build = (i: number): string[] => {
      t.op(); calls.set(i, (calls.get(i) ?? 0) + 1);
      if (i === s.length) return [""];
      const out: string[] = [];
      for (let j = i; j < s.length; j++) { t.op(j - i + 1); const w = s.slice(i, j + 1); if (words.has(w)) for (const r of build(j + 1)) out.push(r ? `${w} ${r}` : w); }
      return out;
    };
    if (t.record) t.step({ line: 3, array: [], grid: sGrid(s), vars: {}, message: "List every way to cut s into dictionary words. Try each dictionary word that s starts with, then list every way to cut the rest, the same way." });
    const res = build(0);
    const repeats = [...calls].filter(([, c]) => c > 1);
    if (t.record) t.step({ line: 16, array: [], grid: sGrid(s, Object.fromEntries(repeats.map(([i]) => [`0,${i}`, "miss" as Tone]))), map: { title: "sentences", entries: res.map((x, k) => [String(k + 1), x] as [string, string]) }, vars: { sentences: res.length, "calls made": [...calls.values()].reduce((a, b) => a + b, 0) }, done: "found",
      message: `${res.length} sentence${res.length === 1 ? "" : "s"}. ${repeats.length ? `The rest of s from position ${repeats.map(([i, c]) => `${i} (${c}×)`).join(", ")} was worked out more than once (red).` : "No position was worked out twice here,"} On strings like "aaaa…" this repetition grows exponentially, even when there are no sentences at all.` });
  },
};

const memo: Approach<Input> = {
  id: "memo", name: "Remember each position's sentences, walking a trie",
  code: `function wordBreak(s, wordDict)
    root ← a trie of wordDict
    memo ← empty map  // i → sentences of s[i..end]
    return build(0)
function build(i)
    if i = length(s)
        return [""]
    if i is in memo
        return memo[i]
    out, node ← [], root
    for j from i to length(s) − 1
        node ← node.child[s[j]]
        if node = none
            leave this loop
        if node ends a word
            w ← s[i..j]
            for each rest in build(j + 1)
                if rest = ""
                    out.push(w)
                else
                    out.push(w + " " + rest)
    memo[i] ← out
    return out
`,
  run({ s, dict }, t) {
    const tr = new Trie(); parseWords(dict).forEach((w) => tr.insert(w));
    const memoMap = new Map<number, string[]>();
    let asked = 0;
    const entries = () => [...memoMap].sort((a, b) => b[0] - a[0]).map(([i, v]) => [`from ${i}`, v.length ? v.join(" | ") : "none"] as [string, string]);
    if (t.record) t.step({ line: 4, array: [], trees: tr.view(), grid: sGrid(s), map: { title: "memo", entries: [] }, vars: {}, message: "The sentences for the rest of s from position i are the same however you got to i. Work each position out once and remember it. The dictionary words starting at i are found by walking a trie along s." });
    const build = (i: number): string[] => {
      t.op();
      if (i === s.length) return [""];
      const hit = memoMap.get(i);
      if (hit) {
        if (t.record) t.step({ line: 9, array: [], trees: tr.view(), grid: sGrid(s, Object.fromEntries([...s].map((_, k) => [`0,${k}`, (k >= i ? "found" : "settled") as Tone]))), map: { title: "memo", entries: entries() }, vars: { i },
          message: `Position ${i} again: its sentences are already in the memo (${hit.length ? hit.join(" | ") : "none"}). Reuse them instead of working it out again.` });
        return hit;
      }
      const out: string[] = []; let node: string | undefined = tr.root; const path: string[] = [];
      for (let j = i; j < s.length; j++) {
        t.op(); node = tr.child(node!, s[j]); if (!node) break; path.push(node);
        if (tr.ends.has(node)) { const w = s.slice(i, j + 1); for (const r of build(j + 1)) out.push(r ? `${w} ${r}` : w); }
      }
      memoMap.set(i, out);
      const ask = t.record && asked < 1 && out.length ? (asked++, { ask: { q: `Position ${i}'s sentences are now known. If another cut reaches position ${i} later, what happens?`, options: ["Its sentences are read from the memo", "They're worked out again", "It's skipped as a dead end"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 22, array: [], trees: tr.view(Object.fromEntries(path.map((p) => [p, (tr.ends.has(p) ? "found" : "visited") as Tone]))), grid: sGrid(s, Object.fromEntries(path.map((_, k) => [`0,${i + k}`, "compare" as Tone]))), map: { title: "memo", entries: entries() }, vars: { i },
        message: `From position ${i}, the trie follows "${s.slice(i, i + path.length)}"${path.filter((p) => tr.ends.has(p)).length ? `, where ${path.filter((p) => tr.ends.has(p)).length} word${path.filter((p) => tr.ends.has(p)).length === 1 ? " ends" : "s end"}` : ", finding no word"}. Sentences for the rest from ${i}: ${out.length ? out.join(" | ") : "none"}. Remember them.` });
      return out;
    };
    const res = build(0);
    if (t.record) t.step({ line: 4, array: [], trees: tr.view(), grid: sGrid(s), map: { title: "sentences", entries: res.map((x, k) => [String(k + 1), x] as [string, string]) }, vars: { sentences: res.length }, done: "found",
      message: `${res.length} sentence${res.length === 1 ? "" : "s"}. Each position is worked out once, so the search itself is O(n · L) trie steps, plus the time to write out the sentences, which can't be avoided.` });
  },
};

export const approaches = { plain, memo };
/** n a's then a b, with the dictionary a, aa, aaa: no sentence exists, but plain recursion tries every way of cutting the a's. */
export const growth = measureGrowth(
  [{ approach: plain, slot: 1 }, { approach: memo, slot: 3 }],
  (n) => ({ s: "a".repeat(n) + "b", dict: "a, aa, aaa" }),
  [4, 8, 12, 16, 20],
);
