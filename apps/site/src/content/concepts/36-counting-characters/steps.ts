import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

const letters = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/* ---------- Counting into 26 slots ---------- */
export type SlotInput = { s: string };
export const slotExample: SlotInput = { s: "settee" };
export const slotFields: InputField[] = [{ key: "s", label: "word (a to z)", kind: "text" }];
export function slotPrepare(raw: SlotInput): Prepared<SlotInput> {
  const s = letters(raw.s);
  if (!s.length) return { error: "Type a word using the letters a to z." };
  if (s.length > 8) return { error: "Use at most 8 letters so the word fits." };
  return { input: { s } };
}

const slots: Approach<SlotInput> = {
  id: "slots",
  name: "Count into 26 slots",
  code: `function countLetters(s)
    counts ← array of 26, all 0
    for each ch in s
        slot ← code(ch) - code('a')
        counts[slot] += 1
    return counts
`,
  run({ s }, t) {
    const chars = [...s], counts = new Array(26).fill(0);
    const panel = (hl?: string) => ({
      title: "counts (only slots above 0 shown)",
      entries: counts.map((k, i) => [k, i] as const).filter(([k]) => k > 0).map(([k, i]) => [`${String.fromCharCode(97 + i)} · slot ${i}`, String(k)] as [string, string]),
      highlight: hl,
    });
    t.step({ line: 2, array: chars, map: panel(), vars: {},
      message: `Lowercase letters are a to z, so 26 slots cover them all: slot 0 for a, slot 1 for b, up to slot 25 for z. No hashing needed; a letter's slot is just how far it is from 'a'.` });
    let asked = false;
    chars.forEach((ch, i) => {
      t.op();
      const slot = ch.charCodeAt(0) - 97;
      const before = counts[slot];
      counts[slot]++;
      const ask = !asked && slot > 0
        ? (asked = true, { ask: { q: `code('${ch}') - code('a') = ${ch.charCodeAt(0)} - 97. Which slot does '${ch}' use?`, options: [String(slot), String(slot + 1), String(ch.charCodeAt(0))], answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: chars, pointers: { ch: i }, tones: { [i]: "active" }, map: panel(`${ch} · slot ${slot}`), vars: { ch, slot, [`counts[${slot}]`]: counts[slot] },
        message: `'${ch}' is code ${ch.charCodeAt(0)}, and 'a' is 97, so its slot is ${slot}. counts[${slot}] goes from ${before} to ${counts[slot]}.` });
    });
    const max = Math.max(...counts), top = counts.findIndex((k) => k === max);
    t.step({ line: 6, array: chars, tones: Object.fromEntries(chars.map((_, k) => [k, "settled" as Tone])), map: panel(), vars: { letters: chars.length }, done: "found",
      message: `One pass: O(n) time, and always exactly 26 slots however long the text: O(1) space. Now "how many ${String.fromCharCode(97 + top)}s?" is one lookup (${max}).` });
  },
};

/* ---------- The first-appearance pattern ---------- */
export type PatInput = { s: string };
export const patExample: PatInput = { s: "paper" };
export const patFields: InputField[] = [{ key: "s", label: "word", kind: "text" }];
export function patPrepare(raw: PatInput): Prepared<PatInput> {
  const s = raw.s.trim();
  if (!s.length) return { error: "Type a word." };
  if (s.length > 8) return { error: "Use at most 8 characters so the word fits." };
  return { input: { s } };
}

/** "paper" → [0, 1, 0, 2, 3]: each character becomes the order in which it first appeared. */
export const patternOf = (s: string) => { const m = new Map<string, number>(); return [...s].map((ch) => { if (!m.has(ch)) m.set(ch, m.size); return m.get(ch)!; }); };

const pattern: Approach<PatInput> = {
  id: "pattern",
  name: "Number each character by first appearance",
  code: `function patternOf(s)
    first ← empty map  // character → its number
    result ← empty list
    for each ch in s
        if ch not in first
            first[ch] ← length(first)
        result.push(first[ch])
    return result
`,
  run({ s }, t) {
    const chars = [...s], first = new Map<string, number>(), res: number[] = [];
    const panel = (hl?: string) => ({ title: "first (character → number)", entries: [...first].map(([c, k]) => [`'${c}'`, String(k)] as [string, string]), highlight: hl === undefined ? undefined : `'${hl}'` });
    const out = () => ({ grid: { title: "pattern", rows: [res.length ? [...res] : [""]] } });
    t.step({ line: 3, array: chars, map: panel(), ...out(), vars: {},
      message: `Replace each character with a number: 0 for the first different character, 1 for the second, and so on, reusing a character's number whenever it comes back. The result keeps the word's shape and forgets its letters.` });
    let asked = false;
    chars.forEach((ch, i) => {
      t.op();
      const fresh = !first.has(ch);
      const ask = !asked && !fresh
        ? (asked = true, { ask: { q: `'${ch}' already has number ${first.get(ch)}. What goes into the pattern?`, options: [...new Set([first.get(ch)!, first.size, i, first.size + 1].map(String))].slice(0, 3), answer: 0 } }) : {};
      if (fresh) {
        first.set(ch, first.size);
        t.step({ line: 6, array: chars, pointers: { ch: i }, tones: { [i]: "active" }, map: panel(ch), ...out(), vars: { ch },
          message: `'${ch}' is new: it gets the next number, ${first.get(ch)}.` });
      }
      res.push(first.get(ch)!);
      t.step({ ...ask, line: 7, array: chars, pointers: { ch: i }, tones: { [i]: fresh ? "active" : "found" }, map: panel(ch), ...out(), vars: { ch },
        message: fresh ? `Write ${first.get(ch)}.` : `'${ch}' came back, so it reuses its number: write ${first.get(ch)}.` });
    });
    t.step({ line: 8, array: chars, tones: Object.fromEntries(chars.map((_, k) => [k, "settled" as Tone])), map: panel(), ...out(), vars: {}, done: "found",
      message: `"${s}" has the pattern ${res.join(" ")}. Any word with the same pattern has the same shape: ${s === "paper" ? `"title" is also 0 1 0 2 3` : "the letters can differ, but repeats fall in the same places"}. One pass, O(n).` });
  },
};

export const slotApproaches = { slots };
export const patApproaches = { pattern };
