import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, rangeSumExample, rangeFields, rangePrepare, rangeAll, rangePrune, type RangeInput } from "../../concepts/57-binary-search-trees/more";

export type Input = RangeInput;
export const example = rangeSumExample;
export const fields = rangeFields;
export const prepare = rangePrepare;
export const approaches = { all: rangeAll, prune: rangePrune };

export const growth = measureGrowth(
  [{ approach: rangeAll, slot: 1 }, { approach: rangePrune, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), low: 2 * n + 1, high: 2 * n + 5 }),
  [7, 15, 31, 63, 127],
);
