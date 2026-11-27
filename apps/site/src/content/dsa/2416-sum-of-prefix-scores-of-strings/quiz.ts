import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "What does a node's count tell you here?", options: ["How many words start with the prefix on its path", "How many words end there", "How many children it has"], answer: 0, why: "Every word passing through it starts with that path." },
  { q: "Why insert every word before scoring any?", options: ["A score counts words that may come later in the list", "Inserting is faster in bulk", "To sort them"], answer: 0, why: "The counts must be final before they're added up." },
  { q: "Why is the map version O(L²) per word?", options: ["Copying each of the L prefixes costs up to L letters", "Maps are slow", "It sorts each word"], answer: 0, why: "1 + 2 + … + L letters." },
  { q: "For car, cat, cart, dog, what is dog's score?", options: ["3", "1", "4"], answer: 0, why: "Each of d, do, dog starts only dog." },
];
