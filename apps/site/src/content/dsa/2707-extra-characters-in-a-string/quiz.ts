import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What is dp[n], past the end of s?", options: ["0: nothing is left", "1", "n"], answer: 0, why: "An empty rest has no spare letters." },
  { q: "Why go from the end?", options: ["dp[i] uses the answers to its right", "Strings are read backwards", "To find longer words"], answer: 0, why: "Each answer is built from later ones." },
  { q: "What stops a trie walk from position i?", options: ["No child for the next letter of s", "Finding a word", "Reaching the middle"], answer: 0, why: "No dictionary word continues that way." },
  { q: "Why is the set version slower?", options: ["It copies every piece to look it up, even hopeless ones", "Sets are unordered", "It checks fewer pieces"], answer: 0, why: "The trie walk stops early and copies nothing." },
];
