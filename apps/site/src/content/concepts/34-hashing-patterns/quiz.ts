import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Counting [5, 2, 5, 5] with a map of value → how many: what does the map hold at the end?", options: ["5 → 3, 2 → 1", "5 → 1, 2 → 1", "5 → 3, 2 → 3"], answer: 0, why: "Each value adds one to its own count: 5 appears three times and 2 once." },
  { q: "You only need to know whether a value has appeared before. What should you store?", options: ["A set of the values seen", "A map from each value to its count", "A sorted copy of the array"], answer: 0, why: "A set answers \"is it here?\" in O(1) on average, and that's all the question needs." },
  { q: "Looking for two values that add up to 10, you reach x = 4. What do you look up among the earlier values?", options: ["6", "4", "14"], answer: 0, why: "4 needs a partner of 10 − 4 = 6. If 6 was stored earlier, the pair is found." },
  { q: "Grouping words that use the same letters, which key puts \"tea\" and \"eat\" together?", options: ["The letters sorted: \"aet\"", "The first letter", "The length of the word"], answer: 0, why: "Both sort to \"aet\". The first letter or the length would also lump in words with different letters." },
  { q: "Counting subarrays that add up to k, the running total is 9 and k = 4. Which earlier total are you looking for?", options: ["5", "4", "13"], answer: 0, why: "A subarray ending here adds up to 4 when the total before it was 9 − 4 = 5." },
  { q: "Why does that map start with seen[0] = 1?", options: ["So subarrays starting at position 0 are counted", "To avoid an empty map", "Because k could be 0"], answer: 0, why: "The total before any value is 0, and a subarray from the start needs it as its earlier total." },
  { q: "A hash map turns an O(n²) search into O(n). What does it cost?", options: ["O(n) extra memory", "Nothing", "The array must be sorted first"], answer: 0, why: "The map holds up to one entry per value." },
];
