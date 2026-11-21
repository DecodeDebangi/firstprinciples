import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** The 8 low bits of x, most significant first. */
export const bitsOf = (x: number, width = 8) => Array.from({ length: width }, (_, k) => (x >> (width - 1 - k)) & 1);
/** Place values under 8 bit cells: 128 … 1. */
export const placeLabels = (width = 8) => Array.from({ length: width }, (_, k) => String(2 ** (width - 1 - k)));
export const bin = (x: number, width = 8) => bitsOf(x, width).join("");
type T = Parameters<Approach<{ x: number }>["run"]>[1];
export type { T as BitTracer };

/* ---------- Converting to binary ---------- */
export type BinInput = { x: number };
export const binExample: BinInput = { x: 13 };
export const binFields: InputField[] = [{ key: "x", label: "x (0 to 255)", kind: "number" }];
export function binPrepare(raw: BinInput): Prepared<BinInput> {
  if (raw.x < 0 || raw.x > 255) return { error: "Use a number from 0 to 255, so it fits in 8 bits." };
  return { input: raw };
}

const toBinary: Approach<BinInput> = {
  id: "toBinary",
  name: "Divide by 2, keep the remainders",
  code: `function toBinary(x)
    bits ← empty list
    while x > 0
        put x % 2 at the front of bits
        x ← floor(x / 2)
    return bits
`,
  run({ x: x0 }, t) {
    const cells: (number | string)[] = Array(8).fill(""), labels = placeLabels();
    let x = x0, k = 7;
    t.step({ line: 2, array: [...cells], labels, vars: { x },
      message: `In binary each place is worth twice the one to its right: 1, 2, 4, 8, … 128 (written under the cells). The last bit of x is x % 2, its remainder when halved. Halve and repeat to get the rest.` });
    let asked = false;
    while (x > 0) {
      t.op();
      const bit = x % 2, before = x;
      cells[k] = bit;
      x = Math.floor(x / 2);
      const ask = !asked && before > 1
        ? (asked = true, { ask: { q: `x is ${before}. What is the next bit, x % 2?`, options: [String(bit), String(1 - bit)], answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: [...cells], labels, pointers: { bit: k }, tones: { [k]: "active" }, vars: { x, "x % 2": bit },
        message: `${before} % 2 = ${bit}, so the ${labels[k]}s place holds ${bit}. Then x = floor(${before} / 2) = ${x}.` });
      k--;
    }
    for (let i = 0; i <= k; i++) cells[i] = 0;
    const sum = bitsOf(x0).map((b, i) => (b ? labels[i] : "")).filter(Boolean);
    t.step({ line: 6, array: [...cells], labels, tones: Object.fromEntries(cells.map((b, i) => [i, (b === 1 ? "settled" : "discard") as Tone])), vars: { binary: bin(x0) }, done: "found",
      message: `${x0} is ${bin(x0)} in 8 bits${sum.length ? `: ${sum.join(" + ")} = ${x0}` : ""}. The leading 0s fill the places it doesn't use. A number up to n needs about log₂ n bits, so this loop runs O(log n) times.` });
  },
};

/* ---------- Combining two numbers bit by bit ---------- */
export type OpInput = { a: number; b: number; op: string };
export const opExample: OpInput = { a: 12, b: 10, op: "xor" };
export const opFields: InputField[] = [
  { key: "a", label: "a (0 to 255)", kind: "number" },
  { key: "b", label: "b (0 to 255)", kind: "number" },
  { key: "op", label: "and, or or xor", kind: "text" },
];
export function opPrepare(raw: OpInput): Prepared<OpInput> {
  const op = raw.op.toLowerCase();
  if (!["and", "or", "xor"].includes(op)) return { error: "The operation must be and, or or xor." };
  if ([raw.a, raw.b].some((v) => v < 0 || v > 255)) return { error: "Use numbers from 0 to 255, so they fit in 8 bits." };
  return { input: { ...raw, op } };
}
const SYMBOL: Record<string, string> = { and: "&", or: "|", xor: "xor" };
const apply = (op: string, x: number, y: number) => (op === "and" ? x & y : op === "or" ? x | y : x ^ y);
const RULE: Record<string, string> = { and: "1 only if both bits are 1", or: "1 if either bit is 1", xor: "1 if exactly one bit is 1" };

const combine: Approach<OpInput> = {
  id: "combine",
  name: "Combine bit by bit",
  code: `function combine(a, b, op)  // op is &, | or xor
    result ← 0
    for k ← 7 down to 0
        bitA ← (a >> k) & 1
        bitB ← (b >> k) & 1
        if (bitA op bitB) = 1
            result += 1 << k
    return result
`,
  run({ a, b, op }, t) {
    const sym = SYMBOL[op], A = bitsOf(a), Bb = bitsOf(b), R: (number | string)[] = Array(8).fill("");
    const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: `a ${sym} b, bit by bit`, rows: [A, Bb, [...R]], rowLabels: ["a", "b", `a ${sym} b`], colLabels: placeLabels(), dense: true, tones } });
    let result = 0;
    t.step({ line: 2, array: [], hideStage: true, ...grid(), vars: { a, b, result },
      message: `${a} is ${bin(a)} and ${b} is ${bin(b)}. ${op.toUpperCase()} looks at each place on its own: the result bit is ${RULE[op]}. (a >> k) & 1 reads the bit in place k.` });
    let asked = false;
    for (let k = 7; k >= 0; k--) {
      t.op();
      const col = 7 - k, x = A[col], y = Bb[col], r = apply(op, x, y);
      R[col] = r;
      if (r) result += 1 << k;
      const ask = !asked && x !== y
        ? (asked = true, { ask: { q: `In the ${2 ** k}s place, a has ${x} and b has ${y}. What is the ${op.toUpperCase()} bit?`, options: [String(r), String(1 - r)], answer: 0 } }) : {};
      t.step({ ...ask, line: r ? 7 : 6, array: [], hideStage: true, ...grid({ [`0,${col}`]: "compare", [`1,${col}`]: "compare", [`2,${col}`]: r ? "found" : "discard" }), vars: { k, bitA: x, bitB: y, result },
        message: `${2 ** k}s place: ${x} ${sym} ${y} = ${r}.${r ? ` Add ${2 ** k}: result is ${result}.` : ""}` });
    }
    t.step({ line: 8, array: [], hideStage: true, ...grid(), vars: { result }, done: "found",
      message: `${a} ${sym} ${b} = ${result} (${bin(result)}). A computer does all the places at once, in a single step: O(1).` });
  },
};

export const binApproaches = { toBinary };
export const opApproaches = { combine };
