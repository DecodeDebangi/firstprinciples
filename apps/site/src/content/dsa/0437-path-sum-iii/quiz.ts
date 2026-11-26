import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A path from just below A down to B adds up to what?", options: ["sum(B) − sum(A), where sum is the running sum from the root", "sum(A) + sum(B)", "sum(B) alone"], answer: 0, why: "Everything from the root to A cancels out." },
  { q: "The running sum here is 10 and the target is 6. Which earlier running sum would make a path?", options: ["4", "16", "6"], answer: 0, why: "10 − 6 = 4: the path after a node with running sum 4 adds up to 6." },
  { q: "Why does the map start with 0 → 1?", options: ["So paths starting at the root are counted", "To avoid dividing by zero", "It doesn't need to"], answer: 0, why: "A path from the root to B has sum(B), which needs an earlier 'running sum' of 0." },
  { q: "Why remove a node's running sum when its subtrees are done?", options: ["Other branches must only see their own ancestors", "To save memory", "Sums can't repeat"], answer: 0, why: "A path must go straight down, so it can only start at an ancestor." },
];
