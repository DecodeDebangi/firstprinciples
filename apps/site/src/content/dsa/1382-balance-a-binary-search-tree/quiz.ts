import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why walk the tree in order first?", options: ["It lists a BST's values sorted", "It's the fastest walk", "It visits the root first"], answer: 0, why: "Left subtree, node, right subtree: smallest to largest." },
  { q: "Building from 1, 2, 3, 4, 5, 6, 7, which value is the root?", options: ["4", "1", "7"], answer: 0, why: "The middle value, so three go on each side." },
  { q: "Why is rebuilding faster than re-inserting into an AVL tree?", options: ["Each value is placed once, with no searching or rotating", "AVL trees are unbalanced", "It skips half the values"], answer: 0, why: "O(n) against O(n log n)." },
  { q: "What is the height of the balanced tree for 7 values?", options: ["3", "4", "7"], answer: 0, why: "A perfect tree of 3 levels holds exactly 7 values." },
];
