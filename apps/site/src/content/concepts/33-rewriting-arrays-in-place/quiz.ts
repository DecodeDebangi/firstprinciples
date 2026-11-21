import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Removing values with a read pointer r and a write pointer w, what's true of everything before w?", options: ["It's finished: the kept values, in order", "It's still to be checked", "It's all the removed values"], answer: 0, why: "Each kept value is written at w and w moves on, so the front of the array is the answer so far." },
  { q: "Why can't the write pointer overwrite a value that hasn't been read yet?", options: ["w never moves ahead of r", "Writing is slower than reading", "The array is copied first"], answer: 0, why: "w only moves when a value at r is kept, so it's always at or behind r." },
  { q: "Reversing positions 2 to 7 by swapping from both ends takes how many swaps?", options: ["3", "6", "5"], answer: 0, why: "Six values, and each swap fixes two of them: (2,7), (3,6), (4,5)." },
  { q: "Rotating [1, 2, 3, 4, 5] right by 2 with three reversals: what does the array look like after the first reversal?", options: ["[5, 4, 3, 2, 1]", "[4, 5, 1, 2, 3]", "[2, 1, 3, 4, 5]"], answer: 0, why: "The first step reverses the whole array. Then reversing the first 2 and the last 3 gives [4, 5, 1, 2, 3]." },
  { q: "Why work out k % n before rotating?", options: ["Rotating by n brings the array back to where it started", "k must be odd", "It sorts the array"], answer: 0, why: "Only the remainder after whole laps changes anything." },
  { q: "Values are between 1 and n. How can the array remember which values appeared, with no extra memory?", options: ["Make the number at position v − 1 negative for each value v", "Sort it first", "Add n to every value"], answer: 0, why: "Each value names a position; a negative sign there is a mark, and the absolute value still gives the original number." },
];
