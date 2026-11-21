import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Splitting \"  to  be \" into words by skipping runs of spaces, what do you get?", options: ["[\"to\", \"be\"]", "[\"\", \"to\", \"\", \"be\", \"\"]", "[\"to be\"]"], answer: 0, why: "Runs of spaces are skipped, so only the two runs of letters become words." },
  { q: "Building a sentence with s += word for n words, what can it cost when strings can't be changed?", options: ["O(n²) characters copied", "O(n)", "O(log n)"], answer: 0, why: "Each += copies everything built so far, and those copies add up quadratically." },
  { q: "What is code('7') - code('0')?", options: ["7", "55", "48"], answer: 0, why: "Digits are stored in order, '0' at 48 up to '9' at 57, so the difference is the digit's value." },
  { q: "Reading \"352\", result is 35 after two digits. What is it after the '2'?", options: ["352", "37", "70"], answer: 0, why: "Shift one place left and add the digit: 35 · 10 + 2." },
  { q: "When should a parser check that the number still fits?", options: ["Before each result · 10 + d", "Only at the very end", "Never: numbers can't overflow"], answer: 0, why: "Once the value has overflowed it's already wrong, so the check has to come first." },
];
