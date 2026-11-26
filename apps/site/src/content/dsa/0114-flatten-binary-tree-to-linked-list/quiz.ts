import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "In the result, what is each node's left child?", options: ["none", "The previous node", "Its old left child"], answer: 0, why: "The list uses right pointers only." },
  { q: "Where does a node's old right subtree go?", options: ["Under the rightmost node of its left subtree", "Under its left child", "At the end of the whole list"], answer: 0, why: "That's where pre-order finishes the left subtree." },
  { q: "Why is the in-place version O(n) despite the inner search?", options: ["Each edge is walked by at most one rightmost search", "The tree is balanced", "The search is O(1)"], answer: 0, why: "After splicing, those edges are behind the current node forever." },
  { q: "What order does the flattened list follow?", options: ["Pre-order", "In-order", "Level order"], answer: 0, why: "Node, then left subtree, then right subtree." },
];
