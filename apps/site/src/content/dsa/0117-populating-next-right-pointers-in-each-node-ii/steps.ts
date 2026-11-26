import { rootFields, anyPrepare, anyExample, nextBfs, nextGeneral, type RootInput } from "../../concepts/54-tree-recursion/reshape";

export type Input = RootInput;
export const example = anyExample;
export const fields = rootFields;
export const prepare = anyPrepare;
export const approaches = { queue: nextBfs, links: nextGeneral };
