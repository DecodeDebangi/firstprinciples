import { levels, preorder, serialExample, serialFields, serialPrepare } from "../../concepts/60-serializing-trees/steps";
import type { TreeInput } from "../../concepts/54-tree-recursion/steps";

export type Input = TreeInput;
export const example = serialExample;
export const fields = serialFields;
export const prepare = serialPrepare;
export const approaches = { levels, preorder };
