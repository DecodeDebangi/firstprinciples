import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Post-order is [1, 3, 4, 2, 7, 9, 6]. Which value is the root?", options: ["6, the last one", "1, the first one", "4"], answer: 0, why: "Post-order writes each node after its subtrees, so the root comes last." },
  { q: "Reading post-order from the end, whose roots come right after the tree's root?", options: ["The right subtree's", "The left subtree's", "The leaves'"], answer: 0, why: "Post-order is left, right, root; backwards it's root, right, left." },
  { q: "So which subtree must be built first?", options: ["The right one", "The left one", "Either"], answer: 0, why: "The next roots taken from the end belong to the right subtree." },
  { q: "In-order is [1, 2, 3, 4, 6, 7, 9] and the root is 6. What's in its right subtree?", options: ["7, 9", "1, 2, 3, 4", "9 only"], answer: 0, why: "Everything after the root in in-order is on its right." },
];
