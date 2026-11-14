import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { height: number[] };

export const example: Input = { height: [3, 7, 2, 6, 4, 8, 5] };

export const fields: InputField[] = [{ key: "height", label: "height", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.height.length < 2) return { error: "Give at least two heights." };
  if (raw.height.some((h) => h < 0)) return { error: "Heights can't be negative." };
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force: every pair of lines",
  code: `function maxArea(h)
  best ← 0
  for i ← 0 to length(h) - 1
    for j ← i + 1 to length(h) - 1
      area ← (j - i) * min(h[i], h[j])
      best ← max(best, area)
  return best
`,
  run({ height: h }, t) {
    let best = 0, bi = 0, bj = 1;
    t.step({ line: 2, array: h, vars: { best }, message: "Any two lines make a container. Its water is width × the shorter line. Try every pair." });
    for (let i = 0; i < h.length; i++) {
      for (let j = i + 1; j < h.length; j++) {
        t.op();
        const area = (j - i) * Math.min(h[i], h[j]);
        const better = area > best;
        if (better) { best = area; bi = i; bj = j; }
        t.step({ line: 6, array: h, pointers: { i, j }, range: [i, j], tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${j - i} × ${Math.min(h[i], h[j])} = ${area}` },
          vars: { area, best }, message: better ? `Lines ${i} and ${j} hold ${area}. New best.` : `Lines ${i} and ${j} hold ${area}. Best stays ${best}.` });
      }
    }
    t.step({ line: 7, array: h, range: [bi, bj], tones: { [bi]: "found", [bj]: "found" }, vars: { best }, done: "found",
      message: `Most water: ${best}, between lines ${bi} and ${bj}.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "pointers",
  name: "Two pointers: move the shorter line",
  code: `function maxArea(h)
  lo, hi ← 0, length(h) - 1
  best ← 0
  while lo < hi
    area ← (hi - lo) * min(h[lo], h[hi])
    best ← max(best, area)
    if h[lo] < h[hi]
      lo += 1
    else
      hi -= 1
  return best
`,
  run({ height: h }, t) {
    let lo = 0, hi = h.length - 1, best = 0, bi = 0, bj = hi;
    t.step({ line: 2, array: h, pointers: { lo, hi }, range: [lo, hi], vars: { best },
      message: "Start with the widest container. Then always move the shorter line inward: keeping it can never beat what we just measured." });
    while (lo < hi) {
      t.op();
      const area = (hi - lo) * Math.min(h[lo], h[hi]);
      const better = area > best;
      if (better) { best = area; bi = lo; bj = hi; }
      const moveLo = h[lo] < h[hi];
      const ask = { q: `Heights: lo = ${h[lo]}, hi = ${h[hi]}. Which pointer moves inward?`, options: ["lo: it's the shorter line", "hi: it's the shorter line (or they're equal)"], answer: moveLo ? 0 : 1 };
      t.step({ ask, line: moveLo ? 8 : 10, array: h, pointers: { lo, hi }, range: [lo, hi], tones: { [lo]: moveLo ? "miss" : "compare", [hi]: moveLo ? "compare" : "miss" },
        badge: { at: moveLo ? lo : hi, text: `${hi - lo} × ${Math.min(h[lo], h[hi])} = ${area}` }, vars: { area, best },
        message: `Area ${area}${better ? ", a new best" : ""}. The ${moveLo ? `left line (${h[lo]})` : `right line (${h[hi]})`} is shorter: any narrower container using it holds less, so drop it.` });
      if (moveLo) lo++; else hi--;
    }
    t.step({ line: 11, array: h, range: [bi, bj], tones: { [bi]: "found", [bj]: "found" }, vars: { best }, done: "found",
      message: `Most water: ${best}, between lines ${bi} and ${bj}, found in ${h.length - 1} steps.` });
  },
};

export const approaches = { brute: bruteForce, pointers: twoPointers };

const worstCase = (n: number): Input => ({ height: Array.from({ length: n }, (_, i) => (i * 5) % 9 + 1) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: twoPointers, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
