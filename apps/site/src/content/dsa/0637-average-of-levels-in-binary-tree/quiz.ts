import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A level holds 1, 4 and 9. What's its average?", options: ["4.67", "4", "14"], answer: 0, why: "(1 + 4 + 9) / 3 = 14 / 3." },
  { q: "Where does the count to divide by come from?", options: ["The queue's length when the level starts", "The number of leaves", "The tree's height"], answer: 0, why: "At that moment the queue holds exactly that level." },
  { q: "Why is one walk per level slower?", options: ["Each walk passes through every level above it again", "It visits fewer nodes", "It needs sorting"], answer: 0, why: "Summing depth d walks d levels again." },
  { q: "How much memory does the breadth-first walk need?", options: ["O(w): the widest level", "O(1)", "O(n²)"], answer: 0, why: "The queue never holds more than about one level." },
];
