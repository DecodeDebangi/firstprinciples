import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { opsFields, parseQOps, queueCode, queuePrepare, queueSteps, type OpsInput } from "../../concepts/46-stack-patterns/steps";

export type Input = OpsInput;
export const example: Input = { ops: "push 1, push 2, push 3, peek, pop, push 4, pop, pop" };
export const fields: InputField[] = opsFields;
export const prepare: (raw: Input) => Prepared<Input> = queuePrepare;

const eager: Approach<Input> = {
  id: "eager",
  name: "Keep the oldest on top at every push",
  code: `main, temp ← empty stack, empty stack
function push(x)  // keep the oldest on top of main
    while main not empty
        temp.push(main.pop())
    main.push(x)
    while temp not empty
        main.push(temp.pop())
function pop()
    return main.pop()
function peek()
    return main.top()
`,
  run({ ops }, t) {
    const main: number[] = [], res: string[] = [];
    const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "main (bottom → top)", rows: [main.length ? [...main] : [""]], dense: true, tones } });
    t.step({ line: 1, array: [], hideStage: true, ...grid(), vars: {},
      message: `Keep a single stack in queue order, oldest on top, so pop and peek are instant. The price: a new value has to go underneath everything, so each push moves every value out and back.` });
    let asked = false;
    for (const o of parseQOps(ops)) {
      if (o.kind === "push") {
        const moved = main.length;
        const ask = !asked && moved >= 2 ? (asked = true, { ask: { q: `Pushing ${o.v} onto a queue of ${moved}. How many values move out and back in?`, options: [String(moved), "0", "1"], answer: 0 } }) : {};
        t.op(2 * moved + 1);
        main.unshift(o.v!);
        t.step({ ...ask, line: 7, array: [], hideStage: true, ...grid({ "0,0": "found" }), vars: { op: `push ${o.v}`, moved },
          message: moved ? `Move all ${moved} value${moved === 1 ? "" : "s"} to temp, push ${o.v}, and move them back on top: ${2 * moved + 1} steps. ${o.v} is now at the bottom, the newest end.` : `Empty, so just push ${o.v}.` });
        continue;
      }
      t.op();
      const v = main[main.length - 1];
      if (o.kind === "pop") main.pop();
      res.push(`${o.kind} → ${v}`);
      t.step({ line: o.kind === "pop" ? 9 : 11, array: [], hideStage: true, ...grid(o.kind === "peek" ? { [`0,${main.length - 1}`]: "compare" } : {}), vars: { op: o.kind, value: v },
        message: `${o.kind}: the top of main is the oldest value, ${v}. O(1).` });
    }
    t.step({ line: 9, array: [], hideStage: true, ...grid(), vars: { results: res.join(", ") || "none" }, done: "found",
      message: `pop and peek were O(1), but every push moved the whole queue twice: O(n) per push, O(n²) for n pushes.` });
  },
};

const lazy: Approach<Input> = { id: "twoStacks", name: "Pour only when out is empty", code: queueCode, run({ ops }, t) { queueSteps(ops, t, { push: 3, move: 7, pop: 10, peek: 13 }); } };

export const approaches = { eager, twoStacks: lazy };

/** n pushes, then n pops. */
export const growth = measureGrowth(
  [{ approach: eager, slot: 1 }, { approach: lazy, slot: 3 }],
  (n) => ({ ops: [...Array.from({ length: n }, (_, i) => `push ${i}`), ...Array(n).fill("pop")].join(", ") }),
  [4, 8, 16, 24, 32],
);
