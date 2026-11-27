import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does the stack version build before reversing?", options: ["Node first, then children right to left", "Pre-order", "Level order"], answer: 0, why: "Reversing that gives children left to right, then the node." },
  { q: "In what order does the stack version push a node's children 2, 3, 4?", options: ["2, 3, 4", "4, 3, 2", "3, 4, 2"], answer: 0, why: "4 ends on top and is written first, as the mirrored order needs." },
  { q: "What is the post-order of 1 with children 2 and 3, where 2 has child 4?", options: ["[4, 2, 3, 1]", "[1, 2, 4, 3]", "[2, 4, 3, 1]"], answer: 0, why: "Each subtree in full, left to right, and the node last." },
  { q: "Which node is always last in post-order?", options: ["The root", "The leftmost leaf", "The rightmost leaf"], answer: 0, why: "The root comes after everything below it, which is every other node." },
];
