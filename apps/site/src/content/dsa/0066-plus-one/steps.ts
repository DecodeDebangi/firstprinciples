import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { digits: number[] };

export const example: Input = { digits: [4, 2, 9, 9] };

export const fields: InputField[] = [{ key: "digits", label: "digits", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.digits.some((d) => d < 0 || d > 9)) return { error: "Each digit must be 0–9." };
  if (raw.digits.length > 1 && raw.digits[0] === 0) return { error: "No leading zeros, except for the number 0 itself." };
  return { input: raw };
}

const convert: Approach<Input> = {
  id: "convert",
  name: "Convert to a number",
  code: `function plusOne(digits)
    num ← 0
    for each d in digits
        num ← num * 10 + d
    num += 1
    return the digits of num
`,
  run({ digits }, t) {
    let num = 0n; // BigInt: Python's ints never overflow, so neither do ours
    t.step({ line: 2, array: digits, vars: { num: "0" },
      message: "The obvious way: turn the digits into a real number, add 1, then split it back into digits." });
    for (let i = 0; i < digits.length; i++) {
      t.op();
      num = num * 10n + BigInt(digits[i]);
      const tones: Record<number, Tone> = Object.fromEntries(Array.from({ length: i + 1 }, (_, k) => [k, "active" as const]));
      t.step({ line: 4, array: digits, pointers: { i }, tones, vars: { num: num.toString() },
        message: `num = num × 10 + ${digits[i]} = ${num}.` });
    }
    t.op();
    num += 1n;
    t.step({ line: 5, array: digits, vars: { num: num.toString() }, message: `Add one: ${num}.` });
    const out = [...num.toString()].map(Number);
    t.op(out.length);
    t.step({ line: 6, array: out, tones: Object.fromEntries(out.map((_, k) => [k, "found" as const])), vars: { num: num.toString() }, done: "found",
      message: `Split ${num} back into ${out.length} digits. Simple, but in Java or C++ a 100-digit number won't fit in any integer type.` });
  },
};

const carry: Approach<Input> = {
  id: "carry",
  name: "Carry from the right",
  code: `function plusOne(digits)
    for i ← length(digits) - 1 down to 0
        if digits[i] < 9
            digits[i] += 1
            return digits
        digits[i] ← 0
    return [1] followed by digits
`,
  run({ digits: input }, t) {
    const digits = [...input];
    t.step({ line: 2, array: [...digits], vars: { i: null, carry: 1 },
      message: "Do it the way you would on paper: add 1 to the last digit, and carry left only while you hit 9s." });
    for (let i = digits.length - 1; i >= 0; i--) {
      t.op();
      const d = digits[i];
      const ask = (answer: number) => ({ q: `digits[${i}] = ${d}. What happens?`, options: ["Add 1 and stop", "Write 0 and carry 1 left"], answer });
      const done: Record<number, Tone> = Object.fromEntries(Array.from({ length: digits.length - 1 - i }, (_, k) => [i + 1 + k, "visited" as const]));
      if (digits[i] < 9) {
        digits[i] += 1;
        t.step({ ask: ask(0), badge: { at: i, text: `${d} + 1 = ${d + 1}` }, line: 5, array: [...digits], pointers: { i }, tones: { ...done, [i]: "found" }, vars: { i, carry: 0 }, done: "found",
          message: `${digits[i] - 1} < 9, so it becomes ${digits[i]} and nothing carries. Stop here; every digit to the left stays as it is.` });
        return;
      }
      digits[i] = 0;
      t.step({ ask: ask(1), badge: { at: i, text: "9 + 1 = 10, carry 1" }, line: 6, array: [...digits], pointers: { i }, tones: { ...done, [i]: "compare" }, vars: { i, carry: 1 },
        message: `9 + 1 = 10: write 0 and carry 1 to the left.` });
    }
    const out = [1, ...digits];
    t.step({ ask: { q: "The carry ran past the first digit. What now?", options: ["Put a 1 in front", "Return the digits as they are"], answer: 0 }, line: 7, array: out, tones: { 0: "found" }, vars: { i: null, carry: 1 }, done: "found",
      message: "Every digit was 9, so the carry falls off the left end. Put a 1 in front: the number got one digit longer." });
  },
};

export const approaches = { convert, carry };

/** The common case: the last digit isn't 9, so the carry approach stops after one step. */
const typical = (n: number): Input => ({ digits: Array.from({ length: n }, (_, i) => (i % 8) + 1) });

export const growth = measureGrowth(
  [
    { approach: convert, slot: 1 },
    { approach: carry, slot: 2 },
  ],
  typical,
  [8, 16, 32, 48, 64, 96, 128],
);
