import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Picking non-neighbours for the biggest sum, with dp[i] the best from positions 0 to i. What are the two options at position i?", options: ["Skip it (dp[i − 1]) or take it (nums[i] + dp[i − 2])", "Take it (nums[i] + dp[i − 1]) or skip it (dp[i − 2])", "Always take it"], answer: 0, why: "Taking i rules out i − 1, so it builds on dp[i − 2]; skipping keeps the best up to i − 1." },
  { q: "dp[i] is the longest increasing run ending exactly at i. Where is the final answer?", options: ["The largest value in dp", "dp[n − 1]", "dp[0]"], answer: 0, why: "The best run can end at any position, so check them all." },
  { q: "nums is 2, 5, 3, 7 and dp so far is 1, 2, 2. What is dp[3], the longest increasing run ending at 7?", options: ["3", "4", "2"], answer: 0, why: "7 can follow 2, 5 or 3; the best of their dp values is 2, plus 1 for 7 itself." },
  { q: "Each dp[i] reads only dp[i − 1] and dp[i − 2]. How much space does the DP really need?", options: ["O(1): keep the last two values", "O(n)", "O(n²)"], answer: 0, why: "Nothing older than two steps back is ever read again." },
  { q: "Which check catches a recurrence that reads a value before it's been filled in?", options: ["The fill order", "The base cases", "Counting the options"], answer: 0, why: "Every value dp[i] uses must already be computed when dp[i] is filled." },
];
