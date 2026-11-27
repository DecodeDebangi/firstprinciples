import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which node's right pointer does Morris borrow before going left from cur?", options: ["The rightmost node of cur's left side", "cur's left child", "The root"], answer: 0, why: "That node comes just before cur in order, and its right pointer is always empty." },
  { q: "How does Morris know a node's left side is finished?", options: ["The node before it already points back at it", "A counter reaches zero", "The stack is empty"], answer: 0, why: "Finding the borrowed pointer already in place means the walk has been down there and come back." },
  { q: "How much extra memory does Morris use?", options: ["O(1)", "O(h)", "O(n)"], answer: 0, why: "Only cur and pre. The way back is stored in pointers the tree already has." },
  { q: "What state is the tree in when Morris finishes?", options: ["Exactly as it started", "Turned into a list", "With every right pointer set"], answer: 0, why: "Each borrowed pointer is removed on the second visit." },
  { q: "When is Morris a bad choice?", options: ["When other code may read the tree during the walk", "When the tree is large", "When the tree is a BST"], answer: 0, why: "Mid-walk, the tree temporarily has extra links and isn't safe to share." },
];
