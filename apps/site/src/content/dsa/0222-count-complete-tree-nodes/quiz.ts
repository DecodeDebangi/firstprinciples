import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Both edges of a subtree pass 4 nodes. How many nodes does it hold?", options: ["15", "16", "8"], answer: 0, why: "Four full levels: 1 + 2 + 4 + 8 = 2^4 − 1." },
  { q: "Why can at most one child of a node be imperfect?", options: ["The last level fills from the left, so the gap is in only one place", "Complete trees are perfect", "The left child is always bigger"], answer: 0, why: "Everything left of the gap is full and everything right of it is one level shorter but full too." },
  { q: "Why is the fast version O(log² n)?", options: ["About log n splits, each walking two paths of about log n", "It sorts the nodes", "It visits half the nodes"], answer: 0, why: "One split per level, and each split walks the two edges." },
  { q: "For which trees does this shortcut give a correct count?", options: ["Complete trees", "Any binary tree", "Only perfect trees"], answer: 0, why: "Equal edges prove a perfect subtree only when there can't be gaps in the middle." },
];
