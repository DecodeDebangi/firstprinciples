import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Node 2's children are 4 and 5, and 2.next is 3. Where does 5.next point?", options: ["6, 3's left child", "Nothing", "4"], answer: 0, why: "A right child reaches across to the next node's left child." },
  { q: "Where does 4.next point?", options: ["5, its sibling", "6", "Nothing"], answer: 0, why: "A left child links to its own parent's right child." },
  { q: "What does the queue version cost in memory?", options: ["O(w), up to a whole level", "O(1)", "O(n²)"], answer: 0, why: "The widest level of a perfect tree holds about half the nodes." },
  { q: "What lets the faster version skip the queue?", options: ["The level above is already linked by next pointers", "The tree is sorted", "Recursion"], answer: 0, why: "It walks the level above like a linked list." },
];
