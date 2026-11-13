import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [2, 0, 1, 2, 1, 0, 0] };

export const fields: InputField[] = [{ key: "nums", label: "nums (0, 1 or 2)", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.some((x) => x < 0 || x > 2)) return { error: "Use only 0, 1 and 2 (the three colours)." };
  return { input: raw };
}

const counting: Approach<Input> = {
  id: "count",
  name: "Count, then overwrite",
  code: `def sort_colors(nums):
    count = [0, 0, 0]
    for x in nums:
        count[x] += 1
    i = 0
    for color in range(3):
        for _ in range(count[color]):
            nums[i] = color
            i += 1
`,
  run({ nums }, t) {
    const a = [...nums];
    const count = [0, 0, 0];
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "count of 0s · 1s · 2s", rows: [[...count]], tones });
    t.step({ line: 2, array: [...a], grid: grid(), vars: { i: null }, message: "Pass 1: count how many 0s, 1s and 2s there are. Pass 2: write them back in order." });
    a.forEach((x, k) => {
      t.op();
      count[x]++;
      t.step({ line: 4, array: [...a], pointers: { x: k }, tones: { [k]: "compare" }, grid: grid({ [`0,${x}`]: "found" }), vars: { i: null }, message: `A ${x}: count[${x}] is now ${count[x]}.` });
    });
    let i = 0;
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < count[c]; r++) {
        t.op();
        a[i] = c;
        t.step({ line: 8, array: [...a], pointers: { i }, tones: { ...Object.fromEntries(Array.from({ length: i }, (_, k) => [k, "settled" as Tone])), [i]: "found" },
          grid: grid({ [`0,${c}`]: "compare" }), vars: { i }, message: `Write ${c} into slot ${i}.` });
        i++;
      }
    }
    t.step({ line: 9, array: [...a], tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), grid: grid(), vars: { i }, done: "found",
      message: `Sorted in two passes: [${a.join(", ")}].` });
  },
};

const dutchFlag: Approach<Input> = {
  id: "flag",
  name: "Dutch national flag (one pass)",
  code: `def sort_colors(nums):
    lo, mid, hi = 0, 0, len(nums) - 1
    while mid <= hi:
        if nums[mid] == 0:
            nums[lo], nums[mid] = nums[mid], nums[lo]
            lo += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[hi] = nums[hi], nums[mid]
            hi -= 1
`,
  run({ nums }, t) {
    const a = [...nums];
    let lo = 0, mid = 0, hi = a.length - 1;
    // Left of lo: 0s. lo..mid-1: 1s. right of hi: 2s. mid..hi: not looked at yet.
    const zones = (): Record<number, Tone> => Object.fromEntries(a.map((_, k) => [k, k < lo ? "settled" : k < mid ? "side-a" : k > hi ? "settled" : undefined]).filter(([, v]) => v)) as Record<number, Tone>;
    t.step({ line: 2, array: [...a], pointers: { lo, mid, hi }, range: [mid, hi], vars: { lo, mid, hi },
      message: "Keep three zones: 0s before lo, 1s from lo up to mid, 2s after hi. The shelf is the part not sorted yet; mid looks at its first cell." });
    while (mid <= hi) {
      t.op();
      const v = a[mid];
      const opts = ["0: swap it to lo, move lo and mid", "1: leave it, move mid", "2: swap it to hi, move hi only"];
      const ask = { q: `nums[mid] = ${v}. What happens?`, options: opts, answer: v };
      if (v === 0) {
        [a[lo], a[mid]] = [a[mid], a[lo]];
        lo++; mid++;
        t.step({ ask, line: 7, array: [...a], pointers: { lo, mid, hi }, range: mid <= hi ? [mid, hi] : null, tones: { ...zones(), [lo - 1]: "found" }, badge: { at: lo - 1, text: "0 → front" },
          vars: { lo, mid, hi }, message: "A 0: swap it into the 0 zone at lo. What came back is a 1 (already checked), so mid moves on too." });
      } else if (v === 1) {
        mid++;
        t.step({ ask, line: 9, array: [...a], pointers: { lo, mid, hi }, range: mid <= hi ? [mid, hi] : null, tones: { ...zones(), [mid - 1]: "compare" }, badge: { at: mid - 1, text: "1 stays" },
          vars: { lo, mid, hi }, message: "A 1 is already in the middle zone. Move mid on." });
      } else {
        [a[mid], a[hi]] = [a[hi], a[mid]];
        hi--;
        t.step({ ask, line: 12, array: [...a], pointers: { lo, mid, hi }, range: mid <= hi ? [mid, hi] : null, tones: { ...zones(), [hi + 1]: "found" }, badge: { at: hi + 1, text: "2 → back" },
          vars: { lo, mid, hi }, message: `A 2: swap it into the 2 zone at the back. The value that came back to mid hasn't been checked yet, so mid stays.` });
      }
    }
    t.step({ line: 3, array: [...a], tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: { lo, mid, hi }, done: "found",
      message: `mid passed hi: every cell is in its zone. Sorted in one pass with three pointers: [${a.join(", ")}].` });
  },
};

export const approaches = { count: counting, flag: dutchFlag };

const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => (i * 2) % 3) });

export const growth = measureGrowth(
  [
    { approach: counting, slot: 1 },
    { approach: dutchFlag, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
