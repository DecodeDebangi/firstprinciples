import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does a node's total hold?", options: ["The sum of values of all keys passing through it", "The value of one key", "The number of keys"], answer: 0, why: "Every key starting with that path adds its value there." },
  { q: "cat was 3 and is inserted again with 1. What is added along its path?", options: ["−2", "+1", "+4"], answer: 0, why: "The new value minus the old: 1 − 3." },
  { q: "How long does sum(prefix) take with the trie?", options: ["O(length of the prefix)", "O(number of keys)", "O(total letters)"], answer: 0, why: "Walk the prefix and read one total." },
  { q: "sum(\"zz\") where no key starts with zz returns…", options: ["0", "The total of everything", "An error"], answer: 0, why: "The walk falls off the trie." },
];
