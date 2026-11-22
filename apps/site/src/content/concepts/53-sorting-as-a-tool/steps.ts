import { type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<unknown>["run"]>[1];
const span = (lo: number, hi: number, tn: Tone) => Object.fromEntries(Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => [lo + i, tn]));

/* ---------- Sorting with a custom rule (merge sort, so O(n log n) comparisons) ---------- */

/** "a goes first if a then b, as text, beats b then a." Used for building the largest number. */
export const concatFirst = (a: number, b: number) => `${a}${b}` > `${b}${a}`;
export const concatWhy = (a: number, b: number) => `"${a}${b}" ${`${a}${b}` > `${b}${a}` ? ">" : `${a}${b}` === `${b}${a}` ? "=" : "<"} "${b}${a}"`;

/** Merge sort by `first(a, b)` ("a belongs before b"), one step per merge. Returns the sorted list. */
export function ruleSortSteps(t: T, nums: number[], first: (a: number, b: number) => boolean, why: (a: number, b: number) => string, L: { merge: number; end: number }, endMsg?: (a: number[]) => string, ask = true) {
  const a = [...nums];
  let asked = !ask;
  const go = (lo: number, hi: number) => {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    go(lo, mid); go(mid, hi);
    const Lh = a.slice(lo, mid), R = a.slice(mid, hi), out: number[] = [], notes: string[] = [];
    let i = 0, j = 0;
    while (i < Lh.length && j < R.length) {
      t.op();
      const takeR = first(R[j], Lh[i]);
      notes.push(`${why(takeR ? R[j] : Lh[i], takeR ? Lh[i] : R[j])}, so ${takeR ? R[j] : Lh[i]} first`);
      out.push(takeR ? R[j++] : Lh[i++]);
    }
    out.push(...Lh.slice(i), ...R.slice(j));
    const q = !asked && Lh[0] !== R[0] ? (asked = true, { ask: { q: `Merging [${Lh.join(", ")}] with [${R.join(", ")}]: which comes first, ${Lh[0]} or ${R[0]}?`, options: [String(first(R[0], Lh[0]) ? R[0] : Lh[0]), String(first(R[0], Lh[0]) ? Lh[0] : R[0])], answer: 0 } }) : {};
    for (let k = 0; k < out.length; k++) a[lo + k] = out[k];
    t.step({ ...q, line: L.merge, array: [...a], range: [lo, hi - 1], tones: span(lo, hi - 1, "found"), vars: { left: `[${Lh.join(", ")}]`, right: `[${R.join(", ")}]` },
      message: `Merge [${Lh.join(", ")}] with [${R.join(", ")}]: ${notes.join("; ")}.` });
  };
  go(0, a.length);
  if (endMsg) t.step({ line: L.end, array: [...a], tones: span(0, a.length - 1, "settled"), vars: {}, done: "found", message: endMsg(a) });
  return a;
}

export type NumsInput = { nums: number[] };
export const ruleExample: NumsInput = { nums: [8, 81, 4, 47, 6] };
export const ruleFields: InputField[] = [{ key: "nums", label: "nums (0 to 999)", kind: "numbers" }];
export function rulePrepare(raw: NumsInput): Prepared<NumsInput> {
  if (raw.nums.length < 2 || raw.nums.length > 7) return { error: "Use 2 to 7 numbers." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 999)) return { error: "Use whole numbers from 0 to 999." };
  return { input: raw };
}

const rule: Approach<NumsInput> = {
  id: "rule",
  name: "Merge sort with a custom rule",
  code: `function largestFirst(nums)
    sort nums so a comes before b when first(a, b)
    return nums
function first(a, b)  // should a go before b?
    return text(a) + text(b) > text(b) + text(a)
`,
  run({ nums }, t) {
    t.step({ line: 2, array: [...nums], vars: {},
      message: `Sort so that, glued together, the numbers make the biggest possible number. The rule compares two numbers by trying both orders as text: a goes first if "a then b" beats "b then a". Any good sort works with any consistent rule; this one is merge sort.` });
    ruleSortSteps(t, nums, concatFirst, concatWhy, { merge: 2, end: 3 }, (a) => `Sorted by the rule: glued together, ${a.join("")}. The rule is only ever asked about two numbers at a time, and merge sort asks it O(n log n) times.`);
  },
};
export const ruleApproaches = { rule };

