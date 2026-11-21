import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which of these is a palindrome?", options: ["noon", "moon", "nono"], answer: 0, why: "noon reads the same backwards. moon backwards is noom, and nono is onon." },
  { q: "Checking \"kayak\" with two pointers from the ends, how many comparisons are made?", options: ["2", "5", "3"], answer: 0, why: "k with k, then a with a. The pointers then meet at the middle y, which matches itself." },
  { q: "How many centres does a string of 6 characters have?", options: ["11", "6", "12"], answer: 0, why: "6 character centres for odd lengths, plus 5 gaps between neighbours for even lengths: 2 · 6 − 1." },
  { q: "Where is the centre of \"abba\"?", options: ["The gap between the two b's", "The first b", "The second b"], answer: 0, why: "Even-length palindromes have no middle character; their centre is the gap in the middle." },
  { q: "Expanding around a centre, the new ends differ. Why stop there?", options: ["Every wider string around this centre contains that mismatched pair", "The string has ended", "Palindromes can't be longer than 3"], answer: 0, why: "A wider string would have those two characters at mirrored positions, so it can't read the same both ways." },
  { q: "What does expanding around every centre cost for a string of length n?", options: ["O(n²) time, O(1) extra space", "O(n³) time, O(1) extra space", "O(n) time, O(n²) space"], answer: 0, why: "2n − 1 centres, each expanding at most about n / 2 times, with only two pointers." },
];
