import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A function loops over a list of n items, and inside that loop does a binary search over the same list. What's its time complexity?", options: ["O(n)", "O(n log n)", "O(n²)"], answer: 1, why: "n iterations, each doing an O(log n) search: n × log n." },
  { q: "What is O(n² + 5n + 100) simplified?", options: ["O(n²)", "O(n² + n)", "O(5n)"], answer: 0, why: "Keep only the fastest-growing term and drop constants." },
  { q: "An O(n) algorithm takes 2 seconds on 1 million items. Roughly how long on 4 million?", options: ["2 seconds", "8 seconds", "32 seconds"], answer: 1, why: "Linear: 4× the input means about 4× the time." },
  { q: "An O(n²) algorithm takes 2 seconds on 1 million items. Roughly how long on 4 million?", options: ["8 seconds", "16 seconds", "32 seconds"], answer: 2, why: "Quadratic: 4× the input means 4² = 16× the time." },
  { q: "A recursive function calls itself n levels deep but stores nothing else. What's its space complexity?", options: ["O(1)", "O(log n)", "O(n)"], answer: 2, why: "Each waiting call keeps a frame on the call stack: n frames at the deepest point." },
];
