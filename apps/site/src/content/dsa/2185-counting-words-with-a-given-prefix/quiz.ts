import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Does \"carp\" start with \"car\"?", options: ["Yes", "No"], answer: 0, why: "Its first three letters are c, a, r." },
  { q: "When is the counting trie the better choice?", options: ["When many prefixes are asked about the same words", "Always", "Never"], answer: 0, why: "It's built once and each question is then O(p)." },
  { q: "How many letters does checking one word need at most?", options: ["p, the prefix's length", "The word's length", "1"], answer: 0, why: "After p letters the answer is known." },
  { q: "What does the trie version cost to build?", options: ["Every letter of every word", "Only the prefix", "Nothing"], answer: 0, why: "O(total letters)." },
];