/* ---------- Three-way partition (the Dutch national flag) ---------- */

/** Split a around p into < p, = p, > p in one pass. Returns the rearranged list. */
export function partitionSteps(t: T, nums: number[], p: number, L: { less: number; more: number; equal: number; end: number }, names = { less: `< ${p}`, equal: `= ${p}`, more: `> ${p}` }) {
  const a = [...nums];
  let lo = 0, mid = 0, hi = a.length - 1, asked = false;
  const tones = () => ({ ...span(0, lo - 1, "side-a"), ...span(lo, mid - 1, "settled"), ...span(hi + 1, a.length - 1, "side-b") });
  while (mid <= hi) {
    t.op();
    const x = a[mid], m0 = mid, h0 = hi;
    const verdict = x < p ? 0 : x > p ? 1 : 2;
    const q = !asked && verdict !== 2 ? (asked = true, { ask: { q: `a[mid] is ${x} and the pivot is ${p}. Where does ${x} go?`, options: [`To the front (swap with lo)`, `To the back (swap with hi)`, `Stay; mid moves on`], answer: verdict } }) : {};
    if (x < p) { [a[lo], a[mid]] = [a[mid], a[lo]]; lo++; mid++; }
    else if (x > p) { [a[mid], a[hi]] = [a[hi], a[mid]]; hi--; }
    else mid++;
    t.step({ ...q, line: verdict === 0 ? L.less : verdict === 1 ? L.more : L.equal, array: [...a], pointers: { ...(lo < a.length ? { lo } : {}), ...(mid < a.length ? { mid } : {}), ...(hi >= 0 ? { hi } : {}) }, tones: { ...tones(), ...(verdict === 1 ? { [h0]: "found" } : verdict === 0 ? { [lo - 1]: "found" } : { [m0]: "found" }) },
      vars: { "a[mid]": x, pivot: p },
      message: verdict === 0 ? `${x} belongs at the front (${names.less}): swap it to lo, and move lo and mid on.` : verdict === 1 ? `${x} belongs at the back (${names.more}): swap it to hi, and move hi in. Don't move mid: the value that came from the back hasn't been checked yet.` : `${x} belongs in the middle (${names.equal}), where it already is. Move mid on.` });
  }
  t.step({ line: L.end, array: [...a], tones: tones(), vars: { pivot: p }, done: "found",
    message: `mid passed hi: every value has been placed, in one pass with O(1) extra space. Front: ${names.less}; middle: ${names.equal}; back: ${names.more}.` });
  return a;
}

export type PartitionInput = { nums: number[]; pivot: number };
export const partitionExample: PartitionInput = { nums: [6, 2, 5, 8, 5, 1, 9, 4], pivot: 5 };
export const partitionFields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }, { key: "pivot", label: "pivot", kind: "number" }];
export function partitionPrepare(raw: PartitionInput): Prepared<PartitionInput> {
  if (!raw.nums.length || raw.nums.length > 10) return { error: "Use 1 to 10 numbers." };
  if (!Number.isInteger(raw.pivot)) return { error: "The pivot must be a whole number." };
  return { input: raw };
}

const partition: Approach<PartitionInput> = {
  id: "partition",
  name: "Three-way partition in one pass",
  code: `function partition3(a, p)
    lo, mid, hi ← 0, 0, length(a) - 1
    while mid ≤ hi
        if a[mid] < p
            swap a[lo] and a[mid]
            lo, mid ← lo + 1, mid + 1
        else if a[mid] > p
            swap a[mid] and a[hi]
            hi -= 1  // the new a[mid] is unchecked
        else
            mid += 1
`,
  run({ nums, pivot }, t) {
    t.step({ line: 2, array: [...nums], pointers: { lo: 0, mid: 0, hi: nums.length - 1 }, vars: { pivot },
      message: `Split the list into three parts around ${pivot}, in place: smaller values at the front, equal ones in the middle, bigger ones at the back. Everything before lo is smaller, lo to mid is equal, after hi is bigger, and mid to hi is not yet checked.` });
    partitionSteps(t, nums, pivot, { less: 6, more: 9, equal: 11, end: 3 });
  },
};
export const partitionApproaches = { partition };
