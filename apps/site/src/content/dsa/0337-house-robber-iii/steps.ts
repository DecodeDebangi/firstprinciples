import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, rootFields, prepareUpTo, robExample, robPlain, robPair, type RootInput } from "../../concepts/61-dp-on-trees/steps";

export type Input = RootInput;
export const example = robExample;
export const fields = rootFields;
export const prepare = prepareUpTo(9);
export const approaches = { plain: robPlain, pair: robPair };

export const growth = measureGrowth(
  [{ approach: robPlain, slot: 1 }, { approach: robPair, slot: 3 }],
  (n) => ({ root: chainOf(Array.from({ length: n }, (_, i) => (i % 5) + 1)) }),
  [4, 8, 12, 16, 20],
);
