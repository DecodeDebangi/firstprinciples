import { measureGrowth } from "@firstprinciples/ui";
import { chain, sum3Example, targetFields, targetPrepare, sum3Every, sum3Prefix, type TargetInput } from "../../concepts/54-tree-recursion/paths";

export type Input = TargetInput;
export const example = sum3Example;
export const fields = targetFields;
export const prepare = targetPrepare;
export const approaches = { every: sum3Every, prefix: sum3Prefix };

/** A chain of n nodes: one long path, the worst case for redoing work at every node. */
export const growth = measureGrowth(
  [{ approach: sum3Every, slot: 1 }, { approach: sum3Prefix, slot: 3 }],
  (n) => ({ root: chain(n, () => 1), target: -1 }),
  [8, 16, 32, 64, 128],
);
