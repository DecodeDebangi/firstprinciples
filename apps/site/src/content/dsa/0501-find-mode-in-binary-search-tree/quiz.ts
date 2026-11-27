import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why does the in-order walk need no map?", options: ["Equal values are visited one after another, so a single counter tracks each run", "Values never repeat", "It sorts the tree first"], answer: 0, why: "Sorted order groups copies together." },
  { q: "The run reaches 3 and the best so far is 2. What happens to out?", options: ["It becomes just this value", "This value is added to it", "Nothing"], answer: 0, why: "A longer run beats every earlier answer." },
  { q: "The run reaches 2 and the best so far is 2. What happens to out?", options: ["This value is added to it", "It becomes just this value", "Nothing"], answer: 0, why: "A tie joins the answer." },
  { q: "How much extra memory does the map version use?", options: ["O(n)", "O(1)", "O(h)"], answer: 0, why: "One entry per distinct value." },
];
