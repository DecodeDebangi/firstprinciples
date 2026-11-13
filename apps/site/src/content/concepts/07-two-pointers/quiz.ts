import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "a = [1, 3, 5, 8], target 12. lo = 0, hi = 3: 1 + 8 = 9. What's the next move?", options: ["Move lo right", "Move hi left", "Stop: no pair exists"], answer: 0, why: "9 < 12, and 8 is the largest number left, so 1 is too small for every partner." },
  { q: "Why is it safe to drop a[lo] when a[lo] + a[hi] < target?", options: ["a[hi] is the biggest partner left, and even it isn't enough", "a[lo] has already been used", "The array has no duplicates"], answer: 0, why: "Every other partner is smaller than a[hi], so every sum with a[lo] would be smaller still." },
  { q: "What does the both-ends technique need from the input?", options: ["Some order, such as sorted values", "No duplicates", "An even length"], answer: 0, why: "Without order, one comparison tells you nothing about the other pairs." },
  { q: "In the read/write pattern, what's true of everything left of w?", options: ["It's finished: the kept items, in order", "It hasn't been read yet", "It's all duplicates"], answer: 0, why: "w only advances after writing an item worth keeping, so the prefix a[:w] is the answer so far." },
  { q: "Find the longest stretch of a string with no repeated letter. Which technique fits?", options: ["Sliding window", "Both ends", "Sort, then both ends"], answer: 0, why: "You care about everything between the pointers, and the window grows and shrinks as you go." },
];
