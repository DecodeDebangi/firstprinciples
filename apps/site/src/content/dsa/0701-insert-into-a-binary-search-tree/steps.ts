import { insertExample, insertFields, insertLoop, insertPrepare, insertRecursive, type InsertInput } from "../../concepts/57-binary-search-trees/steps";

export type Input = InsertInput;
export const example = insertExample;
export const fields = insertFields;
export const prepare = insertPrepare;
export const approaches = { recursive: insertRecursive, iterative: insertLoop };
