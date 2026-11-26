import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does the stack hold?", options: ["The days still waiting for a warmer day", "The warmest days so far", "Every day's answer"], answer: 0, why: "A day sits on the stack until a warmer day arrives and settles it." },
  { q: "Why does the stack store day numbers, not temperatures?", options: ["The answer is a distance between two days", "Day numbers take less memory", "Temperatures can repeat"], answer: 0, why: "To work out i − j you need both days' positions; the temperature can be read from temps[j]." },
  { q: "Day 3 is 69° and day 4 is also 69°. What happens when day 4 arrives?", options: ["Day 4 waits on top: an equal day isn't warmer", "Day 3 is settled with a wait of 1", "Both leave the stack"], answer: 0, why: "Only a strictly warmer day counts, so equal temperatures both keep waiting." },
  { q: "One day can pop several days. Why is the whole walk still O(n)?", options: ["Each day is pushed once and popped at most once", "The inner loop always runs at most once", "The stack never holds more than two days"], answer: 0, why: "Count pushes and pops over the whole walk: at most n of each, however they're spread out." },
];
