import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; target: number };

export const example: Input = { nums: [2, 4, 4, 4, 7, 9, 12], target: 4 };

export const fields: InputField[] = [
  { key: "nums", label: "nums (sorted)", kind: "numbers" },
  { key: "target", label: "target", kind: "number" },
];

export function prepare(raw: Input): Prepared<Input> {
  const sorted = [...raw.nums].sort((a, b) => a - b);
  const changed = sorted.some((v, i) => v !== raw.nums[i]);
  return { input: { nums: sorted, target: raw.target }, note: changed ? "Binary search needs sorted input, so your numbers were sorted. Duplicates are kept on purpose." : undefined };
}

const outside = (n: number, lo: number, hi: number): Record<number, Tone> =>
  Object.fromEntries(Array.from({ length: n }, (_, k) => k).filter((k) => k < lo || k > hi).map((k) => [k, "discard" as Tone]));

const closed: Approach<Input> = {
  id: "closed",
  name: "Closed interval [lo, hi]",
  code: `def search(a, target):
    lo, hi = 0, len(a) - 1  # candidates: a[lo..hi]
    while lo <= hi:  # non-empty while lo <= hi
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            lo = mid + 1  # mid is ruled out
        else:
            hi = mid - 1  # mid is ruled out
    return -1
`,
  run({ nums: a, target }, t) {
    let lo = 0, hi = a.length - 1;
    const inv = () => `a[${lo}..${hi}]`;
    t.step({ line: 2, array: a, pointers: { lo, hi }, range: [lo, hi], vars: { "target in": inv() },
      message: "Both ends are included. The interval is non-empty while lo <= hi, and after checking mid it must be excluded on both sides." });
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      t.op();
      const base = { array: a, range: [lo, hi] as [number, number], tones: { ...outside(a.length, lo, hi) } };
      if (a[mid] === target) {
        t.step({ ...base, line: 6, pointers: { mid }, tones: { ...base.tones, [mid]: "found" }, badge: { at: mid, text: `${a[mid]} = ${target} ✓` }, vars: { "target in": inv() }, done: "found",
          message: `Found ${target} at ${mid}. With duplicates this is *a* match, not necessarily the first one.` });
        return;
      }
      const right = a[mid] < target;
      const ask = { q: `a[mid] = ${a[mid]}, target ${target}. In a closed interval, what's the update?`, options: right ? ["lo = mid + 1", "lo = mid"] : ["hi = mid − 1", "hi = mid"], answer: 0 };
      t.step({ ...base, ask, line: right ? 8 : 10, pointers: { lo, mid, hi }, tones: { ...base.tones, [mid]: "miss" }, badge: { at: mid, text: right ? `${a[mid]} < ${target} →` : `← ${a[mid]} > ${target}` },
        vars: { "target in": inv() }, message: right ? `${a[mid]} < ${target}: mid and everything left of it are out. lo = ${mid + 1}.` : `${a[mid]} > ${target}: mid and everything right of it are out. hi = ${mid - 1}.` });
      if (right) lo = mid + 1; else hi = mid - 1;
    }
    t.step({ line: 11, array: a, tones: outside(a.length, 0, -1), vars: { "target in": "empty range" }, done: "notfound",
      message: `lo (${lo}) passed hi (${hi}): the interval is empty, so ${target} isn't there.` });
  },
};

