import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why store words backwards in a trie?", options: ["So questions about endings become questions about beginnings", "To save memory", "So the trie stays balanced"], answer: 0, why: "A trie is good at beginnings; reversing turns endings into beginnings." },
  { q: "Checking whether a word ends at the end of a stream, in which order are the stream's letters read?", options: ["Newest first, going backwards", "Oldest first", "Only the newest"], answer: 0, why: "The reversed words start with their last letter." },
  { q: "In a trie of reversed words, a word ends partway down another word's path. What does that mean?", options: ["It is an ending of that longer word", "It is a beginning of that longer word", "Nothing"], answer: 0, why: "Reversed, its letters are the longer word's last ones." },
  { q: "How can one trie answer \"starts with p and ends with s\"?", options: ["Store keys like ending#word and walk s#p", "Store every word twice", "It can't"], answer: 0, why: "The key puts the ending first, so both conditions become one prefix." },
];
