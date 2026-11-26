import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** k is LeetCode's indexDiff, t its valueDiff. */
export type Input = { nums: number[]; k: number; t: number };
export const example: Input = { nums: [9, 2, 15, 6, 13, 4, 11], k: 2, t: 2 };
export const fields: InputField[] = [
  { key: "nums", label: "nums", kind: "numbers" },
  { key: "k", label: "k (max index gap)", kind: "number" },
  { key: "t", label: "t (max value gap)", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 1 || raw.nums.length > 10) return { error: "Use 1 to 10 numbers so everything fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < -99 || x > 99)) return { error: "Use whole numbers from -99 to 99." };
  if (!Number.isInteger(raw.k) || raw.k < 1 || raw.k > 9) return { error: "k must be a whole number from 1 to 9." };
  if (!Number.isInteger(raw.t) || raw.t < 0 || raw.t > 20) return { error: "t must be a whole number from 0 to 20." };
  return { input: raw };
}
const win = (i: number, k: number) => [Math.max(0, i - k), i] as [number, number];

const brute: Approach<Input> = {
  id: "pairs",
  name: "Check the next k values from each one",
  code: `function containsNearbyAlmostDuplicate(nums, k, t)
    for i ← 0 to n - 1
        for j ← i + 1 to min(i + k, n - 1)
            if abs(nums[i] - nums[j]) ≤ t
                return true
    return false
`,
  run({ nums: a, k, t: gap }, t) {
    const n = a.length;
    t.step({ line: 2, array: a, vars: { k, t: gap },
      message: `Look for two values at most ${k} positions apart whose difference is at most ${gap}. The plain way: compare each value with the next ${k}.` });
    for (let i = 0; i < n; i++) {
      const hi = Math.min(i + k, n - 1);
      let hit = -1;
      for (let j = i + 1; j <= hi; j++) { t.op(); if (Math.abs(a[i] - a[j]) <= gap) { hit = j; break; } }
      if (hit >= 0) {
        t.step({ line: 5, array: a, pointers: { i, j: hit }, range: [i, hi], tones: { [i]: "found", [hit]: "found" }, badge: { at: hit, text: `|${a[i]} − ${a[hit]}| = ${Math.abs(a[i] - a[hit])}` }, vars: { i, j: hit }, done: "found",
          message: `${a[i]} and ${a[hit]} are ${hit - i} apart and differ by ${Math.abs(a[i] - a[hit])} ≤ ${gap}. Return true.` });
        return;
      }
      if (i < hi) t.step({ line: 4, array: a, pointers: { i }, range: [i, hi], tones: { [i]: "active" }, vars: { i, checked: hi - i },
        message: `${a[i]} against the next ${hi - i}: ${a.slice(i + 1, hi + 1).map((x) => `${x} (off by ${Math.abs(a[i] - x)})`).join(", ")}. None within ${gap}.` });
    }
    t.step({ line: 6, array: a, vars: { k, t: gap }, done: "notfound",
      message: `No pair qualifies: return false. Each value was compared with up to ${k} others: O(n · k).` });
  },
};

const sortedWindow: Approach<Input> = {
  id: "ordered",
  name: "A sorted window (ordered set)",
  code: `function containsNearbyAlmostDuplicate(nums, k, t)
    window ← empty ordered set  // the last k values
    for each index i, value x in nums
        s ← smallest value in window ≥ x - t
        if s exists and s ≤ x + t
            return true
        window.add(x)
        if i ≥ k
            window.remove(nums[i - k])
    return false
`,
  run({ nums: a, k, t: gap }, t) {
    const w: number[] = [];
    const lg = () => Math.max(1, Math.ceil(Math.log2(w.length + 1)));
    let asked = 0;
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "window, kept sorted", rows: [w.length ? [...w] : ["empty"]], tones });
    t.step({ line: 2, array: a, grid: grid(), vars: { k, t: gap },
      message: `Only the last ${k} values can pair with the next one. Keep them in an ordered set (sorted, a balanced BST inside). Then one question per value: is there a value between x − ${gap} and x + ${gap}? The smallest one ≥ x − ${gap} answers it.` });
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      t.op(lg());
      const at = w.findIndex((v) => v >= x - gap), s = at >= 0 ? w[at] : null;
      const ok = s !== null && s <= x + gap;
      const q = asked < 2 && w.length ? (asked++, { ask: { q: `x = ${x}, t = ${gap}, and the window holds ${w.join(", ")}. Is there a value from ${x - gap} to ${x + gap}?`, options: ["Yes: return true", "No: add x and move on"], answer: ok ? 0 : 1 } }) : {};
      if (ok) {
        t.step({ ...q, line: 6, array: a, pointers: { i }, range: win(i, k), tones: { [i]: "found" }, grid: grid({ [`0,${at}`]: "found" }), vars: { x, s: s!, from: x - gap, to: x + gap }, done: "found",
          message: `The smallest value ≥ ${x - gap} is ${s}, and ${s} ≤ ${x + gap}: it's within ${gap} of ${x}, and it's in the window, so at most ${k} positions back. Return true.` });
        return;
      }
      w.push(x); w.sort((p, r) => p - r);
      t.op(lg());
      let removed: number | null = null;
      if (i >= k) { removed = a[i - k]; w.splice(w.indexOf(removed), 1); t.op(lg()); }
      t.step({ ...q, line: removed !== null ? 9 : 7, array: a, pointers: { i }, range: win(i, k), tones: { [i]: "active" }, grid: grid(Object.fromEntries(w.map((v, j) => [`0,${j}`, (v === x ? "active" : "side-b") as Tone]))), vars: { x, s: s ?? "none", from: x - gap, to: x + gap },
        message: `${s === null ? `Nothing in the window is ≥ ${x - gap}` : `The smallest value ≥ ${x - gap} is ${s}, but ${s} > ${x + gap}`}, so nothing is close enough. Add ${x}${removed !== null ? ` and remove ${removed}, which is now too far back` : ""}.` });
    }
    t.step({ line: 10, array: a, grid: grid(), vars: { k, t: gap }, done: "notfound",
      message: `No value ever had a close neighbour in its window: return false. Each value costs a few O(log k) set operations: O(n log k).` });
  },
};

