import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "For the longest window, when do you shrink it?", options: ["Only when it breaks the rule, until it follows it again", "After every step", "Never: longest windows only grow"], answer: 0, why: "A valid window is a candidate; you only give up its left end when you must." },
  { q: "For the shortest window, when do you shrink it?", options: ["While it still meets the target, recording each length", "Only when it breaks the rule", "Never"], answer: 0, why: "A valid window might still be valid with its first value dropped, so keep trying shorter." },
  { q: "nums = [1, 0, 0, 1, 1] with at most one zero allowed. What's the longest window?", options: ["3", "2", "5"], answer: 0, why: "0, 1, 1 (positions 2 to 4) has one zero and length 3." },
  { q: "Why does the shortest-window method need positive numbers?", options: ["So adding a value never lowers the sum, and dropping one never raises it", "So the answer is positive", "It doesn't"], answer: 0, why: "With negatives, shrinking could raise the sum and growing could lower it, so the window's moves stop being safe." },
  { q: "In a window of length 6 whose most common letter appears 4 times, how many letters must change to make it all one letter?", options: ["2", "4", "6"], answer: 0, why: "Keep the most common letter and change the rest: 6 − 4." },
  { q: "Both pointers only move forward. What does the whole scan cost?", options: ["O(n)", "O(n²)", "O(n log n)"], answer: 0, why: "Each value enters the window once and leaves at most once." },
];
