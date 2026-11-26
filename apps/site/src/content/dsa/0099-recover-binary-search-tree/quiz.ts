import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In order, the values read 1, 12, 4, 6, 9, 3. Where are the drops?", options: ["12 → 4 and 9 → 3", "1 → 12", "Only 9 → 3"], answer: 0, why: "A drop is where a value is smaller than the one before it." },
  { q: "Which two values are swapped?", options: ["12 and 3", "12 and 4", "9 and 3"], answer: 0, why: "The bigger side of the first drop and the smaller side of the last drop." },
  { q: "When is there only one drop?", options: ["When the swapped values are next to each other in order", "Never", "When the root is swapped"], answer: 0, why: "Then both culprits sit at that one drop." },
  { q: "Why not sort to fix it?", options: ["Sorting is O(n log n) and needs O(n) memory; one walk is O(n)", "Sorting changes the shape", "Sorting can't find them"], answer: 0, why: "The drops already identify the culprits." },
];
