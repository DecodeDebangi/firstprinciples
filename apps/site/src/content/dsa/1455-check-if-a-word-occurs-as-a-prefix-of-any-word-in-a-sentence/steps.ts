import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { sentence: string; search: string };
export const example: Input = { sentence: "the cat sat on a catalog", search: "cat" };
export const fields: InputField[] = [{ key: "sentence", label: "sentence", kind: "raw" }, { key: "search", label: "search word", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.sentence.trim().toLowerCase().replace(/\s+/g, " "), w = raw.search.toLowerCase();
  if (!/^[a-z]+( [a-z]+){0,7}$/.test(s)) return { error: "Use 1 to 8 words of letters a to z, separated by single spaces." };
  if (!/^[a-z]{1,6}$/.test(w)) return { error: "Use a search word of 1 to 6 letters a to z." };
  return { input: { sentence: s, search: w } };
}

const split: Approach<Input> = {
  id: "split", name: "Split into words, check each",
  code: `function isPrefixOfWord(sentence, searchWord)
    words ← sentence split at spaces
    for i from 0 to length(words) − 1
        if words[i] starts with searchWord
            return i + 1  // positions count from 1
    return −1
`,
  run({ sentence, search }, t) {
    const words = sentence.split(" "); t.op(sentence.length);
    if (t.record) t.step({ line: 2, array: words, vars: {}, message: `Split the sentence into words (a new list), then check each word's start against "${search}". Positions count from 1.` });
    for (let i = 0; i < words.length; i++) {
      t.op(Math.min(search.length, words[i].length));
      const ok = words[i].startsWith(search);
      if (t.record) t.step({ line: ok ? 5 : 4, array: words, tones: { [i]: ok ? "found" : "discard" }, vars: { word: words[i], position: i + 1 }, ...(ok ? { done: "found" as const } : {}),
        message: ok ? `"${words[i]}" starts with "${search}": return ${i + 1}.` : `"${words[i]}" doesn't start with "${search}".` });
      if (ok) return;
    }
    if (t.record) t.step({ line: 6, array: words, vars: { answer: -1 }, done: "notfound", message: `No word starts with "${search}": return −1.` });
  },
};

const scan: Approach<Input> = {
  id: "scan", name: "One pass over the letters, no splitting",
  code: `function isPrefixOfWord(sentence, w)  // w: searched
    word, matched ← 1, 0  // letters of w matched
    for each letter c in sentence
        if c = " "
            word, matched ← word + 1, 0
        else if matched ≥ 0 and c = w[matched]
            matched ← matched + 1
            if matched = length(w)
                return word
        else
            matched ← −1  // this word can't match
    return −1
`,
  run({ sentence, search }, t) {
    const chars = [...sentence];
    let word = 1, matched = 0, asked = 0;
    const g = (i: number, tone: Tone) => ({ grid: { title: "sentence", rows: [chars.map((c) => (c === " " ? "␣" : c))], tones: { [`0,${i}`]: tone } } });
    if (t.record) t.step({ line: 2, array: [], grid: { title: "sentence", rows: [chars.map((c) => (c === " " ? "␣" : c))] }, vars: { word, matched }, message: `Read the letters once, counting words at each space. Track how many letters of "${search}" the current word has matched; once a letter doesn't match, mark the word as hopeless (−1) until the next space.` });
    for (let i = 0; i < chars.length; i++) {
      t.op();
      const c = chars[i];
      if (c === " ") { word++; matched = 0; continue; }
      if (matched >= 0 && c === search[matched]) {
        matched++;
        if (matched === search.length) { if (t.record) t.step({ line: 9, array: [], ...g(i, "found"), vars: { word, matched }, done: "found", message: `Word ${word} has matched all of "${search}": return ${word}. No list of words was made.` }); return; }
        const ask = t.record && asked < 1 && matched === 1 ? (asked++, { ask: { q: `Word ${word} starts with '${c}', matching "${search}" so far. What is tracked?`, options: [`matched = ${matched}`, "The whole word", "Nothing until the space"], answer: 0 } }) : {};
        if (t.record) t.step({ ...ask, line: 7, array: [], ...g(i, "compare"), vars: { word, matched }, message: `'${c}' matches letter ${matched} of "${search}".` });
      } else if (matched >= 0) {
        matched = -1;
        if (t.record) t.step({ line: 11, array: [], ...g(i, "miss"), vars: { word, matched }, message: `'${c}' doesn't match "${search}" here: word ${word} can't start with it. Ignore the rest of this word.` });
      }
    }
    if (t.record) t.step({ line: 12, array: [], grid: { title: "sentence", rows: [chars.map((c) => (c === " " ? "␣" : c))] }, vars: { answer: -1 }, done: "notfound", message: `No word starts with "${search}": return −1.` });
  },
};

export const approaches = { split, scan };
