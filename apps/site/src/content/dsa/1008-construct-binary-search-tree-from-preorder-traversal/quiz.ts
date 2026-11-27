import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In pre-order, what comes right after a node?", options: ["Its left subtree, then its right subtree", "Its right subtree", "Its parent"], answer: 0, why: "Node, left, right." },
  { q: "What bound does a node pass to its left subtree?", options: ["Its own value", "Its parent's bound", "Infinity"], answer: 0, why: "Everything on its left is smaller than it." },
  { q: "What bound does a node pass to its right subtree?", options: ["Its own bound, from its parent", "Its own value", "Zero"], answer: 0, why: "Values on its right are bigger than it but must stay below its own limit." },
  { q: "Why can inserting one by one be O(n²)?", options: ["An increasing list makes a chain, and each insert walks all of it", "Pre-order is unsorted", "It sorts first"], answer: 0, why: "1 + 2 + … + n steps." },
];
