import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What is the floor of 17 in {5, 10, 12, 15, 18, 20}?", options: ["15", "18", "17"], answer: 0, why: "The largest value that is ≤ 17." },
  { q: "Looking for a floor, the walk meets a value smaller than x. Where can a better answer be?", options: ["In its right subtree", "In its left subtree", "Nowhere"], answer: 0, why: "A better floor is bigger but still ≤ x, and bigger values are to the right." },
  { q: "What does an ordered set do that a hash set can't?", options: ["Find the nearest value above or below x", "Check membership", "Add a value"], answer: 0, why: "A hash set scatters values, so it has no idea which one is next to x." },
  { q: "What do insert, delete and floor cost in a balanced ordered set?", options: ["O(log n) each", "O(1) each", "O(n) each"], answer: 0, why: "Each walks one path down a tree of height about log n." },
  { q: "The values are all known up front and never change. What's simplest?", options: ["Sort once, then binary search", "A balanced BST", "A hash set"], answer: 0, why: "Without inserts or deletes, a sorted array answers floor and ceiling in O(log n) too." },
];
