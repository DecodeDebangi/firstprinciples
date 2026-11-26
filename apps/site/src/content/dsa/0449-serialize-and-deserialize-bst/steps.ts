import { bstSerialExample, bstSerialPrepare, compact, preorder, serialFields } from "../../concepts/60-serializing-trees/steps";
import type { TreeInput } from "../../concepts/54-tree-recursion/steps";

export type Input = TreeInput;
export const example = bstSerialExample;
export const fields = serialFields;
export const prepare = bstSerialPrepare;
export const approaches = { preorder, compact };
