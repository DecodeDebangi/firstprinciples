import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Looking for 5, you're at a node holding 9. Which subtree can you skip?", options: ["The right one: everything there is bigger than 9", "The left one", "Neither"], answer: 0, why: "5 < 9, so 5 can only be on 9's left." },
  { q: "How many nodes does following the order look at?", options: ["At most one per level: the tree's height", "Half of them", "All of them"], answer: 0, why: "Each comparison moves one level down, so it walks a single path: O(h)." },
  { q: "When is checking every node as fast as following the order?", options: ["Never in general: it ignores the order and can read all n nodes", "Always", "When the value is the root's"], answer: 0, why: "Apart from lucky cases, checking every node is O(n), while one path is O(h)." },
  { q: "What should the search return when the value isn't there?", options: ["none", "The closest value", "The root"], answer: 0, why: "The problem asks for the node holding the value, or nothing when there is none." },
];
