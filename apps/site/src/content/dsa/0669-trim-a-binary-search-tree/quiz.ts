import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Range 4 to 10, and a node holds 3. What survives from its subtree?", options: ["Only what's kept in its right subtree", "Its left subtree", "Nothing"], answer: 0, why: "Everything on 3's left is below 3, so below 4." },
  { q: "Range 4 to 10, and a node holds 14. Where can kept values be?", options: ["Only in its left subtree", "Only in its right subtree", "Anywhere"], answer: 0, why: "Everything on its right is above 14." },
  { q: "A kept node 6 had a removed parent 3. What becomes of 6?", options: ["It moves up into 3's place", "It's removed too", "It becomes the root"], answer: 0, why: "The trimmed right subtree replaces 3." },
  { q: "Why is the recursive trim O(n) and often faster?", options: ["Dropped subtrees are skipped without being visited", "It sorts the values", "It uses a queue"], answer: 0, why: "Half of each out-of-range node's subtree is never looked at." },
];
