import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "You need to sort 5 million records by timestamp, keeping records with the same timestamp in arrival order. Which property must the sort have?", options: ["Stable", "In place", "Comparison-free"], answer: 0, why: "Keeping equal keys in their original order is exactly what stability means." },
  { q: "A list is sorted except for two neighbouring items that are swapped. Which sort finishes fastest?", options: ["Merge sort", "Insertion sort", "Selection sort"], answer: 1, why: "Insertion sort only shifts the one out-of-place item a single step, so it does about n operations. Merge sort still does n·log n; selection sort still does n²/2." },
  { q: "Quicksort always picks the last element as its pivot. Which input makes it slowest?", options: ["Random order", "Already sorted", "All values distinct"], answer: 1, why: "On sorted input the last element is the largest, so every partition splits off nothing: O(n²)." },
  { q: "You must sort 10 million exam scores, each between 0 and 100. What's the best choice?", options: ["Quicksort", "Counting sort", "Merge sort"], answer: 1, why: "With only 101 possible values, counting sort runs in O(n + 101) with no comparisons at all." },
  { q: "Which of these sorts needs O(n) extra memory?", options: ["Heapsort", "Insertion sort", "Merge sort"], answer: 2, why: "Merging two sorted halves needs a buffer as big as the data. Heapsort and insertion sort work in place." },
];
