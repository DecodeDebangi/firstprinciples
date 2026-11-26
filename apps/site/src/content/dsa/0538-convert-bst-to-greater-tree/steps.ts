import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, greaterExample, greaterFields, greaterPrepare, greaterEach, greaterReverse, type RootInput } from "../../concepts/57-binary-search-trees/more";

export type Input = RootInput;
export const example = greaterExample;
export const fields = greaterFields;
export const prepare = greaterPrepare;
export const approaches = { each: greaterEach, reverse: greaterReverse };

export const growth = measureGrowth(
  [{ approach: greaterEach, slot: 1 }, { approach: greaterReverse, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n) }),
  [7, 15, 31, 63, 127],
);
