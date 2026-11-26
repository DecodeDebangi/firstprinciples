import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Target 11. The root is 6 and its child is 3. How much is still needed after 3?", options: ["2", "5", "9"], answer: 0, why: "11 − 6 − 3 = 2." },
  { q: "When is the shared path copied into the answer?", options: ["At a leaf where nothing is still needed", "At every node", "When the sum passes the target"], answer: 0, why: "Only matching root-to-leaf paths belong in the answer." },
  { q: "Why not stop as soon as the running sum exceeds the target?", options: ["Negative values can bring it back down", "It would be correct", "Leaves are always positive"], answer: 0, why: "In [6, 8, -3], the sum passes 11 at 8 and still ends at exactly 11." },
  { q: "Why must a copy be stored, not the shared list?", options: ["The shared list changes as the walk continues", "Copies are faster", "The list is popped to empty"], answer: 0, why: "By the end, the shared list is empty again; only copies keep the paths." },
];
