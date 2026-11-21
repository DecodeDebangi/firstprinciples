import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "In grid[r][c], what does r pick?", options: ["The row", "The column", "The cell's number in reading order"], answer: 0, why: "A grid is a list of rows, so the first index picks a row and the second picks a value within it." },
  { q: "A grid has 3 rows and 5 columns. What are m, n and the number of cells?", options: ["m = 3, n = 5, 15 cells", "m = 5, n = 3, 15 cells", "m = 3, n = 5, 8 cells"], answer: 0, why: "m counts rows and n counts columns; there are m · n cells." },
  { q: "In a grid with 4 columns, what is the reading-order number of the cell at row 2, column 1?", options: ["9", "6", "7"], answer: 0, why: "Two full rows of 4 come before it, then 1 more: 2 · 4 + 1 = 9." },
  { q: "Which cell is one step left of (2, 0)?", options: ["None: (2, −1) is off the grid", "(1, 0)", "(2, 1)"], answer: 0, why: "Left subtracts 1 from the column, giving −1, and columns start at 0. The bounds check skips it." },
  { q: "How many neighbours (up, down, left, right) does a corner cell have?", options: ["2", "3", "4"], answer: 0, why: "Two of its four directions lead off the grid." },
  { q: "Transposing in place, why does the inner loop start at c = r + 1?", options: ["So each pair across the diagonal swaps exactly once", "Because column 0 never changes", "To skip the last row"], answer: 0, why: "Visiting both (r, c) and (c, r) would swap the pair twice and undo it, and diagonal cells stay where they are." },
  { q: "In a 9 × 9 board split into 3 × 3 boxes, which box is the cell (4, 7) in?", options: ["5", "4", "7"], answer: 0, why: "floor(4 / 3) · 3 + floor(7 / 3) = 1 · 3 + 2 = 5, counting boxes from 0 in reading order." },
];
