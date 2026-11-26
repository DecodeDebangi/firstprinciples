import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does the diameter count?", options: ["Edges on the longest path between any two nodes", "Nodes on the longest root-to-leaf path", "Edges from the root to the deepest leaf"], answer: 0, why: "It's measured in edges, and the path doesn't have to go through the root." },
  { q: "The longest path bending at a node has how many edges?", options: ["Left height + right height", "max(left, right) + 1", "Left height × right height"], answer: 0, why: "With heights counted in edges down each side, the path goes down both sides from the node." },
  { q: "Why is measuring both heights at every node slow?", options: ["Subtrees are measured again for every node above them", "It skips the root", "It needs extra memory"], answer: 0, why: "Each height is recomputed from scratch at every ancestor." },
  { q: "In the faster approach, what does each call return, and what does it track on the side?", options: ["Returns its height, tracks the best diameter seen", "Returns the diameter, tracks the height", "Returns nothing, tracks both"], answer: 0, why: "The parent needs the height to continue; the best bend found anywhere is kept in a separate variable." },
];
