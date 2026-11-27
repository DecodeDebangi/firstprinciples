import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why can \"me\" share \"game#\"?", options: ["It's the ending of \"game\", so it can be read up to the #", "Both have an m", "It's shorter"], answer: 0, why: "Reading starts partway and runs to the #." },
  { q: "In the reversed trie, which words need space?", options: ["The ones at the leaves", "Every word", "The ones nearest the root"], answer: 0, why: "Any other word is the ending of a word below it." },
  { q: "What does each kept word add to the length?", options: ["Its length plus one, for the #", "Its length", "One"], answer: 0, why: "Each entry ends with a #." },
  { q: "Why is the set version O(L²) per word?", options: ["Each of its L − 1 endings is copied out to look it up", "Sets are slow", "It sorts the words"], answer: 0, why: "1 + 2 + … letters." },
];
