import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { s: string; t: string };

export const example: Input = { s: "listen", t: "silent" };

export const fields: InputField[] = [
  { key: "s", label: "s", kind: "text" },
  { key: "t", label: "t", kind: "text" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.s.length || !raw.t.length) return { error: "Type a word in both boxes." };
  return { input: raw };
}

const sortCompare: Approach<Input> = {
  id: "sort",
  name: "Sort both, compare",
  code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    a, b = sorted(s), sorted(t)
    for x, y in zip(a, b):
        if x != y:
            return False
    return True
`,
  run({ s, t: w }, t) {
    t.op();
    if (s.length !== w.length) {
      t.step({ line: 3, array: [...s], vars: { "len(s)": s.length, "len(t)": w.length }, done: "notfound",
        message: `Different lengths (${s.length} and ${w.length}) can't be anagrams. Return False.` });
      return;
    }
    const n = s.length;
    const a = [...s].sort(), b = [...w].sort();
    t.op(2 * Math.ceil(n * Math.log2(Math.max(n, 2))));
    const labels = b.map((c) => `t: ${c}`);
    t.step({ line: 4, array: a, labels, vars: { a: a.join(""), b: b.join("") },
      message: `Anagrams use the same letters, so sorted they're identical. Sorted s is the top row; sorted t is underneath.` });
    for (let i = 0; i < n; i++) {
      t.op();
      if (a[i] !== b[i]) {
        t.step({ line: 7, array: a, labels, pointers: { i }, tones: { [i]: "miss" }, badge: { at: i, text: `${a[i]} ≠ ${b[i]}` },
          vars: { a: a.join(""), b: b.join("") }, done: "notfound", message: `Position ${i}: "${a[i]}" vs "${b[i]}". The letters differ. Return False.` });
        return;
      }
      t.step({ line: 6, array: a, labels, pointers: { i }, tones: { [i]: "compare" }, badge: { at: i, text: `${a[i]} = ${b[i]}` },
        vars: { a: a.join(""), b: b.join("") }, message: `"${a[i]}" matches. Next.` });
    }
    t.step({ line: 8, array: a, labels, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as const])), vars: { a: a.join(""), b: b.join("") },
      done: "found", message: "Every position matches. Return True." });
  },
};

const counting: Approach<Input> = {
  id: "count",
  name: "Count letters",
  code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for ch in s:
        count[ch] = count.get(ch, 0) + 1
    for ch in t:
        count[ch] = count.get(ch, 0) - 1
        if count[ch] < 0:
            return False
    return True
`,
  run({ s, t: w }, t) {
    t.op();
    if (s.length !== w.length) {
      t.step({ line: 3, array: [...s], vars: { "len(s)": s.length, "len(t)": w.length }, done: "notfound",
        message: `Different lengths (${s.length} and ${w.length}) can't be anagrams. Return False.` });
      return;
    }
    const count = new Map<string, number>();
    const map = (hl?: string) => ({ title: "count (letter → how many)", entries: [...count].map(([c, k]) => [c, String(k)] as [string, string]), highlight: hl });
    t.step({ line: 4, array: [...s], labels: [...s].map((_, k) => `s[${k}]`), map: map(), vars: { phase: "count s" },
      message: "Count each letter of s, then cancel the counts with t. Anagrams cancel out exactly." });
    [...s].forEach((ch, i) => {
      t.op();
      count.set(ch, (count.get(ch) ?? 0) + 1);
      t.step({ line: 6, array: [...s], labels: [...s].map((_, k) => `s[${k}]`), pointers: { i }, tones: { [i]: "active" }, map: map(ch), vars: { phase: "count s" },
        message: `"${ch}" seen ${count.get(ch)} time${count.get(ch)! > 1 ? "s" : ""} in s.` });
    });
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      t.op();
      const next = (count.get(ch) ?? 0) - 1;
      count.set(ch, next);
      const ask = { q: `t[${i}] = "${ch}". After subtracting 1, its count is ${next}. What happens?`,
        options: ["Below zero: t has an extra one, return False", "Still zero or more: keep going"], answer: next < 0 ? 0 : 1 };
      const base = { array: [...w], labels: [...w].map((_, k) => `t[${k}]`), pointers: { i }, vars: { phase: "cancel with t" } };
      if (next < 0) {
        t.step({ ...base, ask, line: 10, tones: { [i]: "miss" }, badge: { at: i, text: `${ch}: ${next}` }, map: map(ch), done: "notfound",
          message: `t has more "${ch}"s than s. Return False.` });
        return;
      }
      t.step({ ...base, ask, line: 8, tones: { [i]: "compare" }, badge: { at: i, text: `${ch}: ${next}` }, map: map(ch),
        message: `Cancel one "${ch}": ${next} left.` });
    }
    t.step({ line: 11, array: [...w], labels: [...w].map((_, k) => `t[${k}]`), tones: Object.fromEntries([...w].map((_, k) => [k, "settled" as const])), map: map(),
      vars: { phase: "done" }, done: "found", message: "Every count cancelled to zero without going negative. Return True." });
  },
};

export const approaches = { sort: sortCompare, count: counting };

/** Worst case: a real anagram pair, so neither approach stops early. */
const worstCase = (n: number): Input => {
  const s = Array.from({ length: n }, (_, i) => String.fromCharCode(97 + (i % 26))).join("");
  return { s, t: [...s].reverse().join("") };
};

export const growth = measureGrowth(
  [
    { approach: sortCompare, slot: 1 },
    { approach: counting, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
