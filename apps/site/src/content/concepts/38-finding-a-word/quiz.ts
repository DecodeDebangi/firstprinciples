import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "A text has 10 characters and the word has 4. How many starting positions does the simple search try at most?", options: ["7", "10", "6"], answer: 0, why: "Starts 0 to 10 − 4 = 6: that's 7 windows." },
  { q: "What is the worst case of the simple search, for a text of n and a word of m?", options: ["O(n · m)", "O(n + m)", "O(m²)"], answer: 0, why: "Each of about n starts can match almost all m characters before failing." },
  { q: "Two windows have different hashes. What does that tell you?", options: ["The strings are certainly different", "They might be equal", "Nothing"], answer: 0, why: "Equal strings always get equal hashes, so different hashes rule out a match." },
  { q: "Two windows have the same hash. What does that tell you?", options: ["They might be equal: check the letters", "They're certainly equal", "They're certainly different"], answer: 0, why: "Different strings can share a hash, a collision, so a match must be confirmed." },
  { q: "Why is sliding a rolling hash one place cheap?", options: ["It removes one letter's share and adds one letter: O(1)", "It rereads the whole window", "It sorts the window"], answer: 0, why: "Only the letter leaving and the letter arriving change, whatever the window's length." },
  { q: "You need every place where some rearrangement of p appears. What do you slide?", options: ["A window of letter counts", "A rolling hash of the letters in order", "Nothing: sort the text"], answer: 0, why: "Rearrangements have the same letter counts, so compare counts, updating them as the window moves." },
];
