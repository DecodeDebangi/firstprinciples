import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why sort the queries by m?", options: ["So the allowed numbers only ever grow", "To speed up XOR", "So the answers come out sorted"], answer: 0, why: "Numbers are added, never removed." },
  { q: "The trie is empty when a query comes up. What's its answer?", options: ["−1", "0", "x"], answer: 0, why: "No number is at most m." },
  { q: "What does each query's walk prefer at every bit?", options: ["The bit opposite to x's", "The same bit as x's", "0"], answer: 0, why: "As in Maximum XOR of Two Numbers." },
  { q: "What is this kind of answering called?", options: ["Offline: the queries are reordered to suit the data", "Online", "Greedy"], answer: 0, why: "All the queries are known up front." },
];
