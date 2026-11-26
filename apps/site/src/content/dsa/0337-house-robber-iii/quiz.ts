import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A child reports (robbed 6, skipped 1). If its parent is robbed, which number counts?", options: ["1", "6", "Either"], answer: 0, why: "The child can't be robbed too, so use its skipped number." },
  { q: "If the parent is skipped, which number counts for that child?", options: ["6, the larger", "1", "0"], answer: 0, why: "With the parent skipped, the child may do whichever is better." },
  { q: "Why is plain recursion exponential on a chain?", options: ["Each node's answer is recomputed by every path that reaches it", "It robs every house", "It uses a queue"], answer: 0, why: "Skip asks the child; rob asks the grandchild, which the child also asks." },
  { q: "What does an empty child report?", options: ["(0, 0)", "(−∞, 0)", "Nothing"], answer: 0, why: "No houses, no money either way." },
];
