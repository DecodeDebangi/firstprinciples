import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "In this site's pseudocode, what does count ← count + 1 do?", options: ["Adds 1 to count and stores the result in count", "Checks whether count equals count + 1", "Nothing; it's a comment"], answer: 0, why: "The arrow ← stores a value. The right side is worked out first, then stored in the box on the left." },
  { q: "What does x = 5 mean in this site's pseudocode?", options: ["Is x equal to 5? (true or false)", "Store 5 in x", "x is always 5"], answer: 0, why: "= only ever compares. Storing a value always uses the arrow ←." },
  { q: "for i ← 0 to 3 runs its body for which values of i?", options: ["0, 1, 2 and 3", "0, 1 and 2", "1, 2 and 3"], answer: 0, why: "Both ends are included, so it runs four times." },
  { q: "An array a holds 6 values. What is the position of the last one?", options: ["5", "6", "It depends on the values"], answer: 0, why: "Positions start at 0, so the last one is length(a) - 1 = 5." },
  { q: "Which lines run when an if condition is false?", options: ["None of the lines indented under it", "Only the first indented line", "All of them, but later"], answer: 0, why: "Indentation marks what belongs to the if. When it's false, the whole indented block is skipped." },
];
