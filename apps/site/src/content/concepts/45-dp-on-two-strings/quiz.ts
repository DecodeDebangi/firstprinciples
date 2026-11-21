import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Is \"ct\" a subsequence of \"cart\"?", options: ["Yes: c and t appear in that order, with letters skipped", "No: the letters aren't next to each other", "No: it's too short"], answer: 0, why: "A subsequence keeps the order but may skip letters, unlike a substring." },
  { q: "In a table for two strings, what does dp[i][j] usually describe?", options: ["The answer for the first i letters of a and the first j letters of b", "The i-th letter of a and the j-th of b only", "The whole of both strings"], answer: 0, why: "Each cell is a smaller version of the problem: a prefix of each string." },
  { q: "Why does the table have an extra row and column 0?", options: ["They stand for \"no letters yet\", the base cases", "To store the lengths", "To make it square"], answer: 0, why: "With an empty prefix on either side the answer is known, which starts the table off." },
  { q: "For the longest common subsequence, a[i − 1] = b[j − 1] and dp[i − 1][j − 1] = 2. What is dp[i][j]?", options: ["3", "2", "max of the cells above and to the left"], answer: 0, why: "A matching pair extends the best subsequence of the two shorter prefixes by one." },
  { q: "For the longest common subsequence, the letters differ, the cell above is 2 and the cell to the left is 3. What is dp[i][j]?", options: ["3", "2", "5"], answer: 0, why: "One of the two letters must be left out, so take the better of the two options." },
  { q: "What does filling the table for words of lengths m and n cost?", options: ["O(m · n)", "O(2^m)", "O(m + n)"], answer: 0, why: "There are (m + 1)(n + 1) cells, each filled in constant time." },
];
