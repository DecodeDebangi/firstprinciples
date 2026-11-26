import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In a symmetric tree, which node must the root's left child match?", options: ["The root's right child", "The root's left grandchild", "The root itself"], answer: 0, why: "A mirror swaps left and right, so the two children of the root must be mirror images of each other." },
  { q: "Comparing a mirror pair (a, b), which children are paired next?", options: ["a.left with b.right, and a.right with b.left", "a.left with b.left, and a.right with b.right", "a.left with a.right"], answer: 0, why: "Mirroring swaps sides, so outer children pair with outer children and inner with inner." },
  { q: "Is [1, 2, 2, null, 3, null, 3] symmetric?", options: ["No: both 3s hang to the right, not mirrored", "Yes: each level has the same values", "Yes: it has an even number of 2s"], answer: 0, why: "The left 2 has its child on the right, and so does the right 2. A mirror needs them on opposite sides." },
  { q: "Why do missing children matter when reading each level?", options: ["Without them, different shapes can read the same", "They make the tree smaller", "They don't matter"], answer: 0, why: "Writing a placeholder for each missing child keeps the shape in the level, so it reads the same both ways only if it's truly mirrored." },
];
