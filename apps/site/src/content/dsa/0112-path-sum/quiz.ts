import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What counts as a path here?", options: ["From the root down to a leaf", "Any two connected nodes", "From any node down to a leaf"], answer: 0, why: "The sum must use a root-to-leaf path, ending at a node with no children." },
  { q: "Target 22, and a call reaches a node with value 5 needing 9. What does it pass to its children?", options: ["4", "14", "22"], answer: 0, why: "The amount still needed drops by the node's value: 9 − 5 = 4." },
  { q: "Why is reaching 0 at a node that has children not enough?", options: ["The path must end at a leaf", "0 means the target was too small", "It is enough"], answer: 0, why: "Only a leaf can end a path, so the check happens when the call reaches a leaf." },
  { q: "Why can values make an early stop unsafe?", options: ["Negative values can bring a sum back down", "Values are always sorted", "The tree might be empty"], answer: 0, why: "With negative numbers, going over the target partway down doesn't rule a path out." },
];
