import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/* ---------- Checking from both ends ---------- */
export type EndsInput = { s: string };
export const endsExample: EndsInput = { s: "racecar" };
export const endsFields: InputField[] = [{ key: "s", label: "word", kind: "text" }];
export function endsPrepare(raw: EndsInput): Prepared<EndsInput> {
  const s = raw.s.trim();
  if (!s.length) return { error: "Type a word." };
  if (s.length > 9) return { error: "Use at most 9 characters so the word fits." };
  return { input: { s } };
}

const ends: Approach<EndsInput> = {
  id: "ends",
  name: "Two pointers from the ends",
  code: `function isPalindrome(s)
    lo, hi ← 0, length(s) - 1
    while lo < hi
        if s[lo] ≠ s[hi]
            return false
        lo, hi ← lo + 1, hi - 1
    return true
`,
  run({ s }, t) {
    const a = [...s], n = a.length;
    let lo = 0, hi = n - 1;
    const matched: Record<number, Tone> = {};
    t.step({ line: 2, array: a, pointers: { lo, hi }, vars: { lo, hi },
      message: `A palindrome reads the same both ways, so its first character must equal its last, its second the second-last, and so on. Start a pointer at each end.` });
    let asked = false;
    while (lo < hi) {
      t.op();
      const same = a[lo] === a[hi];
      const ask = !asked ? (asked = true, { ask: { q: `s[${lo}] = '${a[lo]}' and s[${hi}] = '${a[hi]}'. What now?`, options: ["They match: move both pointers inwards", "They differ: return false"], answer: same ? 0 : 1 } }) : {};
      if (!same) {
        t.step({ ...ask, line: 5, array: a, pointers: { lo, hi }, tones: { ...matched, [lo]: "miss", [hi]: "miss" }, vars: { lo, hi }, done: "notfound",
          message: `'${a[lo]}' ≠ '${a[hi]}': the word reads differently backwards. Return false.` });
        return;
      }
      matched[lo] = "settled"; matched[hi] = "settled";
      t.step({ ...ask, line: 6, array: a, pointers: { lo, hi }, tones: { ...matched, [lo]: "found", [hi]: "found" }, vars: { lo, hi },
        message: `'${a[lo]}' = '${a[hi]}'. Move both inwards.` });
      lo++; hi--;
    }
    t.step({ line: 7, array: a, ...(lo === hi ? { pointers: { lo, hi } } : {}), tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: { lo, hi }, done: "found",
      message: `${lo === hi ? `The pointers meet at the middle character, '${a[lo]}', which matches itself.` : "The pointers have crossed."} Every pair matched: a palindrome. About n / 2 comparisons: O(n), O(1) space.` });
  },
};

/* ---------- Expanding around one centre ---------- */
/** centre: "3" is the character at 3; "2.5" is the gap between positions 2 and 3. */
export type ExpInput = { s: string; centre: string };
export const expExample: ExpInput = { s: "abacabx", centre: "3" };
export const expFields: InputField[] = [
  { key: "s", label: "word", kind: "text" },
  { key: "centre", label: "centre (3, or 2.5 for a gap)", kind: "text" },
];
export function expPrepare(raw: ExpInput): Prepared<ExpInput> {
  const s = raw.s.trim(), c = Number(raw.centre);
  if (!s.length) return { error: "Type a word." };
  if (s.length > 9) return { error: "Use at most 9 characters so the word fits." };
  if (!Number.isFinite(c) || c * 2 !== Math.round(c * 2)) return { error: "The centre is a position like 3, or a gap like 2.5." };
  if (c < 0 || c > s.length - 1) return { error: `The centre must be between 0 and ${s.length - 1}.` };
  return { input: { s, centre: String(c) } };
}

type T = Parameters<Approach<{ s: string }>["run"]>[1];
/**
 * Expands from lo, hi while the ends match, drawing each step. Returns the widest [lo, hi] that is a palindrome
 * (lo > hi means none, for a gap whose two sides differ). Shared with LC 5 and 647.
 */
