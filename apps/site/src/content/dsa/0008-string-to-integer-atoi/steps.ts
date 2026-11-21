import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";
import { showSpaces } from "../../concepts/39-reading-text-apart/steps";

export type Input = { s: string };
export const example: Input = { s: "  -0420x9" };
export const fields: InputField[] = [{ key: "s", label: "s (spaces allowed)", kind: "raw" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.s.length > 12) return { error: "Use at most 12 characters so they fit." };
  return { input: raw };
}

const MAX = 2 ** 31 - 1, MIN = -(2 ** 31);
type T = Parameters<Approach<Input>["run"]>[1];

/** The shared walk: spaces, sign, digits. `early` checks for overflow before each digit; otherwise it clamps at the end. */
function walk(s: string, t: T, early: boolean) {
  const a = showSpaces(s), n = s.length;
  const L = early
    ? { space: 4, sign: 9, digit: 16, clamp: 15, end: 18 }
    : { space: 4, sign: 9, digit: 13, clamp: 15, end: 15 };
  const tones: Record<number, Tone> = {};
  t.step({ line: 2, array: a, vars: {},
    message: `Follow the rules in order: skip leading spaces, read one optional sign, then read digits until something that isn't a digit. Anything after that is ignored.` });
  let i = 0;
  while (i < n && s[i] === " ") { t.op(); tones[i] = "discard"; i++; }
  if (i > 0) t.step({ line: L.space, array: a, ...(i < n ? { pointers: { i } } : {}), tones: { ...tones }, vars: { i },
    message: `Skip ${i} leading space${i > 1 ? "s" : ""}.` });
  let sign = 1;
  if (i < n && (s[i] === "+" || s[i] === "-")) {
    t.op();
    sign = s[i] === "-" ? -1 : 1;
    tones[i] = "visited";
    t.step({ line: L.sign, array: a, pointers: { i }, tones: { ...tones }, vars: { sign },
      message: `'${s[i]}': the number is ${sign < 0 ? "negative" : "positive"}, sign = ${sign}. Only one sign is allowed, and only here.` });
    i++;
  }
  let result = 0, asked = false;
  while (i < n && s[i] >= "0" && s[i] <= "9") {
    t.op();
    const d = s.charCodeAt(i) - 48;
    if (early && result > (MAX - d) / 10) {
      const out = sign === 1 ? MAX : MIN;
      t.step({ line: L.clamp, array: a, pointers: { i }, tones: { ...tones, [i]: "miss" }, vars: { result, d, answer: out }, done: "found",
        message: `${result} · 10 + ${d} would be more than MAX = ${MAX}, the largest 32-bit integer. Stop before it overflows and return ${out}.` });
      return;
    }
    const before = result;
    result = result * 10 + d;
    tones[i] = "settled";
    const ask = !asked && before > 0
      ? (asked = true, { ask: { q: `result is ${before} and the next digit is ${d}. What is result now?`, options: [String(result), String(before + d), String(before * 100 + d)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
    t.step({ ...ask, line: L.digit, array: a, pointers: { i }, tones: { ...tones, [i]: "active" }, vars: { d, result },
      message: `'${s[i]}' is the digit ${d}: result = ${before} · 10 + ${d} = ${result}.${early ? ` It fits under MAX, so carry on.` : ""}` });
    i++;
  }
  if (i < n) t.step({ line: L.digit - (early ? 4 : 2), array: a, pointers: { i }, tones: { ...tones, [i]: "discard" }, vars: { result },
    message: `'${s[i]}' isn't a digit: stop reading. ${i < n - 1 ? "Everything after it is ignored too." : ""}` });
  const answer = sign * result;
  if (!early) {
    const clamped = Math.min(Math.max(answer, MIN), MAX);
    t.step({ line: L.end, array: a, tones, vars: { "sign · result": answer, answer: clamped }, done: "found",
      message: clamped !== answer
        ? `${answer} is outside the 32-bit range, so clamp it to ${clamped}. But a language with 32- or 64-bit integers would already have overflowed while reading, giving garbage before this line ever runs.`
        : `${answer} fits in 32 bits: return it. This works here, but with enough digits a fixed-size integer would overflow during the loop, before the clamp.` });
    return;
  }
  t.step({ line: L.end, array: a, tones, vars: { "sign · result": answer, answer }, done: "found",
    message: `Return ${sign} · ${result} = ${answer}. Every digit was checked against MAX before it was added, so nothing ever overflowed. O(n) time, O(1) space.` });
}

const header = `function myAtoi(s)
    i, n ← 0, length(s)
    while i < n and s[i] = ' '
        i += 1
    sign ← 1
    if i < n and (s[i] = '+' or s[i] = '-')
        if s[i] = '-'
            sign ← -1
        i += 1
`;

const clampEnd: Approach<Input> = {
  id: "clampEnd",
  name: "Read everything, clamp at the end",
  code: header + `    result ← 0
    while i < n and s[i] is a digit
        d ← code(s[i]) - code('0')
        result ← result · 10 + d
        i += 1
    return min(max(sign · result, -2^31), 2^31 - 1)
`,
  run({ s }, t) { walk(s, t, false); },
};

const checkEach: Approach<Input> = {
  id: "checkEach",
  name: "Check before every digit",
  code: header + `    MAX ← 2^31 - 1  // 2147483647
    result ← 0
    while i < n and s[i] is a digit
        d ← code(s[i]) - code('0')
        if result > (MAX - d) / 10  // too big?
            return sign = 1 ? MAX : -MAX - 1
        result ← result · 10 + d
        i += 1
    return sign · result
`,
  run({ s }, t) { walk(s, t, true); },
};

export const approaches = { clampEnd, checkEach };
