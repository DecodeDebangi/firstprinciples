import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "a = [7, 3, 9, 4, 6]. What is a[1]?", options: ["3", "7", "9"], answer: 0, why: "Indices start at 0, so a[0] is 7 and a[1] is the second value, 3." },
  { q: "An array has length 8. Which index does its last value have?", options: ["7", "8", "It depends on the values"], answer: 0, why: "Counting from 0, eight values use indices 0 to 7: always length - 1." },
  { q: "Reading a[500] from an array of 1,000 values takes how long, compared with a[0]?", options: ["The same: the computer jumps straight there", "500 times longer", "Twice as long"], answer: 0, why: "An array finds any index directly, without walking past the earlier boxes." },
  { q: "To find the biggest value in an unsorted array, how many values must you look at?", options: ["All of them", "Half of them", "Just the first and last"], answer: 0, why: "Any value you skip could be the biggest, so every one has to be checked." },
  { q: "What is an off-by-one error?", options: ["A loop or index that goes one step too far or stops one step short", "Adding 1 to the wrong variable", "A value that is 1 instead of 0"], answer: 0, why: "The edges are where indices go wrong: one past the end, or missing the first or last box." },
];
