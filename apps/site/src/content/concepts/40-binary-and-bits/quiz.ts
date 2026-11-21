import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What is 1011 in binary as an ordinary number?", options: ["11", "13", "1011"], answer: 0, why: "8 + 0 + 2 + 1: the places are worth 8, 4, 2 and 1." },
  { q: "What is the last bit of an odd number?", options: ["1", "0", "It depends on the number"], answer: 0, why: "The last place is worth 1, and every other place is even, so odd numbers need a 1 there." },
  { q: "What is 12 & 10 (1100 & 1010)?", options: ["8", "14", "6"], answer: 0, why: "Only the 8s place has a 1 in both: 1000." },
  { q: "What is 12 xor 10?", options: ["6", "14", "8"], answer: 0, why: "The places where exactly one has a 1 are the 4s and the 2s: 0110." },
  { q: "What does x << 1 do to a number?", options: ["Doubles it", "Halves it", "Adds 1"], answer: 0, why: "Every bit moves to a place worth twice as much." },
  { q: "What is x xor x, for any x?", options: ["0", "x", "2x"], answer: 0, why: "Every place has two equal bits, and XOR gives 0 for equal bits." },
];
