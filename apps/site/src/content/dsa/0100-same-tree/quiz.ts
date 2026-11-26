import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "When are two trees the same?", options: ["Same shape and the same value at every position", "Same values in any order", "Same number of nodes"], answer: 0, why: "Each pair of positions must match: both have a node with the same value, or both have nothing." },
  { q: "One tree has a node where the other has nothing. What should the comparison return?", options: ["false: the shapes differ", "true, if the values seen so far match", "Skip that position"], answer: 0, why: "A missing child in only one tree means a different shape." },
  { q: "Why can comparing node by node finish early while writing both trees out can't?", options: ["It returns false at the first mismatch", "It visits fewer nodes when the trees match", "It doesn't look at values"], answer: 0, why: "Writing both out always walks both trees fully; the node-by-node walk stops at the first difference." },
  { q: "Two identical trees of n nodes: how much work does the node-by-node comparison do?", options: ["O(n): every pair is checked once", "O(n²)", "O(log n)"], answer: 0, why: "Nothing stops early when the trees match, so each of the n pairs is compared once." },
];
