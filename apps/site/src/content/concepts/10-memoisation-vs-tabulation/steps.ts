import { measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/** Ways to climb n stairs taking 1 or 2 at a time: ways(n) = ways(n − 1) + ways(n − 2). */
export type Input = { n: number };

export const example: Input = { n: 5 };

export const fields: InputField[] = [{ key: "n", label: "stairs n", kind: "number" }];

export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.n) || raw.n < 2 || raw.n > 5) return { error: "Use n from 2 to 5: the full call tree for 6 already has 25 calls." };
  return { input: raw };
}

/** The complete call tree of the plain recursion, built up front. Calls not made yet are drawn faded. */
function callTree(n: number) {
  const nodes: TreeNodeData[] = [];
  const arg = new Map<string, number>();
  let k = 0;
  const make = (m: number): string => {
    const id = `c${k++}`;
    const node: TreeNodeData = { id, val: m, left: null, right: null };
    nodes.push(node);
    arg.set(id, m);
    if (m >= 2) { node.left = make(m - 1); node.right = make(m - 2); }
    return id;
  };
  const root = make(n);
  const by = new Map(nodes.map((x) => [x.id, x]));
  return { root, nodes, by, arg };
}

const naive: Approach<Input> = {
  id: "naive",
  name: "Plain recursion",
  code: `function ways(n)
  if n ≤ 1
    return 1  // one way: stay, or one step
  return ways(n - 1) + ways(n - 2)
`,
  run({ n }, t) {
    const T = callTree(n);
    const tones: Record<string, Tone> = Object.fromEntries(T.nodes.map((x) => [x.id, "discard" as Tone]));
    const notes: Record<string, string> = {};
    const seen = new Map<number, number>();
    const stack: string[] = [];
    let calls = 0;
    const view = (extra: Record<string, Tone> = {}, at?: string): TreeData[] => [{ root: T.root, nodes: T.nodes, tones: { ...tones, ...extra }, notes: { ...notes }, pointers: at ? { call: at } : {}, layout: "compact" }];
    t.step({ line: 1, array: [], trees: view(), stack: [], vars: { n, calls: 0 },
      message: `To reach stair ${n}, your last move was 1 step (from ${n - 1}) or 2 steps (from ${n - 2}). So ways(${n}) = ways(${n - 1}) + ways(${n - 2}). The faded tree shows every call this will make.` });
    const go = (id: string): number => {
      const m = T.arg.get(id)!;
      t.op();
      calls++;
      const times = (seen.get(m) ?? 0) + 1;
      seen.set(m, times);
      const repeat = times > 1 && m >= 2;
      stack.push(`ways(${m})`);
      if (m <= 1) {
        notes[id] = "1";
        tones[id] = "settled";
        t.step({ line: 3, array: [], trees: view({ [id]: "found" }, id), stack: [...stack], vars: { n: m, calls },
          message: `ways(${m}) is a base case: 1 way.` });
        stack.pop();
        return 1;
      }
      tones[id] = "side-a";
      t.step({ line: 4, array: [], trees: view({ [id]: "active" }, id), stack: [...stack], vars: { n: m, calls },
        message: repeat ? `ways(${m}) again: this is call #${times} for ${m}, and it will redo all the same work.` : `ways(${m}) needs ways(${m - 1}) and ways(${m - 2}). Ask for ways(${m - 1}) first.` });
      const node = T.by.get(id)!;
      const l = go(node.left!);
      const r = go(node.right!);
      const v = l + r;
      notes[id] = String(v);
      tones[id] = repeat ? "side-b" : "settled";
      const opts = [...new Set([l + r, Math.max(l, r), l * r === l + r ? l + r + 1 : l * r])];
      t.step({ ask: { q: `ways(${m}) gets ways(${m - 1}) = ${l} and ways(${m - 2}) = ${r}. What does it return?`, options: opts.map(String), answer: 0 },
        line: 4, array: [], trees: view({ [id]: "found" }, id), stack: [...stack], vars: { n: m, calls },
        message: `ways(${m}) = ${l} + ${r} = ${v}.${repeat ? ` Computed ${times} times so far: the yellow nodes are repeated work.` : ""}` });
      stack.pop();
      return v;
    };
    const ans = go(T.root);
    const repeats = [...seen.entries()].filter(([m, c]) => m >= 2 && c > 1).map(([m, c]) => `ways(${m}) ×${c}`);
    t.step({ line: 4, array: [], trees: view(), stack: [], vars: { n, calls, answer: ans }, done: "found",
      message: `ways(${n}) = ${ans}, after ${calls} calls${repeats.length ? `, including ${repeats.join(", ")}` : ""}. Every call above the base cases makes two more, so the number of calls grows like 1.6ⁿ: exponential.` });
  },
};

