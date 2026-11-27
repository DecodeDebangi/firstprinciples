import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why remember each position's sentences?", options: ["The rest from a position is the same however you got there", "To sort them", "To save memory"], answer: 0, why: "Reached twice, worked out once." },
  { q: "What does build(length(s)) return?", options: ["[\"\"]: one empty sentence", "[]: none", "s"], answer: 0, why: "An empty rest can be cut in exactly one way." },
  { q: "Why can the answer still take exponential time?", options: ["The number of sentences itself can be exponential", "The trie is slow", "The memo is too big"], answer: 0, why: "Writing out the answer can't be avoided." },
  { q: "What does the trie walk from position i find?", options: ["Every dictionary word that starts at i", "The longest word only", "The whole sentence"], answer: 0, why: "Each ✓ reached is one such word." },
];
