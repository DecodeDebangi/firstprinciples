import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums1: number[]; nums2: number[] };

export const example: Input = { nums1: [1, 4, 7], nums2: [2, 5, 6] };

export const fields: InputField[] = [
  { key: "nums1", label: "nums1 (first m values)", kind: "numbers" },
  { key: "nums2", label: "nums2", kind: "numbers" },
];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums1.length + raw.nums2.length > 12) return { error: "Use at most 12 values in total so the array fits." };
  const a = [...raw.nums1].sort((x, y) => x - y), b = [...raw.nums2].sort((x, y) => x - y);
  const changed = a.some((v, i) => v !== raw.nums1[i]) || b.some((v, i) => v !== raw.nums2[i]);
  return { input: { nums1: a, nums2: b }, note: changed ? "Both lists must be sorted, so your values were sorted first." : undefined };
}

const EMPTY = "_";

const copySort: Approach<Input> = {
  id: "sort",
  name: "Copy in, then sort",
  code: `function merge(nums1, m, nums2, n)
  for j ← 0 to n - 1
    nums1[m + j] ← nums2[j]
  nums1.sort()
`,
  run({ nums1: A, nums2: B }, t) {
    const m = A.length, n = B.length;
    const arr: (number | string)[] = [...A, ...Array(n).fill(EMPTY)];
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "nums2", rows: [[...B]], tones });
    t.step({ line: 2, array: [...arr], grid: grid(), vars: { m, n }, message: `nums1 has room for ${n} more at the end (shown as _). Drop nums2 into the gap, then sort everything.` });
    for (let j = 0; j < n; j++) {
      t.op();
      arr[m + j] = B[j];
      t.step({ line: 3, array: [...arr], pointers: { "m+j": m + j }, tones: { [m + j]: "active" }, grid: grid({ [`0,${j}`]: "compare" }), vars: { m, n, j },
        message: `Copy nums2[${j}] = ${B[j]} into slot ${m + j}.` });
    }
    const k = m + n;
    t.op(Math.ceil(k * Math.log2(Math.max(k, 2))));
    const sorted = [...A, ...B].sort((x, y) => x - y);
    t.step({ line: 4, array: sorted, tones: Object.fromEntries(sorted.map((_, i) => [i, "settled" as Tone])), grid: grid(), vars: { m, n }, done: "found",
      message: `Sort all ${k} values: about ${k}·log₂${k} comparisons to rediscover an order both halves already had.` });
  },
};

const fromBack: Approach<Input> = {
  id: "back",
  name: "Three pointers from the back",
  code: `function merge(nums1, m, nums2, n)
  i, j, k ← m - 1, n - 1, m + n - 1
  while j ≥ 0
    if i ≥ 0 and nums1[i] > nums2[j]
      nums1[k] ← nums1[i]
      i -= 1
    else
      nums1[k] ← nums2[j]
      j -= 1
    k -= 1
`,
  run({ nums1: A, nums2: B }, t) {
    const m = A.length, n = B.length;
    const arr: (number | string)[] = [...A, ...Array(n).fill(EMPTY)];
    let i = m - 1, j = n - 1, k = m + n - 1;
    const placed = new Set<number>();
    const settled = () => Object.fromEntries([...placed].map((p) => [p, "settled" as Tone]));
    const used = new Set<number>();
    const grid = (extra: Record<string, Tone> = {}) => ({ title: "nums2", rows: [[...B]],
      tones: { ...Object.fromEntries([...used].map((u) => [`0,${u}`, "settled" as Tone])), ...extra } });
    const ptr = () => ({ ...(i >= 0 ? { i } : {}), k });
    t.step({ line: 2, array: [...arr], pointers: ptr(), grid: grid(j >= 0 ? { [`0,${j}`]: "compare" } : {}), vars: { i, j, k },
      message: "Fill nums1 from the back with the larger of the two last values. The empty slots are at the back, so nothing gets overwritten before it's read." });
    while (j >= 0) {
      t.op();
      const takeA = i >= 0 && (A[i] as number) > B[j];
      const ask = { q: i >= 0 ? `nums1[i] = ${arr[i]}, nums2[j] = ${B[j]}. What goes into slot ${k}?` : `nums1 is used up. What goes into slot ${k}?`,
        options: i >= 0 ? [`${arr[i]} from nums1`, `${B[j]} from nums2`] : ["nums1[i]", `${B[j]} from nums2`], answer: takeA ? 0 : 1 };
      if (takeA) {
        arr[k] = arr[i];
        placed.add(k);
        t.step({ ask, line: 5, array: [...arr], pointers: ptr(), tones: { ...settled(), [i]: "discard", [k]: "found" }, badge: { at: k, text: `${arr[k]} > ${B[j]}` },
          grid: grid({ [`0,${j}`]: "compare" }), vars: { i, j, k }, message: `${arr[k]} > ${B[j]}: move ${arr[k]} from slot ${i} to slot ${k}.` });
        arr[i] = EMPTY;
        i--;
      } else {
        arr[k] = B[j];
        placed.add(k);
        used.add(j);
        t.step({ ask, line: 8, array: [...arr], pointers: ptr(), tones: { ...settled(), [k]: "found" }, badge: { at: k, text: i >= 0 ? `${B[j]} ≥ ${arr[i]}` : `${B[j]}` },
          grid: grid({ [`0,${j}`]: "found" }), vars: { i, j, k }, message: i >= 0 ? `${B[j]} ≥ ${arr[i]}: put nums2's ${B[j]} in slot ${k}.` : `nums1 is used up: put ${B[j]} in slot ${k}.` });
        j--;
      }
      k--;
    }
    const final = arr.map((v, idx) => (v === EMPTY ? A[idx] : v));
    t.step({ line: 3, array: final, tones: Object.fromEntries(final.map((_, idx) => [idx, "settled" as Tone])), grid: grid(), vars: { i, j, k }, done: "found",
      message: "nums2 is used up. Whatever is left of nums1 is already in place, so stop. One pass, no extra memory." });
  },
};

export const approaches = { sort: copySort, back: fromBack };

/** Worst case for the back merge: perfectly interleaved, so every slot needs a comparison. */
const worstCase = (n: number): Input => ({
  nums1: Array.from({ length: Math.ceil(n / 2) }, (_, i) => 2 * i),
  nums2: Array.from({ length: Math.floor(n / 2) }, (_, i) => 2 * i + 1),
});

export const growth = measureGrowth(
  [
    { approach: copySort, slot: 1 },
    { approach: fromBack, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
