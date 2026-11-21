import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Moving only right or down, the cell above (2, 3) has 6 routes and the cell to its left has 4. How many routes reach (2, 3)?", options: ["10", "24", "6"], answer: 0, why: "Every route arrives from exactly one of the two, so the counts add: 6 + 4." },
  { q: "Why does the top row of the routes table hold 1s?", options: ["Each of its cells can only be reached by moving straight right", "It's the start of the table", "Nothing can reach it"], answer: 0, why: "With moves only right or down, the only way along the top row is a straight line." },
  { q: "In what order must the table be filled?", options: ["So that the cell above and the cell to the left are done first, e.g. row by row, left to right", "Any order", "Bottom row first"], answer: 0, why: "Each cell is built from those two, so they have to be ready." },
  { q: "What does filling an m × n table cost?", options: ["O(m · n) time", "O(2^(m+n)) time", "O(m + n) time"], answer: 0, why: "One constant-time calculation per cell." },
  { q: "Each row only uses the row above it. What does that allow?", options: ["Keeping a single row: O(n) space", "Skipping the first column", "Filling the table backwards"], answer: 0, why: "Overwriting one row in place keeps exactly the values still needed." },
  { q: "Why is plain recursion slow for counting grid routes?", options: ["It works out the same cells again and again", "It visits cells in the wrong order", "It can't reach the bottom row"], answer: 0, why: "Many different routes pass through the same cell, and each one repeats its whole calculation." },
];
