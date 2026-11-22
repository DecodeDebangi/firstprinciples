import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { minCode, minPrepare, minStackSteps, opsFields, parseMinOps, type OpsInput } from "../../concepts/46-stack-patterns/steps";

export type Input = OpsInput;
export const example: Input = { ops: "push 6, push 2, push 8, getMin, push 1, getMin, pop, getMin" };
export const fields: InputField[] = opsFields;
export const prepare: (raw: Input) => Prepared<Input> = minPrepare;

const scanMin: Approach<Input> = {
  id: "scan",
  name: "Plain stack, search for the minimum",
  code: `vals ← empty stack
function push(x)
    vals.push(x)
function pop()
    return vals.pop()
function top()
    return vals.top()
function getMin()
    best ← vals[0]
    for each x in vals
        best ← min(best, x)
    return best
`,
  run({ ops }, t) {
    const vals: number[] = [], out: string[] = [];
    const grid = (tones: Record<string, Tone> = {}) => ({ grid: { title: "values (bottom → top)", rows: [vals.length ? [...vals] : [""]], dense: true, tones } });
    t.step({ line: 1, array: [], hideStage: true, ...grid(), vars: {},
      message: `A plain stack makes push, pop and top O(1). getMin has nothing stored to use, so it looks through every value.` });
    let asked = false;
    for (const o of parseMinOps(ops)) {
      t.op();
      if (o.kind === "push") { vals.push(o.v!); t.step({ line: 3, array: [], hideStage: true, ...grid({ [`0,${vals.length - 1}`]: "found" }), vars: { op: `push ${o.v}` }, message: `Push ${o.v}.` }); continue; }
      if (o.kind === "pop") { const v = vals.pop()!; out.push(`pop → ${v}`); t.step({ line: 5, array: [], hideStage: true, ...grid(), vars: { op: "pop", removed: v }, message: `Pop ${v}.` }); continue; }
      if (o.kind === "top") { out.push(`top → ${vals.at(-1)}`); t.step({ line: 7, array: [], hideStage: true, ...grid({ [`0,${vals.length - 1}`]: "compare" }), vars: { op: "top", answer: vals.at(-1)! }, message: `top: ${vals.at(-1)}.` }); continue; }
      t.op(vals.length);
      const best = Math.min(...vals), at = vals.indexOf(best);
      const ask = !asked && vals.length > 2 ? (asked = true, { ask: { q: `getMin on a plain stack of ${vals.length} values: how many does it look at?`, options: [`All ${vals.length}`, "Just the top one", "Half of them"], answer: 0 } }) : {};
      out.push(`getMin → ${best}`);
      t.step({ ...ask, line: 11, array: [], hideStage: true, ...grid({ ...Object.fromEntries(vals.map((_, k) => [`0,${k}`, "visited" as Tone])), [`0,${at}`]: "found" }), vars: { op: "getMin", answer: best },
        message: `getMin looks at all ${vals.length} values to find ${best}: O(n) every time it's asked.` });
    }
    t.step({ line: 12, array: [], hideStage: true, ...grid(), vars: { results: out.join(", ") || "none" }, done: "found",
      message: `push, pop and top were O(1), but each getMin was O(n). Many getMin calls on a big stack cost O(n) each.` });
  },
};

const withMins: Approach<Input> = { id: "minStack", name: "A stack of minimums", code: minCode, run({ ops }, t) { minStackSteps(ops, t, { push: 4, pop: 7, top: 9, min: 11 }); } };

export const approaches = { scan: scanMin, minStack: withMins };

/** n pushes, then n getMin calls. */
export const growth = measureGrowth(
  [{ approach: scanMin, slot: 1 }, { approach: withMins, slot: 3 }],
  (n) => ({ ops: [...Array.from({ length: n }, (_, i) => `push ${(i * 7) % 11}`), ...Array(n).fill("getMin")].join(", ") }),
  [4, 8, 16, 24, 32],
);
