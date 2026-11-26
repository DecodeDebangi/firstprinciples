import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Searching a BST for 7, you reach a node holding 10. Where can 7 be?", options: ["Only in 10's left subtree", "Only in 10's right subtree", "Anywhere below 10"], answer: 0, why: "Everything smaller than 10 that sits below it is on its left, so the right subtree is ruled out." },
  { q: "Where does a newly inserted value end up?", options: ["As a new leaf, where a search for it falls off the tree", "Always as the new root", "Swapped into the middle of the tree"], answer: 0, why: "Searching for the new value shows the only empty spot that keeps the order; nothing else has to move." },
  { q: "Deleting a node with two children, which value replaces it?", options: ["The smallest value in its right subtree", "Its left child's value", "The root's value"], answer: 0, why: "That value is bigger than everything on the left and smaller than everything else on the right, so the order still holds." },
  { q: "Deleting a node that has only a right child, what happens?", options: ["The right child's whole subtree moves up into its place", "The right child is deleted too", "The tree must be rebuilt"], answer: 0, why: "Everything in that subtree was already on the correct side of the deleted node's parent." },
  { q: "Walking down to find the in-order successor of p, when does a node become the candidate?", options: ["When p is smaller than it, so the walk turns left", "When p is bigger than it", "Only when it is a leaf"], answer: 0, why: "A node bigger than p could be the answer; going left then looks for something smaller that's still bigger than p." },
  { q: "Why are search, insert and delete O(h), not O(log n), in general?", options: ["A BST can be lopsided, so its height can reach n", "They visit every node", "h is always log n"], answer: 0, why: "Each walks one path from the root, which is only short when the tree is balanced." },
];
