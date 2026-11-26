import { measureGrowth } from "@firstprinciples/ui";
import { buildFrom, chainInput, examples, pairFields, pairPrepare, type PairInput } from "../../concepts/59-trees-from-traversals/steps";

/** a = preorder, b = postorder. */
export type Input = PairInput;
export const example = examples["pre-post"];
export const fields = pairFields("pre-post");
export const prepare = pairPrepare("pre-post");
const scan = buildFrom("pre-post", false), map = buildFrom("pre-post", true);
export const approaches = { scan, map };

/** A chain leaning left: every scan runs to the end of its range. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: map, slot: 3 }],
  (n) => chainInput("pre-post", n),
  [8, 16, 32, 64, 128],
);
