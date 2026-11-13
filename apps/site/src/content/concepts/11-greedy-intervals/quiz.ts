import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "To fit the most meetings in one room, which meeting should you consider first?", options: ["The one that ends earliest", "The one that starts earliest", "The shortest one"], answer: 0, why: "It frees the room soonest, which the exchange argument shows is always safe." },
  { q: "Meetings 0–8, 1–4, 4–6 and 6–8. How many does 'earliest start first' fit?", options: ["1", "2", "3"], answer: 0, why: "It takes 0–8 first, which overlaps all the others." },
  { q: "What does an exchange argument show?", options: ["Any best answer can be changed into the greedy one without getting worse", "Greedy is always faster than DP", "Sorting is necessary"], answer: 0, why: "If the greedy choice can always be swapped in, it's part of some optimal answer." },
  { q: "To merge overlapping intervals, sort by…", options: ["Start", "End", "Length"], answer: 0, why: "Sorted by start, every interval that overlaps the current merged one comes right after it." },
  { q: "Coins 1, 3 and 4, amount 6. Why isn't 'take the biggest coin first' enough?", options: ["It gives 4 + 1 + 1 (3 coins), but 3 + 3 uses 2", "It can't make 6 at all", "It gives the right answer, just slowly"], answer: 0, why: "The locally best coin blocks the better combination. That's a sign the problem needs DP." },
];
