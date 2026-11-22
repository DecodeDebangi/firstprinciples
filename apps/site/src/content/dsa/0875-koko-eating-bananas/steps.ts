import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { hoursAt, speedCode, speedFields, speedPrepare, speedSearchSteps, type SpeedInput } from "../../concepts/47-binary-search-on-answers/steps";

export type Input = SpeedInput;
export const example: Input = { piles: [5, 9, 2, 6], h: 7 };
export const fields: InputField[] = speedFields;
export const prepare: (raw: Input) => Prepared<Input> = speedPrepare;

const everySpeed: Approach<Input> = {
  id: "linear",
  name: "Try speeds 1, 2, 3, …",
  code: `function minEatingSpeed(piles, h)
    k ← 1
    while hours(piles, k) > h  // too slow?
        k += 1
    return k
`,
  run({ piles, h }, t) {
    const max = Math.max(...piles), cells = Array.from({ length: max }, (_, i) => i + 1), tones: Record<number, Tone> = {};
    t.step({ line: 2, array: cells, vars: { h }, message: `Try every speed from 1 upwards; the first one that finishes within ${h} hours is the answer. Each try adds up the hours for every pile.` });
    for (let k = 1; ; k++) {
      t.op(piles.length);
      const hrs = hoursAt(piles, k), ok = hrs <= h;
      tones[k - 1] = ok ? "found" : "miss";
      t.step({ line: ok ? 5 : 4, array: cells, pointers: { k: k - 1 }, tones: { ...tones }, badge: { at: k - 1, text: `${hrs}h` }, vars: { k, hours: hrs, h }, ...(ok ? { done: "found" as const } : {}),
        message: ok ? `Speed ${k}: ${hrs} hours, within ${h}. Return ${k}. That took ${k} tries of ${piles.length} piles each: O(max · n) in the worst case.` : `Speed ${k}: ${piles.map((p) => `⌈${p}/${k}⌉`).join(" + ")} = ${hrs} hours, more than ${h}. Too slow.` });
      if (ok) return;
    }
  },
};

const binary: Approach<Input> = { id: "binary", name: "Binary search the speeds", code: speedCode, run(input, t) { speedSearchSteps(input, t); } };

export const approaches = { linear: everySpeed, binary };

/** Four piles, the biggest of size n, and 4 hours: every pile must be eaten in an hour, so the answer is n. */
export const growth = measureGrowth(
  [{ approach: everySpeed, slot: 1 }, { approach: binary, slot: 3 }],
  (n) => ({ piles: Array.from({ length: 4 }, (_, i) => (i === 0 ? n : 1 + (i % 3))), h: 4 }),
  [8, 16, 32, 64, 128],
);
