import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why are the words stored reversed?", options: ["So the stream can be read from its newest letter", "To save memory", "To sort them"], answer: 0, why: "The newest letter is every matching word's last letter." },
  { q: "When does the backwards walk stop with false?", options: ["The trie has no child for the next letter", "After one letter", "When the stream is empty"], answer: 0, why: "No word ends with those letters." },
  { q: "How many letters can one check read at most?", options: ["As many as the longest word has", "The whole stream", "One"], answer: 0, why: "The reversed words are no deeper than that." },
  { q: "Words at, sea; the stream is s, e, a. Is the answer after 'a' true?", options: ["Yes: \"sea\" ends there", "No", "Only if \"at\" is complete"], answer: 0, why: "Reading backwards, a, e, s reaches the ✓ of \"sea\"." },
];
