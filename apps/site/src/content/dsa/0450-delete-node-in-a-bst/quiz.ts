import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The node to delete is a leaf. What happens?", options: ["It's simply removed", "Its parent takes its place", "Its successor's value is copied in"], answer: 0, why: "Nothing hangs below a leaf, so there is no hole to fill." },
  { q: "The node to delete has only a left child. What fills its place?", options: ["Its left child, with everything below it", "Its parent", "The smallest value in the tree"], answer: 0, why: "That whole subtree was already on the correct side of the deleted node's parent, so it can move up as it is." },
  { q: "Deleting 3 in [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], which value replaces it?", options: ["4", "1", "6"], answer: 0, why: "3 has two children; the smallest value in its right subtree (6, 4, 7) is 4." },
  { q: "After copying the successor's value up, why is deleting the old successor easy?", options: ["It has no left child, so it's a leaf or has one child", "It is always the root", "It doesn't need deleting"], answer: 0, why: "It is the leftmost node of the right subtree, so nothing can be on its left." },
];
