import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "To keep the k largest numbers of a stream, which heap do you use, and what's on top?", options: ["A min-heap; its top is the kth largest", "A max-heap; its top is the largest", "A min-heap; its top is the smallest number ever seen"], answer: 0, why: "The min-heap's top is the weakest of the k best, the one to drop when a better number arrives, and it's also the kth largest." },
  { q: "What does finding the k largest of n numbers cost with a heap of size k?", options: ["O(n log k)", "O(n log n)", "O(k log n)"], answer: 0, why: "Each of the n numbers is one push and at most one pop on a heap of at most k + 1 items." },
  { q: "Merging k sorted lists with n values in all: what does the heap hold?", options: ["One head from each list that isn't used up", "All n values", "The k smallest values overall"], answer: 0, why: "The smallest value not yet taken is always one of the heads, so the heap only needs those: at most k items." },
  { q: "In the two-heaps median, the smaller half is a max-heap. Why?", options: ["Its biggest item is next to the middle, and a max-heap keeps it on top", "Max-heaps are faster", "So the halves can be any size"], answer: 0, why: "The median sits at the boundary between the halves: the smaller half's biggest and the larger half's smallest." },
  { q: "The smaller half's top is 4 and the larger half's top is 7, and both halves hold 3 numbers. What's the median?", options: ["5.5", "4", "7"], answer: 0, why: "An even count: the median is the average of the two middle values, (4 + 7) / 2 = 5.5." },
];
