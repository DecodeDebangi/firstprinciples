import { measureGrowth } from "@firstprinciples/ui";
import { balancedLevelOrder, rightChainBST, recoverExample, recoverFields, recoverPrepare, recoverSort, recoverWalk, type RootInput } from "../../concepts/57-binary-search-trees/more";

export type Input = RootInput;
export const example = recoverExample;
export const fields = recoverFields;
export const prepare = recoverPrepare;
export const approaches = { sort: recoverSort, walk: recoverWalk };

export const growth = measureGrowth(
  [{ approach: recoverSort, slot: 1 }, { approach: recoverWalk, slot: 3 }],
  (n) => { const r = balancedLevelOrder(n); const a = r[0] as number, b = r[r.length - 1] as number; return { root: r.map((x) => (x === a ? b : x === b ? a : x)) }; },
  [7, 15, 31, 63, 127],
);
