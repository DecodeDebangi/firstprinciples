import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A node holds 4; its left child holds 4 and returned 1. What's its left arm?", options: ["2", "1", "0"], answer: 0, why: "Same value, so the child's arm extends by one edge." },
  { q: "Its right child holds 5. What's its right arm?", options: ["0", "1", "Whatever the child returned"], answer: 0, why: "Different values break the path." },
  { q: "Left arm 2 and right arm 1. What's checked, and what's returned?", options: ["Checks 3, returns 2", "Checks 2, returns 3", "Checks 3, returns 3"], answer: 0, why: "The bend uses both arms; the parent can only continue one." },
  { q: "Is a path of one node length 0 or 1?", options: ["0: it has no edges", "1", "It isn't a path"], answer: 0, why: "Length is counted in edges." },
];
