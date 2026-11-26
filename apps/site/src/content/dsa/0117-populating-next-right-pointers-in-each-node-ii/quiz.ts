import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does the perfect-tree trick fail here?", options: ["A neighbouring node may have no left child", "Values can repeat", "Levels aren't sorted"], answer: 0, why: "Gaps mean the next child on the level may be several nodes over." },
  { q: "What does the placeholder head do?", options: ["Gives the first child something to attach to, so no special case", "Stores the level's size", "Marks the root"], answer: 0, why: "Its next ends up pointing at the first node of the level below." },
  { q: "Where does the next level start?", options: ["At the placeholder's next", "At the leftmost node's left child", "At the root"], answer: 0, why: "The leftmost node may have no left child, so that wouldn't work." },
  { q: "How much extra memory does it use?", options: ["O(1)", "O(w)", "O(n)"], answer: 0, why: "Only a few pointers, reused for every level." },
];