export function expandSteps(t: T, a: string[], lo: number, hi: number, opts: {
  line: { stop: number; grow: number; end: number };
  /** Extra step fields (vars, panels) for the current lo, hi. */
  extra?: (lo: number, hi: number) => Record<string, unknown>;
  /** Ask a predict question on the first comparison of two different positions. */
  ask?: boolean;
  /** Called when s[lo..hi] is found to be a palindrome, before its step is drawn. */
  onGrow?: (lo: number, hi: number) => void;
}): [number, number] {
  const { line, extra = () => ({}), onGrow } = opts;
  let asked = !opts.ask;
  while (lo >= 0 && hi < a.length) {
    t.op();
    const same = a[lo] === a[hi];
    const q = !asked && lo < hi
      ? (asked = true, { ask: { q: `s[${lo}] = '${a[lo]}' and s[${hi}] = '${a[hi]}'. Does the palindrome grow to ${lo}..${hi}?`, options: ["Yes: they match", "No: they differ, so stop"], answer: same ? 0 : 1 } }) : {};
    if (!same) {
      t.step({ ...q, line: line.stop, array: a, range: lo + 1 <= hi - 1 ? [lo + 1, hi - 1] : null, pointers: { lo, hi }, tones: { [lo]: "miss", [hi]: "miss" }, ...extra(lo, hi),
        message: `'${a[lo]}' ≠ '${a[hi]}': stop. ${lo + 1 <= hi - 1 ? `The longest palindrome around this centre is ${lo + 1}..${hi - 1}, "${a.slice(lo + 1, hi).join("")}".` : "No palindrome has this gap as its centre."}` });
      return [lo + 1, hi - 1];
    }
    onGrow?.(lo, hi);
    t.step({ ...q, line: line.grow, array: a, range: [lo, hi], pointers: { lo, hi }, tones: { [lo]: "found", [hi]: "found" }, ...extra(lo, hi),
      message: lo === hi ? `A single character, '${a[lo]}', is a palindrome on its own. Try one wider on each side.` : `'${a[lo]}' = '${a[hi]}', so ${lo}..${hi}, "${a.slice(lo, hi + 1).join("")}", is a palindrome too. Try one wider.` });
    lo--; hi++;
  }
  t.step({ line: line.end, array: a, range: [lo + 1, hi - 1], tones: {}, ...extra(lo + 1, hi - 1),
    message: `The ${lo < 0 ? "start" : "end"} of the string is reached: "${a.slice(lo + 1, hi).join("")}" is as wide as it can get around this centre.` });
  return [lo + 1, hi - 1];
}

const expand: Approach<ExpInput> = {
  id: "expand",
  name: "Expand around a centre",
  code: `function expand(s, lo, hi)
    while lo ≥ 0 and hi < length(s)
        if s[lo] ≠ s[hi]
            break
        lo, hi ← lo - 1, hi + 1
    return lo + 1, hi - 1  // the widest one
`,
  run({ s, centre }, t) {
    const a = [...s], c = Number(centre);
    const lo = Math.floor(c), hi = Math.ceil(c);
    t.step({ line: 1, array: a, pointers: { lo, hi }, vars: { lo, hi },
      message: lo === hi
        ? `Centre on the character at ${c}: lo = hi = ${c}. That finds the palindromes of odd length centred there.`
        : `Centre on the gap between ${lo} and ${hi}: lo = ${lo}, hi = ${hi}. That finds the palindromes of even length centred there.` });
    const [L, R] = expandSteps(t, a, lo, hi, { line: { stop: 4, grow: 5, end: 2 }, extra: (l, h) => ({ vars: { lo: l, hi: h } }), ask: true });
    t.step({ line: 6, array: a, ...(L <= R ? { range: [L, R] as [number, number] } : {}), tones: Object.fromEntries(Array.from({ length: Math.max(0, R - L + 1) }, (_, k) => [L + k, "settled" as Tone])), vars: { lo: L, hi: R }, done: L <= R ? "found" : "notfound",
      message: L <= R
        ? `Around centre ${c}: "${a.slice(L, R + 1).join("")}" (${L}..${R}), and every shorter palindrome inside it with the same centre. Each expansion step costs O(1), and there are at most n / 2 of them: O(n).`
        : `No palindrome is centred on this gap: its two sides differ.` });
  },
};

export const endsApproaches = { ends };
export const expApproaches = { expand };
