import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In post-order, when is a node written down?", options: ["After both of its subtrees", "Before its subtrees", "Between them"], answer: 0, why: "Post-order is left, right, node." },
  { q: "Which order, reversed, gives post-order?", options: ["Node, right, left", "Node, left, right", "Left, node, right"], answer: 0, why: "Reversing node, right, left gives left, right, node." },
  { q: "What is post-order used for?", options: ["Answers that need the children's answers first, like heights or freeing a tree", "Getting a BST's values sorted", "Copying a tree top-down"], answer: 0, why: "A node can combine its children's results only after both are done." },
  { q: "In the swap trick, which child is pushed first?", options: ["The left child, so the right one is popped first", "The right child", "Neither: only one is pushed"], answer: 0, why: "To write node, right, left, the right child must come out of the stack before the left." },
];
