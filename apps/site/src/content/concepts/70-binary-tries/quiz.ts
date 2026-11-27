import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why are bits stored highest first?", options: ["The highest bit where two numbers differ decides most of their XOR", "To save memory", "Because numbers are read left to right"], answer: 0, why: "A higher bit is worth more than all the lower bits together." },
  { q: "x has a 1 in the current bit. Which child does the best-partner walk prefer?", options: ["0, so this bit of the XOR is 1", "1", "Either"], answer: 0, why: "XOR is 1 where the bits differ." },
  { q: "Why is taking the opposite bit whenever possible always right?", options: ["One higher bit outweighs every lower bit combined", "It's a guess that usually works", "Because the trie is balanced"], answer: 0, why: "2^b is bigger than 2^(b−1) + … + 1." },
  { q: "How long does one best-partner walk take?", options: ["O(B), the number of bits", "O(n)", "O(n · B)"], answer: 0, why: "One step per bit, however many numbers are stored." },
  { q: "Queries only allow numbers up to a limit m. What makes a trie work for all of them?", options: ["Answer them in order of m, adding numbers to the trie as m grows", "Build a new trie per query", "Delete numbers above m"], answer: 0, why: "Numbers are only ever added, never removed." },
];
