import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "The largest value above a node is 7 and it holds 7. Is it good?", options: ["Yes: nothing above is bigger", "No", "Only if it's a leaf"], answer: 0, why: "Equal isn't bigger." },
  { q: "What does a node pass to its children?", options: ["max(largest above, its own value)", "Its own value", "The root's value"], answer: 0, why: "Children need the largest value on their whole path." },
  { q: "Is the root always good?", options: ["Yes: nothing is above it", "Only if it's the largest", "No"], answer: 0, why: "Its path is just itself." },
  { q: "Which direction does this recursion pass information?", options: ["Down, from parent to children", "Up, from children to parent", "Both"], answer: 0, why: "It's top-down: the fact is about what's above." },
];
