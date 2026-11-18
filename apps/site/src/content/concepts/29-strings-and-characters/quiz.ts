import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "In s = \"planet\", what is s[2]?", options: ["'a'", "'l'", "'n'"], answer: 0, why: "Positions start at 0: s[0] is 'p', s[1] is 'l', s[2] is 'a'." },
  { q: "'a' has code 97. What is code('d') - code('a')?", options: ["3", "4", "100"], answer: 0, why: "'d' is 100, three after 'a', so it maps to position 3 (counting 'a' as 0)." },
  { q: "Why can an array of 26 counters replace a hash map when counting lowercase letters?", options: ["Each letter maps to a fixed position from 0 to 25", "Arrays are always faster than maps", "Strings are stored as arrays"], answer: 0, why: "code(c) - code('a') gives every lowercase letter its own slot." },
  { q: "Building a string of n characters with out ← out + c in a loop takes how long?", options: ["O(n²): each step copies all of out", "O(n)", "O(1)"], answer: 0, why: "Strings are immutable, so every addition builds a new string, copying 1, then 2, then 3… characters." },
  { q: "What's the usual fix for building a long string piece by piece?", options: ["Collect the pieces in a list and join them once at the end", "Reverse the string first", "Use shorter pieces"], answer: 0, why: "Adding to a list is O(1), and one join writes each character once: O(n) in total." },
  { q: "Are \"listen\" and \"silent\" anagrams?", options: ["Yes: they have exactly the same letter counts", "No: the letters are in a different order"], answer: 0, why: "Anagrams use the same letters the same number of times, in any order." },
];
