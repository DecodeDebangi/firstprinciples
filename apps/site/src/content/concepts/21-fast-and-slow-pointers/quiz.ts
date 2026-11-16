import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "slow moves 1 node per round and fast moves 2. When fast reaches the end of a list, where is slow?", options: ["Halfway along the list", "At the end too", "One node behind fast"], answer: 0, why: "fast has always walked exactly twice as far as slow, so when fast has covered the whole list, slow has covered half." },
  { q: "On a list that loops, the slow and fast pointers are both on the loop. How does the gap between them change each round?", options: ["It shrinks by exactly 1", "It stays the same", "It grows by 1"], answer: 0, why: "fast moves 2 and slow moves 1, so fast gains exactly one node per round." },
  { q: "Why can't the fast pointer jump over the slow one when the speeds are 1 and 2?", options: ["The gap shrinks by exactly 1, so it must pass through 0", "The fast pointer checks every node", "It can, but rarely"], answer: 0, why: "From a gap of 1, fast's two steps land exactly on the node slow just moved to." },
  { q: "The loop condition is 'fast ≠ none and fast.next ≠ none'. Why check fast.next?", options: ["fast is about to read fast.next.next, which crashes if fast.next is none", "To find the middle faster", "It isn't needed"], answer: 0, why: "Moving two steps reads fast.next.next, and you can't read next from none." },
  { q: "With 6 nodes and the loop condition 'fast ≠ none and fast.next ≠ none', where does slow stop?", options: ["On the 4th node, the second of the two middles", "On the 3rd node, the first middle", "On the 6th node"], answer: 0, why: "After 3 rounds fast is none and slow has walked 3 steps from the 1st node, landing on the 4th." },
  { q: "How much extra memory does fast-and-slow loop detection use?", options: ["O(1): just two pointers", "O(n): a set of visited nodes", "O(log n)"], answer: 0, why: "It never stores any nodes. It only compares the two pointers each round." },
];
