import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "You push 1, 2, 3 onto a stack and then pop twice. Which items come out?", options: ["3, then 2", "1, then 2", "3, then 1"], answer: 0, why: "A stack returns the most recent item first: 3, then 2." },
  { q: "You need to process print jobs in the order they were sent. Which structure fits?", options: ["Queue", "Stack", "Hash set"], answer: 0, why: "First come, first served is exactly FIFO." },
  { q: "Why is removing from the front of a plain array a bad way to dequeue?", options: ["It shifts every remaining element: O(n)", "It removes the wrong element", "Arrays don't allow it"], answer: 0, why: "Removing from the front moves all the others left. collections.deque.popleft() is O(1)." },
  { q: "In a monotonic stack for 'next greater element', what happens when a bigger number arrives?", options: ["It pops and answers every smaller waiting number", "It's pushed underneath the waiting numbers", "It's ignored"], answer: 0, why: "The new number is the first bigger value to the right of each smaller waiting number, so it answers them, most recent first." },
  { q: "A monotonic-stack solution has a while loop inside a for loop. What's its time complexity?", options: ["O(n)", "O(n²)", "O(n log n)"], answer: 0, why: "Each index is pushed once and popped at most once, so the total inner work across the whole run is at most n." },
];
