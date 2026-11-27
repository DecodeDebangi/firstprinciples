import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Is /picsold inside /pics?", options: ["No: it doesn't start with \"/pics/\"", "Yes", "Only if both are listed"], answer: 0, why: "Being inside needs the slash after the name." },
  { q: "What are the trie's nodes?", options: ["Folder names", "Single letters", "Whole paths"], answer: 0, why: "\"/pics/2024\" is the path pics → 2024." },
  { q: "The walk reaches a listed folder. What next?", options: ["Record it and don't look below it", "Keep going down", "Remove it"], answer: 0, why: "Anything below is a sub-folder." },
  { q: "Another way to solve it?", options: ["Sort the paths and compare each with the last kept one", "Sort by length only", "There's no other way"], answer: 0, why: "After sorting, a sub-folder comes right after its parent's group." },
];
