import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ ops: string }>["run"]>[1];

/* ---------- Evaluating postfix (Reverse Polish) ---------- */
export type RpnInput = { tokens: string };
export const rpnExample: RpnInput = { tokens: "4 2 + 3 * 5 -" };
export const rpnFields: InputField[] = [{ key: "tokens", label: "postfix expression", kind: "raw" }];
export const parseTokens = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const isOp = (x: string) => ["+", "-", "*", "/"].includes(x);
/** Divides like the problem asks: whole numbers, rounding towards zero. */
const apply = (op: string, a: number, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b));
export function rpnPrepare(raw: RpnInput): Prepared<RpnInput> {
  const tk = parseTokens(raw.tokens);
  if (!tk.length || tk.some((x) => !isOp(x) && !/^-?\d+$/.test(x))) return { error: "Use whole numbers and + - * /, separated by spaces." };
  if (tk.length > 9) return { error: "Use at most 9 tokens so they fit." };
  let depth = 0;
  for (const x of tk) { depth += isOp(x) ? -1 : 1; if (depth < 1) return { error: "Each operator needs two numbers before it." }; }
  if (depth !== 1) return { error: "The expression must reduce to exactly one number." };
  const st: number[] = [];
  for (const x of tk) {
    if (!isOp(x)) { st.push(Number(x)); continue; }
    const b = st.pop()!, a = st.pop()!;
    if (x === "/" && b === 0) return { error: "The expression divides by zero somewhere." };
    st.push(apply(x, a, b));
  }
  return { input: { tokens: tk.join(" ") } };
}

/** Evaluates postfix with a stack, one step per token. Shared with LC 150. */
export function rpnSteps(tokens: string, t: T, lines: { push: number; pop: number; done: number }) {
  const tk = parseTokens(tokens), st: number[] = [];
  t.step({ line: 2, array: tk, stack: [], stackTitle: "stack", vars: {},
    message: `In postfix, each operator comes after its two numbers: "4 2 +" means 4 + 2. Read left to right: push numbers; an operator pops the last two, combines them and pushes the result.` });
  let asked = false;
  tk.forEach((x, i) => {
    t.op();
    if (!isOp(x)) {
      st.push(Number(x));
      t.step({ line: lines.push, array: tk, pointers: { i }, tones: { [i]: "active" }, stack: st.map(String), stackTitle: "stack", vars: { token: x },
        message: `${x} is a number: push it.` });
      return;
    }
    const b = st.pop()!, a = st.pop()!, r = apply(x, a, b);
    const opts = [`${a} ${x} ${b} = ${r}`, `${b} ${x} ${a} = ${apply(x, b, a)}`];
    const ask = !asked && opts[0] !== opts[1] ? (asked = true, { ask: { q: `"${x}" pops ${b}, then ${a}. Which calculation is pushed?`, options: opts, answer: 0 } }) : {};
    st.push(r);
    t.step({ ...ask, line: lines.pop, array: tk, pointers: { i }, tones: { [i]: "found" }, stack: st.map(String), stackTitle: "stack", vars: { token: x, a, b, result: r },
      message: `"${x}": pop ${b} (the top) and ${a}. The one popped second is the left side: ${a} ${x} ${b} = ${r}. Push ${r}.` });
  });
  t.step({ line: lines.done, array: tk, tones: Object.fromEntries(tk.map((_, k) => [k, "settled" as Tone])), stack: st.map(String), stackTitle: "stack", vars: { answer: st[0] }, done: "found",
    message: `One number is left: ${st[0]}. Each token was handled once with O(1) stack work: O(n) time, and the stack holds at most about n / 2 numbers.` });
  return st[0];
}
export const rpnCode = `function evalRPN(tokens)
    stack ← empty stack
    for each x in tokens
        if x is a number
            stack.push(x)
        else
            b, a ← stack.pop(), stack.pop()
            stack.push(a x b)  // x is + - * or /
    return stack.pop()
`;

/* ---------- A stack that knows its minimum ---------- */
export type OpsInput = { ops: string };
export const minExample: OpsInput = { ops: "push 5, push 3, push 7, getMin, pop, pop, getMin" };
export const opsFields: InputField[] = [{ key: "ops", label: "operations", kind: "raw" }];
type MinOp = { kind: "push" | "pop" | "top" | "getMin"; v?: number };
export const parseMinOps = (s: string): MinOp[] => s.split(",").map((x) => x.trim().split(/\s+/)).filter((p) => p[0]).map(([k, v]) => ({ kind: k as MinOp["kind"], v: v === undefined ? undefined : Number(v) }));
export function minPrepare(raw: OpsInput): Prepared<OpsInput> {
  const ops = parseMinOps(raw.ops);
  let size = 0;
  for (const o of ops) {
    if (!["push", "pop", "top", "getMin"].includes(o.kind) || (o.kind === "push" && !Number.isInteger(o.v))) return { error: 'Use operations like "push 5, pop, top, getMin", separated by commas.' };
    if (o.kind === "push") size++; else if (size === 0) return { error: "pop, top and getMin need a non-empty stack." }; else if (o.kind === "pop") size--;
    if (size > 6) return { error: "Keep at most 6 values on the stack so it fits." };
  }
  if (!ops.length || ops.length > 9) return { error: "Use 1 to 9 operations." };
  return { input: { ops: ops.map((o) => (o.kind === "push" ? `push ${o.v}` : o.kind)).join(", ") } };
}

