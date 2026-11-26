import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why can a BST drop the # markers?", options: ["The order rule says where each value must go", "BSTs never have missing children", "Its values are unique"], answer: 0, why: "Given the values in pre-order, there's only one place each can go." },
  { q: "Rebuilding, what range must the root's right subtree fall in?", options: ["Between the root's value and ∞", "Between −∞ and the root's value", "Anything"], answer: 0, why: "Everything on the right is bigger than the root." },
  { q: "The next value is outside the current subtree's range. What happens?", options: ["The subtree is empty; the value is placed higher up", "The value is skipped", "The input is invalid"], answer: 0, why: "A caller with a wider range will take it." },
  { q: "How many tokens does the compact form write for n nodes?", options: ["n", "2n + 1", "n + 1"], answer: 0, why: "Just the values, with no markers for the n + 1 empty child slots." },
];
