import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "To find the next bigger item for each item, when do you pop the stack?", options: ["While the top is smaller than the new item", "While the top is bigger than the new item", "Only at the end of the walk"], answer: 0, why: "The new item is the answer for every waiting item smaller than it, so those are popped and answered." },
  { q: "For the previous bigger item, where does the new item's answer come from?", options: ["The top left on the stack after popping", "The items it pops", "The bottom of the stack"], answer: 0, why: "Popping removes earlier items that aren't bigger; whatever survives on top is the nearest earlier bigger item." },
  { q: "Why push positions onto the stack instead of values?", options: ["A position gives both the value and the distance between items", "Positions use less memory", "Values can't be compared"], answer: 0, why: "With the position you can read a[i] and also work out how far apart two items are, as Daily Temperatures needs." },
  { q: "Values 31, 40, 28, 33: what is the stock span of 33 (days in a row, ending today, no higher than today)?", options: ["2", "1", "4"], answer: 0, why: "33 and 28 are no higher than 33; 40 before them is higher, so the span is 2." },
  { q: "For a circular array of n items, how far does the walk go?", options: ["2n positions, pushing only on the first lap", "n positions", "n² positions"], answer: 0, why: "The second lap lets items near the end find answers near the start, and pushes nothing new." },
  { q: "Heights 2, 4, 3 and then the end (height 0). When bar 2 (height 3) is popped at the end, bar 0 is under it. How wide is its rectangle?", options: ["2", "1", "3"], answer: 0, why: "Bar 0 (height 2) is shorter and blocks the left, the end blocks the right, so it covers bars 1 and 2: width 2, area 6." },
];
