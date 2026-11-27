import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { BitTrie, bitsOf, widthFor } from "../../concepts/70-binary-tries/steps";

export type Input = { nums: number[]; queries: string };
export const example: Input = { nums: [3, 10, 5, 12, 9], queries: "6 4, 6 9, 1 2" };
export const fields: InputField[] = [{ key: "nums", label: "nums (0 to 31)", kind: "numbers" }, { key: "queries", label: "queries (x m)", kind: "raw" }];
type Q = { x: number; m: number };
const parseQ = (s: string): Q[] => s.split(/[,;\n]+/).map((x) => x.trim().split(/\s+/).map(Number)).filter((p) => p.length === 2 && p.every(Number.isInteger)).map(([x, m]) => ({ x, m }));
export function prepare(raw: Input): Prepared<Input> {
  const parts = raw.queries.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean), q = parseQ(raw.queries);
  if (!raw.nums.length || raw.nums.length > 6) return { error: "Use 1 to 6 numbers so the trie fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 31)) return { error: "Use whole numbers from 0 to 31." };
  if (!q.length || q.length !== parts.length || q.length > 4) return { error: 'Give 1 to 4 queries like "6 4": x, a space, then the limit m.' };
  if (q.some((v) => v.x < 0 || v.x > 31 || v.m < 0 || v.m > 31)) return { error: "Use x and m from 0 to 31." };
  return { input: raw };
}
const outMap = (qs: Q[], out: (number | null)[]) => ({ title: "answers", entries: qs.map((q, k) => [`x=${q.x}, m≤${q.m}`, out[k] === null ? "…" : String(out[k])] as [string, string]) });

const scan: Approach<Input> = {
  id: "scan", name: "Check every number for every query",
  code: `function maximizeXor(nums, queries)
    out ← []
    for each (x, m) in queries
        best ← −1
        for each a in nums
            if a ≤ m
                best ← max(best, x xor a)
        out.push(best)
    return out
`,
  run({ nums, queries }, t) {
    const qs = parseQ(queries), out: (number | null)[] = qs.map(() => null);
    if (t.record) t.step({ line: 2, array: nums, map: outMap(qs, out), vars: {}, message: "Each query wants the largest x xor a over the numbers a that are at most m, or −1 if there are none. The direct way checks every number." });
    qs.forEach((q, k) => {
      let best = -1, who = -1;
      nums.forEach((a, j) => { t.op(); if (a <= q.m && (q.x ^ a) > best) { best = q.x ^ a; who = j; } });
      out[k] = best;
      if (t.record) t.step({ line: 8, array: nums, tones: Object.fromEntries(nums.map((a, j) => [j, (j === who ? "found" : a <= q.m ? "compare" : "discard") as Tone])), map: outMap(qs, out), vars: { x: q.x, m: q.m, answer: best },
        message: best < 0 ? `x = ${q.x}, m = ${q.m}: no number is ≤ ${q.m}. −1.` : `x = ${q.x}, m = ${q.m}: of the numbers ≤ ${q.m}, ${nums[who]} gives the largest, ${q.x} xor ${nums[who]} = ${best}.` });
    });
    if (t.record) t.step({ line: 9, array: nums, map: outMap(qs, out), vars: {}, done: "found", message: `Answers: ${out.join(", ")}. Every query checks every number: O(n · q).` });
  },
};

const offline: Approach<Input> = {
  id: "trie", name: "Sort by the limit, grow a binary trie as it rises",
  code: `function maximizeXor(nums, queries)
    sort nums
    order ← query positions, sorted by their m
    k ← 0
    for each q in order
        x, m ← queries[q]
        while k < length(nums) and nums[k] ≤ m
            insert nums[k] into the trie
            k ← k + 1
        out[q] ← −1 if the trie is empty,
                 else bestXor(x)  // as in 421
    return out
`,
  run({ nums, queries }, t) {
    const qs = parseQ(queries), out: (number | null)[] = qs.map(() => null);
    const sorted = [...nums].sort((a, b) => { t.op(); return a - b; });
    const order = qs.map((_, k) => k).sort((a, b) => { t.op(); return qs[a].m - qs[b].m; });
    const B = widthFor([...nums, ...qs.map((q) => q.x)]), tr = new BitTrie(B);
    let k = 0, asked = 0;
    if (t.record) t.step({ line: 3, array: sorted, map: outMap(qs, out), trees: tr.bview(), vars: { order: order.map((q) => `m=${qs[q].m}`).join(", ") },
      message: `The limit changes which numbers count. Answer the queries in order of their limit, smallest first, and keep a binary trie of exactly the numbers allowed so far: as the limit rises, numbers are only ever added.` });
    for (const qi of order) {
      const q = qs[qi]; const added: number[] = [];
      while (k < sorted.length && sorted[k] <= q.m) { tr.add(sorted[k]); t.op(B); added.push(sorted[k]); k++; }
      if (!tr.owner.size) { out[qi] = -1; if (t.record) t.step({ line: 10, array: sorted, map: outMap(qs, out), trees: tr.bview(), vars: { x: q.x, m: q.m, answer: -1 }, message: `m = ${q.m}: no number is that small yet, so the trie is empty. −1.` }); continue; }
      const r = tr.best(q.x, t);
      out[qi] = r.xor;
      const ask = t.record && asked < 1 && added.length ? (asked++, { ask: { q: `The next limit is m = ${q.m}. Which numbers join the trie now?`, options: [`${added.join(", ")}: the sorted numbers up to ${q.m}`, "All of them", "None"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 11, array: sorted, tones: Object.fromEntries(sorted.map((_, j) => [j, (j < k ? "settled" : "discard") as Tone])), map: outMap(qs, out), trees: tr.bview(Object.fromEntries(r.path.map((p) => [p, "found" as Tone]))), vars: { x: q.x, m: q.m, answer: r.xor },
        message: `m = ${q.m}: ${added.length ? `add ${added.join(", ")} to the trie` : "nothing new to add"}. Then x = ${q.x} = ${bitsOf(q.x, B)} walks it, taking the opposite bit where it can: best partner ${r.partner}, ${q.x} xor ${r.partner} = ${r.xor}.` });
    }
    if (t.record) t.step({ line: 12, array: sorted, map: outMap(qs, out), trees: tr.bview(), vars: {}, done: "found", message: `Answers: ${out.join(", ")}, in the original order. Sorting, then O(B) per insert and per query: O((n + q) · B) after sorting.` });
  },
};

export const approaches = { scan, trie: offline };
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: offline, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, k) => (k * 37) % 1024), queries: Array.from({ length: n }, (_, k) => `${(k * 53) % 1024} ${(k * 101) % 1024}`).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
