import { measureGrowth } from "@firstprinciples/ui";
import { chainOf, timeExample, timeFields, timePrepare, timePaths, timeBfs, type StartInput } from "../../concepts/62-trees-as-graphs/steps";

export type Input = StartInput;
export const example = timeExample;
export const fields = timeFields;
export const prepare = timePrepare;
export const approaches = { paths: timePaths, bfs: timeBfs };

export const growth = measureGrowth(
  [{ approach: timePaths, slot: 1 }, { approach: timeBfs, slot: 3 }],
  (n) => ({ root: chainOf(Array.from({ length: n }, (_, i) => i + 1)), start: n, k: 0 }),
  [8, 16, 32, 64, 128],
);
