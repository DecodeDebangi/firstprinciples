import { measureGrowth } from "@firstprinciples/ui";
import { leftChain, pairExample, pairFields, pairPrepare, subCompare, subIds, type PairInput } from "../../concepts/54-tree-recursion/subtrees";

export type Input = PairInput;
export const example = pairExample;
export const fields = pairFields;
export const prepare = pairPrepare;
export const approaches = { compare: subCompare, ids: subIds };

/** root is a chain of n 1s; subRoot is a chain of n/2 1s ending in a 2, so every comparison runs deep and fails. */
const nearMiss = (k: number) => { const s = leftChain(k); s[s.length - 1] = 2; return s; };
export const growth = measureGrowth(
  [{ approach: subCompare, slot: 1 }, { approach: subIds, slot: 3 }],
  (n) => ({ root: leftChain(n), sub: nearMiss(n / 2) }),
  [8, 16, 32, 64, 128],
);
