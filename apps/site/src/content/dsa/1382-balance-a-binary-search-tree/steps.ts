import { measureGrowth } from "@firstprinciples/ui";
import { bstExample, bstFields, bstPrepare, rebalanceAvl, rebalanceMiddle, rightChain, type BstInput } from "../../concepts/66-avl-trees/steps";

export type Input = BstInput;
export const example = bstExample;
export const fields = bstFields;
export const prepare = bstPrepare;
export const approaches = { avl: rebalanceAvl, middle: rebalanceMiddle };

/** A chain of n values going right: the most unbalanced BST there is. */
export const growth = measureGrowth(
  [{ approach: rebalanceAvl, slot: 1 }, { approach: rebalanceMiddle, slot: 3 }],
  rightChain,
  [8, 16, 32, 64, 128, 256],
);
