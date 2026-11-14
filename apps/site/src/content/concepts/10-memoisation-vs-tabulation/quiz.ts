import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why is the plain recursive ways(n) slow?", options: ["It solves the same subproblems many times", "Addition is slow", "It uses a table"], answer: 0, why: "ways(n − 2) is computed both directly and inside ways(n − 1), and the repetition compounds down the tree." },
  { q: "What does adding a memo change?", options: ["Each subproblem is computed once: exponential becomes O(n)", "Nothing: it only saves memory", "It removes the base cases"], answer: 0, why: "Later calls for the same m return the saved answer, so whole branches of the call tree are never made." },
  { q: "In the bottom-up table, why fill dp from left to right?", options: ["Each entry needs the ones before it", "Arrays only grow to the right", "It's faster than right to left for any problem"], answer: 0, why: "dp[i] reads dp[i − 1] and dp[i − 2], so they must already be filled." },
  { q: "Merge sort splits a problem into smaller ones. Why isn't it DP?", options: ["Its subproblems don't overlap", "It doesn't use recursion", "It's too fast"], answer: 0, why: "Each half is a different, independent subarray, so there's nothing to reuse." },
  { q: "A DP table has n × m cells, and filling each one takes O(1). What's the total time?", options: ["O(n·m)", "O(n + m)", "O(2ⁿ)"], answer: 0, why: "Time is the number of cells times the work per cell: n × m × O(1)." },
];
