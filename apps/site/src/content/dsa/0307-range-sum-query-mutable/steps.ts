import { measureGrowth } from "@firstprinciples/ui";
import { growthInput, prefixApproach, rangeExample, rangeFields, rangePrepare, segApproach, type RangeInput } from "../../concepts/65-range-query-trees/steps";

export type Input = RangeInput;
export const example = rangeExample;
export const fields = rangeFields;
export const prepare = rangePrepare;
export const approaches = { prefix: prefixApproach, segment: segApproach };

/** n values and n operations, half sets and half sums. */
export const growth = measureGrowth(
  [{ approach: prefixApproach, slot: 1 }, { approach: segApproach, slot: 3 }],
  growthInput,
  [8, 16, 32, 64, 128, 256],
);
