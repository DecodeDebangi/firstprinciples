import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What is 23 % 5?", options: ["3", "4", "4.6"], answer: 0, why: "5 goes into 23 four times (20), leaving 3 over." },
  { q: "What is floor(23 / 5)?", options: ["4", "5", "3"], answer: 0, why: "23 / 5 is 4.6, and floor rounds down to 4." },
  { q: "Which expression gives the last digit of 4728?", options: ["4728 % 10", "floor(4728 / 10)", "4728 / 1000"], answer: 0, why: "Dividing by 10 leaves the last digit, 8, as the remainder." },
  { q: "An array has 5 positions (0 to 4) and i is 4. What is (i + 1) % 5?", options: ["0", "5", "4"], answer: 0, why: "5 % 5 is 0: stepping past the last position wraps back to the start." },
  { q: "Two numbers are each about 1.5 billion. Why might adding them be a problem in Java or C++?", options: ["The sum is over 2.1 billion, too big for a 32-bit int, so it overflows", "Addition is slow for big numbers", "The sum has a remainder"], answer: 0, why: "A 32-bit int tops out at 2,147,483,647; going past it wraps round to a negative number." },
  { q: "How many times does a loop that keeps doing x ← floor(x / 10) run for x = 1,000,000?", options: ["7, once per digit", "1,000,000", "10"], answer: 0, why: "Each step removes one digit, and 1,000,000 has 7 digits." },
];
