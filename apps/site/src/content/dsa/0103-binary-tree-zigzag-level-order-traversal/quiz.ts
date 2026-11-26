import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Level 1 holds 3 and 8, left to right. How is it written?", options: ["8, 3", "3, 8", "3 only"], answer: 0, why: "Level 1 is read right to left." },
  { q: "Does the queue's order change on right-to-left levels?", options: ["No: only where values are written changes", "Yes: right children go first", "Yes: the queue is reversed"], answer: 0, why: "Changing the queue order would mix up the next level." },
  { q: "On a right-to-left level of size 4, where does the first node taken go?", options: ["Slot 3", "Slot 0", "Slot 1"], answer: 0, why: "size − 1 − 0 = 3." },
  { q: "What does writing into place save?", options: ["The reversing pass", "Memory for the queue", "Visiting leaves"], answer: 0, why: "Both approaches are O(n), but placing directly needs no second pass." },
];
