import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Pre-order is [6, 2, 1, 4, 3, 9, 7]. Which value is the root?", options: ["6", "1", "7"], answer: 0, why: "Pre-order writes each node before its subtrees, so the root comes first." },
  { q: "In-order is [1, 2, 3, 4, 6, 7, 9] and the root is 6. Which values are in its left subtree?", options: ["1, 2, 3, 4", "7, 9", "1, 2"], answer: 0, why: "Everything before the root in in-order is on its left." },
  { q: "After placing a root, which pre-order value is the next root to place?", options: ["The next one in the list: the root of the left subtree", "The last one", "The root of the right subtree"], answer: 0, why: "Pre-order is node, left, right, so the left subtree's root follows immediately." },
  { q: "What makes the map version O(n)?", options: ["Finding each root's in-order position in O(1)", "Sorting the lists", "Skipping leaves"], answer: 0, why: "Scanning instead costs up to n per root on a lopsided tree: O(n\u00b2)." },
];
