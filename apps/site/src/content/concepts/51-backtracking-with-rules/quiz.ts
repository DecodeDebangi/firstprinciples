import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "The input [2, 1, 2] is searched with the plain subsets template. Why does [1, 2] come out twice?", options: ["The search treats the two 2s as different items", "The undo step is missing", "The list wasn't copied when recorded"], answer: 0, why: "One branch picks 1 with the first 2, another picks 1 with the second 2: the same values, built twice." },
  { q: "In the skip rule `if i > start and nums[i] = nums[i - 1]: continue`, what must be true of nums?", options: ["It's sorted, so equal values sit side by side", "It has no repeated values", "It's in its original order"], answer: 0, why: "The rule only compares neighbours, so every repeat must be next to its equal." },
  { q: "With the skip rule, can a subset still contain the same value twice, like [2, 2]?", options: ["Yes: the rule only skips equal values at the same depth", "No: the rule removes every second copy", "Only if the 2s weren't sorted"], answer: 0, why: "Each 2 is picked at a different depth, so neither is skipped." },
  { q: "For n copies of the same number, how many calls does the skip rule make to list the distinct subsets?", options: ["n + 1", "2ⁿ", "n²"], answer: 0, why: "There are n + 1 distinct subsets (zero to n copies), and every call records a new one." },
  { q: "In N-Queens, which value is the same for every square on a diagonal running down to the right?", options: ["row - col", "row + col", "row × col"], answer: 0, why: "Moving down-right adds 1 to both row and column, so their difference doesn't change." },
];
