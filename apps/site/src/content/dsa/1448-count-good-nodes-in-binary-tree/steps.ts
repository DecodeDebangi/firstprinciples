import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, goodExample, rootFields, rootPrepare, goodPaths, goodDown, type RootInput } from "../../concepts/62-trees-as-graphs/steps";

export type Input = RootInput;
export const example = goodExample;
export const fields = rootFields;
export const prepare = rootPrepare;
export const approaches = { paths: goodPaths, down: goodDown };

export const growth = measureGrowth(
  [{ approach: goodPaths, slot: 1 }, { approach: goodDown, slot: 3 }],
  (n) => ({ root: chainOf(Array.from({ length: n }, (_, i) => i + 1)) }),
  [8, 16, 32, 64, 128],
);
