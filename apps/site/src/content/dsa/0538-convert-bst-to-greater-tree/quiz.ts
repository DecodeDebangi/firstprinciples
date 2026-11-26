import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Which order visits a BST from largest to smallest?", options: ["Right, node, left", "Left, node, right", "Node, left, right"], answer: 0, why: "It's in-order backwards." },
  { q: "The running total is 21 and the next node holds 8. What's its new value?", options: ["29", "21", "8"], answer: 0, why: "Everything bigger is 21; add 8 itself." },
  { q: "What's the new value of the largest node?", options: ["Its own value", "0", "The sum of all values"], answer: 0, why: "Nothing is bigger, so it only adds itself." },
  { q: "Why is summing per node O(n²)?", options: ["Each node reads every value again", "It sorts n times", "It visits leaves twice"], answer: 0, why: "The big values are re-added for every node below them." },
];
