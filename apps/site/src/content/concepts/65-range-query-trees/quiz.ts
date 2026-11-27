import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which structure makes range sums O(1) but changes O(n)?", options: ["Prefix sums", "A segment tree", "A Fenwick tree"], answer: 0, why: "Each prefix total includes every earlier value, so one change spreads to all later totals." },
  { q: "In a segment tree, what does a node hold?", options: ["The total of one stretch of positions", "One value of nums", "The sum of all leaves below the root"], answer: 0, why: "The root's stretch is the whole list; each child covers half of its parent's." },
  { q: "What is lowbit(12)?", options: ["4", "2", "8"], answer: 0, why: "12 is 1100 in binary, and its last 1 bit is worth 4." },
  { q: "tree[12] in a Fenwick tree covers which positions?", options: ["9 to 12", "1 to 12", "12 only"], answer: 0, why: "It covers lowbit(12) = 4 positions ending at 12." },
  { q: "When would you pick a segment tree over a Fenwick tree?", options: ["When you need range minimums or other answers that can't be undone by subtracting", "Always: it's faster", "When the list never changes"], answer: 0, why: "A Fenwick tree gets a range by subtracting two prefixes, which works for sums and counts but not for a minimum." },
];
