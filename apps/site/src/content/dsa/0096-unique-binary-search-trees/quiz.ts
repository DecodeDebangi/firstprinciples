import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "With values 1 to 5 and root 3, how many values go left?", options: ["2", "3", "1"], answer: 0, why: "1 and 2, the values below 3." },
  { q: "Why multiply the left and right counts?", options: ["Every left shape can pair with every right shape", "To count nodes", "Because the tree is balanced"], answer: 0, why: "The two sides are chosen independently." },
  { q: "Why is c[0] set to 1?", options: ["An empty side has exactly one shape: empty", "To avoid division by zero", "It's a guess"], answer: 0, why: "Otherwise roots with an empty side would count 0." },
  { q: "What is c[3]?", options: ["5", "6", "3"], answer: 0, why: "c[0]c[2] + c[1]c[1] + c[2]c[0] = 2 + 1 + 2." },
];
