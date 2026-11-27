import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What does a rotation change?", options: ["Which node is on top of a small subtree; the left-to-right order stays the same", "The values in the nodes", "The order of the values"], answer: 0, why: "Only three links move, and every node keeps its place in the sorted order." },
  { q: "A node's left subtree has height 3 and its right has height 1. What is its balance?", options: ["+2: unbalanced", "+1: fine", "−2: unbalanced"], answer: 0, why: "Left height minus right height: 3 − 1 = 2." },
  { q: "A node is 2 taller on the left, and the new value went left of its left child. What fixes it?", options: ["One right rotation at the node", "A left rotation at the left child, then a right rotation at the node", "Nothing"], answer: 0, why: "That's the straight left-left case: lift the left child." },
  { q: "The new value went right of the left child instead. What fixes it?", options: ["A left rotation at the left child, then a right rotation at the node", "One right rotation at the node", "One left rotation at the node"], answer: 0, why: "First straighten the bend, then it's the left-left case." },
  { q: "You insert 1, 2, 3, …, n in order. How tall does each tree get?", options: ["Plain BST: n. AVL: about log₂ n", "Both about log₂ n", "Both n"], answer: 0, why: "Sorted input makes a plain BST a chain; the AVL tree rotates to stay short." },
];
