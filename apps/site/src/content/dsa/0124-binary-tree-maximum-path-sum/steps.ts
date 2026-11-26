import { measureGrowth } from "@firstprinciples/ui";
import { chain, maxExample, rootFields, rootPrepare, maxEvery, maxOnce, type RootInput } from "../../concepts/54-tree-recursion/paths";

export type Input = RootInput;
export const example = maxExample;
export const fields = rootFields;
export const prepare = rootPrepare;
export const approaches = { every: maxEvery, once: maxOnce };

/** A chain of n nodes: one long path, the worst case for redoing work at every node. */
export const growth = measureGrowth(
  [{ approach: maxEvery, slot: 1 }, { approach: maxOnce, slot: 3 }],
  (n) => ({ root: chain(n) }),
  [8, 16, 32, 64, 128],
);
