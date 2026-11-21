import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };
export const example: Input = { s: "abacabad" };
export const fields: InputField[] = [{ key: "s", label: "s (a to z)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim().toLowerCase();
  if (!s.length) return { error: "Type a word." };
  if (!/^[a-z]+$/.test(s)) return { error: "Use the letters a to z only." };
  if (s.length > 10) return { error: "Use at most 10 letters so the word fits." };
  return { input: { s } };
}

const scanAll: Approach<Input> = {
  id: "scan",
  name: "Check each character against all the others",
  code: `function firstUniqChar(s)
    for i ← 0 to length(s) - 1
        unique ← true
        for j ← 0 to length(s) - 1
            if j ≠ i and s[j] = s[i]
                unique ← false
                break
        if unique
            return i
    return -1
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    t.step({ line: 2, array: a, vars: {},
      message: `For each position, look through the whole string for another copy of its character. The first position with no copy is the answer.` });
    let asked = false;
    for (let i = 0; i < n; i++) {
      let unique = true;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        t.op();
        const same = a[j] === a[i];
        const ask = !asked && same && j > i + 1
          ? (asked = true, { ask: { q: `s[${i}] = '${a[i]}' and s[${j}] = '${a[j]}'. What now?`, options: [`'${a[i]}' repeats: stop and try position ${i + 1}`, "Keep looking", `Return ${i}`], answer: 0 } }) : {};
        t.step({ ...ask, line: same ? 6 : 5, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: same ? "miss" : "compare" }, badge: { at: j, text: same ? `= '${a[i]}'` : "≠" }, vars: { i, j },
          message: same ? `s[${j}] is also '${a[i]}': position ${i} isn't unique. Stop looking.` : `s[${j}] = '${a[j]}', not '${a[i]}'.` });
        if (same) { unique = false; break; }
      }
      if (unique) {
        t.step({ line: 9, array: a, pointers: { i }, tones: { [i]: "found" }, vars: { i }, done: "found",
          message: `No other '${a[i]}' anywhere: position ${i} is the first unique character. Return ${i}.` });
        return;
      }
    }
    t.step({ line: 10, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "discard" as Tone])), vars: {}, done: "notfound",
      message: `Every character repeats somewhere. Return -1. In the worst case each of the n positions scanned up to n others: O(n²).` });
  },
};

const counting: Approach<Input> = {
  id: "count",
  name: "Count first, then find the first count of 1",
  code: `function firstUniqChar(s)
    counts ← array of 26, all 0
    for each ch in s
        counts[code(ch) - code('a')] += 1
    for each index i, value ch in s
        if counts[code(ch) - code('a')] = 1
            return i
    return -1
`,
  run({ s }, t) {
    const a = [...s], counts = new Map<string, number>();
    const panel = (hl?: string) => ({ title: "counts (letters seen)", entries: [...counts].sort().map(([c, k]) => [c, String(k)] as [string, string]), highlight: hl });
    t.step({ line: 2, array: a, map: panel(), vars: { pass: "count" },
      message: `While reading, you can't tell whether a character will show up again later. So count every character first (26 slots, one per letter), then read the string again.` });
    a.forEach((ch, i) => {
      t.op();
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
      t.step({ line: 4, array: a, pointers: { ch: i }, tones: { [i]: "active" }, map: panel(ch), vars: { pass: "count" },
        message: `'${ch}': count is now ${counts.get(ch)}.` });
    });
    let asks = 0;
    for (let i = 0; i < a.length; i++) {
      t.op();
      const ch = a[i], k = counts.get(ch)!;
      const ask = asks < 2 ? (asks++, { ask: { q: `s[${i}] = '${ch}', and '${ch}' appears ${k} time${k > 1 ? "s" : ""} in total. Return ${i}?`, options: [`Yes: '${ch}' appears exactly once`, "No: it repeats, keep going"], answer: k === 1 ? 0 : 1 } }) : {};
      if (k === 1) {
        t.step({ ...ask, line: 7, array: a, pointers: { i }, tones: { [i]: "found" }, map: panel(ch), vars: { pass: "find", i }, done: "found",
          message: `'${ch}' appears exactly once, and every earlier position repeats. Return ${i}. Two passes and a fixed 26 counts: O(n) time, O(1) space.` });
        return;
      }
      t.step({ ...ask, line: 6, array: a, pointers: { i }, tones: { [i]: "discard" }, map: panel(ch), vars: { pass: "find", i },
        message: `'${ch}' appears ${k} times: not unique.` });
    }
    t.step({ line: 8, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "discard" as Tone])), map: panel(), vars: { pass: "find" }, done: "notfound",
      message: `No count is 1: return -1. Two passes, O(n) time, O(1) space.` });
  },
};

export const approaches = { scan: scanAll, count: counting };

/** No unique character, and each letter's twin is half the string away. */
export const growth = measureGrowth(
  [{ approach: scanAll, slot: 1 }, { approach: counting, slot: 3 }],
  (n) => { const half = Array.from({ length: n / 2 }, (_, i) => String.fromCharCode(97 + i)).join(""); return { s: half + half }; },
  [8, 16, 24, 32, 40, 52],
);
