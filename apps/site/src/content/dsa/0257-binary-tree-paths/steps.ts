import { measureGrowth } from "@firstprinciples/ui";
import { chain, pathsExample, rootFields, rootPrepare, pathsCopy, pathsShared, type RootInput } from "../../concepts/54-tree-recursion/paths";

export type Input = RootInput;
export const example = pathsExample;
export const fields = rootFields;
export const prepare = rootPrepare;
export const approaches = { copy: pathsCopy, shared: pathsShared };

/** A chain of n nodes: one long path, the worst case for redoing work at every node. */
export const growth = measureGrowth(
  [{ approach: pathsCopy, slot: 1 }, { approach: pathsShared, slot: 3 }],
  (n) => ({ root: chain(n) }),
  [8, 16, 32, 64, 128],
);
