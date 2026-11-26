import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does the stack hold right after the constructor?", options: ["The path from the root down the left side", "Every node in the tree", "Only the root"], answer: 0, why: "pushLeft follows left children from the root, so the smallest value ends up on top." },
  { q: "next() pops a node that has a right subtree. What is pushed?", options: ["The left path of that right subtree", "The right child only", "Nothing"], answer: 0, why: "The next values in order are in that right subtree, starting from its leftmost node." },
  { q: "How much memory does the stack version use?", options: ["O(h): at most one node per level", "O(n): every value", "O(1)"], answer: 0, why: "The stack only holds one path's worth of nodes waiting to be returned." },
  { q: "Why is next() O(1) on average even though one call can push several nodes?", options: ["Each node is pushed once and popped once over all the calls", "It never pushes more than one node", "The tree is always balanced"], answer: 0, why: "n calls do at most n pushes and n pops in total, so the cost per call averages to O(1)." },
];
