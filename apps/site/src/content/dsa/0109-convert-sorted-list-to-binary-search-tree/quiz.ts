import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why can the tree be built while reading the list front to back?", options: ["Its in-order walk visits values in the list's order", "The list is balanced", "The list has a middle pointer"], answer: 0, why: "Build left part, node, right part, and values arrive in order." },
  { q: "In the in-order build, what is made before a node?", options: ["Its whole left part", "Its right part", "Nothing"], answer: 0, why: "That's what moves the list along to the node's own value." },
  { q: "Why is the slow-and-fast version O(n log n)?", options: ["Each level of recursion walks the list again to find middles", "It sorts the list", "It copies the list"], answer: 0, why: "About n/2 steps per level, log n levels." },
  { q: "What decides the tree's shape in the in-order build?", options: ["The positions lo, mid, hi", "The values", "The list's length only at the root"], answer: 0, why: "The list only supplies values." },
];
