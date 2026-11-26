import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Where does the new value go?", options: ["At the empty spot where a search for it falls off the tree", "At the root, pushing everything down", "Next to the largest value"], answer: 0, why: "That is the only place that keeps every left side smaller and every right side bigger." },
  { q: "Inserting 5 under a node 4 that has no right child, where does 5 go?", options: ["As 4's right child", "As 4's left child", "In place of 4"], answer: 0, why: "5 > 4, so it belongs on 4's right, and that spot is empty." },
  { q: "Why does the recursive version write root.left ← insertIntoBST(root.left, val)?", options: ["The call may return a brand-new node that must be linked in", "To copy the left subtree", "To delete the old left child"], answer: 0, why: "When root.left is empty, the call returns the new node, and the parent must store it." },
  { q: "What does the loop version save compared with recursion?", options: ["The O(h) stack of waiting calls: it uses O(1) extra memory", "Time: it is O(1)", "Nothing at all"], answer: 0, why: "Both walk one path in O(h) time, but the loop only keeps two pointers." },
];
