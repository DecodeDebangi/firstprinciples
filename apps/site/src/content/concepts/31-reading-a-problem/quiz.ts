import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A problem says n can be up to 100,000. Which approach is fast enough?", options: ["O(n log n)", "O(n²)", "O(2ⁿ)"], answer: 0, why: "100,000 × 17 is under 2 million steps; 100,000² is 10 billion, far over the roughly 100 million that run in a second." },
  { q: "A problem says n is at most 20. Which approach could still be fine?", options: ["Trying every subset: O(2ⁿ)", "Trying every ordering: O(n!)", "None: 20 is too big for anything slow"], answer: 0, why: "2²⁰ is about a million, easily fast enough; 20! is about 2 × 10¹⁸." },
  { q: "Roughly how many simple steps does a computer do in a second?", options: ["About 100 million", "About 1,000", "About 10¹⁸"], answer: 0, why: "It's a rough rule, but 10⁸ per second is the usual estimate for judging whether an approach is fast enough." },
  { q: "Which four things should you find in a problem statement before solving it?", options: ["The input, the output, the rules and the limits", "The title, the difficulty, the tags and the examples", "The language, the libraries, the speed and the memory"], answer: 0, why: "Together they define exactly what's being asked and how fast the answer must be." },
  { q: "A problem says \"the array is sorted\". What does that often hint at?", options: ["Binary search or two pointers", "Backtracking", "A heap"], answer: 0, why: "Order lets you discard half the array at once, or move two pointers inwards." },
  { q: "The limits say values can be up to 10⁹. What should you watch out for?", options: ["Sums that overflow a 32-bit int", "Strings that are too long", "Negative indices"], answer: 0, why: "Two values near 10⁹ add up to about 2 × 10⁹, close to or past the 32-bit limit of about 2.1 billion." },
];
