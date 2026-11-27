import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The queue holds 2, 3 and 4 at the start of a round. How many nodes does the round take?", options: ["3", "1", "All nodes in the tree"], answer: 0, why: "Exactly one level: the three nodes queued so far." },
  { q: "In the depth-first version, when is a new level list started?", options: ["When a node's depth equals the number of lists so far", "At every leaf", "When a node has no children"], answer: 0, why: "That node is the first one met at that depth." },
  { q: "Which version needs memory for a whole level at once?", options: ["Breadth-first", "Depth-first", "Neither"], answer: 0, why: "Its queue can hold an entire level." },
  { q: "What is the level order of 1 with children 2 and 3, where 2 has child 4?", options: ["[[1], [2, 3], [4]]", "[[1], [2, 4], [3]]", "[[1, 2, 3, 4]]"], answer: 0, why: "4 is the only node at depth 2." },
];
