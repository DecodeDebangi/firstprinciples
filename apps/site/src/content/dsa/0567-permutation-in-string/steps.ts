import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s1: string; s2: string };
export const example: Input = { s1: "cat", s2: "dogtacx" };
export const fields: InputField[] = [
  { key: "s1", label: "s1 (the letters)", kind: "text" },
  { key: "s2", label: "s2 (search in)", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  const s1 = raw.s1.toLowerCase(), s2 = raw.s2.toLowerCase();
  if (!/^[a-z]+$/.test(s1 + s2)) return { error: "Use the letters a to z." };
  if (s2.length > 9) return { error: "Keep s2 to 9 letters so it fits." };
  if (s1.length > s2.length) return { error: "s1 can't be longer than s2." };
  return { input: { s1, s2 } };
}
const counts = (w: string) => { const c = new Map<string, number>(); for (const ch of w) c.set(ch, (c.get(ch) ?? 0) + 1); return c; };
const same = (a: Map<string, number>, b: Map<string, number>) => [...new Set([...a.keys(), ...b.keys()])].every((k) => (a.get(k) ?? 0) === (b.get(k) ?? 0));
const panel = (have: Map<string, number>, need: Map<string, number>, hl?: string) => ({
  title: "letter: window / s1", entries: [...new Set([...have.keys(), ...need.keys()])].filter((c) => (have.get(c) ?? 0) || need.get(c)).sort().map((c) => [c, `${have.get(c) ?? 0} / ${need.get(c) ?? 0}`] as [string, string]), highlight: hl,
});
const win = (n: number, l: number, r: number, tone: Tone) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, (i >= l && i <= r ? tone : "discard") as Tone]));

const recount: Approach<Input> = {
  id: "recount",
  name: "Count every window from scratch",
  code: `function checkInclusion(s1, s2)
    m ← length(s1)
    need ← the 26 letter counts of s1
    for i ← 0 to length(s2) - m
        if the counts of s2[i..i+m-1] = need
            return true
    return false
`,
  run({ s1, s2 }, t) {
    const a = [...s2], m = s1.length, need = counts(s1);
    t.op(m);
    t.step({ line: 3, array: a, map: panel(new Map(), need), vars: { m },
      message: `A rearrangement (permutation) of "${s1}" has exactly its letter counts. Check every window of ${m} letters in "${s2}", counting each from scratch.` });
    for (let i = 0; i + m <= a.length; i++) {
      t.op(m + 26);
      const have = counts(s2.slice(i, i + m)), ok = same(have, need);
      t.step({ line: ok ? 6 : 5, array: a, range: [i, i + m - 1], tones: win(a.length, i, i + m - 1, ok ? "found" : "compare"), map: panel(have, need), vars: { i }, ...(ok ? { done: "found" as const } : {}),
        message: ok ? `"${s2.slice(i, i + m)}" has the same counts as "${s1}": it's a rearrangement. Return true.` : `"${s2.slice(i, i + m)}" has different counts. ${m} letters counted for this window.` });
      if (ok) return;
    }
    t.step({ line: 7, array: a, vars: {}, done: "notfound", message: `No window matches: return false. Up to n windows × m letters: O(n · m).` });
  },
};

const slide: Approach<Input> = {
  id: "slide",
  name: "Slide the counts",
  code: `function checkInclusion(s1, s2)
    m ← length(s1)
    need ← the 26 letter counts of s1
    have ← the 26 letter counts of s2[0..m-1]
    for i ← 0 to length(s2) - m
        if have = need  // compare 26 counts
            return true
        if i + m < length(s2)  // slide right
            have[s2[i]] -= 1
            have[s2[i + m]] += 1
    return false
`,
  run({ s1, s2 }, t) {
    const a = [...s2], m = s1.length, need = counts(s1), have = counts(s2.slice(0, m));
    let asked = false;
    t.op(2 * m);
    t.step({ line: 4, array: a, range: [0, m - 1], map: panel(have, need), vars: { m },
      message: `Count the first window once. Moving it one place right only changes two counts: the letter leaving and the letter arriving.` });
    for (let i = 0; i + m <= a.length; i++) {
      t.op(26);
      const ok = same(have, need);
      const q = !asked && i > 0 ? (asked = true, { ask: { q: `The window is "${s2.slice(i, i + m)}". Do its counts match "${s1}"?`, options: ["Yes: return true", "No: slide on"], answer: ok ? 0 : 1 } }) : {};
      if (ok) {
        t.step({ ...q, line: 7, array: a, range: [i, i + m - 1], tones: win(a.length, i, i + m - 1, "found"), map: panel(have, need), vars: { i }, done: "found",
          message: `"${s2.slice(i, i + m)}" matches "${s1}"'s counts: return true. Each slide cost two updates and one 26-count comparison: O(n).` });
        return;
      }
      t.step({ ...q, line: 6, array: a, range: [i, i + m - 1], tones: win(a.length, i, i + m - 1, "compare"), map: panel(have, need), vars: { i },
        message: `"${s2.slice(i, i + m)}": the counts differ.` });
      if (i + m < a.length) {
        t.op(2);
        const out = a[i], inn = a[i + m];
        have.set(out, have.get(out)! - 1); have.set(inn, (have.get(inn) ?? 0) + 1);
        t.step({ line: 10, array: a, range: [i + 1, i + m], tones: { [i]: "discard", [i + m]: "active" }, map: panel(have, need, inn), vars: { i: i + 1 },
          message: `Slide: '${out}' leaves, '${inn}' arrives. Two counts change.` });
      }
    }
    t.step({ line: 11, array: a, vars: {}, done: "notfound", message: `No window matched: return false. O(n) in total.` });
  },
};

export const approaches = { recount, slide };

/** s2 of length n with no match, and s1 of length n / 2. */
export const growth = measureGrowth(
  [{ approach: recount, slot: 1 }, { approach: slide, slot: 3 }],
  (n) => ({ s1: "z".repeat(n / 2), s2: "ab".repeat(n / 2) }),
  [16, 64, 128, 192, 256],
);
