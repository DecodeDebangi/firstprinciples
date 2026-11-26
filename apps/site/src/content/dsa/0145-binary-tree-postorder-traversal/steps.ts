import { type Approach } from "@firstprinciples/ui";
import { approaches as read, fields as readFields, prepare as readPrepare, type Input as ReadInput } from "../../concepts/09-tree-traversals/steps";
import { iterative } from "../../concepts/09-tree-traversals/iterative";

export type Input = ReadInput;
export const example: Input = { root: [5, 3, 8, 1, 4, null, 9, null, 2] };
export const fields = readFields;
export const prepare = readPrepare;

const recursive: Approach<Input> = { ...read.postorder, id: "recursive", name: "Recursive" };
export const approaches = { recursive, iterative: iterative("post") };
