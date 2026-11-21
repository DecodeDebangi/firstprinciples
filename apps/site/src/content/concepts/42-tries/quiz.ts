import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A trie holds \"car\" and \"cat\". How many letter nodes does it have?", options: ["4", "6", "3"], answer: 0, why: "c and a are shared, then r and t branch off: c, a, r, t." },
  { q: "Why does each node need an \"end of word\" mark?", options: ["So a stored word that's also the start of a longer one can be told apart", "To save memory", "To keep the children sorted"], answer: 0, why: "With \"cart\" stored, the path c-a-r exists either way; only the mark says whether \"car\" itself was inserted." },
  { q: "Looking up a word of length L in a trie of n words costs…", options: ["O(L)", "O(n)", "O(n · L)"], answer: 0, why: "One step per letter, however many words are stored." },
  { q: "The trie holds \"cart\" only. What does search(\"car\") return?", options: ["false", "true", "It depends on the order of insertion"], answer: 0, why: "Every letter is found, but the r node isn't marked as the end of a word." },
  { q: "The trie holds \"cart\" only. Does any word start with \"car\"?", options: ["Yes", "No"], answer: 0, why: "A prefix search only needs the path to exist; it ignores the end marks." },
  { q: "When is a trie better than a hash set of the words?", options: ["When you need to ask about prefixes", "When you only check whole words", "When there's a single word"], answer: 0, why: "A set answers \"is this exact word here?\" just as fast, but can't answer \"does any word start with…?\" without checking every word." },
];
