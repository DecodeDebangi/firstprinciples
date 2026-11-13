import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which order writes a node down before either of its subtrees?", options: ["Pre-order", "In-order", "Post-order"], answer: 0, why: "Pre means before: the node, then its left subtree, then its right subtree." },
  { q: "In-order traversal of a binary search tree gives…", options: ["The values in sorted order", "The values level by level", "The root last"], answer: 0, why: "Smaller values are on the left and bigger on the right, so left, node, right walks them in increasing order." },
  { q: "To compute every subtree's height, which order fits?", options: ["Post-order", "Pre-order", "BFS"], answer: 0, why: "A node's height needs both children's heights first, so it's handled after its subtrees." },
  { q: "BFS uses which data structure to decide what to visit next?", options: ["A queue", "A stack", "A hash set"], answer: 0, why: "The oldest discovered node is visited first, which keeps the levels in order." },
  { q: "On a perfectly balanced tree with n nodes, how much extra space does BFS need?", options: ["O(n)", "O(log n)", "O(1)"], answer: 0, why: "The bottom level holds about half the nodes, and they're all in the queue at once." },
];
