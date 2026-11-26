import { measureGrowth } from "@firstprinciples/ui";
import { buildFrom, chainInput, examples, pairFields, pairPrepare, type PairInput } from "../../concepts/59-trees-from-traversals/steps";

/** a = preorder, b = inorder. */
export type Input = PairInput;
export const example = examples["pre-in"];
export const fields = pairFields("pre-in");
export const prepare = pairPrepare("pre-in");
const scan = buildFrom("pre-in", false), map = buildFrom("pre-in", true);
export const approaches = { scan, map };

/** A chain leaning left: every scan runs to the end of its range. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: map, slot: 3 }],
  (n) => chainInput("pre-in", n),
  [8, 16, 32, 64, 128],
);
