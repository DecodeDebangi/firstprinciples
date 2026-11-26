import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which node has no parent?", options: ["The root", "Every leaf", "The deepest node"], answer: 0, why: "Every other node has exactly one parent; the root is where the tree starts." },
  { q: "What is a leaf?", options: ["A node with no children", "A node with one child", "The last node in the list"], answer: 0, why: "Both its left and right are none." },
  { q: "A node's children have heights 2 and 3. What is the node's height?", options: ["4", "3", "6"], answer: 0, why: "One more than the taller side: 1 + max(2, 3)." },
  { q: "In the list [5, null, 8], where is 8?", options: ["5's right child", "5's left child", "Nowhere: null ends the tree"], answer: 0, why: "Position 1 is 5's left spot (empty), and position 2 is its right spot." },
  { q: "Why are a missing node's children never written in the list?", options: ["A missing node can't have children, so there are no spots to fill", "To keep the list sorted", "They're written as two more nulls"], answer: 0, why: "Only real nodes join the queue and get child spots." },
  { q: "How many nodes can a binary tree of height 3 hold at most?", options: ["7", "6", "9"], answer: 0, why: "1 + 2 + 4: each level holds twice as many as the one above." },
];
