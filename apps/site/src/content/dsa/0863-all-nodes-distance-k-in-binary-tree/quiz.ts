import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What's at distance 0?", options: ["The target itself", "Its children", "Nothing"], answer: 0, why: "Zero edges away is the starting node." },
  { q: "From 6, which node is at distance 1 going up?", options: ["Its parent, 3", "The root", "Its sibling"], answer: 0, why: "One edge up is the parent." },
  { q: "Why is a seen set needed?", options: ["Edges can be walked both ways now", "To sort the answer", "It isn't"], answer: 0, why: "Without it, the search would bounce between a node and its parent." },
  { q: "What does one walk from the root record?", options: ["Each node's parent", "Each node's depth only", "The answer"], answer: 0, why: "That's the missing link that makes the tree a graph." },
];
