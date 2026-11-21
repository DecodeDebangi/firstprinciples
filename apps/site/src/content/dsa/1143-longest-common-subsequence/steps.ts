import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { lcsCode, lcsSteps, twoFields, twoPrepare, type TwoInput } from "../../concepts/45-dp-on-two-strings/steps";

export type Input = TwoInput;
export const example: Input = { a: "cart", b: "chat" };
export const fields: InputField[] = twoFields;
export function prepare(raw: Input): Prepared<Input> { return twoPrepare(raw, 5); }

const isSub = (s: string, w: string) => { let k = 0; for (const c of w) if (k < s.length && c === s[k]) k++; return k === s.length; };

const everySub: Approach<Input> = {
  id: "everySub",
  name: "Try every subsequence of a",
  code: `function longestCommonSubsequence(a, b)
    best ← 0
    for each subsequence s of a
        if s is a subsequence of b
            best ← max(best, length(s))
    return best
`,
  run({ a, b }, t) {
    const chars = [...a], m = a.length;
    let best = 0, bestS = "", asked = false;
    t.step({ line: 2, array: chars, vars: { b, best },
      message: `Every subsequence of "${a}" comes from choosing, for each letter, keep or skip: 2^${m} = ${2 ** m} choices. Check each against "${b}" and keep the longest that fits.` });
    // Longer subsequences first, so the interesting ones come early.
    const masks = Array.from({ length: 2 ** m }, (_, k) => k).sort((x, y) => (y.toString(2).split("1").length - x.toString(2).split("1").length) || x - y);
    for (const mask of masks) {
      const s = chars.filter((_, i) => (mask >> (m - 1 - i)) & 1).join("");
      t.op(b.length);
      const ok = isSub(s, b), better = ok && s.length > best;
      if (better) { best = s.length; bestS = s; }
      const ask = !asked && s.length === 2 ? (asked = true, { ask: { q: `Is "${s}" a subsequence of "${b}" (its letters in order, skipping any)?`, options: ["Yes", "No"], answer: ok ? 0 : 1 } }) : {};
      const tones = Object.fromEntries(chars.map((_, i) => [i, ((mask >> (m - 1 - i)) & 1 ? (ok ? "found" : "compare") : "discard") as Tone]));
      t.step({ ...ask, line: better ? 5 : 4, array: chars, tones, vars: { s: `"${s}"`, best },
        message: s === "" ? `The empty subsequence always fits.` : ok ? `"${s}" also appears in order in "${b}"${better ? `: the longest so far, ${best}` : ""}.` : `"${s}" doesn't appear in order in "${b}".` });
    }
    t.step({ line: 6, array: chars, vars: { best, example: `"${bestS}"` }, done: "found",
      message: `The longest is ${best} ("${bestS}"). That meant 2^${m} subsequences, each checked in O(n): O(2^m · n).` });
  },
};

const table: Approach<Input> = { id: "table", name: "Fill a table", code: lcsCode, run({ a, b }, t) { lcsSteps(a, b, t, { init: 3, same: 8, differ: 10, done: 11 }); } };

export const approaches = { everySub, table };

/** Two words of length n with nothing in common, so no subsequence check stops early. */
export const growth = measureGrowth(
  [{ approach: everySub, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ a: "ab".repeat(n).slice(0, n), b: "cd".repeat(n).slice(0, n) }),
  [2, 4, 6, 8, 10],
);
