import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does only a window of the last k values matter for each new value?", options: ["A partner must be at most k positions back", "Older values are always bigger", "The problem only reads k values"], answer: 0, why: "Any value more than k positions away can never pair with the current one, or with anything later." },
  { q: "With the ordered set, which single lookup answers the question for x?", options: ["The smallest value in the window that is at least x − t", "The largest value in the window", "The value at position i − k"], answer: 0, why: "If that value exists and is at most x + t, it's within t of x; if not, nothing in the window is." },
  { q: "With t = 2, buckets are 3 wide. Why does sharing a bucket guarantee a match?", options: ["Two values in one bucket differ by at most 2", "Equal buckets mean equal values", "Buckets hold one value each"], answer: 0, why: "A bucket covers 3 consecutive whole numbers, so any two of them are at most 2 apart." },
  { q: "Why must the neighbouring buckets be checked too?", options: ["Values in adjacent buckets can still be within t of each other", "To clear them", "They never need checking"], answer: 0, why: "For example, with width 3, 5 is in bucket 1 and 6 in bucket 2, yet they differ by 1." },
];
