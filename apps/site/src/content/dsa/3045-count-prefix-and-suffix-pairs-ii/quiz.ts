import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What are the letter pairs of \"abcab\"?", options: ["ab, ba, cc, ba, ab", "ab, bc, ca, ab", "aa, bb, cc"], answer: 0, why: "k-th from the start with k-th from the end." },
  { q: "Why does a shared beginning of pairs mean \"starts and ends\"?", options: ["Matching first letters means it starts it; matching last letters means it ends it", "It doesn't", "Only for palindromes"], answer: 0, why: "Each pair checks one letter at each end." },
  { q: "When is a word added to the trie?", options: ["After counting the earlier words it matches", "Before counting", "At the very end"], answer: 0, why: "So it only counts for later words." },
  { q: "What does each step of a walk add?", options: ["How many earlier words end at that node", "1", "The word's length"], answer: 0, why: "Each such word starts and ends the current one." },
];