const memo: Approach<Input> = {
  id: "memo",
  name: "Top-down: recursion + memo",
  code: `memo ← empty map
function ways(n)
  if n ≤ 1
    return 1
  if n in memo
    return memo[n]  // saved answer
  memo[n] ← ways(n - 1) + ways(n - 2)
  return memo[n]
`,
  run({ n }, t) {
    const T = callTree(n);
    const tones: Record<string, Tone> = Object.fromEntries(T.nodes.map((x) => [x.id, "discard" as Tone]));
    const notes: Record<string, string> = {};
    const saved = new Map<number, number>();
    const stack: string[] = [];
    let calls = 0;
    const mapPanel = (hl?: number) => ({ title: "memo", entries: [...saved.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => [String(k), String(v)] as [string, string]), highlight: hl === undefined ? undefined : String(hl) });
    const view = (extra: Record<string, Tone> = {}, at?: string): TreeData[] => [{ root: T.root, nodes: T.nodes, tones: { ...tones, ...extra }, notes: { ...notes }, pointers: at ? { call: at } : {}, layout: "compact" }];
    t.step({ line: 1, array: [], trees: view(), map: mapPanel(), stack: [], vars: { n, calls: 0 },
      message: "Same recursion, plus a memo: the first time ways(m) is worked out, save it. Any later call for m returns the saved answer instead of recursing." });
    const go = (id: string): number => {
      const m = T.arg.get(id)!;
      t.op();
      calls++;
      stack.push(`ways(${m})`);
      if (m <= 1) {
        notes[id] = "1";
        tones[id] = "settled";
        t.step({ line: 4, array: [], trees: view({ [id]: "found" }, id), map: mapPanel(), stack: [...stack], vars: { n: m, calls }, message: `ways(${m}) is a base case: 1.` });
        stack.pop();
        return 1;
      }
      if (saved.has(m)) {
        const v = saved.get(m)!;
        notes[id] = `${v} memo`;
        tones[id] = "visited";
        t.step({ ask: { q: `ways(${m}) is called again, and memo already holds ${m}. What happens?`, options: [`Return ${v} straight away`, `Recompute ways(${m - 1}) + ways(${m - 2})`], answer: 0 },
          line: 6, array: [], trees: view({ [id]: "found" }, id), map: mapPanel(m), stack: [...stack], vars: { n: m, calls },
          message: `ways(${m}) is already in the memo: return ${v}. The faded calls below it never happen.` });
        stack.pop();
        return v;
      }
      tones[id] = "side-a";
      t.step({ line: 7, array: [], trees: view({ [id]: "active" }, id), map: mapPanel(), stack: [...stack], vars: { n: m, calls },
        message: `ways(${m}) isn't saved yet. Work it out: ask for ways(${m - 1}), then ways(${m - 2}).` });
      const node = T.by.get(id)!;
      const l = go(node.left!);
      const r = go(node.right!);
      const v = l + r;
      saved.set(m, v);
      notes[id] = String(v);
      tones[id] = "settled";
      t.step({ line: 7, array: [], trees: view({ [id]: "found" }, id), map: mapPanel(m), stack: [...stack], vars: { n: m, calls },
        message: `ways(${m}) = ${l} + ${r} = ${v}. Save it in the memo.` });
      stack.pop();
      return v;
    };
    const ans = go(T.root);
    t.step({ line: 8, array: [], trees: view(), map: mapPanel(), stack: [], vars: { n, calls, answer: ans }, done: "found",
      message: `ways(${n}) = ${ans} after ${calls} calls instead of ${T.nodes.length}. Each value from 2 to ${n} is worked out once: O(n) time, O(n) space for the memo and the call stack.` });
  },
};

const table: Approach<Input> = {
  id: "table",
  name: "Bottom-up: fill a table",
  code: `function ways(n)
  dp ← array of n + 1, all 1  // base cases
  for i ← 2 to n
    dp[i] ← dp[i - 1] + dp[i - 2]
  return dp[n]
`,
  run({ n }, t) {
    const dp: (number | string)[] = Array(n + 1).fill("?");
    dp[0] = 1; dp[1] = 1;
    const labels = dp.map((_, i) => `dp[${i}]`);
    const done = (upto: number): Record<number, Tone> => Object.fromEntries(Array.from({ length: upto + 1 }, (_, i) => [i, "settled" as Tone]));
    t.op(); t.op();
    t.step({ line: 2, array: [...dp], labels, tones: done(1), vars: { n },
      message: `Flip it around: start from the smallest answers and build up. dp[i] is the number of ways to reach stair i; dp[0] and dp[1] are both 1.` });
    for (let i = 2; i <= n; i++) {
      t.op();
      const [a, b] = [dp[i - 1] as number, dp[i - 2] as number];
      const opts = [...new Set([a + b, a * b === a + b ? a + b + 1 : a * b, a + 1])];
      dp[i] = a + b;
      t.step({ ask: { q: `dp[${i - 1}] = ${a} and dp[${i - 2}] = ${b}. What's dp[${i}]?`, options: opts.map(String), answer: 0 },
        line: 4, array: [...dp], labels, pointers: { i }, tones: { ...done(i - 1), [i - 1]: "compare", [i - 2]: "compare", [i]: "found" }, badge: { at: i, text: `${a} + ${b}` }, vars: { n, i },
        message: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${a} + ${b} = ${a + b}. Both were already in the table, so no recursion at all.` });
    }
    t.step({ line: 5, array: [...dp], labels, tones: done(n), vars: { n, answer: dp[n] }, done: "found",
      message: `ways(${n}) = ${dp[n]}. One loop, ${n - 1} additions: O(n) time. Each entry only uses the two before it, so two variables would do: O(1) space.` });
  },
};

export const approaches = { naive, memo, table };

const sizes = [2, 4, 6, 8, 10, 12, 14];
export const growth = measureGrowth([{ approach: naive, slot: 1 }, { approach: memo, slot: 2 }, { approach: table, slot: 3 }], (n) => ({ n }), sizes);
