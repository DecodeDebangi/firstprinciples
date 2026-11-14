import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Inserting a new node at the head of a linked list with a million nodes takes how long?", options: ["O(1): one new node, one pointer change", "O(n): every node shifts", "O(log n)"], answer: 0, why: "Nothing moves. The new node points at the old head and becomes the head." },
  { q: "To insert 7 after node 8, which pointer should change first?", options: ["7's next, to point at what came after 8", "8's next, to point at 7", "Either: the order doesn't matter"], answer: 0, why: "If 8 points at 7 first, nothing points at the rest of the list any more and it's lost." },
  { q: "To delete a node from a singly linked list, which node do you need to be holding?", options: ["The node before it", "The node after it", "Only the head"], answer: 0, why: "Deleting means making the previous node point past it, so you rewire the node before it." },
  { q: "What does prev.next ← prev.next.next do?", options: ["Makes prev skip over the node after it", "Moves prev forward by two", "Deletes prev"], answer: 0, why: "prev now points two nodes ahead, so the node in between is no longer part of the chain." },
  { q: "Without a tail pointer, adding a node at the end costs…", options: ["O(n): walk to the last node first", "O(1)", "O(log n)"], answer: 0, why: "You must reach the last node to rewire it. Keeping a tail pointer turns this into O(1)." },
];
