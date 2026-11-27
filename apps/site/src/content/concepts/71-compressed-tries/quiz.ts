import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which trie nodes does compression merge away?", options: ["Nodes with exactly one child that end no word", "Every leaf", "Nodes that end a word"], answer: 0, why: "Nothing branches there and nothing is marked, so the node adds no information." },
  { q: "In a compressed trie, every node except the root…", options: ["Branches, or ends a word, or both", "Holds one letter", "Has two children"], answer: 0, why: "Any other node would have been merged with its child." },
  { q: "Inserting \"cab\" next to a node labelled \"car\". What happens?", options: ["\"car\" splits into \"ca\" with \"r\" below, and \"b\" is added beside \"r\"", "\"car\" is replaced by \"cab\"", "\"cab\" goes under \"car\""], answer: 0, why: "The words part after \"ca\", so the label must split there." },
  { q: "Why compress a trie?", options: ["Fewer nodes: at most about two per word, however long the words", "Faster to build", "It sorts the words"], answer: 0, why: "Long unbranching stretches cost one node instead of one per letter." },
];
