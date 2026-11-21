import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Counting lowercase letters in 26 slots, which slot does 'd' use?", options: ["3", "4", "100"], answer: 0, why: "code('d') - code('a') = 100 - 97 = 3. Slots start at 0 for 'a'." },
  { q: "How much space do the 26 slots take for a text of a million letters?", options: ["O(1): always 26 slots", "O(n): one per letter", "O(log n)"], answer: 0, why: "The number of slots depends on the alphabet, not on the length of the text." },
  { q: "The text can contain capitals, digits and spaces. What should you count with?", options: ["A hash map from character to count", "An array of 26", "A sorted copy of the text"], answer: 0, why: "26 slots only cover a to z. A map holds any character." },
  { q: "Why does finding the first character that appears only once need two passes?", options: ["A character's count isn't final until the whole string is read", "Strings can't be read backwards", "The first pass sorts the string"], answer: 0, why: "A character that looks unique early on may appear again near the end." },
  { q: "What is the first-appearance pattern of \"level\"?", options: ["0 1 2 1 0", "0 1 2 3 4", "1 2 3 2 1"], answer: 0, why: "l is 0, e is 1, v is 2, then e reuses 1 and l reuses 0." },
  { q: "Which key makes \"stressed\" and \"desserts\" equal?", options: ["Their letters sorted", "Their first-appearance patterns", "Their first letters"], answer: 0, why: "Both sort to \"deerssst\". Their patterns differ (0 1 2 3 0 0 3 4 against 0 1 2 2 1 3 4 2), and so do their first letters." },
];
