import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };
export const example: Input = { nums: [4, 2, 2, 6, 1, 4] };
export const fields: InputField[] = [{ key: "nums", label: "nums (each from 1 to its length)", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  const n = raw.nums.length;
  if (n === 0) return { error: "Give at least one value." };
  if (n > 8) return { error: "Use at most 8 values." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 1 || x > n)) return { error: `With ${n} values, each one must be a whole number from 1 to ${n}.` };
  return { input: raw };
}

const search: Approach<Input> = {
  id: "search",
  name: "Search the array for each value",
  code: `function findDisappeared(nums)
    n ← length(nums)
    missing ← empty list
    for v ← 1 to n
        if v not found in nums  // a full scan
            missing.push(v)
    return missing
`,
  run({ nums }, t) {
    const n = nums.length, missing: number[] = [];
    t.step({ line: 3, array: nums, vars: { n }, message: `The ${n} values should be 1 to ${n}, but some appear twice, so others are missing. The direct way: for each of 1 to ${n}, scan the array for it.` });
    for (let v = 1; v <= n; v++) {
      let at = -1;
      for (let i = 0; i < n; i++) { t.op(); if (nums[i] === v) { at = i; break; } }
      if (at < 0) missing.push(v);
      t.step({ line: at < 0 ? 6 : 5, array: nums, tones: at < 0 ? Object.fromEntries(nums.map((_, i) => [i, "discard" as Tone])) : { ...Object.fromEntries(Array.from({ length: at }, (_, i) => [i, "compare" as Tone])), [at]: "found" }, vars: { v, missing: missing.join(", ") || "none yet" },
        message: at < 0 ? `${v}: scanned all ${n} positions and it isn't there. It's missing.` : `${v}: found at position ${at} after ${at + 1} check${at ? "s" : ""}.` });
    }
    t.step({ line: 7, array: nums, vars: { missing: missing.join(", ") || "none" }, done: "found",
      message: `Missing: ${missing.join(", ") || "nothing"}. Up to n scans of n positions: O(n²).` });
  },
};

const withSet: Approach<Input> = {
  id: "set",
  name: "Remember the values in a set",
  code: `function findDisappeared(nums)
    seen ← empty set
    for each x in nums
        seen.add(x)
    missing ← empty list
    for v ← 1 to length(nums)
        if v not in seen then missing.push(v)
    return missing
`,
  run({ nums }, t) {
    const n = nums.length, seen = new Set<number>(), missing: number[] = [];
    const panel = (hl?: number) => ({ map: { title: "seen (a set)", entries: [...seen].sort((a, b) => a - b).map((x) => [String(x), "seen"] as [string, string]), highlight: hl === undefined ? undefined : String(hl) } });
    nums.forEach((x, i) => { t.op(); seen.add(x); });
    t.step({ line: 4, array: nums, ...panel(), vars: {}, message: `One pass puts every value in a set (repeats are stored once). Now "is v there?" is one O(1) lookup instead of a scan.` });
    for (let v = 1; v <= n; v++) {
      t.op();
      if (!seen.has(v)) missing.push(v);
      t.step({ line: 7, array: nums, ...panel(seen.has(v) ? v : undefined), vars: { v, missing: missing.join(", ") || "none yet" },
        message: seen.has(v) ? `${v} is in the set.` : `${v} isn't in the set: it's missing.` });
    }
    t.step({ line: 8, array: nums, ...panel(), vars: { missing: missing.join(", ") || "none" }, done: "found",
      message: `Missing: ${missing.join(", ") || "nothing"}. Two passes: O(n) time, but the set holds up to n values: O(n) extra space.` });
  },
};

const marking: Approach<Input> = {
  id: "mark",
  name: "Mark positions in the array itself (optimal)",
  code: `function findDisappeared(nums)
    for each x in nums
        p ← abs(x) - 1  // the position x names
        nums[p] ← -abs(nums[p])  // mark it
    missing ← empty list
    for i ← 0 to length(nums) - 1
        if nums[i] > 0 then missing.push(i + 1)
    return missing
`,
  run({ nums: input }, t) {
    const a = [...input], n = a.length, missing: number[] = [];
    t.step({ line: 2, array: [...a], vars: {},
      message: `Every value is between 1 and ${n}, so every value names a position: value v names position v − 1. Use the array as its own set: when v appears, make the number at position v − 1 negative. A minus sign is a mark that costs no extra memory, and abs() still gives back the original number.` });
    let asked = false;
    for (let i = 0; i < n; i++) {
      t.op();
      const x = Math.abs(a[i]), p = x - 1, already = a[p] < 0;
      const ask = !asked && i >= 1 ? (asked = true, { ask: { q: `The value here is ${x}${a[i] < 0 ? ` (stored as ${a[i]}, already marked by something else)` : ""}. Which position gets marked?`, options: [String(p), String(i), String(x)].filter((o, q, arr) => arr.indexOf(o) === q), answer: 0 } }) : {};
      a[p] = -Math.abs(a[p]);
      t.step({ ...("ask" in ask && (ask as { ask: { options: string[] } }).ask.options.length > 1 ? ask : {}), line: 4, array: [...a], pointers: { x: i }, tones: { [i]: "active", [p]: already ? "compare" : "found" }, badge: { at: p, text: `${x} → pos ${p}` }, vars: { x, position: p },
        message: already ? `${x} names position ${p}, which is already negative: ${x} appeared before. Leave it marked.` : `${x} names position ${p}: make nums[${p}] negative (${a[p]}). That records "${x} appears".` });
    }
    for (let i = 0; i < n; i++) { t.op(); if (a[i] > 0) missing.push(i + 1); }
    t.step({ line: 7, array: [...a], tones: Object.fromEntries(a.map((v, i) => [i, (v > 0 ? "miss" : "settled") as Tone])), vars: { missing: missing.join(", ") || "none" }, done: "found",
      message: `Positions still positive were never marked: ${missing.length ? missing.map((v) => `position ${v - 1} means ${v} is missing`).join(", ") : "every position was marked, so nothing is missing"}. Two passes: O(n) time, and no extra memory besides the answer: O(1).` });
  },
};

export const approaches = { search, withSet, marking };

/** Every value 1, so nearly every v is missing and the search scans the whole array each time. */
export const growth = measureGrowth(
  [{ approach: search, slot: 1 }, { approach: withSet, slot: 2 }, { approach: marking, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, () => 1) }),
  [4, 8, 16, 24, 32],
);
