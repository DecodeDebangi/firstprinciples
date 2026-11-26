import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "When is a tree balanced here?", options: ["At every node, the two subtree heights differ by at most 1", "Only at the root, the heights differ by at most 1", "Every leaf is at the same depth"], answer: 0, why: "The rule must hold at every node, not just the root." },
  { q: "Why is checking each node and measuring heights from scratch slow?", options: ["The same subtrees are measured again and again", "It checks too few nodes", "It needs a queue"], answer: 0, why: "Each node's height is recomputed for every ancestor above it." },
  { q: "In the bottom-up approach, what does a call return for an unbalanced subtree?", options: ["−1, so every caller above can stop", "Its height as usual", "0"], answer: 0, why: "−1 isn't a real height, so it works as a signal that travels up and ends the check." },
  { q: "Left subtree height 2, right subtree height 4. What does this node return?", options: ["−1: they differ by 2", "5", "3"], answer: 0, why: "The difference is more than 1, so this node is unbalanced and returns −1." },
];
