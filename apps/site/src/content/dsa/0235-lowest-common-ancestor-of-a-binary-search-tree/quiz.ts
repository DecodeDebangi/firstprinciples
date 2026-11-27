import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "p = 4, q = 7, and the walk is at 8. Which way?", options: ["Left: both are smaller than 8", "Right", "Stop: 8 is the answer"], answer: 0, why: "4 and 7 are both below 8, so both are in its left subtree." },
  { q: "p = 4, q = 7, and the walk is at 6. What happens?", options: ["Stop: 6 is the answer", "Go left", "Go right"], answer: 0, why: "4 ≤ 6 ≤ 7: 4 is on 6's left and 7 on its right, so 6 is the lowest node with both below it." },
  { q: "p = 6 and q = 7, where 7 is in 6's right subtree. What is the answer?", options: ["6", "7", "6's parent"], answer: 0, why: "The walk stops at 6 because 6 ≤ 6 ≤ 7; a node counts as its own ancestor." },
  { q: "Why can a BST answer this in O(h) instead of O(n)?", options: ["The values say which side p and q are on, so only one path is walked", "It visits every node faster", "It doesn't need to know p and q"], answer: 0, why: "In a general tree you must search both sides; in a BST, one comparison picks the side." },
  { q: "The recursive split-point walk uses O(h) memory. Why can the loop version use O(1)?", options: ["Each call only returns its child's answer, so nothing needs to be remembered", "The loop visits fewer nodes", "The loop sorts p and q first"], answer: 0, why: "A call that does nothing after its recursive call can be replaced by moving to the child." },
];
