import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Which key does a query with prefix \"ma\" and suffix \"le\" walk?", options: ["\"le#ma\"", "\"ma#le\"", "\"male\""], answer: 0, why: "Ending first, then a #, then the beginning." },
  { q: "Why does each node keep the largest index?", options: ["The query wants the last matching word", "To save memory", "To sort the words"], answer: 0, why: "Inserting in order and overwriting leaves the largest." },
  { q: "How many keys does a word of length L add?", options: ["L + 1, one per ending including the empty one", "1", "2L"], answer: 0, why: "Endings of length 0 to L." },
  { q: "What does building cost per word?", options: ["O(L²)", "O(L)", "O(1)"], answer: 0, why: "L + 1 keys of up to 2L + 1 letters." },
];
