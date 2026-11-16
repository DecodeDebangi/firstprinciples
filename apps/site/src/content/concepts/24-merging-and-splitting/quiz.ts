import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Merging two sorted lists, which node do you attach next?", options: ["The smaller of the two front nodes", "The larger of the two front nodes", "Always the front node of the first list"], answer: 0, why: "Both lists are sorted, so the smallest remaining value is always at the front of one of them." },
  { q: "One list runs out while merging. What do you do with the other?", options: ["Attach the rest of it in one step", "Walk it and attach nodes one by one", "Sort it first"], answer: 0, why: "Its nodes are already sorted and already linked, so a single pointer change attaches them all." },
  { q: "How much extra space does merging two sorted linked lists use?", options: ["O(1): it relinks the existing nodes", "O(m + n) for a new list", "O(log n)"], answer: 0, why: "Only a dummy node and the tail pointer are added; every node in the result already existed." },
  { q: "Splitting a list in half, why start fast on head.next instead of head?", options: ["So slow stops on the first middle, the end of the first half", "So fast moves quicker", "To skip the head"], answer: 0, why: "With an even length, starting one node ahead makes slow stop one node earlier, on the last node of the first half." },
  { q: "Why does merge sort suit linked lists better than quick sort?", options: ["It only walks forwards, never jumping to a position", "It uses less time in every case", "It doesn't compare values"], answer: 0, why: "Jumping to a position is O(n) on a list. Merge sort only splits and merges, which walk forwards." },
  { q: "What's the time cost of merge sort on a list of n nodes?", options: ["O(n log n)", "O(n²)", "O(n)"], answer: 0, why: "About log₂ n levels of halving, and each level's merges touch all n nodes once." },
];
