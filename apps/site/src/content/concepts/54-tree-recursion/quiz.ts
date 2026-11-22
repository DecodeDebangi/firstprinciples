import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "To find each subtree's height, when does a node do its own work?", options: ["After both children have returned", "Before visiting its children", "Only at the leaves"], answer: 0, why: "Its height depends on its children's heights, so it must wait for them: a post-order walk." },
  { q: "To know the sum of the path from the root to each node, how does that sum reach the node?", options: ["Its parent passes it down as an argument", "Its children return it", "It's stored in a global list"], answer: 0, why: "The path above a node is only known to its ancestors, so it travels down with each call." },
  { q: "A node's left subtree has height 3 and its right has height 2. What's the longest path through that node, counted in edges?", options: ["5", "4", "3"], answer: 0, why: "The path goes down 3 edges on one side and 2 on the other: 3 + 2." },
  { q: "In the balanced-tree check, what does returning −1 mean?", options: ["Somewhere below is already unbalanced", "The subtree is empty", "The node is a leaf"], answer: 0, why: "It's a signal passed up unchanged, so no caller wastes time recomputing heights." },
  { q: "What's the extra space for recursion on a tree that is one long chain of n nodes?", options: ["O(n)", "O(log n)", "O(1)"], answer: 0, why: "The recursion goes n calls deep, one per node on the path." },
];
