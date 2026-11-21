import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "x is 1100 (12). What is x & (x − 1)?", options: ["1000 (8)", "1011 (11)", "0100 (4)"], answer: 0, why: "x − 1 is 1011. AND keeps only the bits both share: the lowest 1 of x is removed." },
  { q: "How many times does the x & (x − 1) loop run to count the 1s in 10010000?", options: ["2", "8", "4"], answer: 0, why: "Once per 1 bit, and there are two." },
  { q: "x is a positive power of two exactly when…", options: ["x & (x − 1) is 0", "x & 1 is 1", "x xor 1 is 0"], answer: 0, why: "A power of two has a single 1 bit, and removing it leaves 0." },
  { q: "What is 7 xor 4 xor 7?", options: ["4", "7", "0"], answer: 0, why: "The two 7s cancel, because XOR can be done in any order and x xor x = 0." },
  { q: "A list has every value twice except one. How do you find the odd one out in O(1) space?", options: ["XOR all the values together", "Add them all up", "AND all the values together"], answer: 0, why: "Each pair XORs to 0, leaving the value without a partner." },
  { q: "With 3 items, how many different subsets can be described by masks of 3 bits?", options: ["8", "3", "6"], answer: 0, why: "Each item is in or out, one bit each: 2³ = 8 masks, from 000 to 111." },
];
