import { measureGrowth } from "@firstprinciples/ui";
import { levelFields, widthPrepare, widthNumbers, widthSlots, legs, type RootInput } from "../../concepts/09-tree-traversals/levels";

export type Input = RootInput;
export const example: Input = { root: [4, 2, 6, 1, null, null, 7, null, 3, 5] };
export const fields = levelFields;
export const prepare = widthPrepare;
export const approaches = { slots: widthSlots, numbers: widthNumbers };

export const growth = measureGrowth(
  [{ approach: approaches.slots, slot: 1 }, { approach: approaches.numbers, slot: 3 }],
  (n) => ({ root: legs(n) }),
  [3, 5, 7, 9, 11],
);
