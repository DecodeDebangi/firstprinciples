import { naryRecursive, naryStack, naryExample, naryFields, naryPrepare, type NaryInput } from "../../concepts/09-tree-traversals/nary";

export type Input = NaryInput;
export const example = naryExample;
export const fields = naryFields;
export const prepare = naryPrepare;
export const approaches = { recursive: naryRecursive("pre"), stack: naryStack("pre") };
