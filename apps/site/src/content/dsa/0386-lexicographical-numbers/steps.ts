import { measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/** The numbers 1..n as an imaginary trie of digits: x's children are 10x … 10x + 9. Shared with LeetCode 440. */
export function numberTree(n: number, tones: Record<string, Tone> = {}, notes: Record<string, string> = {}): TreeData[] {
  const nodes: TreeNodeData[] = [{ id: "root", val: "•", left: null, right: null, kids: [] }];
  const kidsOf = (x: number) => (x === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : Array.from({ length: 10 }, (_, d) => x * 10 + d)).filter((y) => y <= n);
  const add = (x: number) => { for (const y of kidsOf(x)) { nodes.push({ id: `v${y}`, val: y, left: null, right: null, kids: [] }); nodes.find((m) => m.id === (x ? `v${x}` : "root"))!.kids!.push(`v${y}`); add(y); } };
  add(0);
  return [{ root: "root", nodes, tones, notes, layout: "compact" }];
}
export const nid = (x: number) => `v${x}`;

export type Input = { n: number };
export const example: Input = { n: 23 };
export const fields: InputField[] = [{ key: "n", label: "n", kind: "number" }];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 30) return { error: "Use n from 1 to 30 so the tree fits." };
  return { input: raw };
}
const list = (a: number[]) => `[${a.join(", ")}]`;

const sorting: Approach<Input> = {
  id: "sort", name: "Write the numbers as text and sort",
  code: `function lexicalOrder(n)
    words ← text(1), text(2), …, text(n)
    sort words  // as text: "10" before "2"
    return each word as a number
`,
  run({ n }, t) {
    const words = Array.from({ length: n }, (_, k) => String(k + 1)); t.op(n);
    if (t.record) t.step({ line: 2, array: words, vars: {}, message: `Dictionary order compares numbers as text, digit by digit: "10" comes before "2" because '1' comes before '2'. The direct way writes them all as text and sorts.` });
    const sorted = [...words].sort((a, b) => { t.op(Math.min(a.length, b.length)); return a < b ? -1 : 1; });
    if (t.record) t.step({ line: 4, array: sorted, vars: { out: list(sorted.map(Number)) }, done: "found", message: `${list(sorted.map(Number))}. Sorting costs O(n log n) comparisons of up to D digits each, and the text copies take O(n · D) memory.` });
  },
};

const walk: Approach<Input> = {
  id: "walk", name: "Walk the digit trie without building it",
  code: `function lexicalOrder(n)
    out, cur ← [], 1
    repeat n times
        out.push(cur)
        if cur × 10 ≤ n
            cur ← cur × 10  // first child
        else
            while cur mod 10 = 9 or cur + 1 > n
                cur ← floor(cur / 10)  // back up
            cur ← cur + 1  // next sibling
    return out
`,
  run({ n }, t) {
    const out: number[] = [], seen: string[] = [];
    let cur = 1, asked = 0;
    if (t.record) t.step({ line: 2, array: [], trees: numberTree(n), vars: { cur: 1 }, message: `Picture the numbers as a trie of digits: under 1 come 10 to 19, under 2 come 20 to 29, and so on. Dictionary order is a pre-order walk of it. The walk can be done with just cur, without building the tree: go down by multiplying by 10, sideways by adding 1, up by dividing by 10.` });
    for (let k = 0; k < n; k++) {
      out.push(cur); seen.push(nid(cur)); t.op();
      const prev = cur;
      let how: string;
      if (cur * 10 <= n) { cur *= 10; how = `down to its first child, ${cur}`; }
      else { let ups = 0; while (cur % 10 === 9 || cur + 1 > n) { t.op(); cur = Math.floor(cur / 10); ups++; } cur += 1; how = ups ? `no child and no next sibling, so back up ${ups} level${ups === 1 ? "" : "s"}, then on to ${cur}` : `no child (${prev * 10} > ${n}), so on to the next sibling, ${cur}`; }
      const ask = t.record && asked < 2 && k > 0 && k < n - 1 ? (asked++, { ask: { q: `cur is ${prev}. ${prev * 10 <= n ? `${prev * 10} ≤ ${n}.` : `${prev * 10} > ${n}.`} Where does the walk go next?`, options: prev * 10 <= n ? [`Down to ${prev * 10}`, `On to ${prev + 1}`] : [`To ${cur}`, `Down to ${prev * 10}`], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: prev * 10 <= n ? 6 : 10, array: [], trees: numberTree(n, { ...Object.fromEntries(seen.map((s) => [s, "settled" as Tone])), [nid(prev)]: "found" }), vars: { cur: prev, out: list(out) },
        message: `Write ${prev}. ${k === n - 1 ? "That's all n numbers." : `Then ${how}.`}` });
    }
    if (t.record) t.step({ line: 11, array: [], trees: numberTree(n, Object.fromEntries(seen.map((s) => [s, "settled" as Tone]))), vars: { out: list(out) }, done: "found", message: `${list(out)}. Each step moves cur a little: O(n) time in all, and no memory beyond the answer.` });
  },
};

export const approaches = { sort: sorting, walk };
export const growth = measureGrowth(
  [{ approach: sorting, slot: 1 }, { approach: walk, slot: 3 }],
  (n) => ({ n }),
  [16, 64, 256, 1024, 4096],
);
