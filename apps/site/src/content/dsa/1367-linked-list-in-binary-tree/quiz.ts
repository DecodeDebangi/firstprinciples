import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Where can the matching path start?", options: ["At any node in the tree", "Only at the root", "Only at a leaf"], answer: 0, why: "The list may appear along any downward chain, starting anywhere." },
  { q: "While matching from a start node, the next tree value differs from the next list value. What happens?", options: ["That attempt fails; try another start", "Skip that tree node and continue", "The answer is false"], answer: 0, why: "The path must follow consecutive children, so one mismatch ends that attempt, not the whole search." },
  { q: "Must the matched path reach a leaf?", options: ["No: it can stop once the list runs out", "Yes, it must end at a leaf", "Only if the list is long"], answer: 0, why: "As soon as every list value is matched, the answer is true." },
  { q: "Why can trying a match from every node be faster than listing every root-to-leaf path?", options: ["Most attempts fail after a value or two", "It visits fewer nodes in the worst case", "It never backtracks"], answer: 0, why: "Listing paths copies every path in full; trying each start usually stops within a step or two." },
];
