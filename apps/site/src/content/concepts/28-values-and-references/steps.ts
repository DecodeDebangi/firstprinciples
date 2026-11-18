import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { x: number; list: number[] };
export const example: Input = { x: 5, list: [3, 8] };
/** No input boxes: the code panel spells out these exact values, so changing them would make the two disagree. */
export const fields: InputField[] = [];
export function prepare(raw: Input): Prepared<Input> {
  if (!Number.isInteger(raw.x)) return { error: "Use a whole number for x." };
  if (raw.list.length > 5) return { error: "Keep the list to at most 5 values, so a copy fits beside it." };
  return { input: raw };
}

/** Memory panel: each list object is a row, labelled "list #1", "list #2". */
type Mem = number[][];
const memGrid = (mem: Mem, hl: Record<number, Tone> = {}) => ({
  title: "memory: the lists that exist",
  rows: mem.map((l) => (l.length ? l : ["(empty)"])),
  rowLabels: mem.map((_, i) => `list #${i + 1}`),
  tones: Object.fromEntries(Object.entries(hl).flatMap(([r, tn]) => mem[Number(r)].map((_, c) => [`${r},${c}`, tn]))),
});
const show = (l: number[]) => `[${l.join(", ")}]`;

const assign: Approach<Input> = {
  id: "assign",
  name: "Assigning: numbers are copied, lists are shared",
  code: `x ← 5
y ← x  // y gets a copy of the number
y += 1  // x doesn't change
a ← [3, 8]
b ← a  // b names the same list
b.push(4)  // a sees it too
c ← copy(a)  // a separate, new list
c.push(9)  // a and b don't change
`,
  run({ x: x0, list }, t) {
    let x = x0, y: number | null = null;
    const mem: Mem = [];
    const v = (extra: Record<string, string | number> = {}) => ({ x, ...(y === null ? {} : { y }), ...extra });
    t.op();
    t.step({ line: 1, array: [], hideStage: true, vars: v(), message: `x ← ${x}: the variable x holds the number ${x}.` });
    y = x; t.op();
    t.step({ line: 2, array: [], hideStage: true, vars: v(), message: `y ← x copies the number: y now holds its own ${y}. The two variables have nothing else to do with each other.` });
    t.op();
    t.step({ ask: { q: `y ← y + 1. What happens to x?`, options: [`Nothing: x is still ${x}`, `x becomes ${x + 1} too`], answer: 0 },
      line: 3, array: [], hideStage: true, vars: (y = y + 1, v()), message: `y += 1 changes y to ${y}. x is still ${x}: it has its own copy.` });
    mem.push([...list]); t.op();
    const refs: Record<string, number> = { a: 0 };
    const rv = () => Object.fromEntries(Object.entries(refs).map(([k, i]) => [k, `→ list #${i + 1}`]));
    t.step({ line: 4, array: [], hideStage: true, grid: memGrid(mem, { 0: "active" }), vars: v(rv()),
      message: `a ← ${show(list)} creates a list (list #1). A list can be any size, so a doesn't hold the values themselves: it holds a reference, which says where the list is.` });
    refs.b = 0; t.op();
    t.step({ line: 5, array: [], hideStage: true, grid: memGrid(mem, { 0: "active" }), vars: v(rv()),
      message: `b ← a copies the reference, not the list. Now a and b are two names for the same list #1.` });
    mem[0].push(4); t.op();
    t.step({ ask: { q: `b.push(4) adds 4 through b. What does a hold now?`, options: [`${show(mem[0])}: it's the same list`, `${show(list)}: a is unchanged`], answer: 0 },
      line: 6, array: [], hideStage: true, grid: memGrid(mem, { 0: "found" }), vars: v(rv()),
      message: `b.push(4) changes list #1, and a refers to list #1, so a sees ${show(mem[0])} too. This surprises almost everyone the first time.` });
    mem.push([...mem[0]]); refs.c = 1; t.op(mem[0].length);
    t.step({ line: 7, array: [], hideStage: true, grid: memGrid(mem, { 1: "active" }), vars: v(rv()),
      message: `copy(a) builds a brand-new list (list #2) with the same values. c refers to that one. Copying takes time and memory: O(n) for n values.` });
    mem[1].push(9); t.op();
    t.step({ line: 8, array: [], hideStage: true, grid: memGrid(mem, { 1: "found", 0: "settled" }), vars: v(rv()), done: "found",
      message: `c.push(9) changes only list #2. a and b still show ${show(mem[0])}. Two names, one list: changes are shared. Two lists: they're independent.` });
  },
};

const calls: Approach<Input> = {
  id: "calls",
  name: "Passing to a function works the same way",
  code: `function bump(n)
    n += 1  // changes the function's copy

function addZero(list)
    list.push(0)  // changes the caller's list

x ← 5
bump(x)  // x is still 5
a ← [3, 8]
addZero(a)  // a is now [3, 8, 0]
`,
  run({ x, list }, t) {
    const mem: Mem = [[...list]];
    t.op();
    t.step({ line: 7, array: [], hideStage: true, vars: { x }, message: `x ← ${x}.` });
    t.op();
    t.step({ line: 2, array: [], hideStage: true, vars: { x, "n (inside bump)": x + 1 },
      message: `bump(x) gives the function a copy of the number: n starts at ${x}, and n += 1 makes it ${x + 1}. That changes only n.` });
    t.step({ ask: { q: `bump has finished. What is x?`, options: [String(x), String(x + 1)], answer: 0 },
      line: 8, array: [], hideStage: true, vars: { x }, message: `Back outside, x is still ${x}. A function can't change the caller's number through its parameter.` });
    t.op();
    t.step({ line: 9, array: [], hideStage: true, grid: memGrid(mem, { 0: "active" }), vars: { x, a: "→ list #1" }, message: `a ← ${show(list)}: a refers to list #1.` });
    mem[0].push(0); t.op();
    t.step({ line: 5, array: [], hideStage: true, grid: memGrid(mem, { 0: "found" }), vars: { a: "→ list #1", "list (inside addZero)": "→ list #1" },
      message: `addZero(a) gives the function a copy of the reference, so list refers to the same list #1. list.push(0) changes it.` });
    t.step({ line: 10, array: [], hideStage: true, grid: memGrid(mem, { 0: "settled" }), vars: { x, a: "→ list #1" }, done: "found",
      message: `Back outside, a holds ${show(mem[0])}. The function changed the caller's list. That's handy (no need to return it) but easy to do by accident: copy the list first if the caller's must stay as it was.` });
  },
};

export const approaches = { assign, calls };
