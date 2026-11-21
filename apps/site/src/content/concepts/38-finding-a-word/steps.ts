import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** text and the word p to find in it. */
export type FindInput = { text: string; p: string };
export const findFields: InputField[] = [
  { key: "text", label: "text (a to z)", kind: "text" },
  { key: "p", label: "word to find", kind: "text" },
];
export function findPrepare(raw: FindInput): Prepared<FindInput> {
  const text = raw.text.trim().toLowerCase(), p = raw.p.trim().toLowerCase();
  if (!text.length || !p.length) return { error: "Type a text and a word." };
  if (!/^[a-z]+$/.test(text + p)) return { error: "Use the letters a to z only." };
  if (text.length > 9) return { error: "Keep the text to 9 letters so it fits." };
  if (p.length > text.length) return { error: "The word can't be longer than the text." };
  return { input: { text, p } };
}
export const naiveExample: FindInput = { text: "aabaabaac", p: "aabaac" };
export const rollExample: FindInput = { text: "afitcats", p: "cat" };

type T = Parameters<Approach<FindInput>["run"]>[1];

export const naiveCode = `function find(text, p)
    for i ← 0 to length(text) - length(p)
        j ← 0
        while j < length(p) and text[i + j] = p[j]
            j += 1
        if j = length(p)
            return i
    return -1
`;

/** Shared with LC 28. */
export function naiveSteps({ text, p }: FindInput, t: T) {
  const a = [...text], n = a.length, m = p.length;
  const word = (i: number) => a.map((_, k) => (k >= i && k < i + m ? p[k - i] : ""));
  t.step({ line: 2, array: a, labels: word(0), vars: { m },
    message: `Line the word up under every possible start i, from 0 to ${n - m}, and compare it character by character. The word's letters are shown under the text, lined up at the current start.` });
  let asked = false;
  for (let i = 0; i + m <= n; i++) {
    let j = 0;
    while (j < m) {
      t.op();
      if (a[i + j] !== p[j]) break;
      j++;
    }
    const full = j === m;
    const tones: Record<number, Tone> = {};
    for (let k = 0; k < j; k++) tones[i + k] = "found";
    if (!full) tones[i + j] = "miss";
    const ask = !asked && j >= 2 && !full
      ? (asked = true, { ask: { q: `Start ${i}: the first ${j} characters matched. What happens at the mismatch?`, options: [`Move to start ${i + 1} and compare from p[0] again`, `Skip straight to start ${i + j}`, "Return -1"], answer: 0 } }) : {};
    if (full) {
      t.step({ line: 7, array: a, labels: word(i), range: [i, i + m - 1], tones, vars: { i, j }, done: "found",
        message: `All ${m} characters match at start ${i}: return ${i}. Each start cost up to ${m} comparisons, so the worst case is O(n · m).` });
      return;
    }
    t.step({ ...ask, line: 4, array: a, labels: word(i), range: [i, i + m - 1], pointers: { i, "i+j": i + j }, tones, vars: { i, j },
      message: j === 0 ? `Start ${i}: '${a[i]}' ≠ '${p[0]}' straight away.` : `Start ${i}: ${j} character${j > 1 ? "s" : ""} matched, then '${a[i + j]}' ≠ '${p[j]}'. Those ${j + 1} comparisons are thrown away, and the next start begins again from p[0].` });
  }
  t.step({ line: 8, array: a, vars: {}, done: "notfound",
    message: `No start matched: return -1. Up to ${n - m + 1} starts × ${m} comparisons: O(n · m).` });
}

const naive: Approach<FindInput> = { id: "naive", name: "Try every start", code: naiveCode, run(input, t) { naiveSteps(input, t); } };

/* ---------- Rolling hash ---------- */
export const B = 31, M = 101;
export const val = (c: string) => c.charCodeAt(0) - 96;
export const hashOf = (s: string) => [...s].reduce((h, c) => (h * B + val(c)) % M, 0);
const mod = (x: number) => ((x % M) + M) % M;

