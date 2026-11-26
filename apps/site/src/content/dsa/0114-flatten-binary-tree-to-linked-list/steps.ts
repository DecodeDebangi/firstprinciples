import { rootFields, anyPrepare, flatExample, flatList, flatInPlace, type RootInput } from "../../concepts/54-tree-recursion/reshape";

export type Input = RootInput;
export const example = flatExample;
export const fields = rootFields;
export const prepare = anyPrepare;
export const approaches = { list: flatList, inPlace: flatInPlace };
