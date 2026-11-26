import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why can't you search outward from any node in a plain binary tree?", options: ["Nodes only point down to their children, not up", "Trees have cycles", "Values aren't sorted"], answer: 0, why: "Reaching a node's parent needs a link the tree doesn't store." },
  { q: "How do you make every node able to reach its parent?", options: ["One walk from the root, recording each node's parent in a map", "Sort the nodes", "Reverse every edge"], answer: 0, why: "Each call passes itself down as the parent of its children." },
  { q: "After adding parent links, how many neighbours can a node have?", options: ["Up to three: left, right and parent", "Exactly two", "Any number"], answer: 0, why: "It's now an undirected graph where every node has at most three edges." },
  { q: "Why does breadth-first search need a seen set here, when a tree walk from the root doesn't?", options: ["Going up and then down could revisit the node you came from", "To sort the rings", "It doesn't need one"], answer: 0, why: "With parent links every edge can be walked both ways." },
  { q: "Searching outward from a node, what does ring d hold?", options: ["Every node exactly d edges away", "The nodes at depth d from the root", "The leaves"], answer: 0, why: "Breadth-first search reaches nodes in order of distance from where it started." },
];
