import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "With lo, hi ← 0, length(a) − 1, which loop condition is correct?", options: ["while lo ≤ hi", "while lo < hi", "while hi - lo > 1"], answer: 0, why: "Both ends are included, so a range with one element (lo == hi) is still non-empty and must be checked." },
  { q: "In the half-open template, a[mid] ≥ target. What's the update?", options: ["hi ← mid", "hi ← mid − 1", "lo ← mid"], answer: 0, why: "mid could be the first value ≥ target, so it must stay a candidate: hi ← mid (hi itself is excluded)." },
  { q: "a = [1, 3, 3, 3, 8]. What does the lower bound for target 3 return?", options: ["1", "2", "3"], answer: 0, why: "The first index with a value ≥ 3 is 1." },
  { q: "a = [1, 3, 3, 3, 8]. What does the lower bound for target 5 return?", options: ["4", "-1", "3"], answer: 0, why: "5 isn't there; index 4 (where 8 is) is the first value ≥ 5, which is where 5 would be inserted." },
  { q: "What's the simplest test that a binary search update is safe?", options: ["Every iteration must shrink the range", "lo must always be even", "mid must never equal hi"], answer: 0, why: "If an update can leave lo and hi unchanged, the loop can run forever." },
];
