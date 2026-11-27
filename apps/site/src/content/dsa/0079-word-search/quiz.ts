import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why mark a cell while it's on the path?", options: ["So the same cell isn't used twice in one path", "To speed up the next search", "To count cells"], answer: 0, why: "Each cell may appear at most once per path." },
  { q: "Why unmark it when backing out?", options: ["Other paths are allowed to use it", "To free memory", "It isn't needed"], answer: 0, why: "The mark only means 'on this path'." },
  { q: "A path's second letter is wrong. What does backtracking do?", options: ["Drops it and tries the next direction", "Builds it out to full length first", "Restarts from the first cell"], answer: 0, why: "No longer path can fix a wrong beginning." },
  { q: "Which moves are allowed?", options: ["Up, down, left, right", "Any of the 8 neighbours", "Any cell"], answer: 0, why: "Diagonals aren't neighbours here." },
];
