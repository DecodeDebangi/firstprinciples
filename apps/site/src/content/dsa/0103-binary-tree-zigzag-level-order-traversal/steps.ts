import { levelFields, levelPrepare, zigzag, type RootInput } from "../../concepts/09-tree-traversals/levels";

export type Input = RootInput;
export const example: Input = { root: [5, 3, 8, 1, 4, null, 9, null, 2] };
export const fields = levelFields;
export const prepare = levelPrepare;
export const approaches = { reverse: zigzag(false), place: zigzag(true) };
