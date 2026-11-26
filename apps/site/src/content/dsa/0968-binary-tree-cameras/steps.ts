import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, rootFields, prepareUpTo, camExample, camBrute, camGreedy, type RootInput } from "../../concepts/61-dp-on-trees/steps";

export type Input = RootInput;
export const example = camExample;
export const fields = rootFields;
export const prepare = prepareUpTo(9);
export const approaches = { subsets: camBrute, states: camGreedy };

export const growth = measureGrowth(
  [{ approach: camBrute, slot: 1 }, { approach: camGreedy, slot: 3 }],
  (n) => ({ root: chainOf(Array(n).fill(0)) }),
  [3, 5, 7, 9, 11],
);
