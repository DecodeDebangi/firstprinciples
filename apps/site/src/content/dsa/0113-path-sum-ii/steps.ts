import { measureGrowth } from "@firstprinciples/ui";
import { chain, sum2Example, targetFields, targetPrepare, sum2Copy, sum2Shared, type TargetInput } from "../../concepts/54-tree-recursion/paths";

export type Input = TargetInput;
export const example = sum2Example;
export const fields = targetFields;
export const prepare = targetPrepare;
export const approaches = { copy: sum2Copy, shared: sum2Shared };

/** A chain of n nodes: one long path, the worst case for redoing work at every node. */
export const growth = measureGrowth(
  [{ approach: sum2Copy, slot: 1 }, { approach: sum2Shared, slot: 3 }],
  (n) => ({ root: chain(n, () => 1), target: -1 }),
  [8, 16, 32, 64, 128],
);