export const rollCode = `function rabinKarp(text, p)
    m, n ← length(p), length(text)
    hp ← hash(p)
    h ← hash(text[0..m-1])
    top ← B^(m-1) % M
    for i ← 0 to n - m
        if h = hp and text[i..i+m-1] = p
            return i
        if i + m < n  // slide one place right
            h ← (h - val(text[i]) · top) % M
            h ← (h · B + val(text[i + m])) % M
    return -1
`;

/** Shared with LC 28. */
export function rollSteps({ text, p }: FindInput, t: T) {
  const a = [...text], n = a.length, m = p.length;
  const top = Array.from({ length: m - 1 }).reduce<number>((x) => (x * B) % M, 1);
  t.op(2 * m);
  const hp = hashOf(p);
  let h = hashOf(text.slice(0, m));
  t.step({ line: 5, array: a, range: [0, m - 1], vars: { hp, h, top },
    message: `Turn each m-letter string into one number, its hash: read the letters (a = 1 … z = 26) as digits in base ${B}, and keep the remainder after dividing by ${M}. hash("${p}") = ${hp}. The first window, "${text.slice(0, m)}", hashes to ${h}.` });
  let asked = false;
  for (let i = 0; i + m <= n; i++) {
    t.op();
    const win = text.slice(i, i + m);
    if (h === hp) {
      t.op(m);
      const real = win === p;
      const ask = !asked ? (asked = true, { ask: { q: `The window "${win}" hashes to ${h}, the same as "${p}". Is it a match?`, options: ["Maybe: check the letters to be sure", "Yes: equal hashes always mean equal strings", "No: it can't be"], answer: 0 } }) : {};
      if (real) {
        t.step({ ...ask, line: 8, array: a, range: [i, i + m - 1], tones: Object.fromEntries(Array.from({ length: m }, (_, k) => [i + k, "found" as Tone])), vars: { i, h, hp }, done: "found",
          message: `Hashes match (${h}), and checking the ${m} letters confirms it: "${p}" starts at ${i}. Return ${i}.` });
        return;
      }
      t.step({ ...ask, line: 7, array: a, range: [i, i + m - 1], tones: Object.fromEntries(Array.from({ length: m }, (_, k) => [i + k, "miss" as Tone])), vars: { i, h, hp },
        message: `The hashes match (${h}) but the letters don't: "${win}" ≠ "${p}". Two different strings can share a hash (a collision), which is why a match is always checked.` });
    } else {
      t.step({ line: 7, array: a, range: [i, i + m - 1], tones: { [i]: "compare" }, vars: { i, h, hp },
        message: `Window ${i}, "${win}": hash ${h} ≠ ${hp}. One number comparison rules it out, without reading its letters.` });
    }
    if (i + m < n) {
      t.op(2);
      const out = a[i], inn = a[i + m];
      const mid = mod(h - val(out) * top);
      const next = mod(mid * B + val(inn));
      t.step({ line: 11, array: a, range: [i + 1, i + m], tones: { [i]: "discard", [i + m]: "active" }, vars: { i, h: next, hp },
        message: `Slide right. Remove '${out}': (${h} − ${val(out)} · ${top}) % ${M} = ${mid}. Shift and add '${inn}': (${mid} · ${B} + ${val(inn)}) % ${M} = ${next}. Two operations, however long the word.` });
      h = next;
    }
  }
  t.step({ line: 12, array: a, vars: { hp }, done: "notfound",
    message: `No window matched: return -1. Each window cost O(1), so about O(n + m) in total, plus m more for every hash match that's checked.` });
}

const rolling: Approach<FindInput> = { id: "rolling", name: "Rolling hash (Rabin–Karp)", code: rollCode, run(input, t) { rollSteps(input, t); } };

export const naiveApproaches = { naive };
export const rollApproaches = { rolling };
