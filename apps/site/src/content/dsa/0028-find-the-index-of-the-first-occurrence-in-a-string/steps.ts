import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";
import { findFields, findPrepare, naiveCode, naiveSteps, rollCode, rollSteps, type FindInput } from "../../concepts/38-finding-a-word/steps";

export type Input = FindInput;
export const example: Input = { text: "abcabcabd", p: "cabd" };
export const fields: InputField[] = findFields;
export const prepare: (raw: Input) => Prepared<Input> = findPrepare;

const naive: Approach<Input> = { id: "naive", name: "Try every start", code: naiveCode.replace("function find(", "function strStr("), run(input, t) { naiveSteps(input, t); } };
const rolling: Approach<Input> = { id: "rolling", name: "Rolling hash (Rabin–Karp)", code: rollCode.replace("function rabinKarp(", "function strStr("), run(input, t) { rollSteps(input, t); } };

export const approaches = { naive, rolling };

/** A text of n a's and a word of n / 2 − 1 a's then a b: every start nearly matches. */
export const growth = measureGrowth(
  [{ approach: naive, slot: 1 }, { approach: rolling, slot: 3 }],
  (n) => ({ text: "a".repeat(n), p: "a".repeat(n / 2 - 1) + "b" }),
  [8, 16, 24, 32, 48],
);
