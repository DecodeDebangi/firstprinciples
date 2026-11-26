import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "From [1, 3, 4, 6, 7, 8, 10], which value becomes the root?", options: ["6", "1", "10"], answer: 0, why: "6 is in the middle: three values go left and three go right." },
  { q: "Why not insert the sorted values one by one into an empty BST?", options: ["Each goes right of the last, giving a chain", "It breaks the BST order", "It's not allowed"], answer: 0, why: "The tree stays valid but becomes height n, not height-balanced." },
  { q: "Why is copying each half O(n log n)?", options: ["Every level of the recursion copies out all n values again", "Each copy is O(log n)", "It isn't: it's O(n)"], answer: 0, why: "There are about log n levels, and together each level's slices hold every value." },
  { q: "With an even number of values, which middle should be the root?", options: ["Either: both give a height-balanced tree", "Only the left one", "Only the right one"], answer: 0, why: "The two sides differ by at most one value either way, and the problem accepts any balanced answer." },
];
