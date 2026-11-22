import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { citations: number[] };
export const example: Input = { citations: [4, 0, 6, 1, 5, 3] };
export const fields: InputField[] = [{ key: "citations", label: "citations", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!raw.citations.length || raw.citations.length > 9) return { error: "Use 1 to 9 papers." };
  if (raw.citations.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { error: "Citations are whole numbers from 0 to 99." };
  return { input: raw };
}

const tryEach: Approach<Input> = {
  id: "tryEach",
  name: "Try each h, counting every time",
  code: `function hIndex(citations)
    n ← length(citations)
    for h ← n down to 0
        papers ← number of c in citations with c ≥ h
        if papers ≥ h
            return h
`,
  run({ citations: c }, t) {
    const n = c.length;
    t.step({ line: 2, array: [...c], vars: { n }, message: `The h-index can't be more than ${n}, the number of papers. Try h = ${n}, then ${n - 1}, and so on: the first h with at least h papers cited h or more times is the answer.` });
    let asked = false;
    for (let h = n; h >= 0; h--) {
      let papers = 0;
      c.forEach((x) => { t.op(); if (x >= h) papers++; });
      const ok = papers >= h;
      const ask = !asked && h < n ? (asked = true, { ask: { q: `Trying h = ${h}: ${papers} paper${papers === 1 ? " has" : "s have"} at least ${h} citations. Is h = ${h} the answer?`, options: [ok ? "Yes" : "No, try a smaller h", ok ? "No, try a smaller h" : "Yes"], answer: 0 } }) : {};
      t.step({ ...ask, line: ok ? 6 : 4, array: [...c], tones: Object.fromEntries(c.map((x, i) => [i, (x >= h ? (ok ? "found" : "compare") : "discard") as Tone])), vars: { h, papers },
        message: ok ? `h = ${h}: ${papers} paper${papers === 1 ? " has" : "s have"} at least ${h} citations, which is enough. Return ${h}.` : `h = ${h}: only ${papers} paper${papers === 1 ? " has" : "s have"} ${h} or more citations, fewer than ${h}.` });
      if (ok) {
        t.step({ line: 6, array: [...c], tones: Object.fromEntries(c.map((x, i) => [i, (x >= h ? "settled" : "discard") as Tone])), vars: { answer: h }, done: "found",
          message: `The h-index is ${h}. Each guess recounts all ${n} papers, and there can be n + 1 guesses: O(n²).` });
        return;
      }
    }
  },
};

const sorted: Approach<Input> = {
  id: "sort",
  name: "Sort from most cited, then scan",
  code: `function hIndex(citations)
    sort citations from largest to smallest
    h ← 0
    while h < length(citations) and citations[h] > h
        h += 1  // h + 1 papers have ≥ h + 1
    return h
`,
  run({ citations }, t) {
    const c = [...citations].sort((a, b) => { t.op(); return b - a; });
    t.step({ line: 2, array: [...c], vars: {}, message: `Sort from most cited to least. Then the paper at index i is the (i + 1)th best: if it has more than i citations, at least i + 1 papers have i + 1 or more.` });
    let h = 0, asked = false;
    while (h < c.length && c[h] > h) {
      t.op();
      const ask = !asked && h > 0 ? (asked = true, { ask: { q: `The paper at index ${h} has ${c[h]} citations. Can h grow to ${h + 1}?`, options: ["Yes", "No"], answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: [...c], pointers: { h }, tones: { ...Object.fromEntries(Array.from({ length: h }, (_, i) => [i, "settled" as Tone])), [h]: "found" }, badge: { at: h, text: `${c[h]} > ${h}` }, vars: { h: h + 1 },
        message: `Index ${h} has ${c[h]} citation${c[h] === 1 ? "" : "s"}, more than ${h}: ${h === 0 ? "the top paper has at least 1" : `the top ${h + 1} papers all have at least ${h + 1}`}. h becomes ${h + 1}.` });
      h++;
    }
    if (h < c.length) t.op();
    t.step({ line: 6, array: [...c], pointers: h < c.length ? { h } : {}, tones: { ...Object.fromEntries(Array.from({ length: h }, (_, i) => [i, "settled" as Tone])), ...(h < c.length ? { [h]: "miss" } : {}) }, ...(h < c.length ? { badge: { at: h, text: `${c[h]} ≤ ${h}` } } : {}), vars: { answer: h }, done: "found",
      message: `${h < c.length ? `Index ${h} has only ${c[h]} citation${c[h] === 1 ? "" : "s"}, not more than ${h}: stop.` : "Every paper passed."} The h-index is ${h}. Sorting costs O(n log n); the scan is O(n).` });
  },
};

const count: Approach<Input> = {
  id: "count",
  name: "Count papers per citation level",
  code: `function hIndex(citations)
    n ← length(citations)
    count ← array of n + 1, all 0
    for each c in citations
        count[min(c, n)] += 1  // cap at n
    papers ← 0
    for h ← n down to 0
        papers += count[h]  // papers with ≥ h
        if papers ≥ h
            return h
`,
  run({ citations: c }, t) {
    const n = c.length, cnt = Array(n + 1).fill(0);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "papers per citation count (last: n or more)", rows: [cnt.slice()], colLabels: Array.from({ length: n + 1 }, (_, i) => (i === n ? `${n}+` : i)), tones });
    c.forEach((x) => { t.op(); cnt[Math.min(x, n)]++; });
    t.step({ line: 5, array: [...c], grid: grid(), vars: { n },
      message: `The answer is at most ${n}, so citations above ${n} can be treated as ${n}. Count the papers at each level from 0 to ${n}: no sorting, no comparisons between papers.` });
    let papers = 0, asked = false;
    for (let h = n; h >= 0; h--) {
      t.op();
      const before = papers;
      papers += cnt[h];
      const ok = papers >= h;
      const ask = !asked && h < n && before > 0 ? (asked = true, { ask: { q: `${before} paper${before === 1 ? " has" : "s have"} more than ${h} citations, and ${cnt[h]} ha${cnt[h] === 1 ? "s" : "ve"} exactly ${h}${h === n ? " or more" : ""}. How many have at least ${h}?`, options: [...new Set([papers, cnt[h], before].map(String))], answer: 0 } }) : {};
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: ok ? 10 : 8, array: [...c], grid: grid({ ...Object.fromEntries(Array.from({ length: n - h }, (_, i) => [`0,${h + 1 + i}`, "settled" as Tone])), [`0,${h}`]: ok ? "found" : "active" }), vars: { h, papers },
        message: ok ? `Adding level ${h}: ${papers} papers have at least ${h} citations, enough for h = ${h}. Return ${h}.` : `Adding level ${h}: ${papers} paper${papers === 1 ? " has" : "s have"} at least ${h} citations, fewer than ${h}. Try ${h - 1}.` });
      if (ok) {
        t.step({ line: 10, array: [...c], grid: grid({ [`0,${h}`]: "found" }), vars: { answer: h }, done: "found",
          message: `The h-index is ${h}. One pass to count and one to total: O(n) time with O(n) extra space.` });
        return;
      }
    }
  },
};

export const approaches = { tryEach, sort: sorted, count };

/** Citations of 0 to 2, so the answer is small and trying each h from n down takes almost n guesses. */
export const growth = measureGrowth(
  [{ approach: tryEach, slot: 1 }, { approach: sorted, slot: 2 }, { approach: count, slot: 3 }],
  (n) => ({ citations: Array.from({ length: n }, (_, i) => (i * 7) % 3) }),
  [8, 16, 32, 64, 128],
);
