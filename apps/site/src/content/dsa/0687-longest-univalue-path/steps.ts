import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, rootFields, prepareUpTo, uniExample, uniEvery, uniOnce, type RootInput } from "../../concepts/61-dp-on-trees/steps";

export type Input = RootInput;
export const example = uniExample;
export const fields = rootFields;
export const prepare = prepareUpTo(12);
export const approaches = { every: uniEvery, once: uniOnce };

export const growth = measureGrowth(
  [{ approach: uniEvery, slot: 1 }, { approach: uniOnce, slot: 3 }],
  (n) => ({ root: chainOf(Array(n).fill(1)) }),
  [8, 16, 32, 64, 128],
);
