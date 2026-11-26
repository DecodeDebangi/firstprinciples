import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The sorted values are [1, 3, 4, 6, 10, 14] and k = 14. The first sum is 1 + 14 = 15. What moves?", options: ["hi moves left", "lo moves right", "Both"], answer: 0, why: "15 is too big, so 14 can't pair with anything left." },
  { q: "Why does the in-order read help?", options: ["It gives the values sorted, ready for two pointers", "It finds the root", "It removes duplicates"], answer: 0, why: "The BST order becomes a sorted list." },
  { q: "Why is searching per node O(n · h)?", options: ["Each node starts a new walk from the root", "It sorts the tree", "It visits each node once"], answer: 0, why: "n searches of up to h steps each." },
  { q: "Which other O(n) method works on any binary tree?", options: ["Keep a set of values seen and look for k − x", "Binary search", "Sorting the tree in place"], answer: 0, why: "Each value checks whether its partner was seen already." },
];
