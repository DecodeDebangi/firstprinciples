import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, trimExample, rangeFields, rangePrepare, trimInsert, trimRec, type RangeInput } from "../../concepts/57-binary-search-trees/more";

export type Input = RangeInput;
export const example = trimExample;
export const fields = rangeFields;
export const prepare = rangePrepare;
export const approaches = { reinsert: trimInsert, trim: trimRec };

export const growth = measureGrowth(
  [{ approach: trimInsert, slot: 1 }, { approach: trimRec, slot: 3 }],
  (n) => ({ root: rightChainBST(n), low: 1, high: n }),
  [7, 15, 31, 63, 127],
);
