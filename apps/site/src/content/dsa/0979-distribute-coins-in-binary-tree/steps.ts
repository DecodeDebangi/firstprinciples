import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, rootFields, coinPrepare, coinExample, coinEach, coinOnce, type RootInput } from "../../concepts/61-dp-on-trees/steps";

export type Input = RootInput;
export const example = coinExample;
export const fields = rootFields;
export const prepare = coinPrepare;
export const approaches = { each: coinEach, once: coinOnce };

export const growth = measureGrowth(
  [{ approach: coinEach, slot: 1 }, { approach: coinOnce, slot: 3 }],
  (n) => ({ root: chainOf([...Array(n - 1).fill(0), n]) }),
  [8, 16, 32, 64, 128],
);
