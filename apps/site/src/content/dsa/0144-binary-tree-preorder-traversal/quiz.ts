import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In pre-order, when is a node written down?", options: ["As soon as it's reached, before its subtrees", "Between its two subtrees", "After both subtrees"], answer: 0, why: "Pre-order is node, left, right." },
  { q: "With a stack, why push the right child before the left?", options: ["So the left child is on top and comes out first", "Because right is smaller", "It doesn't matter"], answer: 0, why: "A stack returns the last thing pushed, so pushing left last makes it next." },
  { q: "What is pre-order used for?", options: ["Copying or saving a tree: every parent comes before its children", "Getting a BST's values sorted", "Freeing a tree from the bottom up"], answer: 0, why: "Rebuilding from pre-order always creates a parent before its children." },
  { q: "How much memory does the stack need?", options: ["O(h): about one waiting node per level, plus pending right children", "Always O(n)", "O(1)"], answer: 0, why: "The stack holds nodes along the current path and the right children waiting beside it." },
];
