import { measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

/* ---------- Factorial: the call stack ---------- */
export type FactInput = { n: number };
export const factExample: FactInput = { n: 4 };
export const factFields: InputField[] = [{ key: "n", label: "n =", kind: "number" }];
export function factPrepare(raw: FactInput): Prepared<FactInput> {
  if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 7) return { error: "Pick n from 1 to 7." };
  return { input: raw };
}

const factorial: Approach<FactInput> = {
  id: "factorial",
  name: "Factorial: the call stack",
  code: `function factorial(n)
    if n ≤ 1
        return 1  // base case
    return n * factorial(n - 1)
`,
  run({ n }, t) {
    const frames: string[] = [];
    t.step({ line: 1, array: [], hideStage: true, stack: [], vars: { n },
      message: `factorial(n) is n × (n − 1) × … × 1, so factorial(4) = 4 × 3 × 2 × 1 = 24. Notice that factorial(4) is just 4 × factorial(3): the same question on a smaller number. A function that answers by calling itself on a smaller input is recursive.` });
    for (let k = n; k > 1; k--) {
      t.op();
      frames.push(`factorial(${k}): ${k} × ?`);
      t.step({ line: 4, array: [], hideStage: true, stack: [...frames], vars: { n: k },
        message: `factorial(${k}): ${k} isn't ≤ 1, so it needs factorial(${k - 1}) first. It can't finish yet, so it waits on the call stack, the pile of calls that have started but not returned.` });
    }
    t.op();
    t.step({ ask: n > 1 ? { q: `factorial(1) is called. What happens?`, options: ["It returns 1 straight away: the base case", "It calls factorial(0)", "It waits for the others"], answer: 0 } : undefined,
      line: 3, array: [], hideStage: true, stack: [...frames, "factorial(1) = 1"], vars: { n: 1 },
      message: `factorial(1): 1 ≤ 1, the base case. It returns 1 without calling anything. Without a base case the calls would never stop.` });
    let acc = 1;
    for (let k = 2; k <= n; k++) {
      const below = acc; acc *= k;
      const shown = frames.slice(0, n - k + 1);
      shown[shown.length - 1] = `factorial(${k}) = ${k} × ${below} = ${acc}`;
      t.step({ line: 4, array: [], hideStage: true, stack: shown, vars: { n: k, returns: acc },
        message: `factorial(${k - 1}) answered ${below}, so factorial(${k}) can finish: ${k} × ${below} = ${acc}. It returns and leaves the stack.` });
    }
    t.step({ line: 4, array: [], hideStage: true, stack: [], vars: { answer: acc }, done: "found",
      message: `factorial(${n}) = ${acc}. ${n} calls were waiting at the deepest point, so the stack took O(n) space, and there were n calls: O(n) time.` });
  },
};

/* ---------- Fibonacci: the call tree ---------- */
export type FibInput = { n: number };
export const fibExample: FibInput = { n: 4 };
export const fibFields: InputField[] = [{ key: "n", label: "n =", kind: "number" }];
export function fibPrepare(raw: FibInput): Prepared<FibInput> {
  if (!Number.isInteger(raw.n) || raw.n < 0 || raw.n > 5) return { error: "Pick n from 0 to 5, so the call tree fits." };
  return { input: raw };
}
const fibVal = (n: number): number => (n <= 1 ? n : fibVal(n - 1) + fibVal(n - 2));

