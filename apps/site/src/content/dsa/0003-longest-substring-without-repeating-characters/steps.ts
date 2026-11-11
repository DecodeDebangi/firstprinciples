import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };

export const example: Input = { s: "dvdfab" };

export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.s.length === 0) return { error: "Type at least one character." };
  return { input: raw };
}

const span = (a: number, b: number, tone: Tone): Record<number, Tone> =>
  Object.fromEntries(Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => [a + k, tone]));

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force: grow from every start",
  code: `def length_of_longest_substring(s):
    best = 0
    for i in range(len(s)):
        seen = set()
        for j in range(i, len(s)):
            if s[j] in seen:
                break
            seen.add(s[j])
            best = max(best, j - i + 1)
    return best
`,
  run({ s }, t) {
    const a = [...s];
    let best = 0, bi = 0, bj = -1;
    t.step({ line: 2, array: a, vars: { best }, message: "From every start position, extend to the right until a letter repeats. Keep the longest run." });
    for (let i = 0; i < a.length; i++) {
      const seen = new Set<string>();
      for (let j = i; j < a.length; j++) {
        t.op();
        if (seen.has(a[j])) {
          t.step({ line: 7, array: a, pointers: { i, j }, range: [i, j - 1], tones: { [j]: "miss" }, badge: { at: j, text: `"${a[j]}" repeats` },
            vars: { i, j, best }, message: `"${a[j]}" is already in this run. Stop, and start over from position ${i + 1}, re-checking letters we just saw.` });
          break;
        }
        seen.add(a[j]);
        if (j - i + 1 > best) { best = j - i + 1; bi = i; bj = j; }
        t.step({ line: 9, array: a, pointers: { i, j }, range: [i, j], tones: { [j]: "compare" }, vars: { i, j, best },
          message: `"${s.slice(i, j + 1)}" has no repeats: length ${j - i + 1}.` });
      }
    }
    t.step({ line: 10, array: a, range: [bi, bj], tones: span(bi, bj, "found"), vars: { best }, done: "found",
      message: `Longest: "${s.slice(bi, bj + 1)}", length ${best}.` });
  },
};

const windowSet: Approach<Input> = {
  id: "window",
  name: "Sliding window with a set",
  code: `def length_of_longest_substring(s):
    seen = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best
`,
  run({ s }, t) {
    const a = [...s];
    const seen = new Set<string>();
    let left = 0, best = 0, bi = 0, bj = -1;
    const map = () => ({ title: "seen (letters in the window)", entries: [...seen].map((c) => [c, "in window"] as [string, string]) });
    t.step({ line: 3, array: a, pointers: { left }, vars: { left, best }, map: map(),
      message: "Keep a window with no repeats. Grow it on the right; when a repeat arrives, shrink it from the left. No letter is re-checked from scratch." });
    for (let right = 0; right < a.length; right++) {
      const ch = a[right];
      const repeat = seen.has(ch);
      const ask = { q: `Next letter: "${ch}". Is it already in the window?`, options: ["Yes: shrink from the left first", "No: just add it"], answer: repeat ? 0 : 1 };
      let asked = false;
      while (seen.has(ch)) {
        t.op();
        t.step({ ...(asked ? {} : { ask }), line: 6, array: a, pointers: { left, right }, range: [left, right - 1], tones: { [left]: "discard", [right]: "miss" },
          badge: { at: right, text: `"${ch}" repeats` }, vars: { left, right, best }, map: { ...map(), highlight: a[left] },
          message: `"${ch}" is already inside. Drop "${a[left]}" from the left.` });
        asked = true;
        seen.delete(a[left]);
        left++;
      }
      t.op();
      seen.add(ch);
      const len = right - left + 1;
      if (len > best) { best = len; bi = left; bj = right; }
      t.step({ ...(asked ? {} : { ask }), line: 9, array: a, pointers: { left, right }, range: [left, right], tones: { [right]: "compare" },
        badge: { at: right, text: `length ${len}` }, vars: { left, right, best }, map: { ...map(), highlight: ch },
        message: `Add "${ch}". The window "${s.slice(left, right + 1)}" has length ${len}${len === best ? ", the best so far" : ""}.` });
    }
    t.step({ line: 10, array: a, range: [bi, bj], tones: span(bi, bj, "found"), vars: { best }, map: map(), done: "found",
      message: `Longest: "${s.slice(bi, bj + 1)}", length ${best}. Each letter entered and left the window at most once.` });
  },
};

const jump: Approach<Input> = {
  id: "jump",
  name: "Sliding window, jump with last index",
  code: `def length_of_longest_substring(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
`,
  run({ s }, t) {
    const a = [...s];
    const last = new Map<string, number>();
    let left = 0, best = 0, bi = 0, bj = -1;
    const map = (hl?: string) => ({ title: "last (letter → last index)", entries: [...last].map(([c, k]) => [c, String(k)] as [string, string]), highlight: hl });
    t.step({ line: 3, array: a, pointers: { left }, vars: { left, best }, map: map(),
      message: "Remember where each letter was last seen. On a repeat, jump left straight past the old copy instead of shrinking one step at a time." });
    for (let right = 0; right < a.length; right++) {
      const ch = a[right];
      t.op();
      const prev = last.get(ch);
      const jumps = prev !== undefined && prev >= left;
      const ask = { q: `"${ch}" was last seen at ${prev ?? "nowhere"}; left is ${left}. What happens to left?`,
        options: ["Jump past the earlier copy", "Leave left where it is"], answer: jumps ? 0 : 1 };
      if (jumps) {
        t.step({ ask, line: 6, array: a, pointers: { left: prev! + 1, right }, range: [prev! + 1, right], tones: { ...span(left, prev!, "discard"), [prev!]: "miss", [right]: "miss" },
          badge: { at: right, text: `jump to ${prev! + 1}` }, vars: { left: prev! + 1, right, best }, map: map(ch),
          message: `"${ch}" was at ${prev}, inside the window. Jump left to ${prev! + 1} in one move.` });
        left = prev! + 1;
      }
      last.set(ch, right);
      const len = right - left + 1;
      if (len > best) { best = len; bi = left; bj = right; }
      t.step({ ...(jumps ? {} : { ask }), line: 8, array: a, pointers: { left, right }, range: [left, right], tones: { [right]: "compare" },
        badge: { at: right, text: `length ${len}` }, vars: { left, right, best }, map: map(ch),
        message: `Record "${ch}" at ${right}. Window "${s.slice(left, right + 1)}", length ${len}${len === best ? ", the best so far" : ""}.` });
    }
    t.step({ line: 9, array: a, range: [bi, bj], tones: span(bi, bj, "found"), vars: { best }, map: map(), done: "found",
      message: `Longest: "${s.slice(bi, bj + 1)}", length ${best}, in exactly one pass.` });
  },
};

export const approaches = { brute: bruteForce, window: windowSet, jump };

/** Worst case for brute force: every character distinct, so no run ever stops early. */
const worstCase = (n: number): Input => ({ s: Array.from({ length: n }, (_, i) => String.fromCharCode(0x4e00 + i)).join("") });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: windowSet, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
