import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What is the in-order successor of p in a BST?", options: ["The smallest value bigger than p", "p's right child", "p's parent"], answer: 0, why: "Reading in order gives the values sorted, so the next one is the smallest bigger value." },
  { q: "Walking down for p = 7, you reach 10. What happens?", options: ["10 becomes the candidate, and the walk goes left", "The walk goes right", "The answer is 10, stop"], answer: 0, why: "10 is bigger than 7, so it could be the answer; something smaller but still bigger than 7 may be on its left." },
  { q: "Walking down for p = 7, you reach 6. What happens?", options: ["Go right: 6 isn't bigger than 7", "6 becomes the candidate", "Stop: the answer is none"], answer: 0, why: "Anything at 6 or on its left is too small, so the answer can only be on the right." },
  { q: "p is the largest value in the tree. What is returned?", options: ["none", "The root", "p itself"], answer: 0, why: "Nothing is bigger, so the walk never turns left and no candidate is ever set." },
];
