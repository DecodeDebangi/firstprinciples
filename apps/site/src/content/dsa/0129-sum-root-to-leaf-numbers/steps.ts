import { measureGrowth } from "@firstprinciples/ui";
import { chain, digitsExample, rootFields, digitPrepare, digitsCollect, digitsCarry, type RootInput } from "../../concepts/54-tree-recursion/paths";

export type Input = RootInput;
export const example = digitsExample;
export const fields = rootFields;
export const prepare = digitPrepare;
export const approaches = { collect: digitsCollect, carry: digitsCarry };

/** A chain of n nodes: one long path, the worst case for redoing work at every node. */
export const growth = measureGrowth(
  [{ approach: digitsCollect, slot: 1 }, { approach: digitsCarry, slot: 3 }],
  (n) => ({ root: chain(n, () => 1) }),
  [8, 16, 32, 64, 128],
);
