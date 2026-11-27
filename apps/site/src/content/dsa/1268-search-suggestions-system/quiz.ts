import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page. */
export const questions: QuizQuestion[] = [
  { q: "Why sort the products first?", options: ["So the first matches found are the alphabetically smallest", "Binary search needs it, and nothing else does", "To remove duplicates"], answer: 0, why: "Both the scan and the binary search rely on sorted order for the right three." },
  { q: "After sorting, where do the products starting with \"ban\" sit?", options: ["In one block, starting where \"ban\" would be inserted", "Spread through the list", "At the end"], answer: 0, why: "Everything between \"ban\" and \"bao\" starts with \"ban\"." },
  { q: "In the trie version, what does each node store?", options: ["The first three products, alphabetically, that pass through it", "Every product below it", "How many products pass through"], answer: 0, why: "Filled by inserting the products in sorted order." },
  { q: "When does the trie beat binary search?", options: ["When many words are typed against the same products", "Always", "Never"], answer: 0, why: "It's built once; after that each typed letter is a single step." },
];
