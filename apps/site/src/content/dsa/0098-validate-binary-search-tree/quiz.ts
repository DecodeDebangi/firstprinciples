import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why isn't comparing each node with its own children enough?", options: ["A value deep in a subtree can break the rule with an ancestor higher up", "Children can be missing", "It takes too long"], answer: 0, why: "In the example, 9 is fine under 6 but sits inside 8's left subtree, where everything must be smaller than 8." },
  { q: "Reading a valid BST in order (left, node, right), what do the values do?", options: ["Strictly increase", "Strictly decrease", "Alternate up and down"], answer: 0, why: "Everything on a node's left is smaller and everything on its right is bigger, so in-order reads them in increasing order." },
  { q: "In the ranges approach, what range does a node's left child get?", options: ["Same lower bound, and the node's value as the new upper bound", "The node's value as the new lower bound", "No bounds at all"], answer: 0, why: "Going left, values must stay below the node, so its value becomes the upper bound; the lower bound passes down unchanged." },
  { q: "Is the tree [2, 2] a valid BST here?", options: ["No: the left side must be strictly smaller", "Yes: equal values may go left", "Only if it has a right child"], answer: 0, why: "This problem needs strictly smaller on the left and strictly bigger on the right." },
];
