import { measureGrowth } from "@firstprinciples/ui";
import { buildFrom, chainInput, examples, pairFields, pairPrepare, type PairInput } from "../../concepts/59-trees-from-traversals/steps";

/** a = inorder, b = postorder. */
export type Input = PairInput;
export const example = examples["in-post"];
export const fields = pairFields("in-post");
export const prepare = pairPrepare("in-post");
const scan = buildFrom("in-post", false), map = buildFrom("in-post", true);
export const approaches = { scan, map };

/** A chain leaning left: every scan runs to the end of its range. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: map, slot: 3 }],
  (n) => chainInput("in-post", n),
  [8, 16, 32, 64, 128],
);
