import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "When is a node reported?", options: ["When its id is seen for the second time", "Every time its id repeats", "When it's a leaf"], answer: 0, why: "Reporting only at exactly 2 gives one node per kind." },
  { q: "Why must the walk be bottom-up?", options: ["A node's id is built from its children's ids", "To save memory", "It doesn't matter"], answer: 0, why: "Children are named first, then their parent." },
  { q: "Why is writing subtrees out O(n²) on a chain?", options: ["Each node writes its whole subtree: n + (n − 1) + … + 1", "The map is slow", "Strings can't be hashed"], answer: 0, why: "The texts repeat their children's texts in full." },
  { q: "Why can the ids version stay O(n)?", options: ["Each key is three small values, whatever the subtree's size", "It skips leaves", "It sorts the ids"], answer: 0, why: "Two ids and a value, looked up once per node." },
];
