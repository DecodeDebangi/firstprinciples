import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The start is a leaf with only a parent. What's infected at minute 1?", options: ["Its parent", "Every node", "Nothing new"], answer: 0, why: "Each minute reaches every neighbour one edge away." },
  { q: "What does the answer equal?", options: ["The distance from the start to the farthest node", "The tree's height", "The number of nodes"], answer: 0, why: "The last node infected is the farthest one." },
  { q: "Why record parents first?", options: ["So the spread can go up as well as down", "To sort the nodes", "To find the root"], answer: 0, why: "Tree nodes only link to their children." },
  { q: "If the tree is a single node, what's the answer?", options: ["0", "1", "−1"], answer: 0, why: "It's infected at minute 0, and nothing else is left." },
];
