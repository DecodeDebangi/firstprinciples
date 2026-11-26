import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does the id use the empty children too?", options: ["So two different shapes with the same values get different ids", "To make ids smaller", "It doesn't need to"], answer: 0, why: "Without them, a left-only child and a right-only child would look the same." },
  { q: "Why must both trees share one table?", options: ["So an id means the same subtree in both trees", "To save memory", "So the ids are sorted"], answer: 0, why: "Separate tables would give unrelated numbers." },
  { q: "What makes comparing at every node slow?", options: ["Each node can start a long comparison: O(m · n)", "Recursion is slow", "It sorts the trees"], answer: 0, why: "Chains of equal values make every comparison run deep." },
  { q: "subRoot is [4, 1, 2]. Does a 4 with children 1 and 2, where 2 has a child, match?", options: ["No: the whole subtree must match", "Yes", "Only if the child is none"], answer: 0, why: "The extra child makes it a different subtree." },
];
