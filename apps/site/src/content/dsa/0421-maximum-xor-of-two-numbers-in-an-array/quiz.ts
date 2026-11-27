import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does the walk start at the highest bit?", options: ["That bit outweighs all lower bits of the XOR", "It's the first one stored", "Lower bits don't matter at all"], answer: 0, why: "2^b > 2^(b−1) + … + 1." },
  { q: "At a bit where x has 0, which child is preferred?", options: ["1", "0", "Either"], answer: 0, why: "Different bits make a 1 in the XOR." },
  { q: "What is 3 xor 12?", options: ["15", "9", "0"], answer: 0, why: "0011 xor 1100 = 1111." },
  { q: "How long does one number's walk take?", options: ["O(B) steps", "O(n) steps", "O(1)"], answer: 0, why: "One step per bit." },
];
