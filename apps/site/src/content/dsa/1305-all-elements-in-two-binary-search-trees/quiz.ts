import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why walk each tree in order?", options: ["It gives its values sorted", "It's the shortest walk", "It visits the root first"], answer: 0, why: "Left subtree, node, right subtree: smallest first." },
  { q: "The fronts are 4 and 6. Which goes into the answer next?", options: ["4", "6", "Both"], answer: 0, why: "Always the smaller front value." },
  { q: "What does the merge cost?", options: ["O(m + n)", "O((m + n) log(m + n))", "O(m · n)"], answer: 0, why: "Each value is taken once." },
  { q: "One list is used up. What happens to the other?", options: ["Its remaining values are copied to the end", "They're dropped", "It's sorted again"], answer: 0, why: "They're all bigger than everything taken so far." },
];
