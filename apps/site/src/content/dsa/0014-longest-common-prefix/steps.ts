import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { words: string };
export const example: Input = { words: "carpet, cargo, card" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export const parseWords = (s: string) => s.split(/[\s,]+/).filter(Boolean);
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words);
  if (!w.length) return { error: "Give at least one word, separated by commas." };
  if (w.length > 5) return { error: "Use at most 5 words." };
  if (w.some((x) => x.length > 8)) return { error: "Keep each word to 8 characters or fewer so it fits." };
  return { input: { words: w.join(", ") } };
}

type T = Parameters<Approach<Input>["run"]>[1];
/** The words as rows of one board, padded with invisible cells so columns line up. */
const boardOf = (ws: string[], tones: Record<string, Tone> = {}) => {
  const width = Math.max(...ws.map((w) => w.length), 1);
  return { rows: ws.map((w) => Array.from({ length: width }, (_, i) => w[i] ?? "")), labels: true, tones };
};
const prefixTones = (ws: string[], len: number, tone: Tone = "settled") => {
  const t: Record<string, Tone> = {};
  ws.forEach((_, r) => { for (let c = 0; c < len; c++) t[`${r},${c}`] = tone; });
  return t;
};
const show = (p: string) => (p ? `"${p}"` : `"" (nothing in common)`);

const longestFirst: Approach<Input> = {
  id: "longestFirst",
  name: "Try each prefix, longest first",
  code: `function longestCommonPrefix(words)
    first ← words[0]
    for len ← length(first) down to 0
        p ← first[0..len-1]
        if every w in words starts with p
            return p
`,
  run({ words }, t: T) {
    const ws = parseWords(words), first = ws[0];
    t.step({ line: 2, array: [], board: boardOf(ws), vars: { first },
      message: `The answer can't be longer than the first word, and it must be a prefix of it. So try the first word's prefixes from longest to shortest, and return the first one that every word starts with.` });
    let asked = false;
    for (let len = first.length; len >= 0; len--) {
      const p = first.slice(0, len);
      let fail: [number, number] | null = null;
      for (let r = 0; r < ws.length && !fail; r++) {
        for (let c = 0; c < len; c++) {
          t.op();
          if (ws[r][c] !== p[c]) { fail = [r, c]; break; }
        }
      }
      const ask = !asked && fail && len < first.length
        ? (asked = true, { ask: { q: `Trying ${show(p)}. Does every word start with it?`, options: ["No: try a shorter prefix", "Yes: return it"], answer: 0 } }) : {};
      if (fail) {
        const [r, c] = fail;
        t.step({ ...ask, line: 5, array: [], board: boardOf(ws, { ...prefixTones(ws, len, "compare"), [`${r},${c}`]: "miss" }), vars: { len, p: `"${p}"` },
          message: `${show(p)}: "${ws[r]}" ${c < ws[r].length ? `has '${ws[r][c]}' at position ${c}, not '${p[c]}'` : `is only ${ws[r].length} long`}. Try one character shorter.` });
        continue;
      }
      t.step({ line: 6, array: [], board: boardOf(ws, prefixTones(ws, len, "found")), vars: { len, p: `"${p}"` }, done: "found",
        message: `Every word starts with ${show(p)}: return it. In the worst case it tries all L prefixes of the first word (L is its length), each reading up to n · L characters that earlier tries already read: O(n · L²).` });
      return;
    }
  },
};

const columns: Approach<Input> = {
  id: "columns",
  name: "Column by column",
  code: `function longestCommonPrefix(words)
    first ← words[0]
    for i ← 0 to length(first) - 1
        for each w in words
            if i = length(w) or w[i] ≠ first[i]
                return first[0..i-1]
    return first
`,
  run({ words }, t: T) {
    const ws = parseWords(words), first = ws[0];
    t.step({ line: 2, array: [], board: boardOf(ws), vars: { first },
      message: `Build the prefix one column at a time. Column i joins the prefix only if every word has the same character there as the first word. The first column where any word disagrees, or runs out, ends it.` });
    let asked = false;
    for (let i = 0; i < first.length; i++) {
      for (let r = 0; r < ws.length; r++) {
        t.op();
        const w = ws[r], out = i === w.length, bad = out || w[i] !== first[i];
        const ask = !asked && bad
          ? (asked = true, { ask: { q: `Column ${i}: the first word has '${first[i]}', and "${w}" has ${out ? "no character there" : `'${w[i]}'`}. What now?`, options: [`Stop: the prefix is ${show(first.slice(0, i))}`, `Add '${first[i]}' to the prefix`, "Skip this word"], answer: 0 } }) : {};
        if (bad) {
          t.step({ ...ask, line: 6, array: [], board: boardOf(ws, { ...prefixTones(ws, i), [`${r},${i}`]: "miss", [`0,${i}`]: "compare" }), vars: { i, w, prefix: `"${first.slice(0, i)}"` }, done: "found",
            message: `"${w}" ${out ? `ends before column ${i}` : `has '${w[i]}' in column ${i}, not '${first[i]}'`}. The common prefix is ${show(first.slice(0, i))}. Only the columns up to here were ever read: O(n · m), where m is the prefix's length.` });
          return;
        }
        t.step({ line: 5, array: [], board: boardOf(ws, { ...prefixTones(ws, i), [`${r},${i}`]: "compare" }), vars: { i, w, prefix: `"${first.slice(0, i)}"` },
          message: `"${w}" has '${w[i]}' in column ${i}${r === 0 ? " (the first word sets what to match)" : ", the same as the first word"}.` });
      }
      t.step({ line: 3, array: [], board: boardOf(ws, prefixTones(ws, i + 1)), vars: { i, prefix: `"${first.slice(0, i + 1)}"` },
        message: `Every word has '${first[i]}' in column ${i}: the prefix grows to "${first.slice(0, i + 1)}".` });
    }
    t.step({ line: 7, array: [], board: boardOf(ws, prefixTones(ws, first.length, "found")), vars: { prefix: `"${first}"` }, done: "found",
      message: `Every word starts with the whole of "${first}": return it.` });
  },
};

export const approaches = { longestFirst, columns };

/** A long first word and two short words that share only its first letter: most prefixes fail. */
export const growth = measureGrowth(
  [{ approach: longestFirst, slot: 1 }, { approach: columns, slot: 3 }],
  (n) => ({ words: ["a".repeat(n), "ab", "ac"].join(", ") }),
  [4, 8, 16, 24, 32],
);
