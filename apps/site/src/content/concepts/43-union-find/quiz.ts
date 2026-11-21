import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "In union-find, what does find(x) return?", options: ["The root of x's tree, which names its group", "x's parent", "The size of x's group"], answer: 0, why: "Following parents up ends at the root, and two items are in the same group exactly when they reach the same root." },
  { q: "parent = [0, 0, 1, 3]. What is find(2)?", options: ["0", "1", "2"], answer: 0, why: "2's parent is 1, 1's parent is 0, and 0 is its own parent: the root." },
  { q: "How does union(a, b) join two different groups?", options: ["Points one root at the other", "Moves every item of one group", "Points a at b"], answer: 0, why: "Changing one root's parent puts its whole tree under the other root in one step." },
  { q: "Why hang the smaller tree under the bigger one?", options: ["It keeps the trees shallow, so finds stay short", "It saves memory", "It keeps the groups sorted"], answer: 0, why: "An item only gets deeper when its tree goes under a bigger one, which at least doubles its group, so depth stays O(log n)." },
  { q: "What does path compression do during find?", options: ["Points every item on the path straight at the root", "Deletes the path", "Moves the root to the bottom"], answer: 0, why: "The next find from any of those items then takes one step." },
  { q: "union(a, b) finds that a and b already have the same root. In an undirected graph, what does that edge do?", options: ["It closes a cycle", "It splits the group", "Nothing can be said"], answer: 0, why: "a and b were already connected by another path, so this edge makes a loop." },
];
