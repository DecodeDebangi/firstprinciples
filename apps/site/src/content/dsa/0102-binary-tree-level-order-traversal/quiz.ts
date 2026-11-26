import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Which structure gives the nodes level by level, left to right?", options: ["A queue", "A stack", "A sorted list"], answer: 0, why: "A queue hands back nodes in the order they were added, so a whole level comes out before the next one." },
  { q: "How does the queue approach know where one level ends?", options: ["It notes the queue's length before taking that level out", "It looks for a null marker in the tree", "It counts the leaves"], answer: 0, why: "At the start of a level, the queue holds exactly that level's nodes, so its length says how many to take." },
  { q: "Why is one walk per level slower?", options: ["Each walk starts again from the root", "It skips some nodes", "It uses a queue"], answer: 0, why: "Walking down to depth d for every level revisits the upper levels again and again." },
  { q: "With the queue, how many times is each node added and taken out?", options: ["Once each", "Once per level above it", "Twice"], answer: 0, why: "Each node joins the queue once, when its parent is taken out, and leaves once: O(n) in total." },
];
