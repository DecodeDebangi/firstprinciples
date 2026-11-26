import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "At what kind of node is a path finished?", options: ["A leaf: a node with no children", "Any node with a missing child", "The root"], answer: 0, why: "A root-to-leaf path must end at a leaf." },
  { q: "In the shared-path version, when is a node popped?", options: ["After both of its subtrees are done", "Right after it's pushed", "Only at leaves"], answer: 0, why: "It stays on the path while anything below it is being explored." },
  { q: "Why is passing a new string down slower?", options: ["Every node copies the whole path above it", "It visits more nodes", "It skips leaves"], answer: 0, why: "On a long path that's 1 + 2 + … + n characters copied." },
  { q: "What's the extra space of the shared-path version, besides the answer?", options: ["O(h): the path and the recursion", "O(n²)", "O(1)"], answer: 0, why: "Only one path is ever stored while walking." },
];
