import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What two things does every node in a singly linked list hold?", options: ["A value and a pointer to the next node", "A value and its index", "A pointer to the head and a pointer to the tail"], answer: 0, why: "val is the data; next says where the following node is. There's no index stored anywhere." },
  { q: "What does the last node's next pointer hold?", options: ["none", "A pointer back to the head", "Its own index"], answer: 0, why: "none marks the end of the chain; a loop that walks the list stops when curr becomes none." },
  { q: "A problem shows head = [4, 7, 2]. What does your function actually receive?", options: ["The node holding 4", "An array of three numbers", "All three nodes in a list"], answer: 0, why: "The brackets are just how the list is written down. You get the head node and follow next pointers to the rest." },
  { q: "How long does it take to reach the 50th node of a linked list from the head?", options: ["About 50 steps: follow 50 pointers", "One step, like an array", "It depends on the values"], answer: 0, why: "Nodes can be anywhere in memory, so the only way to find node 50 is through node 49, and so on: O(k)." },
  { q: "You lose your only pointer to the head. What happens to the list?", options: ["It's unreachable: you can't get to any node", "Nothing: the tail still knows the way back", "The second node becomes the head automatically"], answer: 0, why: "In a singly linked list, pointers only go forward. Every node is reached from the head, so without it the chain is lost." },
];
