import { measureGrowth } from "@firstprinciples/ui";
import { dupExample, dupIds, dupStrings, leftChain, rootFields, rootPrepare, type RootInput } from "../../concepts/54-tree-recursion/subtrees";

export type Input = RootInput;
export const example = dupExample;
export const fields = rootFields;
export const prepare = rootPrepare;
export const approaches = { strings: dupStrings, ids: dupIds };

/** A chain of n equal values: every subtree is a shorter chain, so the written-out texts add up to n² characters. */
export const growth = measureGrowth(
  [{ approach: dupStrings, slot: 1 }, { approach: dupIds, slot: 3 }],
  (n) => ({ root: leftChain(n) }),
  [8, 16, 32, 64, 128],
);
