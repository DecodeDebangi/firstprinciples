import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, tsExample, tsFields, tsPrepare, tsSearch, tsPointers, type TargetInput } from "../../concepts/57-binary-search-trees/more";

export type Input = TargetInput;
export const example = tsExample;
export const fields = tsFields;
export const prepare = tsPrepare;
export const approaches = { search: tsSearch, pointers: tsPointers };

export const growth = measureGrowth(
  [{ approach: tsSearch, slot: 1 }, { approach: tsPointers, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), target: -1 }),
  [7, 15, 31, 63, 127],
);
