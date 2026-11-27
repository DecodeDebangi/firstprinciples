import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why are prefix sums slow for this problem?", options: ["A set changes every total after its position", "Sums need a loop", "They use too much memory"], answer: 0, why: "pre[k] includes every earlier value, so one change spreads to all later totals." },
  { q: "A segment tree node lies completely inside the query range. What does the query do with it?", options: ["Uses its total and stops", "Visits both children", "Skips it"], answer: 0, why: "Its total already counts every position under it." },
  { q: "How many nodes does a set change?", options: ["One per level: about log n", "All of them", "Just the leaf"], answer: 0, why: "Only the blocks that contain the changed position." },
  { q: "How many nodes does a segment tree over n values have?", options: ["About 2n", "About n log n", "Exactly n"], answer: 0, why: "n leaves plus n − 1 nodes above them." },
];
