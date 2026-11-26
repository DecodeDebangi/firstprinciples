import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does a leaf report?", options: ["needs", "camera", "covered"], answer: 0, why: "Nothing below watches it, and it shouldn't hold a camera itself." },
  { q: "A node's children report needs and covered. What does it do?", options: ["Take a camera", "Report covered", "Report needs"], answer: 0, why: "Only a camera here can watch the needy child." },
  { q: "A node's children report camera and covered. What does it report?", options: ["covered", "needs", "camera"], answer: 0, why: "The child's camera watches it." },
  { q: "What does a missing child count as?", options: ["covered", "needs", "camera"], answer: 0, why: "There's nothing there to watch." },
];