const buckets: Approach<Input> = {
  id: "buckets",
  name: "Buckets of width t + 1",
  code: `function containsNearbyAlmostDuplicate(nums, k, t)
    w ← t + 1  // bucket width
    seen ← empty map  // bucket → value
    for each index i, value x in nums
        b ← floor(x / w)
        if b in seen
            return true
        if (b - 1) in seen and x - seen[b - 1] ≤ t
            return true
        if (b + 1) in seen and seen[b + 1] - x ≤ t
            return true
        seen[b] ← x
        if i ≥ k
            remove floor(nums[i - k] / w) from seen
    return false
`,
  run({ nums: a, k, t: gap }, t) {
    const w = gap + 1, seen = new Map<number, number>();
    let asked = 0;
    const map = (hl?: number) => ({ title: `seen: bucket → value (width ${w})`, entries: [...seen.entries()].sort((p, q) => p[0] - q[0]).map(([b, v]) => [String(b), String(v)] as [string, string]), ...(hl !== undefined ? { highlight: String(hl) } : {}) });
    t.step({ line: 2, array: a, map: map(), vars: { w },
      message: `Cut the number line into buckets ${w} wide: values 0 to ${w - 1} in bucket 0, ${w} to ${2 * w - 1} in bucket 1, and so on. Two values in the same bucket differ by at most ${gap}, so they match at once. A match can also sit in a neighbouring bucket, so check those two. Keep only the last ${k} values' buckets.` });
    for (let i = 0; i < a.length; i++) {
      const x = a[i], b = Math.floor(x / w);
      t.op(3);
      const same = seen.has(b), lo = seen.has(b - 1) && x - seen.get(b - 1)! <= gap, hi = seen.has(b + 1) && seen.get(b + 1)! - x <= gap;
      const q = asked < 2 && seen.size ? (asked++, { ask: { q: `x = ${x} falls in bucket ${b}. The buckets in use are ${[...seen.keys()].sort((p, r) => p - r).join(", ")}. Does x have a match?`, options: ["Yes: return true", "No: store it and move on"], answer: same || lo || hi ? 0 : 1 } }) : {};
      if (same || lo || hi) {
        const ob = same ? b : lo ? b - 1 : b + 1, ov = seen.get(ob)!;
        t.step({ ...q, line: same ? 7 : lo ? 9 : 11, array: a, pointers: { i }, range: win(i, k), tones: { [i]: "found", [a.lastIndexOf(ov, i - 1)]: "found" }, map: map(ob), vars: { x, bucket: b }, done: "found",
          message: same ? `Bucket ${b} already holds ${ov}: same bucket, so they differ by at most ${gap}. Return true.` : `Bucket ${ob} next door holds ${ov}, and |${x} − ${ov}| = ${Math.abs(x - ov)} ≤ ${gap}. Return true.` });
        return;
      }
      seen.set(b, x);
      let gone: number | null = null;
      if (i >= k) { gone = Math.floor(a[i - k] / w); seen.delete(gone); t.op(); }
      t.step({ ...q, line: gone !== null ? 14 : 12, array: a, pointers: { i }, range: win(i, k), tones: { [i]: "active" }, map: map(b), vars: { x, bucket: b },
        message: `${x} goes in bucket ${b}: it's empty${seen.has(b - 1) || seen.has(b + 1) ? ", and its neighbours' values are too far away" : ", and so are both neighbours"}.${gone !== null ? ` ${a[i - k]} leaves the window, so bucket ${gone} is cleared.` : ""}` });
    }
    t.step({ line: 15, array: a, map: map(), vars: { w }, done: "notfound",
      message: `No value found a match: return false. Each value costs a few map lookups: O(n), with at most k buckets stored.` });
  },
};

export const approaches = { pairs: brute, ordered: sortedWindow, buckets };

/** Values far apart (no match) with a wide window, k = n / 2. */
export const growth = measureGrowth(
  [{ approach: brute, slot: 1 }, { approach: sortedWindow, slot: 2 }, { approach: buckets, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i * 10), k: n / 2, t: 1 }),
  [16, 32, 64, 128, 256],
);
