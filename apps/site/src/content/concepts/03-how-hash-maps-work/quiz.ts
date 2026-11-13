import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A hash map has 8 buckets. Which bucket does the key 27 go to (hash(27) = 27)?", options: ["Bucket 3", "Bucket 7", "Bucket 2"], answer: 0, why: "27 % 8 = 3, since 8 × 3 = 24 and 27 − 24 = 3." },
  { q: "Two different keys land in the same bucket. What is this called?", options: ["A collision", "A resize", "A rehash"], answer: 0, why: "A collision: different keys, same index. Chaining or probing handles it." },
  { q: "Why is inserting into a hash map O(1) on average even though resizing costs O(n)?", options: ["Resizes are rare enough to average out", "Resizing happens in the background", "Resizing is actually O(1)"], answer: 0, why: "Doubling means n cheap inserts happen between O(n) resizes, so each insert averages O(1): amortised cost." },
  { q: "In linear probing, why do clusters hurt?", options: ["New keys landing anywhere in a cluster must probe to its end", "They use more memory", "They make the hash function slower"], answer: 0, why: "Every key whose home slot falls inside a cluster has to step past it, and that makes the cluster grow further." },
  { q: "You need the 10 smallest keys out of a collection. Is a hash map a good fit?", options: ["No: it keeps no order", "Yes: lookups are O(1)", "Yes, if it's large enough"], answer: 0, why: "Hash maps spread keys out with no order. A heap or a sorted structure is the right tool." },
];
