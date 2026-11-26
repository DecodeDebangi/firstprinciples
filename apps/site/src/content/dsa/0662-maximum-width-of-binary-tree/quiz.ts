import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A node at position 3 has a right child. What's its position?", options: ["7", "6", "4"], answer: 0, why: "Children of i are at 2i and 2i + 1: 2 · 3 + 1." },
  { q: "A level's nodes are at positions 2 and 7. How wide is it?", options: ["6", "2", "5"], answer: 0, why: "7 − 2 + 1 = 6, counting the empty positions between." },
  { q: "Why can storing every slot be so slow?", options: ["Empty slots double with every level", "It sorts each level", "It visits leaves twice"], answer: 0, why: "A tree 30 levels deep could need about a billion slots, even with few real nodes." },
  { q: "What must be done about the numbers in languages with fixed-size integers?", options: ["Renumber each level from its first position", "Nothing", "Use only odd numbers"], answer: 0, why: "Positions double each level and can overflow on deep trees." },
];