/** Runs fib(n) recursively, drawing each call as a node. `memo` switches on remembering answers. */
function runFib(n0: number, t: Parameters<Approach<FibInput>["run"]>[1], memo: boolean, lines: { base: number; hit: number; call: number; ret: number }) {
  const nodes: TreeNodeData[] = [];
  const tones: Record<string, Tone> = {}, notes: Record<string, string> = {};
  const parentOf = new Map<string, string | null>();
  const seenN = new Set<number>();
  const known = new Map<number, number>();
  let k = 0, root: string | null = null, repeats = 0;
  // Silent runs (the growth chart) skip copying the tree at every call, which is O(calls²).
  const view = (extra: Record<string, Tone> = {}): TreeData[] => !t.record ? [] : [{ root, nodes: nodes.map((x) => ({ ...x, kids: [...(x.kids ?? [])] })), tones: { ...tones, ...extra }, notes: { ...notes }, layout: "compact" }];
  const path = (id: string) => { const out: string[] = []; for (let p: string | null = id; p; p = parentOf.get(p) ?? null) out.unshift(p); return out; };
  const label = (id: string) => `fib(${nodes.find((x) => x.id === id)!.val})`;
  const memoPanel = () => (memo ? { map: { title: "memo (n → answer)", entries: [...known.entries()].sort((a, b) => a[0] - b[0]).map(([a, b]) => [String(a), String(b)] as [string, string]) } } : {});
  let askedRepeat = false;
  const call = (n: number, parent: string | null): number => {
    const id = `c${k++}`;
    const node: TreeNodeData = { id, val: n, left: null, right: null, kids: [] }; // the node shows n; it stands for the call fib(n)
    nodes.push(node); parentOf.set(id, parent);
    if (parent) nodes.find((x) => x.id === parent)!.kids!.push(id); else root = id;
    t.op();
    const again = seenN.has(n) && n > 1;
    seenN.add(n);
    const stack = path(id).map(label);
    if (n <= 1) {
      notes[id] = `= ${n}`;
      t.step({ line: lines.base, array: [], trees: view({ [id]: "found" }), stack, vars: { n }, ...memoPanel(), message: `fib(${n}): the base case, return ${n}.` });
      tones[id] = "settled";
      return n;
    }
    if (memo && known.has(n)) {
      notes[id] = `= ${known.get(n)} (memo)`;
      t.step({ line: lines.hit, array: [], trees: view({ [id]: "found" }), stack, vars: { n }, ...memoPanel(), message: `fib(${n}) was already worked out: look it up in memo, ${known.get(n)}, and return at once. No calls below it.` });
      tones[id] = "settled";
      return known.get(n)!;
    }
    if (again) repeats++;
    const ask = again && !askedRepeat && !memo ? (askedRepeat = true, { ask: { q: `fib(${n}) was already fully worked out earlier. What does this call do?`, options: ["Works it all out again, calls and all", "Remembers the answer"], answer: 0 } }) : {};
    t.step({ ...ask, line: lines.call, array: [], trees: view({ [id]: again ? "miss" : "active" }), stack, vars: { n }, ...memoPanel(),
      message: again ? `fib(${n}) again! It was already worked out in another branch, but this call doesn't know that, so it repeats all the same calls below it.` : `fib(${n}) = fib(${n - 1}) + fib(${n - 2}). Call fib(${n - 1}) first, and wait.` });
    tones[id] = "side-a";
    const a = call(n - 1, id), b = call(n - 2, id);
    const v = a + b;
    notes[id] = `= ${v}`;
    if (memo) known.set(n, v);
    t.step({ line: lines.ret, array: [], trees: view({ [id]: "found" }), stack, vars: { n, returns: v }, ...memoPanel(),
      message: `Both answers are back: fib(${n}) = ${a} + ${b} = ${v}.${memo ? ` Store it in memo, so no other call has to work it out again.` : ""}` });
    tones[id] = again ? "visited" : "settled";
    return v;
  };
  t.step({ line: 1, array: [], trees: [{ root: null, nodes: [] }], stack: [], vars: { n: n0 }, ...memoPanel(),
    message: memo ? "Same recursion, plus a memo: a map from n to fib(n). Before working anything out, check whether it's already in the memo." : `The Fibonacci numbers go 0, 1, 1, 2, 3, 5, 8…: each is the sum of the two before it. So fib(n) = fib(n − 1) + fib(n − 2), with fib(0) = 0 and fib(1) = 1 as base cases. Watch the calls grow into a tree: each node is one call, labelled with its n, and the note under it is what it returned.` });
  const ans = call(n0, null);
  t.step({ line: lines.ret, array: [], trees: view(), stack: [], vars: { answer: ans, calls: k }, ...memoPanel(), done: "found",
    message: memo ? `fib(${n0}) = ${ans} in ${k} calls: each value is worked out once, so O(n) time, plus O(n) for the memo and the stack.`
      : `fib(${n0}) = ${ans}, but it took ${k} calls${repeats ? `, ${repeats} of them repeating work already done elsewhere` : ""}. The tree roughly doubles with every extra n: O(2ⁿ) time. That's what memoisation fixes.` });
}

const fibPlain: Approach<FibInput> = {
  id: "fib",
  name: "Fibonacci: a tree of calls",
  code: `function fib(n)
    if n ≤ 1
        return n  // base cases
    return fib(n - 1) + fib(n - 2)
`,
  run({ n }, t) { runFib(n, t, false, { base: 3, hit: 3, call: 4, ret: 4 }); },
};

const fibMemo: Approach<FibInput> = {
  id: "fib-memo",
  name: "Fibonacci with a memo",
  code: `function fib(n, memo)
    if n ≤ 1 then return n
    if n in memo then return memo[n]
    memo[n] ← fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
`,
  run({ n }, t) { runFib(n, t, true, { base: 2, hit: 3, call: 4, ret: 5 }); },
};

export const factApproaches = { factorial };
export const fibApproaches = { fibPlain, fibMemo };
export { fibVal };

export const growth = measureGrowth(
  [{ approach: fibPlain, slot: 1 }, { approach: fibMemo, slot: 3 }],
  (n) => ({ n: Math.min(n, 18) }),
  [2, 4, 8, 12, 16],
);
