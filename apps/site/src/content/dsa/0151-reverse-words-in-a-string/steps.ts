import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { showSpaces } from "../../concepts/39-reading-text-apart/steps";

export type Input = { s: string };
export const example: Input = { s: " hi  you " };
export const fields: InputField[] = [{ key: "s", label: "s (spaces allowed)", kind: "raw" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.s.trim().length) return { error: "Type at least one word." };
  if (raw.s.length > 9) return { error: "Use at most 9 characters (spaces count) so it fits." };
  return { input: raw };
}

const splitJoin: Approach<Input> = {
  id: "splitJoin",
  name: "Split, reverse the list, join",
  code: `function reverseWords(s)
    words ← splitWords(s)  // skips extra spaces
    lo, hi ← 0, length(words) - 1
    while lo < hi
        swap words[lo] and words[hi]
        lo, hi ← lo + 1, hi - 1
    return join(words, " ")
`,
  run({ s }, t) {
    const a = showSpaces(s), words = s.split(" ").filter(Boolean);
    t.op(s.length);
    const panel = (tones: Record<string, Tone> = {}) => ({ grid: { title: "words", rows: [[...words]], colLabels: words.map((_, k) => k), tones } });
    t.step({ line: 2, array: a, ...panel(), vars: { words: words.length },
      message: `Split into words, skipping every run of spaces (see Reading text apart): ${words.map((w) => `"${w}"`).join(", ")}. The extra spaces are gone already.` });
    let lo = 0, hi = words.length - 1, asked = false;
    while (lo < hi) {
      t.op();
      const ask = !asked && words.length > 2 ? (asked = true, { ask: { q: `There are ${words.length} words, numbered from 0. Which two swap first?`, options: [`Words ${lo} and ${hi}`, `Words ${lo} and ${lo + 1}`, `Words ${hi - 1} and ${hi}`], answer: 0 } }) : {};
      [words[lo], words[hi]] = [words[hi], words[lo]];
      t.step({ ...ask, line: 5, array: a, ...panel({ [`0,${lo}`]: "found", [`0,${hi}`]: "found" }), vars: { lo, hi },
        message: `Swap word ${lo} and word ${hi}: now "${words[lo]}" comes before "${words[hi]}".` });
      lo++; hi--;
    }
    const out = words.join(" ");
    t.op(out.length);
    t.step({ line: 7, array: showSpaces(out), tones: Object.fromEntries([...out].map((_, k) => [k, "settled" as Tone])), ...panel(), vars: { result: `"${out}"` }, done: "found",
      message: `Join with one space between: "${out}". O(n) time, and O(n) extra space for the list of words and the new string.` });
  },
};

const inPlace: Approach<Input> = {
  id: "inPlace",
  name: "Reverse everything, then each word",
  code: `function reverseWords(a)  // a list of characters
    reverse(a, 0, length(a) - 1)
    n ← length(a)
    w, r ← 0, 0  // write and read positions
    while r < n
        if a[r] = ' '
            r += 1
            continue
        if w > 0
            a[w] ← ' '  // one space between words
            w += 1
        start ← w
        while r < n and a[r] ≠ ' '
            a[w] ← a[r]
            w, r ← w + 1, r + 1
        reverse(a, start, w - 1)
    return a[0..w-1]
`,
  run({ s }, t) {
    const a = [...s].reverse(), n = a.length;
    t.op(Math.floor(n / 2));
    const view = () => showSpaces(a.join(""));
    t.step({ line: 2, array: showSpaces(s), vars: {},
      message: `If the string can be changed in place (a list of characters), no list of words is needed. Two reversals do the work: reverse the whole thing, then reverse each word back.` });
    t.step({ line: 2, array: view(), tones: Object.fromEntries(a.map((_, k) => [k, "visited" as Tone])), vars: {},
      message: `Reversed as a whole: "${a.join("")}". The words are now in the right order, but each is spelled backwards.` });
    let w = 0, r = 0, asked = false;
    const kept: Record<number, Tone> = {};
    while (r < n) {
      if (a[r] === " ") {
        t.op();
        const from = r;
        while (r < n && a[r] === " ") r++;
        t.step({ line: 7, array: view(), pointers: { w, ...(r < n ? { r } : {}) }, tones: { ...kept, ...Object.fromEntries(Array.from({ length: r - from }, (_, k) => [from + k, "discard" as Tone])) }, vars: { w, r },
          message: `Skip ${r - from} space${r - from > 1 ? "s" : ""}. Spaces are only written back between words, one at a time.` });
        continue;
      }
      if (w > 0) { a[w] = " "; kept[w] = "settled"; w++; }
      const start = w;
      while (r < n && a[r] !== " ") { t.op(); a[w] = a[r]; w++; r++; }
      for (let k = start; k < w; k++) kept[k] = "compare";
      const word = a.slice(start, w).join("");
      t.step({ line: 15, array: view(), range: [start, w - 1], pointers: { w: Math.min(w, n - 1), ...(r < n ? { r } : {}) }, tones: { ...kept }, vars: { start, w, r },
        message: `${start > 0 ? "Write one space, then copy" : "Copy"} the word "${word}" to positions ${start}..${w - 1}. It's still backwards.` });
      const rev = [...word].reverse().join("");
      const ask = !asked && rev !== word ? (asked = true, { ask: { q: `"${word}" sits at ${start}..${w - 1}. What does reversing it give?`, options: [`"${rev}"`, `"${word}"`], answer: 0 } }) : {};
      a.splice(start, w - start, ...a.slice(start, w).reverse());
      t.op(Math.floor((w - start) / 2));
      for (let k = start; k < w; k++) kept[k] = "settled";
      t.step({ ...ask, line: 16, array: view(), range: [start, w - 1], pointers: { w: Math.min(w, n - 1), ...(r < n ? { r } : {}) }, tones: { ...kept }, vars: { start, w, r },
        message: `Reverse it in place: "${a.slice(start, w).join("")}".` });
    }
    const out = a.slice(0, w).join("");
    t.step({ line: 17, array: view(), tones: { ...kept, ...Object.fromEntries(Array.from({ length: n - w }, (_, k) => [w + k, "discard" as Tone])) }, vars: { result: `"${out}"` }, done: "found",
      message: `The answer is the first ${w} characters: "${out}". Each character is reversed twice and copied once: O(n) time, and O(1) extra space.` });
  },
};

export const approaches = { splitJoin, inPlace };
