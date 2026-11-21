import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { expandSteps } from "../../concepts/37-palindromes/steps";

export type Input = { s: string };
export const example: Input = { s: "cabbad" };
export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim();
  if (!s.length) return { error: "Type at least one character." };
  if (s.length > 9) return { error: "Use at most 9 characters so the string fits." };
  return { input: { s } };
}

const settled = (lo: number, hi: number) => Object.fromEntries(Array.from({ length: hi - lo + 1 }, (_, k) => [lo + k, "settled" as Tone]));

const everySub: Approach<Input> = {
  id: "everySub",
  name: "Check every substring",
  code: `function longestPalindrome(s)
    best ← ""
    for i ← 0 to length(s) - 1
        for j ← i to length(s) - 1
            if isPalindrome(s[i..j])
                if j - i + 1 > length(best)
                    best ← s[i..j]
    return best
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    let best: [number, number] = [0, -1];
    const bestText = () => (best[1] >= best[0] ? `"${a.slice(best[0], best[1] + 1).join("")}"` : `""`);
    t.step({ line: 2, array: a, vars: { best: bestText() },
      message: `Try every substring s[i..j], check it with two pointers from its ends, and keep the longest palindrome seen.` });
    let asked = false;
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let lo = i, hi = j, ok = true;
        while (lo < hi) { t.op(); if (a[lo] !== a[hi]) { ok = false; break; } lo++; hi--; }
        const sub = a.slice(i, j + 1).join("");
        const longer = ok && j - i > best[1] - best[0];
        const ask = !asked && j - i >= 2
          ? (asked = true, { ask: { q: `Is "${sub}" (positions ${i}..${j}) a palindrome?`, options: ["Yes", "No"], answer: ok ? 0 : 1 } }) : {};
        if (longer) best = [i, j];
        t.step({ ...ask, line: longer ? 7 : 5, array: a, range: [i, j], ...(ok ? {} : { pointers: { lo, hi } }), tones: ok ? settled(i, j) : { [lo]: "miss", [hi]: "miss" }, vars: { i, j, best: bestText() },
          message: !ok ? `"${sub}": '${a[lo]}' ≠ '${a[hi]}', not a palindrome.` : longer ? `"${sub}" is a palindrome, and the longest so far: keep it.` : `"${sub}" is a palindrome, but not longer than ${bestText()}.` });
      }
    }
    t.step({ line: 8, array: a, range: [best[0], best[1]], tones: settled(best[0], best[1]), vars: { best: bestText() }, done: "found",
      message: `The longest is ${bestText()}. That was ${n * (n + 1) / 2} substrings, each checked in up to n / 2 comparisons: O(n³) when many substrings are long near-palindromes, and O(1) space.` });
  },
};

const centres: Approach<Input> = {
  id: "centres",
  name: "Expand around every centre",
  code: `function longestPalindrome(s)
    best ← ""
    for c ← 0 to 2 · length(s) - 2
        lo ← floor(c / 2)
        hi ← lo + c % 2  // gap centres: hi = lo + 1
        while lo ≥ 0 and hi < length(s)
            if s[lo] ≠ s[hi]
                break
            lo, hi ← lo - 1, hi + 1
        lo, hi ← lo + 1, hi - 1
        if hi - lo + 1 > length(best)
            best ← s[lo..hi]
    return best
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    let best: [number, number] = [0, -1];
    // Ask on the centre that will give the answer.
    let target = 0, tl = -1;
    for (let c = 0; c <= 2 * n - 2; c++) {
      let lo = Math.floor(c / 2), hi = lo + (c % 2);
      while (lo >= 0 && hi < n && a[lo] === a[hi]) { lo--; hi++; }
      if (hi - lo - 1 > tl) { tl = hi - lo - 1; target = c; }
    }
    const bestText = () => (best[1] >= best[0] ? `"${a.slice(best[0], best[1] + 1).join("")}"` : `""`);
    t.step({ line: 2, array: a, vars: { best: bestText() },
      message: `Every palindrome has a centre: a character (odd length) or the gap between two (even length). Try all ${2 * n - 1} centres, expand each as far as it goes, and keep the longest.` });
    for (let c = 0; c <= 2 * n - 2; c++) {
      const lo = Math.floor(c / 2), hi = lo + (c % 2);
      const where = lo === hi ? `the character at ${lo}` : `the gap between ${lo} and ${hi}`;
      const [L, R] = expandSteps(t, a, lo, hi, {
        line: { stop: 8, grow: 9, end: 6 },
        extra: () => ({ vars: { centre: where, best: bestText() } }),
        ask: c === target && lo !== hi,
      });
      if (R - L > best[1] - best[0]) {
        best = [L, R];
        t.step({ line: 12, array: a, range: [L, R], tones: settled(L, R), vars: { centre: where, best: bestText() },
          message: `${bestText()} (length ${R - L + 1}) is the longest palindrome so far. Keep it.` });
      }
    }
    t.step({ line: 13, array: a, range: [best[0], best[1]], tones: settled(best[0], best[1]), vars: { best: bestText() }, done: "found",
      message: `The longest palindrome is ${bestText()}. ${2 * n - 1} centres, each expanding at most n / 2 times: O(n²) time, and only a few indices: O(1) space.` });
  },
};

export const approaches = { everySub, centres };

/** n identical letters: every substring is a palindrome, so every check runs to the middle. */
export const growth = measureGrowth(
  [{ approach: everySub, slot: 1 }, { approach: centres, slot: 3 }],
  (n) => ({ s: "a".repeat(n) }),
  [8, 16, 24, 32, 48],
);
