import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** Spaces are drawn as "␣" so they can be seen. */
export const showSpaces = (s: string) => [...s].map((c) => (c === " " ? "␣" : c));

/* ---------- Splitting into words ---------- */
export type SplitInput = { s: string };
export const splitExample: SplitInput = { s: " hi  mom " };
export const splitFields: InputField[] = [{ key: "s", label: "text (spaces allowed)", kind: "raw" }];
export function splitPrepare(raw: SplitInput): Prepared<SplitInput> {
  if (!raw.s.length) return { error: "Type some text." };
  if (raw.s.length > 9) return { error: "Use at most 9 characters (spaces count) so it fits." };
  return { input: raw };
}

const split: Approach<SplitInput> = {
  id: "split",
  name: "Split into words by hand",
  code: `function splitWords(s)
    words ← empty list
    i ← 0
    while i < length(s)
        while i < length(s) and s[i] = ' '
            i += 1  // skip spaces
        start ← i
        while i < length(s) and s[i] ≠ ' '
            i += 1  // walk over the word
        if i > start
            words.push(s[start..i-1])
    return words
`,
  run({ s }, t) {
    const a = showSpaces(s), n = s.length, words: string[] = [];
    const tones: Record<number, Tone> = {};
    const panel = () => ({ grid: { title: "words", rows: [words.length ? [...words] : [""]] } });
    t.step({ line: 2, array: a, ...panel(), vars: { i: 0 },
      message: `Spaces (shown as ␣) separate the words, and there may be several in a row, or some at either end. Alternate: skip a run of spaces, then walk over a run of letters, which is one word.` });
    let i = 0, asked = false;
    while (i < n) {
      const from = i;
      while (i < n && s[i] === " ") { t.op(); tones[i] = "discard"; i++; }
      if (i > from) {
        t.step({ line: 6, array: a, ...(i < n ? { pointers: { i } } : {}), tones: { ...tones }, ...panel(), vars: { i },
          message: `Skip ${i - from} space${i - from > 1 ? "s" : ""}${i < n ? `: i stops at '${s[i]}', the start of a word` : ", reaching the end"}.` });
      }
      const start = i;
      while (i < n && s[i] !== " ") { t.op(); i++; }
      if (i > start) {
        const w = s.slice(start, i);
        const ask = !asked && words.length === 1
          ? (asked = true, { ask: { q: `The second word runs from ${start} to ${i - 1}. What gets added to the list?`, options: [`"${w}"`, `"${w} "`, `"${s.slice(start - 1, i)}"`].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
        words.push(w);
        for (let k = start; k < i; k++) tones[k] = "settled";
        t.step({ ...ask, line: 11, array: a, range: [start, i - 1], ...(i < n ? { pointers: { i } } : {}), tones: { ...tones }, ...panel(), vars: { start, i },
          message: `Walk over "${w}" until ${i < n ? "a space" : "the end"}: it's positions ${start} to ${i - 1}. Add it to the list.` });
      }
    }
    t.step({ line: 12, array: a, tones, ...panel(), vars: { words: words.length }, done: "found",
      message: `${words.length} word${words.length === 1 ? "" : "s"}: ${words.map((w) => `"${w}"`).join(", ") || "none"}. Every character was looked at once: O(n). Extra and edge spaces simply never become words.` });
  },
};

/* ---------- Reading a number ---------- */
export type NumInput = { s: string };
export const numExample: NumInput = { s: "-4096" };
export const numFields: InputField[] = [{ key: "s", label: "digits (optional - first)", kind: "text" }];
export function numPrepare(raw: NumInput): Prepared<NumInput> {
  const s = raw.s.trim();
  if (!/^-?\d+$/.test(s)) return { error: "Type digits, with an optional - in front." };
  if (s.replace("-", "").length > 7) return { error: "Use at most 7 digits so it fits." };
  return { input: { s } };
}

const parse: Approach<NumInput> = {
  id: "parse",
  name: "Digits to a number",
  code: `function parseNumber(s)
    sign, i ← 1, 0
    if s[0] = '-'
        sign, i ← -1, 1
    result ← 0
    while i < length(s)
        d ← code(s[i]) - code('0')
        result ← result · 10 + d
        i += 1
    return sign · result
`,
  run({ s }, t) {
    const a = [...s];
    let sign = 1, i = 0, result = 0;
    t.step({ line: 2, array: a, vars: { sign, result },
      message: `The text "${s}" is characters, not a number. Read it left to right: each new digit shifts what you have one place left (× 10) and fills the units.` });
    if (s[0] === "-") {
      sign = -1; i = 1;
      t.step({ line: 4, array: a, pointers: { i: 0 }, tones: { 0: "visited" }, vars: { sign, result },
        message: `A '-' in front: remember sign = -1, and start reading digits at position 1.` });
    }
    const tones: Record<number, Tone> = sign < 0 ? { 0: "visited" } : {};
    let asked = false;
    for (; i < a.length; i++) {
      t.op();
      const d = a[i].charCodeAt(0) - 48, before = result;
      result = result * 10 + d;
      tones[i] = "settled";
      const ask = !asked && before > 0
        ? (asked = true, { ask: { q: `result is ${before}, and the next digit is ${d}. What is result now?`, options: [String(result), String(before + d), String(d * 10 + before)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      t.step({ ...ask, line: 8, array: a, pointers: { i }, tones: { ...tones, [i]: "active" }, vars: { d, result },
        message: `'${a[i]}' is code ${a[i].charCodeAt(0)}, and '0' is 48, so d = ${d}. result = ${before} · 10 + ${d} = ${result}.` });
    }
    t.step({ line: 10, array: a, tones, vars: { sign, result: sign * result }, done: "found",
      message: `Return ${sign} · ${result} = ${sign * result}. One pass: O(n). Real parsers also check, before each step, that result · 10 + d still fits in the number type.` });
  },
};

export const splitApproaches = { split };
export const numApproaches = { parse };
