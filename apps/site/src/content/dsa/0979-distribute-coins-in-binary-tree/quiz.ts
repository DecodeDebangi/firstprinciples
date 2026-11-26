import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A leaf holds 3 coins. What does it report?", options: ["+2", "+3", "−1"], answer: 0, why: "It keeps one and sends two up." },
  { q: "A leaf holds 0 coins. What does it report, and how many moves is that?", options: ["−1, one move", "0, no moves", "+1, one move"], answer: 0, why: "It needs one coin to come down its edge." },
  { q: "Why is the answer the sum of the absolute excesses?", options: ["Each unit of excess must cross that edge exactly once", "It's a convention", "Coins move two at a time"], answer: 0, why: "Moving a coin back and forth would only waste moves." },
  { q: "What does the root report?", options: ["0", "n", "1"], answer: 0, why: "There are exactly n coins for n nodes." },
];
