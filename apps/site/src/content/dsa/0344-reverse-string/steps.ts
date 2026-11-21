import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { s: string };
export const example: Input = { s: "stressed" };
export const fields: InputField[] = [{ key: "s", label: "characters", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.trim();
  if (!s.length) return { error: "Type at least one character." };
  if (s.length > 9) return { error: "Use at most 9 characters so they fit." };
  return { input: { s } };
}

const copyBack: Approach<Input> = {
  id: "copy",
  name: "Fill a reversed copy, then copy it back",
  code: `function reverseString(s)
    n ← length(s)
    rev ← array of n
    for i ← 0 to n - 1
        rev[i] ← s[n - 1 - i]
    for i ← 0 to n - 1
        s[i] ← rev[i]
`,
  run({ s }, t) {
    const a = [...s], n = a.length, rev: string[] = Array(n).fill("");
    const panel = () => ({ grid: { title: "rev", rows: [[...rev]], colLabels: rev.map((_, k) => k) } });
    t.step({ line: 3, array: [...a], ...panel(), vars: { n },
      message: `The last character goes first, the second-last second, and so on: rev[i] is s[n − 1 − i]. Fill a second array that way, then copy it over s.` });
    for (let i = 0; i < n; i++) {
      t.op();
      rev[i] = a[n - 1 - i];
      t.step({ line: 5, array: [...a], pointers: { i: n - 1 - i }, tones: { [n - 1 - i]: "active" }, ...panel(), vars: { i, "n - 1 - i": n - 1 - i },
        message: `rev[${i}] ← s[${n - 1 - i}] = '${a[n - 1 - i]}'.` });
    }
    for (let i = 0; i < n; i++) {
      t.op();
      a[i] = rev[i];
    }
    t.step({ line: 7, array: [...a], tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), ...panel(), vars: { n }, done: "found",
      message: `Copied back: s is now "${a.join("")}". O(n) time, but the second array costs O(n) extra memory, and the problem asks for O(1).` });
  },
};

const swapEnds: Approach<Input> = {
  id: "swap",
  name: "Swap from both ends",
  code: `function reverseString(s)
    lo, hi ← 0, length(s) - 1
    while lo < hi
        swap s[lo] and s[hi]
        lo, hi ← lo + 1, hi - 1
`,
  run({ s }, t) {
    const a = [...s];
    let lo = 0, hi = a.length - 1;
    const done: Record<number, Tone> = {};
    t.step({ line: 2, array: [...a], pointers: { lo, hi }, vars: { lo, hi },
      message: `The first and last characters trade places, then the second and second-last, and so on. Each swap puts two characters in their final places, with no second array.` });
    let asked = false;
    while (lo < hi) {
      t.op();
      const ask = !asked && hi - lo > 2
        ? (asked = true, { ask: { q: `lo = ${lo} and hi = ${hi}. Which positions swap now?`, options: [`${lo} and ${hi}`, `${lo} and ${lo + 1}`, `${hi - 1} and ${hi}`], answer: 0 } }) : {};
      const [x, y] = [a[lo], a[hi]];
      [a[lo], a[hi]] = [y, x];
      done[lo] = "settled"; done[hi] = "settled";
      t.step({ ...ask, line: 4, array: [...a], pointers: { lo, hi }, tones: { ...done, [lo]: "found", [hi]: "found" }, vars: { lo, hi },
        message: `Swap s[${lo}] = '${x}' and s[${hi}] = '${y}'. Both are now in their final places.` });
      lo++; hi--;
    }
    t.step({ line: 3, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: { lo, hi }, done: "found",
      message: `${lo === hi ? `lo and hi meet at '${a[lo]}', the middle character, which stays put.` : "lo has passed hi."} Reversed: "${a.join("")}". ${Math.floor(a.length / 2)} swaps: O(n) time, O(1) extra space.` });
  },
};

export const approaches = { copy: copyBack, swap: swapEnds };
