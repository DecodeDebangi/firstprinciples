import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What comes right after 1 in dictionary order for n = 23?", options: ["10", "2", "11"], answer: 0, why: "1's first child." },
  { q: "What comes right after 19 for n = 23?", options: ["2", "20", "110"], answer: 0, why: "190 > 23 and 19 ends in 9, so back up to 1, then on to 2." },
  { q: "How does the walk go down a level?", options: ["Multiply by 10", "Add 1", "Divide by 10"], answer: 0, why: "x's first child is 10x." },
  { q: "How much extra memory does the walk need?", options: ["O(1): just cur", "O(n)", "O(D)"], answer: 0, why: "The tree is never built." },
];
