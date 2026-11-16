import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "You hold a node in the middle of a doubly linked list. How long does removing it take?", options: ["O(1): it knows both of its neighbours", "O(n): you must walk from the head", "O(log n)"], answer: 0, why: "node.prev.next ← node.next and node.next.prev ← node.prev: two changes, no walking." },
  { q: "What do sentinel nodes at both ends of a doubly linked list give you?", options: ["Every real node always has a node on both sides, so the ends need no special case", "Faster lookups by value", "Half the memory"], answer: 0, why: "Removing or adding at the first or last real position becomes the same code as in the middle." },
  { q: "In a circular linked list, when should a walk that visits every node stop?", options: ["When it gets back to the node it started from", "When it reaches none", "After 100 steps"], answer: 0, why: "There is no none in a circular list; the last node points back to the first." },
  { q: "An LRU cache with capacity 2 holds keys 1 and 2, and key 1 was used most recently. A new key 3 arrives. Which key is thrown out?", options: ["2, used longest ago", "1, used most recently", "3, the new one"], answer: 0, why: "LRU means least recently used goes first. That's key 2, which sits next to the tail sentinel." },
  { q: "In an LRU cache, what does the hash map store for each key?", options: ["The key's node in the linked list", "Only the key's value", "The key's position as a number"], answer: 0, why: "Finding the node lets you move or remove it in O(1) without searching the list." },
  { q: "Why can't an LRU cache use only a hash map?", options: ["A map has no order, so it can't tell which item was used longest ago", "Maps can't store numbers", "Maps are O(n) to look up"], answer: 0, why: "The linked list keeps the order of use; the map only finds items by key." },
];
