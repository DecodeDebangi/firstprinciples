import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "w = \"race\", cut as \"race\" | \"\". Which word would pair as w + x?", options: ["\"ecar\", the reverse of \"race\"", "\"car\"", "\"race\""], answer: 0, why: "The empty right part is a palindrome, so x must be \"race\" reversed." },
  { q: "w = \"ra\", cut as \"r\" | \"a\". Is \"r\" a palindrome?", options: ["Yes: a single letter reads the same both ways", "No", "Only if it's first"], answer: 0, why: "Then \"a\" reversed must be a word: x + \"ra\" = \"a\" + \"ra\"." },
  { q: "Why is the cut approach O(n · L²)?", options: ["L + 1 cuts per word, each checked in O(L)", "It sorts the words", "It compares every pair"], answer: 0, why: "No pair is ever joined." },
  { q: "Where does a trie come in?", options: ["Storing the reversed words in a trie does the same lookups while walking", "It isn't possible", "To sort the pairs"], answer: 0, why: "The map and the trie play the same role here." },
];
