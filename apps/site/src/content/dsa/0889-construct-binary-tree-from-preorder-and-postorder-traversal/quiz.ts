import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Pre-order is [1, 2, 4, 5, 3, 6, 7]. Which value is the root's left child?", options: ["2, the value right after the root", "3", "7"], answer: 0, why: "Pre-order is node, left, right, so the left subtree's root comes right after." },
  { q: "Post-order is [4, 5, 2, 6, 7, 3, 1] and the left child is 2. Where does the left subtree end?", options: ["At 2's position, 2: positions 0 to 2", "At position 0", "At the end"], answer: 0, why: "In post-order a subtree's own root comes last, so the left subtree is everything up to 2." },
  { q: "Why can there be more than one answer?", options: ["A lone child could be on the left or the right", "Values can repeat", "The root can change"], answer: 0, why: "Pre-order and post-order list a lone child next to its parent either way." },
  { q: "When is the answer unique?", options: ["When every node has zero or two children", "When the tree is balanced", "Always"], answer: 0, why: "Then each node's first child after it in pre-order is always a left child." },
];
