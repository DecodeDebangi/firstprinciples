import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "How many numbers ≤ 23 start with 1?", options: ["11: 1 and 10 to 19", "10", "2"], answer: 0, why: "1 itself, then 10 to 19 (100 is past 23)." },
  { q: "The count for cur is no more than the steps left. What happens?", options: ["Skip all of them: move to cur + 1", "Step inside", "Stop"], answer: 0, why: "The k-th number lies beyond this subtree." },
  { q: "Stepping inside cur, where does the walk go?", options: ["cur × 10", "cur + 1", "cur ÷ 10"], answer: 0, why: "cur's first child." },
  { q: "Why is skipping fast even for a billion?", options: ["Each level needs a few counts of D steps", "It sorts first", "It uses a real trie"], answer: 0, why: "About D² steps instead of k." },
];
