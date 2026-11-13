import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Why is reading item k from an array O(1)?", options: ["Its address is start + k × size, computed directly", "Arrays are always sorted", "The CPU caches every array"], answer: 0, why: "Slots are equal in size and consecutive, so the address of any index is one calculation away." },
  { q: "Why is inserting at the front of a linked list O(1)?", options: ["Only the new node's pointer and the head change", "Linked lists are smaller than arrays", "The list is copied in the background"], answer: 0, why: "Create a node, point it at the old head, and make it the head. No existing node moves." },
  { q: "You need to insert in the middle of a linked list, and you only have the head. What's the cost?", options: ["O(n): you must walk to the spot first", "O(1)", "O(log n)"], answer: 0, why: "The O(1) insert assumes you already hold the node before the spot. Finding it is a walk." },
  { q: "Both an array scan and a linked-list scan are O(n). Why is the array usually faster in practice?", options: ["Its items are contiguous, so the CPU cache already holds the next ones", "Arrays use fewer comparisons", "Linked lists are scanned twice"], answer: 0, why: "Each cache line fetch brings in several neighbouring items; scattered nodes often miss the cache." },
  { q: "An LRU cache must move any entry to the front in O(1). What does it use?", options: ["A hash map plus a doubly linked list", "A sorted array", "A single Python list"], answer: 0, why: "The map finds the node in O(1), and the doubly linked list unlinks and re-inserts it in O(1)." },
];
