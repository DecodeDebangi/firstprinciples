import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string; p: string };
export const example: Input = { s: "baxabcab", p: "abc" };
export const fields: InputField[] = [
  { key: "s", label: "s (a to z)", kind: "text" },
  { key: "p", label: "p", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim().toLowerCase(), p = raw.p.trim().toLowerCase();
  if (!s.length || !p.length) return { error: "Type both strings." };
  if (!/^[a-z]+$/.test(s + p)) return { error: "Use the letters a to z only." };
  if (s.length > 9) return { error: "Keep s to 9 letters so it fits." };
  if (p.length > s.length) return { error: "p can't be longer than s." };
  return { input: { s, p } };
}

const countOf = (w: string) => { const c = new Map<string, number>(); for (const ch of w) c.set(ch, (c.get(ch) ?? 0) + 1); return c; };
/** One row per letter that either side has: "have / need". */
function panel(have: Map<string, number>, need: Map<string, number>, hl?: string) {
  const letters = [...new Set([...have.keys(), ...need.keys()])].filter((c) => (have.get(c) ?? 0) || need.get(c)).sort();
  return { title: "letter: have / need", entries: letters.map((c) => [c, `${have.get(c) ?? 0} / ${need.get(c) ?? 0}`] as [string, string]), highlight: hl };
}
const same = (a: Map<string, number>, b: Map<string, number>) =>
  [...new Set([...a.keys(), ...b.keys()])].every((c) => (a.get(c) ?? 0) === (b.get(c) ?? 0));
const firstDiff = (a: Map<string, number>, b: Map<string, number>) =>
  [...new Set([...a.keys(), ...b.keys()])].sort().find((c) => (a.get(c) ?? 0) !== (b.get(c) ?? 0));

const recount: Approach<Input> = {
  id: "recount",
  name: "Count every window from scratch",
  code: `function findAnagrams(s, p)
    m ← length(p)
    need ← the 26 letter counts of p
    result ← empty list
    for i ← 0 to length(s) - m
        have ← the 26 letter counts of s[i..i+m-1]
        if have = need  // compare all 26 counts
            result.push(i)
    return result
`,
  run({ s, p }, t) {
    const a = [...s], m = p.length, need = countOf(p), res: number[] = [];
    t.op(m);
    t.step({ line: 4, array: a, map: panel(new Map(), need), vars: { m },
      message: `A rearrangement of "${p}" has exactly its letter counts. So for every window of ${m} letters, count its letters and compare all 26 counts with p's.` });
    let asked = false;
    for (let i = 0; i + m <= a.length; i++) {
      t.op(m + 26);
      const have = countOf(s.slice(i, i + m)), ok = same(have, need);
      if (ok) res.push(i);
      const ask = !asked && i > 0 ? (asked = true, { ask: { q: `Window ${i} is "${s.slice(i, i + m)}". Is it a rearrangement of "${p}"?`, options: ["Yes: the counts match", "No: the counts differ"], answer: ok ? 0 : 1 } }) : {};
      t.step({ ...ask, line: ok ? 8 : 7, array: a, range: [i, i + m - 1], tones: Object.fromEntries(Array.from({ length: m }, (_, k) => [i + k, (ok ? "found" : "compare") as Tone])), map: panel(have, need, ok ? undefined : firstDiff(have, need)), vars: { i, result: res.join(", ") || "none yet" },
        message: ok ? `"${s.slice(i, i + m)}" has the same counts: add ${i}. Counting it cost ${m} steps, plus 26 to compare.` : `"${s.slice(i, i + m)}": the counts differ (look at '${firstDiff(have, need)}'). Counting it cost ${m} steps, plus 26 to compare.` });
    }
    t.step({ line: 9, array: a, vars: { result: res.join(", ") || "none" }, done: res.length ? "found" : "notfound",
      message: `Answer: [${res.join(", ")}]. Each of the n − m + 1 windows was counted from scratch: O(n · m), though neighbouring windows share all but two letters.` });
  },
};

const sliding: Approach<Input> = {
  id: "sliding",
  name: "Slide the counts",
  code: `function findAnagrams(s, p)
    m ← length(p)
    need ← the 26 letter counts of p
    have ← the 26 letter counts of s[0..m-1]
    result ← empty list
    for i ← 0 to length(s) - m
        if have = need  // compare all 26 counts
            result.push(i)
        if i + m < length(s)  // slide right
            have[s[i]] -= 1
            have[s[i + m]] += 1
    return result
`,
  run({ s, p }, t) {
    const a = [...s], m = p.length, need = countOf(p), have = countOf(s.slice(0, m)), res: number[] = [];
    t.op(2 * m);
    t.step({ line: 5, array: a, range: [0, m - 1], map: panel(have, need), vars: { m },
      message: `Neighbouring windows share all but two letters. So count the first window once, then as it slides, take one away for the letter leaving and add one for the letter arriving.` });
    let asks = 0;
    for (let i = 0; i + m <= a.length; i++) {
      t.op(26);
      const ok = same(have, need);
      if (ok) res.push(i);
      const ask = asks < 2 && i > 0 ? (asks++, { ask: { q: `Window ${i} is "${s.slice(i, i + m)}". Do its counts match p's?`, options: ["Yes: add its start", "No: slide on"], answer: ok ? 0 : 1 } }) : {};
      t.step({ ...ask, line: ok ? 8 : 7, array: a, range: [i, i + m - 1], tones: Object.fromEntries(Array.from({ length: m }, (_, k) => [i + k, (ok ? "found" : "compare") as Tone])), map: panel(have, need, ok ? undefined : firstDiff(have, need)), vars: { i, result: res.join(", ") || "none yet" },
        message: ok ? `"${s.slice(i, i + m)}" matches p's counts: add ${i}.` : `"${s.slice(i, i + m)}": the counts differ (look at '${firstDiff(have, need)}').` });
      if (i + m < a.length) {
        t.op(2);
        const out = a[i], inn = a[i + m];
        have.set(out, have.get(out)! - 1);
        have.set(inn, (have.get(inn) ?? 0) + 1);
        t.step({ line: 11, array: a, range: [i + 1, i + m], tones: { [i]: "discard", [i + m]: "active" }, map: panel(have, need, inn), vars: { i, result: res.join(", ") || "none yet" },
          message: `Slide: '${out}' leaves (have['${out}'] − 1) and '${inn}' arrives (have['${inn}'] + 1). Two updates, however long p is.` });
      }
    }
    t.step({ line: 12, array: a, vars: { result: res.join(", ") || "none" }, done: res.length ? "found" : "notfound",
      message: `Answer: [${res.join(", ")}]. Two updates and one 26-count comparison per window: O(n) time, and O(1) space for the counts.` });
  },
};

export const approaches = { recount, sliding };

/** A text of n letters and a word half as long. */
export const growth = measureGrowth(
  [{ approach: recount, slot: 1 }, { approach: sliding, slot: 3 }],
  (n) => ({ s: Array.from({ length: n }, (_, i) => "abc"[i % 3]).join(""), p: Array.from({ length: n / 2 }, (_, i) => "abc"[i % 3]).join("") }),
  [16, 64, 128, 192, 256],
);
