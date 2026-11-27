import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does the in-order walk only need to compare neighbours?", options: ["It lists the values sorted, and the closest pair is always adjacent there", "Neighbours are parent and child", "It skips duplicates"], answer: 0, why: "Any value between two others is closer to each of them." },
  { q: "A node's closest value is…", options: ["Its neighbour in sorted order, which may be far away in the tree", "Always its parent", "Always a child"], answer: 0, why: "For example, the smallest value in its right subtree." },
  { q: "What does the pairs approach cost?", options: ["O(n²)", "O(n)", "O(n log n)"], answer: 0, why: "Every pair of values is compared." },
  { q: "In the in-order walk, why is node.val − prev never negative?", options: ["Values come smallest first", "prev is always 0", "The tree has no repeats"], answer: 0, why: "Each value is at least as big as the one before it." },
];
