import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What is the postfix expression \"6 2 - 3 *\" equal to?", options: ["12", "0", "-12"], answer: 0, why: "6 2 - is 4, then 4 3 * is 12." },
  { q: "Evaluating postfix, an operator pops b and then a. Which order is the calculation?", options: ["a op b: the one popped second is on the left", "b op a", "It doesn't matter"], answer: 0, why: "a was pushed first, so it's the left side; order matters for - and /." },
  { q: "A min stack keeps a second stack of minimums. After push 4, push 2, push 6, what's on top of the min stack?", options: ["2", "6", "4"], answer: 0, why: "Each level stores the smallest value so far: 4, then 2, then min(6, 2) = 2." },
  { q: "Why can getMin be O(1) after a pop?", options: ["The minimum for the level below is already stored", "It searches the remaining values", "It never changes"], answer: 0, why: "Each level's minimum was saved when it was pushed, so popping just reveals the previous one." },
  { q: "A queue made of two stacks: when does it pour values from the in stack to the out stack?", options: ["Only when out is empty and a value is needed", "After every push", "After every pop"], answer: 0, why: "Pouring reverses the order; doing it only when out is empty keeps the oldest values on top." },
  { q: "Why is each operation of the two-stack queue O(1) amortised?", options: ["Every value is moved across at most once", "Pouring is always one step", "The stacks never hold more than one value"], answer: 0, why: "A single pour can be long, but each value is pushed, poured and popped once, so the total work is O(n) for n operations." },
];
