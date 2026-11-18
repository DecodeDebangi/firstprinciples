import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What's a base case in a recursive function?", options: ["An input small enough to answer without calling the function again", "The first call made", "The largest input it can handle"], answer: 0, why: "It's where the calls stop. Every other call must get closer to it." },
  { q: "factorial(n) returns n * factorial(n - 1). When does the first multiplication happen?", options: ["After the base case returns", "Straight away, in the first call", "Halfway through"], answer: 0, why: "Every call waits for the call below it, so nothing is multiplied until the base case answers." },
  { q: "How much stack space does factorial(n) use?", options: ["O(n): n calls are waiting at the deepest point", "O(1)", "O(log n)"], answer: 0, why: "Each waiting call is a frame on the call stack, and all n wait at once." },
  { q: "Why is fib(n) = fib(n - 1) + fib(n - 2), with no memo, so slow?", options: ["It works out the same values again and again in different branches", "Addition is slow", "It has no base case"], answer: 0, why: "The call tree repeats whole subtrees, and its size nearly doubles with each extra n." },
  { q: "What does a memo do in a recursive function?", options: ["Stores each answer the first time, so later calls look it up instead of recomputing", "Limits how deep the recursion goes", "Sorts the inputs"], answer: 0, why: "With a memo, each distinct input is worked out once." },
  { q: "A recursive function calls itself with the same n every time. What happens?", options: ["It never reaches the base case and eventually overflows the stack", "It returns the right answer slowly", "It stops after one call"], answer: 0, why: "Each call must move towards the base case; otherwise the calls pile up until the stack is full." },
];
