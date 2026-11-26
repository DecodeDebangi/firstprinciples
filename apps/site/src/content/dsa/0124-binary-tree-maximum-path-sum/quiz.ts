import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A node holding 3 gets gains 5 (left) and 4 (right). What does it return?", options: ["8", "12", "3"], answer: 0, why: "Its parent can only continue through one side: 3 + max(5, 4)." },
  { q: "For the same node, what bending path does it check?", options: ["12: 3 + 5 + 4", "8", "9"], answer: 0, why: "The path that bends here uses both sides." },
  { q: "A child's best gain is −4. What does the parent use for that side?", options: ["0: leave that side out", "−4", "4"], answer: 0, why: "A path doesn't have to go anywhere, so a negative side is skipped." },
  { q: "Why must best start at −∞, not 0?", options: ["The answer can be negative when every value is", "0 is never possible", "It's only a convention"], answer: 0, why: "With all values negative, the best path is the single largest value." },
];
