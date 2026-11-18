import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "For a = [2, 5, 1, 4], what is the prefix array (with a 0 at the front)?", options: ["[0, 2, 7, 8, 12]", "[2, 7, 8, 12]", "[0, 2, 5, 1, 4]"], answer: 0, why: "Each entry is the previous total plus the next value: 0, 0 + 2, 2 + 5, 7 + 1, 8 + 4." },
  { q: "Using that prefix array, what is the sum of positions 1..2?", options: ["prefix[3] - prefix[1] = 6", "prefix[2] - prefix[1] = 5", "prefix[3] - prefix[2] = 1"], answer: 0, why: "Positions 1 to 2 are everything up to position 2 (prefix[3] = 8) minus everything before 1 (prefix[1] = 2): 5 + 1 = 6." },
  { q: "Why is the prefix array one longer than the input?", options: ["prefix[0] = 0 lets ranges starting at 0 use the same formula", "To store the length", "It isn't; it's the same length"], answer: 0, why: "With prefix[0] = 0, a range 0..r is prefix[r + 1] - prefix[0], with no special case." },
  { q: "How long does answering q range-sum queries take with prefix sums on n values?", options: ["O(n + q)", "O(n · q)", "O(q²)"], answer: 0, why: "Build the prefix array once in O(n), then each query is one subtraction." },
  { q: "Do prefix sums still work when the array has negative numbers?", options: ["Yes, subtraction works for any whole numbers", "No, every value must be positive", "Only if the array is sorted"], answer: 0, why: "prefix[r + 1] - prefix[l] is exact whatever the signs." },
  { q: "When is building a prefix array not worth it?", options: ["When you'll only ask about one range", "When the array is long", "When the values are large"], answer: 0, why: "Building costs O(n), the same as adding one range directly. It pays off over many ranges." },
];
