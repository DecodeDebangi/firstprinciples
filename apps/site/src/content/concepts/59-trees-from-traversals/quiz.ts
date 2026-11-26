import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why isn't one traversal enough to rebuild a binary tree?", options: ["Different trees can share the same order", "It doesn't list every value", "It loses the root"], answer: 0, why: "For example, a root with one child on the left and a root with one child on the right have the same pre-order." },
  { q: "Given pre-order and in-order, which value is the root of the whole tree?", options: ["The first value of the pre-order", "The first value of the in-order", "The middle value of the in-order"], answer: 0, why: "Pre-order writes each node before its subtrees, so the root comes first." },
  { q: "The root sits at position 3 of the in-order list of 7 values. How many nodes are in its left subtree?", options: ["3", "4", "Can't tell"], answer: 0, why: "Everything before the root in in-order is in its left subtree: positions 0, 1 and 2." },
  { q: "With in-order and post-order, why build the right subtree before the left?", options: ["Reading post-order from the end gives the root, then the right subtree's roots", "The right subtree is smaller", "It doesn't matter"], answer: 0, why: "Post-order is left, right, root, so backwards it's root, right, left." },
  { q: "Why does a map of positions make the rebuild O(n)?", options: ["Each root's split point is found in O(1) instead of by scanning", "It sorts the values", "It skips half the nodes"], answer: 0, why: "Without it, scanning for each root can cost O(n) per node on a lopsided tree." },
  { q: "When can pre-order and post-order not pin down one tree?", options: ["When a node has exactly one child: left or right can't be told apart", "When the tree is balanced", "Never"], answer: 0, why: "Both orders list a lone child right next to its parent either way; only in-order would show the side." },
];
