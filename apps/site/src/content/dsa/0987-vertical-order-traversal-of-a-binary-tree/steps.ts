import { measureGrowth } from "@firstprinciples/ui";
import { levelFields, levelPrepare, verticalPerColumn, verticalSort, rightChain, type RootInput } from "../../concepts/09-tree-traversals/levels";

export type Input = RootInput;
export const example: Input = { root: [5, 3, 8, 1, 4, 6, 9] };
export const fields = levelFields;
export const prepare = levelPrepare;
export const approaches = { perColumn: verticalPerColumn, sortOnce: verticalSort };

export const growth = measureGrowth(
  [{ approach: approaches.perColumn, slot: 1 }, { approach: approaches.sortOnce, slot: 3 }],
  (n) => ({ root: rightChain(n) }),
  [4, 8, 16, 32, 64],
);
