import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What does binary search need from a yes/no question over positions 0 … n − 1?", options: ["The answers run no…no, yes…yes, never switching back", "The positions hold sorted numbers", "Exactly half the answers are yes"], answer: 0, why: "Then one check in the middle tells you which half the switch is in." },
  { q: "Searching for the first yes, the middle says yes. What changes?", options: ["hi becomes mid: the first yes is here or to the left", "lo becomes mid + 1", "The search stops"], answer: 0, why: "mid itself might be the first yes, so it stays in the range [lo, hi)." },
  { q: "Searching for the first yes, the middle says no. What changes?", options: ["lo becomes mid + 1", "hi becomes mid", "hi becomes mid − 1"], answer: 0, why: "Everything up to mid is no, so the first yes is strictly to the right." },
  { q: "Speeds 1 to 1000 are possible, and checking one speed costs n steps. What does searching for the slowest working speed cost?", options: ["O(n log 1000)", "O(1000 · n)", "O(log n)"], answer: 0, why: "About log₂ 1000 ≈ 10 checks, each costing n." },
  { q: "Why can you binary-search on a speed?", options: ["Any speed above one that works also works", "Speeds are whole numbers", "The piles are sorted"], answer: 0, why: "That makes \"fast enough?\" a no…no, yes…yes question over the speeds." },
  { q: "What is ⌈7 / 2⌉?", options: ["4", "3", "3.5"], answer: 0, why: "Divide and round up: a pile of 7 eaten 2 at a time takes 4 hours." },
];
