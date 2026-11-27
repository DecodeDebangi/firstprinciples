import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "When does the trie version give up on a path?", options: ["When the trie has no child for the next board letter", "When it finds a word", "After L steps"], answer: 0, why: "No word starts with that path." },
  { q: "Why remove a word's ✓ after finding it?", options: ["So it isn't reported again from another path", "To save memory", "To stop the search"], answer: 0, why: "Each word goes in the answer once." },
  { q: "Why does the trie version beat one search per word?", options: ["Words with the same beginning share one walk", "It skips the board", "It sorts the words"], answer: 0, why: "The shared part of the path is searched once." },
  { q: "After finding \"dot\", should the search continue from there?", options: ["Yes: a longer word like \"dote\" may follow", "No: a word was found", "Only if the board is large"], answer: 0, why: "Finding a word doesn't end the path." },
];
