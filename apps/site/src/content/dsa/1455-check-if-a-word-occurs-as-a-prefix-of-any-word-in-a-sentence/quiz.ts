import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In \"the cat sat on a catalog\", which word is first to start with \"cat\"?", options: ["Word 2, \"cat\"", "Word 6, \"catalog\"", "Word 1"], answer: 0, why: "Return the first match." },
  { q: "What resets the matched count?", options: ["A space: a new word begins", "A mismatch", "Nothing"], answer: 0, why: "Each word starts matching from scratch." },
  { q: "A word's second letter doesn't match. What happens to the rest of it?", options: ["It's ignored until the next space", "Matching restarts at that letter", "The search ends"], answer: 0, why: "That word can't start with the search word." },
  { q: "How much extra memory does the one-pass version use?", options: ["O(1)", "O(n)", "O(number of words)"], answer: 0, why: "Just two counters." },
];
