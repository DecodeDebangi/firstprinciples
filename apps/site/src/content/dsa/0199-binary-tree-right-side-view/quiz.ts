import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Is a left child ever visible from the right?", options: ["Yes, when nothing else on its level is to its right", "Never", "Only at the root"], answer: 0, why: "In the example, 2 is a left child but the only node on its level." },
  { q: "In the breadth-first walk, which node of a level is recorded?", options: ["The last one taken", "The first one taken", "The largest one"], answer: 0, why: "Nodes leave the queue left to right, so the last one is the rightmost." },
  { q: "Why read the queue's length at the start of each level?", options: ["It's exactly how many nodes the level has", "To sort the level", "To find the root"], answer: 0, why: "Children added while the level is taken belong to the next level." },
  { q: "A depth-first alternative visits right before left. When does it record a node?", options: ["The first time it reaches a new depth", "At every leaf", "When it backtracks"], answer: 0, why: "Going right first, the first node reached at each depth is the rightmost one." },
];
