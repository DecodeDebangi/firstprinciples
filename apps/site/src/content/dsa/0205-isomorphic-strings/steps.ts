import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string; t: string };
export const example: Input = { s: "lever", t: "madam" };
export const fields: InputField[] = [
  { key: "s", label: "s", kind: "text" },
  { key: "t", label: "t", kind: "text" },
];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim(), t = raw.t.trim();
  if (!s.length || !t.length) return { error: "Type a word in both boxes." };
  if (s.length !== t.length) return { error: "The problem gives two strings of the same length." };
  if (s.length > 8) return { error: "Use at most 8 characters so the words fit." };
  return { input: { s, t } };
}

const below = (t: string) => [...t].map((c) => `t: ${c}`);

const pairs: Approach<Input> = {
  id: "pairs",
  name: "Compare every pair of positions",
  code: `function isIsomorphic(s, t)
    for i ← 0 to length(s) - 1
        for j ← i + 1 to length(s) - 1
            sameS ← s[i] = s[j]
            sameT ← t[i] = t[j]
            if sameS ≠ sameT
                return false
    return true
`,
  run({ s, t: w }, t) {
    const a = [...s], labels = below(w), n = a.length;
    t.step({ line: 2, array: a, labels, vars: {},
      message: `s is on top and t underneath. The strings have the same shape when, for every two positions, s repeats a character there exactly when t does. So check every pair.` });
    let asked = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op();
        const ss = a[i] === a[j], st = w[i] === w[j], bad = ss !== st;
        const ask = !asked && (bad || (ss && st))
          ? (asked = true, { ask: { q: `Positions ${i} and ${j}: s has '${a[i]}' and '${a[j]}', t has '${w[i]}' and '${w[j]}'. Do they agree?`, options: ["Yes: both repeat, or both differ", "No: only one of them repeats"], answer: bad ? 1 : 0 } }) : {};
        t.step({ ...ask, line: bad ? 7 : 6, array: a, labels, pointers: { i, j }, tones: { [i]: bad ? "miss" : "compare", [j]: bad ? "miss" : "compare" }, vars: { i, j, sameS: ss, sameT: st },
          ...(bad ? { done: "notfound" as const } : {}),
          message: bad
            ? `s[${i}] ${ss ? "=" : "≠"} s[${j}], but t[${i}] ${st ? "=" : "≠"} t[${j}]. The shapes differ: return false.`
            : `Both ${ss ? "repeat" : "differ"} at positions ${i} and ${j}: they agree.` });
        if (bad) return;
      }
    }
    t.step({ line: 8, array: a, labels, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: {}, done: "found",
      message: `All ${n * (n - 1) / 2} pairs agree: return true. That's about n² / 2 pairs: O(n²).` });
  },
};

const twoMaps: Approach<Input> = {
  id: "twoMaps",
  name: "Two maps, one pass",
  code: `function isIsomorphic(s, t)
    sToT ← empty map
    tToS ← empty map
    for i ← 0 to length(s) - 1
        a, b ← s[i], t[i]
        if a in sToT and sToT[a] ≠ b
            return false
        if b in tToS and tToS[b] ≠ a
            return false
        sToT[a] ← b
        tToS[b] ← a
    return true
`,
  run({ s, t: w }, t) {
    const a = [...s], labels = below(w), st = new Map<string, string>(), ts = new Map<string, string>();
    const panel = (hl?: string) => ({
      title: "sToT and tToS",
      entries: [...[...st].map(([x, y]) => [`sToT['${x}']`, `'${y}'`]), ...[...ts].map(([y, x]) => [`tToS['${y}']`, `'${x}'`])] as [string, string][],
      highlight: hl,
    });
    t.step({ line: 4, array: a, labels, map: panel(), vars: {},
      message: `Read both strings together. Each character of s must always pair with the same character of t, and each character of t with the same character of s. One map checks each direction.` });
    let asks = 0;
    for (let i = 0; i < a.length; i++) {
      t.op(2);
      const x = a[i], y = w[i];
      const clashS = st.has(x) && st.get(x) !== y, clashT = !clashS && ts.has(y) && ts.get(y) !== x;
      const ask = asks < 2 && (st.has(x) || ts.has(y))
        ? (asks++, { ask: { q: `'${x}' pairs with '${y}'. The maps say ${st.has(x) ? `sToT['${x}'] = '${st.get(x)}'` : `'${x}' is new`} and ${ts.has(y) ? `tToS['${y}'] = '${ts.get(y)}'` : `'${y}' is new`}. Is this pair allowed?`, options: ["Yes: it matches what the maps already say", "No: one side is already paired with something else"], answer: clashS || clashT ? 1 : 0 } }) : {};
      if (clashS) {
        t.step({ ...ask, line: 7, array: a, labels, pointers: { i }, tones: { [i]: "miss" }, map: panel(`sToT['${x}']`), vars: { a: x, b: y }, done: "notfound",
          message: `'${x}' was paired with '${st.get(x)}' before, but now meets '${y}'. Return false.` });
        return;
      }
      if (clashT) {
        t.step({ ...ask, line: 9, array: a, labels, pointers: { i }, tones: { [i]: "miss" }, map: panel(`tToS['${y}']`), vars: { a: x, b: y }, done: "notfound",
          message: `'${x}' → '${y}' looks fine from s's side, but '${y}' already belongs to '${ts.get(y)}'. Two characters of s can't both turn into '${y}'. Return false.` });
        return;
      }
      const known = st.has(x);
      st.set(x, y); ts.set(y, x);
      t.step({ ...ask, line: 11, array: a, labels, pointers: { i }, tones: { [i]: known ? "found" : "active" }, map: panel(`sToT['${x}']`), vars: { a: x, b: y },
        message: known ? `'${x}' → '${y}' again, as before.` : `New pair: '${x}' ↔ '${y}'. Record it in both maps.` });
    }
    t.step({ line: 12, array: a, labels, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), map: panel(), vars: {}, done: "found",
      message: `Every pair agreed both ways: return true. One pass, O(n), and the maps hold one entry per different character.` });
  },
};

export const approaches = { pairs, twoMaps };

/** Two copies of a string of different characters: every pair agrees, so neither approach stops early. */
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: twoMaps, slot: 3 }],
  (n) => { const s = Array.from({ length: n }, (_, i) => String.fromCharCode(0x4e00 + i)).join(""); return { s, t: s }; },
  [8, 16, 32, 48, 64],
);