/** A stack plus a second stack of "minimum so far". Shared with LC 155. */
export function minStackSteps(ops: string, t: T, lines: { push: number; pop: number; top: number; min: number }) {
  const vals: number[] = [], mins: number[] = [], out: string[] = [];
  const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "bottom → top", rows: [vals.length ? [...vals] : [""], mins.length ? [...mins] : [""]], rowLabels: ["values", "min so far"], dense: true, tones } });
  t.step({ line: 1, array: [], hideStage: true, ...grid(), vars: {},
    message: `Keep a second stack beside the values: at each level, the smallest value from the bottom up to that level. Then the minimum of the whole stack is always on top of it, and a pop removes both together.` });
  let asked = false;
  for (const o of parseMinOps(ops)) {
    t.op();
    const top = vals.length - 1;
    if (o.kind === "push") {
      const m = mins.length ? Math.min(o.v!, mins[top]) : o.v!;
      const other = mins.length ? String(o.v === m ? mins[top] : o.v) : "";
      const ask = !asked && mins.length && other !== String(m) ? (asked = true, { ask: { q: `Pushing ${o.v}; the minimum so far is ${mins[top]}. What goes on the min stack?`, options: [String(m), other], answer: 0 } }) : {};
      vals.push(o.v!); mins.push(m); out.push(`push ${o.v}`);
      t.step({ ...ask, line: lines.push, array: [], hideStage: true, ...grid({ [`0,${top + 1}`]: "found", [`1,${top + 1}`]: "found" }), vars: { op: `push ${o.v}`, min: m },
        message: `Push ${o.v}, and push min(${o.v}, ${mins.length > 1 ? mins[top] : o.v}) = ${m} beside it.` });
    } else if (o.kind === "pop") {
      const v = vals.pop()!; mins.pop(); out.push(`pop → ${v}`);
      t.step({ line: lines.pop, array: [], hideStage: true, ...grid(), vars: { op: "pop", removed: v, min: mins.length ? mins[mins.length - 1] : "—" },
        message: `Pop ${v} and its minimum together. The minimum below it is back on top${mins.length ? `: ${mins[mins.length - 1]}` : ""}, with nothing to search.` });
    } else {
      const ans = o.kind === "top" ? vals[top] : mins[top];
      out.push(`${o.kind} → ${ans}`);
      t.step({ line: o.kind === "top" ? lines.top : lines.min, array: [], hideStage: true, ...grid({ [`${o.kind === "top" ? 0 : 1},${top}`]: "compare" }), vars: { op: o.kind, answer: ans },
        message: o.kind === "top" ? `top: the last value pushed, ${ans}.` : `getMin: read the top of the min stack, ${ans}. O(1), however many values there are.` });
    }
  }
  t.step({ line: lines.min, array: [], hideStage: true, ...grid(), vars: { results: out.filter((x) => x.includes("→")).join(", ") || "none" }, done: "found",
    message: `Every operation was O(1), at the cost of a second stack: O(n) extra space.` });
  return out;
}
export const minCode = `vals, mins ← empty stack, empty stack
function push(x)
    vals.push(x)
    mins.push(mins empty ? x : min(x, mins.top()))
function pop()
    mins.pop()
    return vals.pop()
function top()
    return vals.top()
function getMin()
    return mins.top()
`;

