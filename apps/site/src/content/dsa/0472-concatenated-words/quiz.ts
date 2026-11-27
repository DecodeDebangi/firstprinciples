import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why sort the words by length?", options: ["A word can only be made of shorter words", "Tries need sorted input", "To remove duplicates"], answer: 0, why: "When a word is checked, every word it could use is already in the trie." },
  { q: "What does marking position j mean?", options: ["The first j letters can be cut into listed words", "Letter j is in the trie", "The word is j letters long"], answer: 0, why: "A run of cuts can land there." },
  { q: "From one reachable position, how are the next positions found?", options: ["One trie walk, marking after every word that ends", "Checking every word in the list", "Trying every cut and its rest"], answer: 0, why: "The trie finds all words starting there at once." },
  { q: "Why is the recursion exponential here?", options: ["The same tail is split again for every way of cutting the front", "Tries are slow", "Words are long"], answer: 0, why: "The trie version checks each position once." },
];
