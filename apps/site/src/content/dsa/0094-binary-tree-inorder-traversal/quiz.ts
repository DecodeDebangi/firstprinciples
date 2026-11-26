import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In in-order, when is a node written down?", options: ["After its left subtree, before its right one", "As soon as it's reached", "After both subtrees"], answer: 0, why: "In-order is left, node, right." },
  { q: "Iteratively, what does the walk do first from a node?", options: ["Push it and keep going left until there's no left child", "Write it down", "Push its right child"], answer: 0, why: "Everything on the left comes first, so the path down the left is saved on the stack." },
  { q: "After popping and writing a node, where does the walk go?", options: ["To its right child", "To its parent", "Back to the root"], answer: 0, why: "The node's right subtree comes next in order." },
  { q: "What does in-order give on a binary search tree?", options: ["The values in sorted order", "The values level by level", "The values in insertion order"], answer: 0, why: "Smaller values are on the left and bigger ones on the right, so left, node, right is increasing." },
];
