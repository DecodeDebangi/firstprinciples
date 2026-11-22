import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { dpGrid } from "../../concepts/55-one-dimensional-dp/steps";

export type Input = { s: string; words: string };
export const example: Input = { s: "sunpots", words: "sun su n pot" };
export const fields: InputField[] = [
  { key: "s", label: "s", kind: "text" },
  { key: "words", label: "words (split by spaces)", kind: "raw" },
];
export const wordList = (w: string) => w.trim().split(/[\s,]+/).filter(Boolean);
/** Calls the plain recursion makes (it stops at the first success). */
export function callsFor(s: string, words: string[]) {
  let calls = 0;
  const go = (i: number): boolean => { calls++; if (calls > 200) return true; if (i === s.length) return true; for (const w of words) if (s.startsWith(w, i) && go(i + w.length)) return true; return false; };
  go(0);
  return calls;
}
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim(), ws = [...new Set(wordList(raw.words))];
  if (!/^[a-z]{1,9}$/.test(s)) return { error: "s must be 1 to 9 lowercase letters, so the table fits." };
  if (!ws.length || ws.length > 8 || ws.some((w) => !/^[a-z]{1,13}$/.test(w))) return { error: "Give 1 to 8 lowercase words, split by spaces." };
  if (callsFor(s, ws) > 40) return { error: "The plain recursion would make too many calls to draw. Try fewer or longer words." };
  return { input: { s, words: ws.join(" ") } };
}

const recurse: Approach<Input> = {
  id: "recurse",
  name: "Plain recursion: try every first word",
  code: `function wordBreak(s, words)
    return canSplit(0)
function canSplit(i)  // can s[i..end] be split?
    if i = length(s)
        return true
    for each word w in words
        if s starts with w at position i
            if canSplit(i + length(w))
                return true
    return false
`,
  run({ s, words }, t) {
    const ws = wordList(words), tree = new CallTree(), seen = new Set<number>(), label = new Map<string, string>();
    let repeats = 0;
    const go = (parent: string | null, i: number, via: string): boolean => {
      const id = tree.add(parent, via);
      label.set(id, `canSplit(${i})`);
      const again = seen.has(i);
      seen.add(i);
      if (again) repeats++;
      const rest = s.slice(i);
      if (i === s.length) { tree.log({ id, kind: "solution", line: 5, note: "✓", vars: { i }, message: `Nothing is left: every letter is covered by words. Return true.` }); return true; }
      const fits = ws.filter((w) => s.startsWith(w, i));
      t.op(ws.length);
      tree.log({ id, kind: fits.length ? (again ? "prune" : "call") : "prune", line: fits.length ? 7 : 10, note: rest, vars: { i, rest },
        message: `${again ? `"${rest}" again: checked from scratch a second time. ` : ""}"${rest}" ${fits.length ? `starts with ${fits.map((w) => `"${w}"`).join(" and ")}: try ${fits.length === 1 ? "it" : "each"}.` : "doesn't start with any word: a dead end, return false."}` });
      for (const w of fits) if (go(id, i + w.length, w)) return true;
      return false;
    };
    const ok = go(null, 0, "·");
    tree.replay(t, {
      intro: { line: 2, message: `Try every word that s starts with, then try to split whatever is left the same way. Each node is a word just used; the text under it is what's left.`, vars: { words: ws.join(", ") } },
      finish: () => ({ line: ok ? 5 : 10, message: `${ok ? `"${s}" can be split into words: true.` : `No way to split "${s}": false.`} ${repeats ? `${repeats} call${repeats === 1 ? "" : "s"} re-checked an ending already known to fail (red). ` : ""}In the worst case the calls grow exponentially with the length of s.`, vars: { answer: ok ? "true" : "false" }, done: ok ? "found" : "notfound" }),
      stackLabel: (id) => label.get(id)!,
    });
  },
};

const table: Approach<Input> = {
  id: "table",
  name: "Fill a table: can the first i letters be split?",
  code: `function wordBreak(s, words)
    dp ← array of n + 1, all false
    dp[0] ← true  // no letters: nothing to split
    for i ← 1 to n
        for each word w in words
            j ← i - length(w)
            if j ≥ 0 and dp[j] and s[j..i - 1] = w
                dp[i] ← true
    return dp[n]
`,
  run({ s, words }, t) {
    const ws = wordList(words), n = s.length, dp = Array(n + 1).fill(false) as boolean[];
    dp[0] = true;
    const show = () => dp.map((b) => (b ? "T" : "F"));
    const g = (tones: Record<string, Tone>) => dpGrid([...s, ""], show(), tones, ["letter", "dp"]);
    t.step({ line: 3, array: [], grid: g({ "1,0": "found" }), vars: { words: ws.join(", ") },
      message: `dp[i] says whether the first i letters can be split into words (T or F). dp[0] is T: no letters need no words. A word w can end at position i when the letters before it, dp[i − length(w)], could be split.` });
    let asked = false;
    for (let i = 1; i <= n; i++) {
      let via: { w: string; j: number } | null = null;
      for (const w of ws) { t.op(); const j = i - w.length; if (j >= 0 && dp[j] && s.slice(j, i) === w) { dp[i] = true; via = via ?? { w, j }; } }
      const ends = ws.filter((w) => i - w.length >= 0 && s.slice(i - w.length, i) === w);
      if (!ends.length && i < n) continue;
      const ask = !asked && ends.length && via ? (asked = true, { ask: { q: `"${s.slice(0, i)}": the word "${via.w}" ends here, and dp[${via.j}] is T. What's dp[${i}]?`, options: ["T", "F"], answer: 0 } }) : {};
      t.step({ ...ask, line: dp[i] ? 8 : 7, array: [], grid: g({ ...(via ? { [`1,${via.j}`]: "compare" } : {}), ...Object.fromEntries(Array.from({ length: i }, (_, k) => [`0,${k}`, (via && k >= via.j ? "compare" : "visited") as Tone])), [`1,${i}`]: dp[i] ? "found" : "miss" }), vars: { i, [`dp[${i}]`]: dp[i] ? "T" : "F" },
        message: via ? `First ${i} letters, "${s.slice(0, i)}": "${via.w}" ends here and ${via.j === 0 ? "nothing comes before it" : `the ${via.j} letters before it split`} (dp[${via.j}] = T). dp[${i}] = T.` : ends.length ? `First ${i} letters: ${ends.map((w) => `"${w}"`).join(" and ")} end${ends.length === 1 ? "s" : ""} here, but the letters before ${ends.length === 1 ? "it" : "them"} can't be split. dp[${i}] = F.` : `First ${i} letters: no word ends here. dp[${i}] = F.` });
    }
    t.step({ line: 9, array: [], grid: g({ [`1,${n}`]: dp[n] ? "found" : "miss" }), vars: { answer: dp[n] ? "true" : "false" }, done: dp[n] ? "found" : "notfound",
      message: `dp[${n}] is ${dp[n] ? "T" : "F"}: ${dp[n] ? "s can be split." : "s can't be split."} Positions where no word ends were skipped in this animation. Each of the n positions checks each of the k words, comparing up to L letters: O(n · k · L).` });
  },
};

export const approaches = { recurse, table };

/** "aaaa…ab" with words a, aa, aaa: every split of the a's fails at the b. */
export const growth = measureGrowth(
  [{ approach: recurse, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ s: "a".repeat(n) + "b", words: "a aa aaa" }),
  [4, 6, 8, 10, 12],
);
