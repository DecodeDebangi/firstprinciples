import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "nums = [3, 0, 0, 1]. Each value is the longest jump from there. Can you reach the end from position 0?", options: ["Yes: 0 can jump straight to 3", "No: you get stuck on a 0", "Only by landing on every position"], answer: 0, why: "From 0 the farthest reach is 0 + 3 = 3, the last position." },
  { q: "Walking forward, when is the end unreachable?", options: ["When the current position is beyond the farthest reach so far", "When you land on a 0", "When the values decrease"], answer: 0, why: "A 0 only matters if nothing earlier jumps past it; being beyond the farthest reach means nothing can." },
  { q: "Gas Station: if the tank runs dry going from station s to station i, which starts can you rule out?", options: ["Every station from s to i", "Only s", "Only i"], answer: 0, why: "Any start between them arrives at i with no more gas than starting at s did, so it runs dry too." },
  { q: "When is a full lap impossible from any station?", options: ["When total gas is less than total cost", "When one station has no gas", "When the first station costs more than it gives"], answer: 0, why: "Whatever the start, the lap uses all the gas and pays all the costs." },
  { q: "Merging overlapping intervals, what should you sort by?", options: ["Start", "End", "Length"], answer: 0, why: "With starts in order, each interval either overlaps the last merged one or starts a new one." },
  { q: "What makes a greedy choice safe?", options: ["You can show it never rules out a best answer", "It's the cheapest step right now", "It's the first option found"], answer: 0, why: "The exchange argument: any best answer can be changed to use the greedy choice without getting worse." },
];
