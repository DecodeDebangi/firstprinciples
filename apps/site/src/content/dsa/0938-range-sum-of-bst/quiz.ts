import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Range 5 to 9, at node 3. Which side can hold values in range?", options: ["Only the right", "Only the left", "Both"], answer: 0, why: "Everything on 3's left is smaller than 3." },
  { q: "Range 5 to 9, at node 10. Which side?", options: ["Only the left", "Only the right", "Neither"], answer: 0, why: "Everything on 10's right is bigger than 10." },
  { q: "Range 5 to 9, at node 8. Which sides?", options: ["Both, after adding 8", "Neither", "Only the right"], answer: 0, why: "8 is in range, and values on both sides could be too." },
  { q: "What does m stand for in O(h + m)?", options: ["How many values are in range", "The tree's height", "The number of leaves"], answer: 0, why: "Those nodes must all be visited to be added." },
];
