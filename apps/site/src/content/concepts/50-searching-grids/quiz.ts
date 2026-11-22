import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Several cells start a spread at once, and you want each cell's distance to the nearest start. What do you put in the BFS queue first?", options: ["All the starts, at distance 0", "Just one start", "Every cell of the grid"], answer: 0, why: "BFS then grows from all of them together, so each cell is first reached from its nearest start." },
  { q: "Why does BFS give shortest distances on a grid where every move costs 1?", options: ["It reaches every cell at distance d before any at distance d + 1", "It always moves towards the target", "It visits cells in reading order"], answer: 0, why: "The queue holds cells in order of distance, ring by ring." },
  { q: "Measuring the area of an island, why mark a cell \"seen\" when it's pushed, not when it's visited?", options: ["So it can't be pushed twice by two neighbours", "To save memory", "It doesn't matter"], answer: 0, why: "Two land neighbours could both push the same cell before it's visited, and it would be counted twice." },
  { q: "Moves are allowed in all 8 directions, including diagonals. How many neighbours does a middle cell have?", options: ["8", "4", "6"], answer: 0, why: "Up, down, left, right and the four diagonals." },
  { q: "Water flows downhill to the sea, and you want every cell that can reach it. Which way do you search?", options: ["From the sea, moving uphill", "From every cell, downhill", "From the highest cell"], answer: 0, why: "One search from the targets, walking each rule backwards, covers every cell at once." },
  { q: "What does BFS cost on a grid of R rows and C columns?", options: ["O(R · C)", "O((R · C)²)", "O(R + C)"], answer: 0, why: "Each cell enters the queue once and looks at a fixed number of neighbours." },
];
