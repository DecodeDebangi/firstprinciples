import { rootFields, perfectPrepare, perfectExample, nextBfs, nextPerfect, type RootInput } from "../../concepts/54-tree-recursion/reshape";

export type Input = RootInput;
export const example = perfectExample;
export const fields = rootFields;
export const prepare = perfectPrepare;
export const approaches = { queue: nextBfs, links: nextPerfect };
