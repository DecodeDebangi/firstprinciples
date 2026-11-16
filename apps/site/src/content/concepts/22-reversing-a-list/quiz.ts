import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Halfway through reversing a list in place, what does prev point to?", options: ["The head of the part already reversed", "The node before curr in the original list, which is unchanged", "The original head"], answer: 0, why: "Each round puts curr at the front of the reversed part, then prev moves onto it." },
  { q: "Why must you save nxt ← curr.next before setting curr.next ← prev?", options: ["curr.next is the only way to reach the rest of the list", "To count the nodes", "So prev can move faster"], answer: 0, why: "Nothing else points to the remaining nodes. Overwrite that arrow first and they're unreachable." },
  { q: "When the reversal loop finishes, which pointer holds the new head?", options: ["prev", "curr", "head"], answer: 0, why: "curr is none by then, and head still points at the original first node, which is now the last." },
  { q: "How much extra space does reversing a list in place with three pointers use?", options: ["O(1)", "O(n)", "O(log n)"], answer: 0, why: "Only prev, curr and nxt, however long the list is." },
  { q: "You've reversed positions 2 to 4 of a list. The old node at position 2 now points to none. What should it point to?", options: ["The node that was at position 5", "The node that was at position 1", "The node that was at position 4"], answer: 0, why: "It's now the last node of the reversed section, so it continues into whatever came after the section." },
  { q: "Why does the recursive reversal use O(n) space?", options: ["Each node's call waits on the call stack until the rest is reversed", "It copies every value", "It builds a second list"], answer: 0, why: "There are n nested calls before any of them returns, and each takes stack space." },
];
