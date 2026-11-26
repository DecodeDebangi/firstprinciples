import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In-order on a BST gives the values in what order?", options: ["Smallest to largest", "Level by level", "Largest to smallest"], answer: 0, why: "Left subtree, node, right subtree: everything smaller comes first." },
  { q: "With k = 3, how many values does the stopping walk pop?", options: ["3", "All of them", "h"], answer: 0, why: "It stops at the third pop." },
  { q: "What does the stack hold at any moment?", options: ["Nodes on the current path whose left side is still being read", "Every value read", "Only leaves"], answer: 0, why: "That's at most one node per level." },
  { q: "For a tree you query many times with changing k, what helps?", options: ["Storing each node's subtree size, to choose a side directly", "Sorting the tree", "Nothing helps"], answer: 0, why: "With sizes, each query walks one path: O(h)." },
];
