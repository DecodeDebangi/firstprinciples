import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "x ← 4, then y ← x, then y += 1. What is x?", options: ["4", "5"], answer: 0, why: "Assigning a number copies it. y has its own copy, so changing y leaves x alone." },
  { q: "a ← [1, 2], then b ← a, then b.push(3). What is a?", options: ["[1, 2, 3]", "[1, 2]"], answer: 0, why: "b ← a copies the reference, so a and b name the same list, and the push is visible through both." },
  { q: "a ← [1, 2], then c ← copy(a), then c.push(3). What is a?", options: ["[1, 2]", "[1, 2, 3]"], answer: 0, why: "copy makes a separate list. Changing it doesn't touch the original." },
  { q: "A function does list.push(0) on a list it was given. What does the caller see?", options: ["The 0 at the end of its own list", "Its list unchanged", "An error"], answer: 0, why: "The function received a reference to the caller's list, so the change is shared." },
  { q: "How long does b ← a take when a is a list of a million values?", options: ["O(1): only the reference is copied", "O(n): every value is copied", "It depends on the values"], answer: 0, why: "No list is created; b just points at the same one. copy(a) would be O(n)." },
  { q: "Two different nodes both hold the value 7. Are they the same node?", options: ["No: equal values, but two separate objects", "Yes: same value means same node"], answer: 0, why: "Being the same object and holding equal values are different questions." },
];
