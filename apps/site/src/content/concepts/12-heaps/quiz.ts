import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "In a heap stored as an array, where are the children of index 3?", options: ["7 and 8", "6 and 7", "4 and 5"], answer: 0, why: "Children of i are at 2i + 1 and 2i + 2: 7 and 8." },
  { q: "Where does a newly pushed item first go?", options: ["At the end of the array", "At the top", "Next to the equal value"], answer: 0, why: "The end is the next free leaf, which keeps the tree complete. Then it sifts up." },
  { q: "During pop, which item fills the empty top?", options: ["The last item in the array", "The smaller child of the root", "The largest item"], answer: 0, why: "Moving the last leaf keeps the shape complete. Then it sinks down to its place." },
  { q: "What does building a heap with heapify cost, compared with n pushes?", options: ["O(n) vs O(n log n)", "Both O(n log n)", "O(log n) vs O(n)"], answer: 0, why: "Most nodes are near the bottom and sink only a level or two, so the total work is linear." },
  { q: "Python's heapq is a min-heap. How do you get the largest item first?", options: ["Push negated values, and negate on the way out", "Call heapq.reverse()", "Pop from the end of the list"], answer: 0, why: "The most negative stored value is the largest original one." },
];
