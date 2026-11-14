import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What does return do inside a function?", options: ["Stops the function and hands back the answer", "Starts the function again", "Prints the answer and keeps going"], answer: 0, why: "return ends the function right there. Lines after it don't run." },
  { q: "A loop runs its body once per value. How many checks for a list of 200 values?", options: ["200", "400", "40,000"], answer: 0, why: "One check per value: the work grows in step with the input, which is called linear." },
  { q: "A loop inside a loop checks every pair. Roughly what happens to the work when the list doubles?", options: ["It about quadruples", "It doubles", "It stays the same"], answer: 0, why: "Every new value pairs with all the others, so twice the values means about four times the pairs." },
  { q: "How many pairs do 5 values make?", options: ["10", "25", "5"], answer: 0, why: "5 × 4 ÷ 2 = 10: each value pairs with the 4 others, and each pair is counted once." },
  { q: "What is recursion?", options: ["A function calling itself on a smaller piece of the problem", "A loop that never ends", "Running two loops at once"], answer: 0, why: "Each call handles a smaller piece and waits for the smaller calls to finish." },
];
