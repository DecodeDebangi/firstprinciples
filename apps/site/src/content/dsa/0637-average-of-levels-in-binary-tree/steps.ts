import { measureGrowth } from "@firstprinciples/ui";
import { levelFields, levelPrepare, levelBfs, rewalk, rightChain, type RootInput } from "../../concepts/09-tree-traversals/levels";

export type Input = RootInput;
export const example: Input = { root: [5, 3, 8, 1, 4, null, 9, null, 2] };
export const fields = levelFields;
export const prepare = levelPrepare;
export const approaches = { rewalk: rewalk("avg"), bfs: levelBfs("avg") };

export const growth = measureGrowth(
  [{ approach: approaches.rewalk, slot: 1 }, { approach: approaches.bfs, slot: 3 }],
  (n) => ({ root: rightChain(n) }),
  [4, 8, 16, 32, 64],
);
