import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "If the left subtree has depth 3 and the right has depth 5, what is the tree's depth?", options: ["6", "5", "8"], answer: 0, why: "The deeper side plus 1 for the root: max(3, 5) + 1 = 6." },
  { q: "What is the depth of an empty tree?", options: ["0", "1", "−1"], answer: 0, why: "There are no nodes on any path, so the depth is 0; this is where the recursion stops." },
  { q: "Counted level by level, how is the depth found?", options: ["Count how many levels the queue goes through", "Count the leaves", "Count every node"], answer: 0, why: "Each pass over a full level adds one, so the number of levels is the depth." },
  { q: "Which takes extra memory proportional to the tree's height?", options: ["The recursive, depth-first walk", "The queue, level by level", "Neither"], answer: 0, why: "Recursion keeps one call per level of the path it's on; the queue instead holds up to a whole level." },
];
