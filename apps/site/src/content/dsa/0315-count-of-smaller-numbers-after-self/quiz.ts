import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why walk from the right?", options: ["Then the numbers after nums[i] are exactly the ones already seen", "It's faster to sort", "The answer list is filled backwards"], answer: 0, why: "Everything seen so far lies to the right of the current position." },
  { q: "Why replace values by their ranks?", options: ["So the tree has one slot per distinct value, whatever the values are", "To sort them", "So equal values differ"], answer: 0, why: "Ranks run from 1 to the number of distinct values, even for negative or huge numbers." },
  { q: "nums[i] has rank r. Which prefix gives out[i]?", options: ["prefix(r − 1)", "prefix(r)", "prefix(r + 1)"], answer: 0, why: "Only strictly smaller values count, so ranks 1 to r − 1." },
  { q: "What does the Fenwick version cost?", options: ["O(n log n)", "O(n²)", "O(n)"], answer: 0, why: "Sorting, then O(log n) per number." },
];
