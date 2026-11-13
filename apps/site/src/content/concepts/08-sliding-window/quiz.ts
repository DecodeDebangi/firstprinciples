import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A window of size 3 holds [4, 1, 2], summing to 7. It moves right and 6 joins. What's the new sum?", options: ["9", "13", "7"], answer: 0, why: "4 leaves and 6 joins: 7 − 4 + 6 = 9." },
  { q: "Recomputing every window of size k from scratch costs…", options: ["O(n·k)", "O(n)", "O(k)"], answer: 0, why: "There are about n windows, and each one adds up k numbers." },
  { q: "In the grow-and-shrink window, how many times can lo move in total?", options: ["At most n", "Up to n for every value of hi", "Exactly k"], answer: 0, why: "lo only moves right and can't pass the end, so across the whole run it moves at most n times." },
  { q: "For the shortest window with sum ≥ target, when do you record an answer?", options: ["Inside the shrink loop, while the window is still valid", "Only after the loop ends", "Every time hi moves"], answer: 0, why: "Each valid window is a candidate; you record it before shrinking to try a shorter one." },
  { q: "Why does the grow-and-shrink window need positive numbers here?", options: ["So a wider window always has a bigger sum", "So the array can be sorted", "So k stays fixed"], answer: 0, why: "With negatives, adding an item can lower the sum, so shrinking can skip valid answers." },
];
