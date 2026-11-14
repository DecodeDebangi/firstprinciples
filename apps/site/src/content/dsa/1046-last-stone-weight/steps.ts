import { Heap, heapTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";

export type Input = { stones: number[] };

export const example: Input = { stones: [3, 9, 4, 6, 2, 5] };

export const fields: InputField[] = [{ key: "stones", label: "stones", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!raw.stones.length) return { error: "Give at least one stone." };
  if (raw.stones.length > 10) return { error: "Use at most 10 stones so the heap fits." };
  if (raw.stones.some((s) => !Number.isInteger(s) || s < 1)) return { error: "Stone weights must be whole numbers of at least 1." };
  return { input: raw };
}

/** "What's left after smashing y and x?", asked before the smash. */
const smashAsk = (y: number, x: number) => ({
  q: `The two heaviest stones weigh ${y} and ${x}. What's left after they're smashed?`,
  options: y === x ? ["Nothing: both are destroyed", `A stone of ${y + x}`, `A stone of ${y}`] : [`A stone of ${y - x}`, "Nothing: both are destroyed", `A stone of ${y + x}`],
  answer: 0,
});

const resort: Approach<Input> = {
  id: "sort",
  name: "Re-sort every round",
  code: `function lastStoneWeight(stones)
    while length(stones) > 1
        stones.sort()  // heaviest at the end
        y ← stones.pop()  // heaviest
        x ← stones.pop()  // next heaviest
        if y ≠ x
            stones.push(y - x)
    return stones is empty ? 0 : stones[0]
`,
  run({ stones }, t) {
    const a = [...stones];
    let round = 0;
    t.step({ line: 2, array: [...a], vars: { round: 0 }, message: "Each round, smash the two heaviest stones. The simplest way to find them: sort, and take the last two." });
    while (a.length > 1) {
      round++;
      let cmps = 0;
      a.sort((p, q) => { t.op(); cmps++; return p - q; });
      const n = a.length;
      t.step({ line: 3, array: [...a], tones: { [n - 1]: "compare", [n - 2]: "compare" }, vars: { round, "sort comparisons": cmps },
        message: `Round ${round}: sort the ${n} stones (${cmps} comparisons). The two heaviest are now at the end: ${a[n - 1]} and ${a[n - 2]}.` });
      const y = a.pop()!;
      const x = a.pop()!;
      if (y !== x) a.push(y - x);
      t.step({ ask: smashAsk(y, x), line: y !== x ? 7 : 6, array: [...a], tones: y !== x ? { [a.length - 1]: "found" } : {}, badge: y !== x ? { at: a.length - 1, text: `${y} − ${x}` } : undefined,
        vars: { round, y, x },
        message: y !== x ? `Smash ${y} and ${x}: a stone of ${y} − ${x} = ${y - x} goes back.` : `Smash ${y} and ${x}: equal, so both are destroyed.` });
    }
    const ans = a.length ? a[0] : 0;
    t.step({ line: 8, array: [...a], tones: a.length ? { 0: "found" } : {}, vars: { rounds: round, answer: ans }, done: "found",
      message: `${a.length ? `One stone left: ${ans}.` : "No stones left: 0."} But every round re-sorted the whole pile: up to n rounds × O(n log n) = O(n² log n).` });
  },
};

const heap: Approach<Input> = {
  id: "heap",
  name: "Max-heap",
  code: `// heap: a max-heap, heaviest stone on top
function lastStoneWeight(stones)
    heap ← stones
    arrange heap as a max-heap
    while length(heap) > 1
        y ← heap.popMax()  // heaviest
        x ← heap.popMax()  // next heaviest
        if y ≠ x
            heap.push(y - x)
    return heap is empty ? 0 : heap.max()
`,
  run({ stones }, t) {
    type S = { id: string; val: number };
    let next = 0;
    const H = new Heap<S>((p, q) => p.val > q.val, () => t.op());
    H.heapify(stones.map((v) => ({ id: `s${next++}`, val: v })));
    const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ ...heapTree(H.items), tones }];
    const grid = (hl?: number) => ({ title: "the heap as an array", rows: [H.items.length ? H.items.map((s) => s.val) : ["—"]], colLabels: H.items.map((_, i) => i), tones: hl === undefined ? {} : { [`0,${hl}`]: "found" as Tone } });
    t.step({ line: 4, array: [], trees: view({ [H.items[0].id]: "found" }), grid: grid(0), vars: { stones: stones.length },
      message: `Heapify: arrange the stones so every parent is at least as heavy as its children. The heaviest, ${H.peek()!.val}, is now at the top (index 0).` });
    let round = 0;
    while (H.size > 1) {
      round++;
      const all = [...H.items].map((s) => s.val).sort((p, q) => q - p);
      const [y0, x0] = [all[0], all[1]];
      const ask = { q: `Round ${round}: which two stones come off the top of the heap?`, options: [...new Set([`${y0} and ${x0}`, `${H.items[0].val} and ${H.items[H.size - 1].val}`, `${all[all.length - 1]} and ${all[all.length - 2]}`])], answer: 0 };
      const y = H.pop()!;
      const x = H.pop()!;
      t.step({ ask: ask.options.length > 1 ? ask : undefined, line: 7, array: [], trees: view(H.size ? { [H.items[0].id]: "active" } : {}), grid: grid(), vars: { round, y: y.val, x: x.val },
        message: `Pop twice: ${y.val}, then ${x.val}. After each pop the heap repairs itself in O(log n) steps, so the next heaviest${H.size ? `, ${H.peek()!.val},` : ""} rises to the top.` });
      if (y.val !== x.val) {
        const s = { id: `s${next++}`, val: y.val - x.val };
        H.push(s);
        t.step({ ask: smashAsk(y.val, x.val), line: 9, array: [], trees: view({ [s.id]: "found" }), grid: grid(H.items.indexOf(s)), vars: { round, y: y.val, x: x.val },
          message: `${y.val} − ${x.val} = ${s.val}: push it. It joins at the bottom and swaps upward past any lighter parent: O(log n).` });
      } else {
        t.step({ ask: smashAsk(y.val, x.val), line: 8, array: [], trees: view(), grid: grid(), vars: { round, y: y.val, x: x.val },
          message: `${y.val} = ${x.val}: both are destroyed. Nothing to push.` });
      }
    }
    const ans = H.size ? H.peek()!.val : 0;
    t.step({ line: 10, array: [], trees: view(H.size ? { [H.items[0].id]: "found" } : {}), grid: grid(H.size ? 0 : undefined), vars: { rounds: round, answer: ans }, done: "found",
      message: `${H.size ? `One stone left: ${ans}.` : "No stones left: 0."} Up to n rounds of O(log n) pops and pushes: O(n log n).` });
  },
};

export const approaches = { sort: resort, heap };

const sizes = [8, 16, 32, 48, 64, 96, 128];
/** Distinct weights 1..n: every round leaves a stone, so there are about n rounds. */
export const growth = measureGrowth([{ approach: resort, slot: 1 }, { approach: heap, slot: 2 }], (n) => ({ stones: Array.from({ length: n }, (_, i) => i + 1) }), sizes);
