import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, distExample, distFields, distPrepare, distPaths, distBfs, type StartInput } from "../../concepts/62-trees-as-graphs/steps";

export type Input = StartInput;
export const example = distExample;
export const fields = distFields;
export const prepare = distPrepare;
export const approaches = { paths: distPaths, bfs: distBfs };

export const growth = measureGrowth(
  [{ approach: distPaths, slot: 1 }, { approach: distBfs, slot: 3 }],
  (n) => ({ root: chainOf(Array.from({ length: n }, (_, i) => i + 1)), start: n, k: 1 }),
  [8, 16, 32, 64, 128],
);
