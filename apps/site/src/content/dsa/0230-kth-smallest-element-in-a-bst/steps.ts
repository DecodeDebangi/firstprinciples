import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, kExample, kFields, kPrepare, kList, kStack, type KInput } from "../../concepts/57-binary-search-trees/more";

export type Input = KInput;
export const example = kExample;
export const fields = kFields;
export const prepare = kPrepare;
export const approaches = { list: kList, stop: kStack };

export const growth = measureGrowth(
  [{ approach: kList, slot: 1 }, { approach: kStack, slot: 3 }],
  (n) => ({ root: balancedLevelOrder(n), k: 1 }),
  [7, 15, 31, 63, 127],
);
