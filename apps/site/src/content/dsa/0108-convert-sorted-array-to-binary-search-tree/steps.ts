import { measureGrowth } from "@firstprinciples/ui";
import { middleCopy, middleIdx, sortedExample, sortedFields, sortedPrepare, type SortedInput } from "../../concepts/58-balanced-trees/steps";

export type Input = SortedInput;
export const example = sortedExample;
export const fields = sortedFields;
export const prepare = sortedPrepare;
export const approaches = { copy: middleCopy, indexes: middleIdx };

/** n sorted values. */
export const growth = measureGrowth(
  [{ approach: middleCopy, slot: 1 }, { approach: middleIdx, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => i) }),
  [16, 32, 64, 128, 256],
);
