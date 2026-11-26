import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "If p is above q in the tree, what is their lowest common ancestor?", options: ["p itself", "p's parent", "The root"], answer: 0, why: "A node counts as part of its own subtree, so p already has both p and q below it." },
  { q: "In the one-pass approach, a node finds p on its left and q on its right. What is it?", options: ["The lowest common ancestor", "Not an ancestor of either", "Only an ancestor of p"], answer: 0, why: "p and q are split across its two sides, so no lower node can have both." },
  { q: "A node finds something only on its left. What does it report upward?", options: ["Whatever its left side reported", "none", "Itself"], answer: 0, why: "The answer, or the one node found so far, lies on that side, so it passes that result up." },
  { q: "Why does comparing the two root-to-node paths find the answer?", options: ["The last node they share is the lowest common ancestor", "The first node they share is the answer", "The longer path holds the answer"], answer: 0, why: "Both paths start at the root and agree until they split; the last shared node is the deepest one above both." },
];
