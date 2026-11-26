import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why does a general tree's serialization need a marker like # for missing children?", options: ["Without it, different shapes write the same values", "To mark the root", "To make the string shorter"], answer: 0, why: "The values alone don't say whether a child is on the left or the right, or missing." },
  { q: "A tree has n nodes. How many # markers does pre-order with markers write?", options: ["n + 1", "n", "2n"], answer: 0, why: "Every node has two child slots, 2n in all, and n − 1 of them are real nodes, so n + 1 are empty." },
  { q: "Reading pre-order with markers back, the next token is #. What does that mean?", options: ["The child being built is missing", "The whole tree ends", "The token can be skipped"], answer: 0, why: "Each # stands for exactly one empty child slot, in the same order it was written." },
  { q: "Why can a BST be written with no markers at all?", options: ["The order rule says where each value goes", "BSTs have no missing children", "Its values are sorted"], answer: 0, why: "Reading pre-order back with each subtree's allowed range puts every value in the only place it can go." },
  { q: "Rebuilding a BST, the left subtree of 6 allows values below 6. The next value is 9. What happens?", options: ["6 has no left child; 9 belongs further up", "9 becomes 6's left child", "The input is invalid"], answer: 0, why: "9 is outside the range, so this subtree is empty and 9 is placed by a caller higher up." },
];