const lowerBound: Approach<Input> = {
  id: "lower",
  name: "Half-open lower bound [lo, hi)",
  code: `def lower_bound(a, target):
    lo, hi = 0, len(a)  # answer is in [lo, hi)
    while lo < hi:  # non-empty while lo < hi
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid + 1  # answer is right of mid
        else:
            hi = mid  # mid might be the answer
    return lo  # first index with a[i] >= target
`,
  run({ nums: a, target }, t) {
    let lo = 0, hi = a.length;
    const inv = () => `[${lo}, ${hi})`;
    const rng = (): [number, number] | null => (lo < hi ? [lo, hi - 1] : null);
    t.step({ line: 2, array: a, pointers: { lo, ...(hi < a.length ? { hi } : {}) }, range: rng(), vars: { [`first ≥ ${target} in`]: inv() },
      message: "hi starts one past the end and is never a candidate. Instead of 'is it here?', ask 'where does the first value ≥ target start?'" });
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      t.op();
      const right = a[mid] < target;
      const ask = { q: `a[mid] = ${a[mid]}, target ${target}. Could mid be the first value ≥ ${target}?`, options: ["No: it's smaller, so lo = mid + 1", "Maybe: so hi = mid, keeping it in range"], answer: right ? 0 : 1 };
      t.step({ ask, line: right ? 6 : 8, array: a, pointers: { lo, mid, ...(hi < a.length ? { hi } : {}) }, range: rng(), tones: { ...outside(a.length, lo, hi - 1), [mid]: right ? "miss" : "compare" },
        badge: { at: mid, text: right ? `${a[mid]} < ${target}` : `${a[mid]} ≥ ${target}` }, vars: { [`first ≥ ${target} in`]: inv() },
        message: right ? `${a[mid]} < ${target}: the answer is to the right. lo = ${mid + 1}.` : `${a[mid]} ≥ ${target}: mid could be the first one, so keep it: hi = ${mid}.` });
      if (right) lo = mid + 1; else hi = mid;
    }
    const hit = lo < a.length && a[lo] === target;
    t.step({ line: 9, array: a, pointers: lo < a.length ? { lo } : {}, tones: lo < a.length ? { [lo]: hit ? "found" : "compare" } : {}, vars: { [`first ≥ ${target} at`]: lo }, done: "found",
      message: hit ? `lo = hi = ${lo}: the first ${target} is at index ${lo}. Duplicates handled, no special cases.`
        : `lo = hi = ${lo}: ${target} isn't there, and ${lo} is exactly where it would be inserted.` });
  },
};

const buggy: Approach<Input> = {
  id: "buggy",
  name: "Spot the bug: lo = mid",
  code: `def search(a, target):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid  # bug: mid was already checked
        else:
            hi = mid
    return lo if a[lo] == target else -1
`,
  run({ nums: a, target }, t) {
    let lo = 0, hi = a.length - 1;
    const seen = new Set<string>();
    t.step({ line: 2, array: a, pointers: { lo, hi }, range: [lo, hi], vars: { lo, hi },
      message: "This looks almost identical to a correct binary search. One line is wrong. Watch what happens when the interval gets down to two items." });
    while (lo < hi) {
      const key = `${lo},${hi}`;
      if (seen.has(key)) {
        t.step({ line: 3, array: a, pointers: { lo, hi }, range: [lo, hi], tones: { [lo]: "miss", [hi]: "miss" }, badge: { at: lo, text: "stuck" }, vars: { lo, hi }, done: "notfound",
          message: `lo and hi are back to ${lo} and ${hi}: the same state as before. When hi = lo + 1, mid = lo, and lo = mid changes nothing. This loop never ends. The fix: lo = mid + 1.` });
        return;
      }
      seen.add(key);
      const mid = (lo + hi) >> 1;
      t.op();
      const right = a[mid] < target;
      t.step({ line: right ? 6 : 8, array: a, pointers: { lo, mid, hi }, range: [lo, hi], tones: { [mid]: right ? "miss" : "compare" }, vars: { lo, hi, mid },
        message: right ? `${a[mid]} < ${target}, so lo = mid = ${mid}${mid === lo ? `. But lo was already ${lo}: nothing moved` : ""}.` : `${a[mid]} ≥ ${target}, so hi = mid = ${mid}.` });
      if (right) lo = mid; else hi = mid;
    }
    const hit = a[lo] === target;
    t.step({ line: 9, array: a, pointers: { lo }, tones: { [lo]: hit ? "found" : "miss" }, vars: { lo, hi }, done: hit ? "found" : "notfound",
      message: `This input happened to finish (lo = ${lo}). Try target ${a[a.length - 1] ?? 0} or a value between two numbers and it can loop forever.` });
  },
};

export const approaches = { closed, lower: lowerBound, buggy };
