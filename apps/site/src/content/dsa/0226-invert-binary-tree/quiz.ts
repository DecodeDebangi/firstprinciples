import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does mirroring the whole tree come down to at one node?", options: ["Swap its left and right children", "Swap its value with its parent's", "Sort its children"], answer: 0, why: "Do that at every node and the whole tree is mirrored." },
  { q: "After swapping a node's children, are the subtrees below already mirrored?", options: ["No: their insides are mirrored when the walk reaches them", "Yes, the swap mirrors everything below", "Only the leaves are"], answer: 0, why: "A swap moves each subtree as a whole; each node inside still needs its own swap." },
  { q: "Does it matter whether nodes are visited depth-first or level by level?", options: ["No: every node needs exactly one swap, in any order", "Yes: only depth-first works", "Yes: only level by level works"], answer: 0, why: "Each swap only touches one node's two children, so any order that visits every node once works." },
  { q: "How many swaps does a tree of n nodes need?", options: ["n, one per node", "n / 2", "n²"], answer: 0, why: "Every node gets its children swapped once: O(n)." },
];
