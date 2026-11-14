import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "What are the three steps inside a backtracking loop?", options: ["Choose, explore, undo", "Sort, search, return", "Push, pop, peek"], answer: 0, why: "Make a choice, recurse, then take the choice back before trying the next one." },
  { q: "Why record a copy of path instead of path itself?", options: ["path keeps changing; you need a snapshot", "A copy is faster", "The language requires it"], answer: 0, why: "Every recorded entry would point at the same list, which ends up empty after all the undoing." },
  { q: "In the reach-the-target example with sorted candidates, why can the loop stop (not just skip) at a candidate bigger than what's still needed?", options: ["Every later candidate is even bigger", "The answer is already found", "Breaking is just faster syntax"], answer: 0, why: "Sorted order means nothing after c[i] can fit either." },
  { q: "How many subsets does a set of 4 distinct numbers have?", options: ["16", "8", "24"], answer: 0, why: "Each number is in or out: 2⁴ = 16." },
  { q: "A problem asks only for the number of ways to reach a target, and sub-questions repeat. What's likely better than backtracking?", options: ["Dynamic programming", "A heap", "Binary search"], answer: 0, why: "Counting with repeated subproblems is DP's territory; listing every answer is backtracking's." },
];
