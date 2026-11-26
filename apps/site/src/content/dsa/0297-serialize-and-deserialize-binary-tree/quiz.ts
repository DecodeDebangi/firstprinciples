import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why write # for missing children?", options: ["So the shape can be rebuilt exactly", "To separate values", "To mark the end"], answer: 0, why: "Values alone can't say whether a child is on the left, on the right or missing." },
  { q: "Reading level by level, which tokens become a node's children?", options: ["The next two unread tokens, when that node reaches the front of the queue", "The tokens right after it", "The last two tokens"], answer: 0, why: "Nodes collect children in the same queue order they were written in." },
  { q: "Reading pre-order back, what follows a node's own token?", options: ["Its whole left subtree, then its whole right subtree", "Its two children", "Its parent"], answer: 0, why: "Pre-order writes node, left, right, so reading back recurses the same way." },
  { q: "How long does writing and reading take?", options: ["O(n) each", "O(n log n)", "O(n²)"], answer: 0, why: "Each node and each marker is written once and read once." },
];