/* ---------- A queue from two stacks ---------- */
export const queueExample: OpsInput = { ops: "push 1, push 2, push 3, pop, push 4, pop, pop" };
type QOp = { kind: "push" | "pop" | "peek"; v?: number };
export const parseQOps = (s: string): QOp[] => s.split(",").map((x) => x.trim().split(/\s+/)).filter((p) => p[0]).map(([k, v]) => ({ kind: k as QOp["kind"], v: v === undefined ? undefined : Number(v) }));
export function queuePrepare(raw: OpsInput): Prepared<OpsInput> {
  const ops = parseQOps(raw.ops);
  let size = 0;
  for (const o of ops) {
    if (!["push", "pop", "peek"].includes(o.kind) || (o.kind === "push" && !Number.isInteger(o.v))) return { error: 'Use operations like "push 1, pop, peek", separated by commas.' };
    if (o.kind === "push") size++; else if (size === 0) return { error: "pop and peek need a non-empty queue." }; else if (o.kind === "pop") size--;
    if (size > 6) return { error: "Keep at most 6 values in the queue so it fits." };
  }
  if (!ops.length || ops.length > 9) return { error: "Use 1 to 9 operations." };
  return { input: { ops: ops.map((o) => (o.kind === "push" ? `push ${o.v}` : o.kind)).join(", ") } };
}

/** Queue with an "in" stack and an "out" stack, refilled only when out is empty. Shared with LC 232. */
export function queueSteps(ops: string, t: T, lines: { push: number; move: number; pop: number; peek: number }) {
  const inn: number[] = [], out: number[] = [], res: string[] = [];
  const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "stacks (bottom → top)", rows: [inn.length ? [...inn] : [""], out.length ? [...out] : [""]], rowLabels: ["in", "out"], dense: true, tones } });
  t.step({ line: 1, array: [], hideStage: true, ...grid(), vars: {},
    message: `A queue gives back the oldest value first; a stack gives back the newest. Push into "in". To take one out, use "out"; when it's empty, pour all of "in" into it, which reverses them so the oldest is on top.` });
  let asked = false;
  for (const o of parseQOps(ops)) {
    if (o.kind === "push") {
      t.op(); inn.push(o.v!);
      t.step({ line: lines.push, array: [], hideStage: true, ...grid({ [`0,${inn.length - 1}`]: "found" }), vars: { op: `push ${o.v}` }, message: `Push ${o.v} onto "in". O(1).` });
      continue;
    }
    if (!out.length) {
      const ask = !asked && inn.length > 1 && inn[0] !== inn[inn.length - 1] ? (asked = true, { ask: { q: `"out" is empty and "in" holds ${inn.join(", ")} (bottom to top). After pouring, what's on top of "out"?`, options: [String(inn[0]), String(inn[inn.length - 1])], answer: 0 } }) : {};
      const moved = inn.length;
      while (inn.length) { t.op(); out.push(inn.pop()!); }
      t.step({ ...ask, line: lines.move, array: [], hideStage: true, ...grid({ [`1,${out.length - 1}`]: "compare" }), vars: { op: o.kind, moved },
        message: `"out" is empty, so pour all ${moved} value${moved === 1 ? "" : "s"} across. Popping reverses them: the oldest, ${out[out.length - 1]}, is now on top.` });
    }
    t.op();
    if (o.kind === "pop") {
      const v = out.pop()!; res.push(`pop → ${v}`);
      t.step({ line: lines.pop, array: [], hideStage: true, ...grid(), vars: { op: "pop", removed: v }, message: `Pop ${v} from "out": the oldest value in the queue.` });
    } else {
      res.push(`peek → ${out[out.length - 1]}`);
      t.step({ line: lines.peek, array: [], hideStage: true, ...grid({ [`1,${out.length - 1}`]: "compare" }), vars: { op: "peek", front: out[out.length - 1] }, message: `peek: the top of "out", ${out[out.length - 1]}, is the front of the queue.` });
    }
  }
  t.step({ line: lines.pop, array: [], hideStage: true, ...grid(), vars: { results: res.join(", ") || "none" }, done: "found",
    message: `Each value is pushed once, poured across once and popped once, so although one pour can move many values, every operation is O(1) on average (amortised).` });
  return res;
}
export const queueCode = `inn, out ← empty stack, empty stack
function push(x)
    inn.push(x)
function refill()  // only when out is empty
    if out is empty
        while inn not empty
            out.push(inn.pop())
function pop()
    refill()
    return out.pop()
function peek()
    refill()
    return out.top()
`;

const rpn: Approach<RpnInput> = { id: "rpn", name: "Evaluate with a stack", code: rpnCode, run({ tokens }, t) { rpnSteps(tokens, t, { push: 5, pop: 8, done: 9 }); } };
const minStack: Approach<OpsInput> = { id: "minStack", name: "A stack of minimums", code: minCode, run({ ops }, t) { minStackSteps(ops, t, { push: 4, pop: 7, top: 9, min: 11 }); } };
const twoStacks: Approach<OpsInput> = { id: "twoStacks", name: "Two stacks", code: queueCode, run({ ops }, t) { queueSteps(ops, t, { push: 3, move: 7, pop: 10, peek: 13 }); } };
export const rpnApproaches = { rpn };
export const minApproaches = { minStack };
export const queueApproaches = { twoStacks };
