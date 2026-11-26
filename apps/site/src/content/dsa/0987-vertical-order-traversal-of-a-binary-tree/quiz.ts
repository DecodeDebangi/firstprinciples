import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "A node in column 2 has a left child. What column is the child in?", options: ["1", "3", "2"], answer: 0, why: "A left child is one column left." },
  { q: "Two nodes share row 2 and column 0, with values 6 and 4. Which comes first?", options: ["4", "6", "Whichever was found first"], answer: 0, why: "Ties go smallest value first." },
  { q: "Which single sort puts everything in order?", options: ["By column, then row, then value", "By value only", "By row, then column"], answer: 0, why: "That applies all three rules at once." },
  { q: "Why is walking once per column slow for a chain leaning right?", options: ["Every node has its own column, so there are n walks of n nodes", "Chains have no columns", "It sorts more"], answer: 0, why: "That's n · n work." },
];
