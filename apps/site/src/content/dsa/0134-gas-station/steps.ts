import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { gasFields, gasPrepare, tankCode, tankSteps, type GasInput } from "../../concepts/49-greedy-in-practice/steps";

export type Input = GasInput;
export const example: Input = { gas: [1, 4, 2, 5, 3], cost: [3, 2, 4, 1, 4] };
export const fields: InputField[] = gasFields;
export const prepare: (raw: Input) => Prepared<Input> = gasPrepare;

const everyStart: Approach<Input> = {
  id: "everyStart",
  name: "Try a lap from every station",
  code: `function canCompleteCircuit(gas, cost)
    n ← length(gas)
    for start ← 0 to n - 1
        tank ← 0
        ok ← true
        for k ← 0 to n - 1
            i ← (start + k) % n
            tank += gas[i] - cost[i]
            if tank < 0
                ok ← false
                break
        if ok
            return start
    return -1
`,
  run({ gas, cost }, t) {
    const n = gas.length, net = gas.map((g, i) => g - cost[i]), labels = net.map((_, i) => `st ${i}`);
    t.step({ line: 2, array: net, labels, vars: {}, message: `The row shows gas − cost at each station. Try a full lap from each station in turn, stopping a lap as soon as the tank goes below 0.` });
    for (let s = 0; s < n; s++) {
      let tank = 0, k = 0;
      for (; k < n; k++) { t.op(); tank += net[(s + k) % n]; if (tank < 0) break; }
      const ok = k === n;
      const visited = Object.fromEntries(Array.from({ length: Math.min(k + 1, n) }, (_, z) => [(s + z) % n, (ok ? "found" : "visited") as Tone]));
      t.step({ line: ok ? 13 : 11, array: net, labels, pointers: { start: s }, tones: { ...visited, ...(ok ? {} : { [(s + k) % n]: "miss" as Tone }) }, vars: { start: s, tank }, ...(ok ? { done: "found" as const } : {}),
        message: ok ? `From ${s} the tank never goes below 0 all the way round. Return ${s}.` : `From ${s}, the tank drops to ${tank} after station ${(s + k) % n}: no lap. ${k + 1} station${k ? "s" : ""} driven.` });
      if (ok) return;
    }
    t.step({ line: 14, array: net, labels, vars: {}, done: "notfound", message: `No start completes the lap: return -1. Up to n laps of n stations: O(n²).` });
  },
};

const onePass: Approach<Input> = { id: "tank", name: "One pass, restarting when the tank runs dry", code: tankCode, run(input, t) { tankSteps(input, t, { add: 5, restart: 7, done: 8 }); } };

export const approaches = { everyStart, tank: onePass };

/** Only the last station works, and earlier laps fail late. */
export const growth = measureGrowth(
  [{ approach: everyStart, slot: 1 }, { approach: onePass, slot: 3 }],
  (n) => ({ gas: [...Array(n - 1).fill(1), n], cost: [...Array(n - 2).fill(1), n, 1] }),
  [8, 16, 32, 48, 64],
);
