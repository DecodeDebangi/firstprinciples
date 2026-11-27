import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A node's children are 2, 3 and 4. In which order are they pushed?", options: ["4, 3, 2", "2, 3, 4", "3, 2, 4"], answer: 0, why: "The last one pushed, 2, is popped first, as pre-order needs." },
  { q: "In [1, null, 2, 3, null, 4], whose child is 4?", options: ["2's", "3's", "1's"], answer: 0, why: "After 1's group (2, 3) comes 2's group (4)." },
  { q: "What is the pre-order of 1 with children 2 and 3, where 2 has child 4?", options: ["[1, 2, 4, 3]", "[1, 2, 3, 4]", "[4, 2, 3, 1]"], answer: 0, why: "2's whole subtree comes before 3." },
  { q: "How much time does either version take?", options: ["O(n)", "O(n log n)", "O(n²)"], answer: 0, why: "Every node is visited once." },
];
