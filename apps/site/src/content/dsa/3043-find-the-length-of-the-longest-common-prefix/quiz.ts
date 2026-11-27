import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What do 125 and 1250 share?", options: ["3 leading digits", "4", "2"], answer: 0, why: "\"125\" is the start of both." },
  { q: "What does a walk's depth tell you?", options: ["The longest prefix that number shares with any number in the trie", "How many numbers are in the trie", "The number's length"], answer: 0, why: "Each step down is one more shared digit." },
  { q: "Why put only one list in the trie?", options: ["The other list's numbers just need to walk it", "Tries can't hold two lists", "To save time sorting"], answer: 0, why: "Each walk compares one number with the whole trie." },
  { q: "How long does one walk take?", options: ["At most D steps, its number of digits", "O(n) steps", "O(n · D) steps"], answer: 0, why: "One step per digit." },
];
