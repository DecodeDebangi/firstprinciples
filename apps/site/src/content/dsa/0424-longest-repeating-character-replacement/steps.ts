import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string; k: number };
export const example: Input = { s: "BAABCBBA", k: 2 };
export const fields: InputField[] = [
  { key: "s", label: "s (A to Z)", kind: "text" },
  { key: "k", label: "changes allowed k", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.toUpperCase();
  if (!/^[A-Z]+$/.test(s)) return { error: "Use capital letters A to Z." };
  if (s.length > 9) return { error: "Use at most 9 letters so they fit." };
  if (raw.k < 0 || raw.k > 9) return { error: "k must be from 0 to 9." };
  return { input: { s, k: raw.k } };
}
const countPanel = (c: Map<string, number>, hl?: string) => ({ title: "letter counts in the window", entries: [...c].filter(([, v]) => v > 0).sort().map(([ch, v]) => [ch, String(v)] as [string, string]), highlight: hl });
const most = (c: Map<string, number>) => Math.max(0, ...c.values());

const everyStart: Approach<Input> = {
  id: "everyStart",
  name: "From every start, extend while it can be fixed",
  code: `function characterReplacement(s, k)
    best ← 0
    for left ← 0 to length(s) - 1
        counts ← empty map
        top ← 0  // most common letter's count
        for right ← left to length(s) - 1
            counts[s[right]] += 1
            top ← max(top, counts[s[right]])
            if (right - left + 1) - top > k
                break
            best ← max(best, right - left + 1)
    return best
`,
  run({ s, k }, t) {
    const a = [...s];
    let best = 0;
    t.step({ line: 2, array: a, vars: { k, best }, message: `A window can be made all one letter by keeping its most common letter and changing the rest: length − (count of the most common letter) changes. From each start, extend while that's at most ${k}.` });
    for (let l = 0; l < a.length; l++) {
      const c = new Map<string, number>();
      let top = 0, r = l;
      for (; r < a.length; r++) { t.op(); c.set(a[r], (c.get(a[r]) ?? 0) + 1); top = Math.max(top, c.get(a[r])!); if (r - l + 1 - top > k) { c.set(a[r], c.get(a[r])! - 1); break; } }
      const len = r - l;
      if (len > best) best = len;
      t.step({ line: 11, array: a, range: [l, r - 1], tones: Object.fromEntries(a.map((_, i) => [i, (i >= l && i < r ? "settled" : i === r ? "miss" : "discard") as Tone])), map: countPanel(c), vars: { left: l, length: len, best },
        message: `Starting at ${l}: ${a.slice(l, r).join("")} needs ${len - most(c)} change${len - most(c) === 1 ? "" : "s"}${r < a.length ? `; adding '${a[r]}' would need ${len + 1 - Math.max(most(c), (c.get(a[r]) ?? 0) + 1)}, more than ${k}` : ""}.${len === best ? " The longest so far." : ""}` });
    }
    t.step({ line: 12, array: a, vars: { best }, done: "found", message: `The longest is ${best}. Every start recounts its window from scratch: O(n²).` });
  },
};

const window: Approach<Input> = {
  id: "window",
  name: "One window with letter counts",
  code: `function characterReplacement(s, k)
    counts ← empty map
    left, best ← 0, 0
    for right ← 0 to length(s) - 1
        counts[s[right]] += 1
        while (right - left + 1) - max(counts) > k
            counts[s[left]] -= 1  // too costly
            left += 1
        best ← max(best, right - left + 1)
    return best
`,
  run({ s, k }, t) {
    const a = [...s], c = new Map<string, number>();
    let left = 0, best = 0, asked = false;
    t.step({ line: 2, array: a, map: countPanel(c), vars: { k, best },
      message: `The window's cost is its length minus the count of its most common letter: the letters you'd have to change. Grow it every step; while the cost is over ${k}, drop letters from the left.` });
    a.forEach((ch, right) => {
      t.op(26);
      c.set(ch, (c.get(ch) ?? 0) + 1);
      let len = right - left + 1;
      const cost = len - most(c);
      if (cost > k) {
        const q = !asked ? (asked = true, { ask: { q: `The window ${a.slice(left, right + 1).join("")} has length ${len}, and its most common letter appears ${most(c)} times. Can it be fixed with ${k} change${k === 1 ? "" : "s"}?`, options: [`No: it needs ${cost}, so shrink it`, "Yes: keep growing"], answer: 0 } }) : {};
        const from = left;
        while (right - left + 1 - most(c) > k) { t.op(26); c.set(a[left], c.get(a[left])! - 1); left++; }
        len = right - left + 1;
        t.step({ ...q, line: 8, array: a, range: [left, right], pointers: { left, right }, tones: Object.fromEntries(a.map((_, i) => [i, (i >= left && i <= right ? "settled" : i >= from && i < left ? "miss" : "discard") as Tone])), map: countPanel(c), vars: { best },
          message: `Adding '${ch}' made the window need ${cost} changes, more than ${k}. Drop ${a.slice(from, left).join("")} from the left: ${a.slice(left, right + 1).join("")} needs ${len - most(c)}.` });
      }
      if (len > best) best = len;
      t.step({ line: 9, array: a, range: [left, right], pointers: { left, right }, tones: Object.fromEntries(a.map((_, i) => [i, (i >= left && i <= right ? (i === right ? "active" : "settled") : "discard") as Tone])), map: countPanel(c, ch), vars: { best },
        message: `${a.slice(left, right + 1).join("")}: length ${len}, most common letter ×${most(c)}, so ${len - most(c)} change${len - most(c) === 1 ? "" : "s"}, within ${k}.${len === best ? " The longest so far." : ""}` });
    });
    t.step({ line: 10, array: a, vars: { best }, done: "found",
      message: `The longest is ${best}. Each letter enters and leaves the window once, and finding the most common count looks at 26 letters: O(26 · n) = O(n).` });
  },
};

export const approaches = { everyStart, window };

/** A string that's all one letter: every start runs to the end. */
export const growth = measureGrowth(
  [{ approach: everyStart, slot: 1 }, { approach: window, slot: 3 }],
  (n) => ({ s: "A".repeat(n), k: 1 }),
  [8, 16, 32, 64, 128],
);
