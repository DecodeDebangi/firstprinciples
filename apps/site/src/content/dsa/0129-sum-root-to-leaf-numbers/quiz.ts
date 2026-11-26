import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The number so far is 27 and the next digit is 1. What's the new number?", options: ["271", "28", "127"], answer: 0, why: "Appending a digit means 27 · 10 + 1." },
  { q: "What does a leaf return?", options: ["The number its path spells", "0", "Its own digit"], answer: 0, why: "A leaf finishes its path, so it returns the whole number." },
  { q: "What does a node with children return?", options: ["The sum of what its children return", "Its own number", "The larger child's number"], answer: 0, why: "Each child returns the total of the numbers below it, so the parent adds the two." },
  { q: "Why is carrying the number down O(n)?", options: ["Each node does O(1) work once", "It skips half the nodes", "It sorts the paths"], answer: 0, why: "No path is stored or read twice." },
];
