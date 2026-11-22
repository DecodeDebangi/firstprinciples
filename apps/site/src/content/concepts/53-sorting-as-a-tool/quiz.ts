import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "To glue 9 and 91 into the largest number, which comes first, and why?", options: ["9: \"991\" beats \"919\"", "91: it's the bigger number", "Either: they give the same result"], answer: 0, why: "The rule compares both orders as text; 991 is bigger than 919." },
  { q: "What does a stable sort guarantee?", options: ["Items with equal keys keep their original order", "It never uses extra memory", "It's always O(n log n)"], answer: 0, why: "Stability is about ties: equal items stay in the order they came in." },
  { q: "The values are whole numbers from 0 to 100, and there are a million of them. What's a fast way to sort them?", options: ["Count each value, then read the counts back", "A comparator sort", "Sort by a key"], answer: 0, why: "Counting is O(n + k) with k = 101, faster than O(n log n) comparisons." },
  { q: "In the three-way partition, a[mid] is bigger than the pivot and gets swapped with a[hi]. What happens to mid?", options: ["It stays: the new a[mid] hasn't been checked", "It moves on by one", "It jumps to hi"], answer: 0, why: "The value that came from the back is unknown, so it must be checked before moving on." },
  { q: "You only need the values below a pivot, then those equal to it, then those above, in any order within each group. What's the cheapest tool?", options: ["A one-pass partition", "A full sort", "Counting sort"], answer: 0, why: "A partition makes the three groups in O(n) time and O(1) extra space, without ordering each group." },
];
