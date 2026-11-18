import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };
export const example: Input = { s: "banana" };
export const fields: InputField[] = [{ key: "s", label: "a word (lowercase letters)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim();
  if (!/^[a-z]+$/.test(s)) return { error: "Use lowercase letters a to z only, no spaces." };
  if (s.length > 10) return { error: "Keep it to at most 10 letters." };
  return { input: { s } };
}
const code = (c: string) => c.charCodeAt(0);

const count: Approach<Input> = {
  id: "count",
  name: "Counting letters with 26 counters",
  code: `function countLetters(s)
    counts ← array of 26, all 0
    for each c in s
        counts[code(c) - code('a')] += 1
    return counts
`,
  run({ s }, t) {
    const chars = s.split("");
    const counts = new Map<string, number>();
    const panel = (hl?: string) => ({ title: "counts (only letters seen so far)", entries: [...counts.entries()].sort().map(([c, k]) => [`counts[${code(c) - 97}] (${c})`, String(k)] as [string, string]), highlight: hl ? `counts[${code(hl) - 97}] (${hl})` : undefined });
    t.step({ line: 2, array: chars, map: panel(), vars: {},
      message: `A string is a row of characters, indexed like an array: s[0] is '${chars[0]}'. Each character is stored as a number, its code, and 'a' to 'z' have codes in a row: 97, 98, … 122. So code(c) - code('a') turns a letter into a slot from 0 to 25.` });
    let asked = false;
    chars.forEach((c, i) => {
      t.op();
      counts.set(c, (counts.get(c) ?? 0) + 1);
      const slot = code(c) - 97;
      const ask = !asked && i >= 1 ? (asked = true, { ask: { q: `c is '${c}'. Which counter goes up?`, options: [`counts[${slot}]`, `counts[${slot + 1}]`, `counts[${code(c)}]`], answer: 0 } }) : {};
      t.step({ ...ask, line: 4, array: chars, pointers: { c: i }, tones: { [i]: "active" }, badge: { at: i, text: `${code(c)} - 97 = ${slot}` }, map: panel(c), vars: { c: `'${c}'`, slot },
        message: `'${c}' has code ${code(c)}, and ${code(c)} - 97 = ${slot}, so counts[${slot}] goes up to ${counts.get(c)}.` });
    });
    t.step({ line: 5, array: chars, tones: Object.fromEntries(chars.map((_, i) => [i, "settled" as Tone])), map: panel(), vars: {}, done: "found",
      message: `Done: ${[...counts.entries()].sort().map(([c, k]) => `${k} × '${c}'`).join(", ")}. One pass, O(n), and the counters take a fixed 26 slots: O(1) space. Two words are anagrams exactly when their counters match.` });
  },
};

const concat: Approach<Input> = {
  id: "concat",
  name: "Building a string by adding one character at a time",
  code: `function reverse(s)
    out ← ""
    for i ← length(s) - 1 down to 0
        out ← out + s[i]  // copies all of out
    return out
`,
  run({ s }, t) {
    const chars = s.split("");
    let out = "";
    t.step({ line: 2, array: chars, grid: { title: "out", rows: [["(empty)"]] }, vars: {},
      message: `Reverse the word by adding its characters to out, last one first. It looks like one small step per character, but strings can't be changed in place: out + s[i] builds a whole new string, copying every character of out into it.` });
    for (let i = chars.length - 1; i >= 0; i--) {
      const len = out.length;
      t.op(len + 1);
      const ask = len === 2 ? { ask: { q: `out holds ${len} characters. How many characters does out + s[i] copy?`, options: [`${len + 1}: all of out, plus the new one`, "1: just the new one"], answer: 0 } } : {};
      out += chars[i];
      t.step({ ...ask, line: 4, array: chars, pointers: { i }, tones: { [i]: "active" }, grid: { title: "out (a brand-new string each time)", rows: [out.split("")], tones: Object.fromEntries(out.split("").map((_, k) => [`0,${k}`, (k < len ? "compare" : "found") as Tone])) }, vars: { "characters copied": len + 1 },
        message: `out + '${chars[i]}': copy the ${len} character${len === 1 ? "" : "s"} of out, then add '${chars[i]}'. ${len + 1} character${len ? "s" : ""} written for one new letter.` });
    }
    const n = chars.length;
    t.step({ line: 5, array: chars, grid: { title: "out", rows: [out.split("")] }, vars: {}, done: "found",
      message: `Return '${out}'. The copies add up: 1 + 2 + … + ${n} = ${(n * (n + 1)) / 2} characters written for a ${n}-letter word. That's O(n²): for 100,000 letters, about 5 billion.` });
  },
};

const join: Approach<Input> = {
  id: "join",
  name: "Collecting the pieces, then joining once",
  code: `function reverse(s)
    parts ← empty list
    for i ← length(s) - 1 down to 0
        parts.push(s[i])  // no copying
    return join(parts)
`,
  run({ s }, t) {
    const chars = s.split("");
    const parts: string[] = [];
    t.step({ line: 2, array: chars, grid: { title: "parts (a list)", rows: [["(empty)"]] }, vars: {},
      message: "Collect the characters in a list instead. Adding to the end of a list is O(1): nothing already in it gets copied." });
    for (let i = chars.length - 1; i >= 0; i--) {
      t.op();
      parts.push(chars[i]);
      t.step({ line: 4, array: chars, pointers: { i }, tones: { [i]: "active" }, grid: { title: "parts (a list)", rows: [parts], tones: { [`0,${parts.length - 1}`]: "found" } }, vars: {},
        message: `Push '${chars[i]}' onto the list: one character written.` });
    }
    t.op(parts.length);
    t.step({ line: 5, array: chars, grid: { title: "join(parts)", rows: [parts.join("").split("")], tones: Object.fromEntries(parts.map((_, k) => [`0,${k}`, "settled" as Tone])) }, vars: {}, done: "found",
      message: `join(parts) builds the final string once, writing each character once: '${parts.join("")}'. ${parts.length} pushes plus ${parts.length} characters joined: O(n) in total.` });
  },
};

export const approaches = { count, concat, join };

export const growth = measureGrowth(
  [{ approach: concat, slot: 1 }, { approach: join, slot: 3 }],
  (n) => ({ s: "abcdefghijklmnopqrstuvwxyz".repeat(2).slice(0, n) }),
  [4, 8, 16, 24, 32],
);
