import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { expandSteps } from "../../concepts/37-palindromes/steps";

export type Input = { s: string };
export const example: Input = { s: "aabaa" };
export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim();
  if (!s.length) return { error: "Type at least one character." };
  if (s.length > 8) return { error: "Use at most 8 characters so the animation stays short." };
  return { input: { s } };
}

const settled = (lo: number, hi: number) => Object.fromEntries(Array.from({ length: hi - lo + 1 }, (_, k) => [lo + k, "settled" as Tone]));

const everySub: Approach<Input> = {
  id: "everySub",
  name: "Check every substring",
  code: `function countSubstrings(s)
    count ← 0
    for i ← 0 to length(s) - 1
        for j ← i to length(s) - 1
            if isPalindrome(s[i..j])
                count += 1
    return count
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    let count = 0, asked = false;
    t.step({ line: 2, array: a, vars: { count },
      message: `Try every substring s[i..j] and check each with two pointers from its ends. Count the palindromes.` });
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let lo = i, hi = j, ok = true;
        while (lo < hi) { t.op(); if (a[lo] !== a[hi]) { ok = false; break; } lo++; hi--; }
        if (ok) count++;
        const sub = a.slice(i, j + 1).join("");
        const ask = !asked && j - i >= 2
          ? (asked = true, { ask: { q: `Is "${sub}" a palindrome?`, options: ["Yes: count it", "No"], answer: ok ? 0 : 1 } }) : {};
        t.step({ ...ask, line: ok ? 6 : 5, array: a, range: [i, j], ...(ok ? {} : { pointers: { lo, hi } }), tones: ok ? settled(i, j) : { [lo]: "miss", [hi]: "miss" }, vars: { i, j, count },
          message: ok ? `"${sub}" is a palindrome: count is now ${count}.` : `"${sub}": '${a[lo]}' ≠ '${a[hi]}', not a palindrome.` });
      }
    }
    t.step({ line: 7, array: a, vars: { count }, done: "found",
      message: `${count} palindromic substrings. ${n * (n + 1) / 2} substrings were checked, each in up to n / 2 comparisons: O(n³).` });
  },
};

const centres: Approach<Input> = {
  id: "centres",
  name: "Expand around every centre",
  code: `function countSubstrings(s)
    count ← 0
    for c ← 0 to 2 · length(s) - 2
        lo ← floor(c / 2)
        hi ← lo + c % 2  // gap centres: hi = lo + 1
        while lo ≥ 0 and hi < length(s)
            if s[lo] ≠ s[hi]
                break
            count += 1  // s[lo..hi] is one
            lo, hi ← lo - 1, hi + 1
    return count
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    let count = 0;
    t.step({ line: 2, array: a, vars: { count },
      message: `Every palindrome has exactly one centre: a character or a gap. So expanding from each of the ${2 * n - 1} centres finds every palindrome exactly once, and each successful step outwards is one more to count.` });
    for (let c = 0; c <= 2 * n - 2; c++) {
      const lo = Math.floor(c / 2), hi = lo + (c % 2);
      const where = lo === hi ? `the character at ${lo}` : `the gap between ${lo} and ${hi}`;
      expandSteps(t, a, lo, hi, {
        line: { stop: 8, grow: 9, end: 6 },
        extra: () => ({ vars: { centre: where, count } }),
        ask: c === 3 && n > 3,
        onGrow: () => { count++; },
      });
    }
    t.step({ line: 11, array: a, vars: { count }, done: "found",
      message: `${count} palindromic substrings. ${2 * n - 1} centres, each expanding at most n / 2 times: O(n²) time, O(1) space.` });
  },
};

export const approaches = { everySub, centres };

/** n identical letters: every substring is a palindrome. */
export const growth = measureGrowth(
  [{ approach: everySub, slot: 1 }, { approach: centres, slot: 3 }],
  (n) => ({ s: "a".repeat(n) }),
  [8, 16, 24, 32, 48],
);
