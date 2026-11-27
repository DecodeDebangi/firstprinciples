import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { s: string; dictionary: string };
export const example: Input = { s: "onetwoxthree", dictionary: "one, two, three, on" };
export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }, { key: "dictionary", label: "dictionary", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.toLowerCase(), d = [...new Set(parseWords(raw.dictionary))];
  if (!/^[a-z]{1,12}$/.test(s)) return { error: "Use a string s of 1 to 12 letters a to z." };
  if (!d.length || d.length > 5 || d.some((x) => !/^[a-z]{1,6}$/.test(x))) return { error: "Give 1 to 5 dictionary words of 1 to 6 letters." };
  const t = new Trie(); d.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 20) return { error: "Those words branch too much to fit; use fewer or shorter words." };
  return { input: { s, dictionary: d.join(", ") } };
}
const grid = (s: string, dp: (number | null)[], tones: Record<string, Tone> = {}) => ({ title: "dp[i]: fewest extras in s[i..end]", rows: [[...s, ""], dp.map((x) => (x === null ? "" : x))], rowLabels: ["s", "dp"], colLabels: dp.map((_, k) => k), tones });

const withSet: Approach<Input> = {
  id: "set", name: "A table, checking each piece in a set",
  code: `function minExtraChar(s, dictionary)
    words ← set of dictionary
    n ← length(s)
    dp ← list of n + 1 zeros
    // dp[i]: fewest extras in s[i..end]
    for i from n − 1 down to 0
        dp[i] ← dp[i + 1] + 1  // s[i] is extra
        for j from i to n − 1
            if s[i..j] is in words  // a copy
                dp[i] ← min(dp[i], dp[j + 1])
    return dp[0]
`,
  run({ s, dictionary }, t) {
    const words = new Set(parseWords(dictionary)), n = s.length, dp: (number | null)[] = Array(n + 1).fill(null); dp[n] = 0;
    if (t.record) t.step({ line: 5, array: [], grid: grid(s, dp), vars: {}, message: "Work from the end. dp[i] is the fewest letters left over when s[i..end] is cut into dictionary words and spare letters. Either s[i] is spare, or a dictionary word starts at i and the rest is handled by dp after it." });
    for (let i = n - 1; i >= 0; i--) {
      let best = (dp[i + 1] as number) + 1; const hits: string[] = [];
      for (let j = i; j < n; j++) { t.op(j - i + 1); const piece = s.slice(i, j + 1); if (words.has(piece)) { hits.push(piece); best = Math.min(best, dp[j + 1] as number); } }
      dp[i] = best;
      if (t.record) t.step({ line: 10, array: [], grid: grid(s, dp, { [`1,${i}`]: "found", [`0,${i}`]: "active" }), vars: { i, "dp[i]": best },
        message: `From position ${i}: copied out ${n - i} piece${n - i === 1 ? "" : "s"} to check against the set${hits.length ? `; ${hits.map((h) => `"${h}"`).join(" and ")} ${hits.length === 1 ? "is a word" : "are words"}` : ", none is a word"}. dp[${i}] = ${best}.` });
    }
    if (t.record) t.step({ line: 11, array: [], grid: grid(s, dp), vars: { answer: dp[0] }, done: "found", message: `${dp[0]} letter${dp[0] === 1 ? "" : "s"} left over. Copying each piece makes this O(n³) letters in the worst case.` });
  },
};

const withTrie: Approach<Input> = {
  id: "trie", name: "A table, walking a trie from each position",
  code: `function minExtraChar(s, dictionary)
    root ← a trie of dictionary
    n ← length(s)
    dp ← list of n + 1 zeros
    // dp[i]: fewest extras in s[i..end]
    for i from n − 1 down to 0
        dp[i] ← dp[i + 1] + 1  // s[i] is extra
        node ← root
        for j from i to n − 1
            node ← node.child[s[j]]
            if node = none
                leave this inner loop
            if node ends a word
                dp[i] ← min(dp[i], dp[j + 1])
    return dp[0]
`,
  run({ s, dictionary }, t) {
    const tr = new Trie(); parseWords(dictionary).forEach((w) => tr.insert(w));
    const n = s.length, dp: (number | null)[] = Array(n + 1).fill(null); dp[n] = 0;
    let asked = 0;
    if (t.record) t.step({ line: 5, array: [], trees: tr.view(), grid: grid(s, dp), vars: {}, message: "The same table, but the pieces starting at i are found by walking the trie along s from i. The walk stops as soon as no word continues, and it never copies a piece out." });
    for (let i = n - 1; i >= 0; i--) {
      let best = (dp[i + 1] as number) + 1, node: string | undefined = tr.root; const path: string[] = [], hits: string[] = [];
      for (let j = i; j < n; j++) { t.op(); node = tr.child(node!, s[j]); if (!node) break; path.push(node); if (tr.ends.has(node)) { hits.push(s.slice(i, j + 1)); best = Math.min(best, dp[j + 1] as number); } }
      dp[i] = best;
      const ask = t.record && asked < 1 && hits.length ? (asked++, { ask: { q: `From position ${i}, "${hits[0]}" is a word, and dp after it is ${dp[i + hits[0].length]}. Making s[${i}] spare would give ${(dp[i + 1] as number) + 1}. What is dp[${i}]?`, options: [...new Set([best, (dp[i + 1] as number) + 1, best + 1].map(String))], answer: 0 } }) : {};
      if (t.record) t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: hits.length ? 14 : 7, array: [], trees: tr.view(Object.fromEntries(path.map((p) => [p, (tr.ends.has(p) ? "found" : "visited") as Tone]))), grid: grid(s, dp, { [`1,${i}`]: "found", ...Object.fromEntries(path.map((_, k) => [`0,${i + k}`, "compare" as Tone])) }), vars: { i, "dp[i]": best },
        message: `From position ${i}: the trie follows "${s.slice(i, i + path.length)}"${path.length < n - i ? ` and stops at '${s[i + path.length]}'` : ""}${hits.length ? `, finding ${hits.map((h) => `"${h}"`).join(" and ")}` : ", finding no word"}. dp[${i}] = ${best}.` });
    }
    if (t.record) t.step({ line: 15, array: [], trees: tr.view(), grid: grid(s, dp), vars: { answer: dp[0] }, done: "found", message: `${dp[0]} letter${dp[0] === 1 ? "" : "s"} left over. Each position walks the trie at most as far as the longest word, with no copying: O(n · L).` });
  },
};

export const approaches = { set: withSet, trie: withTrie };
/** A string of n a's and the dictionary a, aa, aaa, aaaa: every position has many pieces to check. */
export const growth = measureGrowth(
  [{ approach: withSet, slot: 1 }, { approach: withTrie, slot: 3 }],
  (n) => ({ s: "a".repeat(n), dictionary: "a, aa, aaa, aaaa" }),
  [8, 16, 32, 64, 128, 256],
);
