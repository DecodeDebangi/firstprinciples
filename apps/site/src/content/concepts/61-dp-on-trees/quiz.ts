import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What makes a tree problem a DP problem?", options: ["A node's best answer is built from its children's best answers", "It uses a table", "It visits nodes level by level"], answer: 0, why: "Subtrees are smaller versions of the same question, and each is solved once on the way up." },
  { q: "In House Robber on a tree, why return two numbers from each node?", options: ["The parent needs the best with the child robbed and with it not robbed", "To count the nodes", "To store the path"], answer: 0, why: "Whether the parent may be robbed depends on whether the child was." },
  { q: "Why is plain recursion slow for House Robber on a tree?", options: ["Grandchildren are asked for their answer again by every path that reaches them", "It visits leaves twice by design", "It sorts values"], answer: 0, why: "Rob-the-node asks the grandchildren, skip-the-node asks the children, who ask the grandchildren again." },
  { q: "In Binary Tree Cameras, why does a leaf never get a camera?", options: ["Its parent's camera watches it and more", "Leaves can't hold cameras", "It's always watched already"], answer: 0, why: "A camera one level up covers the leaf, its siblings and its own parent." },
  { q: "A node whose child reports \"needs\" must do what?", options: ["Hold a camera", "Report needs too", "Report covered"], answer: 0, why: "Only a camera on this node can still watch that child." },
  { q: "What's the usual cost of DP on a tree?", options: ["O(n): one visit per node, O(1) work each", "O(n²)", "O(2^n)"], answer: 0, why: "Each node combines a fixed number of values from its children." },
];
