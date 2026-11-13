import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What's the usual way to store a graph for BFS or DFS?", options: ["An adjacency list", "An edge list", "A sorted array of nodes"], answer: 0, why: "It gives each node's neighbours directly, in O(V + E) space." },
  { q: "Which search finds the fewest edges from a start node to every other node?", options: ["BFS", "DFS", "Both equally"], answer: 0, why: "BFS visits nodes in order of distance, so the first visit to each is by a shortest path." },
  { q: "What happens to DFS on an undirected graph with no visited set?", options: ["It bounces back along edges forever", "It finishes, just more slowly", "It visits each node exactly twice"], answer: 0, why: "Each edge leads back to the node you came from, and nothing remembers that you've been there." },
  { q: "What's the time complexity of BFS or DFS with an adjacency list?", options: ["O(V + E)", "O(V²)", "O(V · E)"], answer: 0, why: "Each node is processed once and each edge is checked once from each end." },
  { q: "You need the cheapest route where each road has a different length. Which algorithm?", options: ["Dijkstra's", "Plain BFS", "DFS"], answer: 0, why: "Plain BFS counts edges, not lengths. Dijkstra's uses a heap to always expand the cheapest known node next." },
];
