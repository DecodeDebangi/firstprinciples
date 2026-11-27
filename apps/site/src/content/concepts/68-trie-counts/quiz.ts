import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What does a node's count mean?", options: ["How many stored words start with the letters on the path to it", "How many children it has", "How deep it is"], answer: 0, why: "Every word passing through the node starts with that path." },
  { q: "How long does counting the words with a prefix of length p take?", options: ["O(p), whatever the number of words", "O(number of words)", "O(total letters stored)"], answer: 0, why: "Walk p letters and read one count." },
  { q: "Deleting a word, a node's count drops to 0. What happens to it?", options: ["It and everything below it are removed", "It stays, marked empty", "Its parent is removed"], answer: 0, why: "No other word uses it, so nothing below it is needed either." },
  { q: "You delete \"car\" while \"cart\" is stored. What changes?", options: ["The counts on c-a-r drop by 1 and the ✓ on r goes; no node is removed", "c, a and r are removed", "Nothing"], answer: 0, why: "\"cart\" still uses every node on the path." },
  { q: "Why is a trie cheaper than a map of every prefix?", options: ["Shared prefixes are stored once, one node per letter, instead of copying every prefix as its own key", "Tries use no memory", "Maps can't store strings"], answer: 0, why: "A word of length L has L prefixes, and copying them all costs about L²/2 letters." },
];
