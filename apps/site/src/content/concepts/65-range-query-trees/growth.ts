import { measureGrowth } from "@firstprinciples/ui";
import { growthInput, rangeApproaches } from "./steps";

/** n values and n operations, half sets and half sums. */
export const growth = measureGrowth(
  [{ approach: rangeApproaches.prefix, slot: 1 }, { approach: rangeApproaches.segment, slot: 2 }, { approach: rangeApproaches.fenwick, slot: 3 }],
  growthInput,
  [8, 16, 32, 64, 128, 256],
);
