import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why does code that deletes nodes often need a special case for the head?", options: ["The head has no node before it to rewire", "The head can't be deleted", "The head stores the list's length"], answer: 0, why: "Deleting means rewiring the previous node, and the head is the only node without one." },
  { q: "With a dummy node in front of the list, what do you return at the end?", options: ["dummy.next", "dummy", "The last node"], answer: 0, why: "The dummy is only scaffolding; the real list starts right after it." },
  { q: "How much extra space does a dummy node cost?", options: ["O(1): one extra node", "O(n): a copy of the list", "None at all"], answer: 0, why: "It's a single node, whatever the list's length." },
  { q: "Removing every 6 from 6 → 6 → 2, you just unlinked a 6 after curr. What next?", options: ["Check the new curr.next before moving", "Move curr forward right away", "Start again from the dummy"], answer: 0, why: "The node that slid into curr.next hasn't been checked yet and could be another 6." },
  { q: "Building a merged list node by node, how does a dummy help?", options: ["You can attach every node to tail the same way, with no first-node check", "It sorts the nodes", "It removes duplicates"], answer: 0, why: "tail starts on the dummy, so even the first real node is attached with tail.next ← node." },
];
