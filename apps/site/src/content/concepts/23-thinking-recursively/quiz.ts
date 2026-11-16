import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What's the base case for most recursive functions on a linked list?", options: ["The empty list: node is none", "The node with the largest value", "The middle of the list"], answer: 0, why: "Every call works on a list one node shorter, so they all end at none, which is answered without another call." },
  { q: "In sum(node) = node.val + sum(node.next), when does the first addition happen?", options: ["After the base case returns, at the last node", "At the head, straight away", "Halfway through the list"], answer: 0, why: "Each call waits for sum(node.next) before adding, so the first addition happens once the calls reach the end and start returning." },
  { q: "A recursive function prints node.val after its call on node.next. In what order are the values printed?", options: ["Last node first", "First node first", "In sorted order"], answer: 0, why: "Work after the call runs as the calls return, which starts from the last node." },
  { q: "How much extra space does a recursive walk over a list of n nodes use?", options: ["O(n) for the call stack", "O(1)", "O(log n)"], answer: 0, why: "All n calls are waiting on the call stack at the deepest point." },
  { q: "What's the risk of recursion on a list with a million nodes?", options: ["A stack overflow: too many waiting calls", "It returns the wrong answer", "It changes the list's values"], answer: 0, why: "Each waiting call takes stack space, and the stack is much smaller than ordinary memory." },
  { q: "removeAll(node, v) sets node.next ← removeAll(node.next, v). If node.val = v, what should it return?", options: ["node.next, so the caller links past this node", "node", "none"], answer: 0, why: "The caller stores whatever is returned in its own next, so returning node.next skips this node." },
];
