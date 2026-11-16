import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "Which input most often breaks code that reads node.next?", options: ["The empty list", "A list of ten nodes", "A sorted list"], answer: 0, why: "With no nodes, head is none, and reading none.next crashes." },
  { q: "Your function may remove the first node. What should it return?", options: ["dummy.next, the real list after a dummy node", "The original head", "The last node"], answer: 0, why: "If the head was removed, the original head points at a removed node; dummy.next is always the current first node." },
  { q: "After rearranging a list, the result loops forever when printed. What's the likely bug?", options: ["The new last node still points to another node instead of none", "A value was compared instead of a node", "The list was empty"], answer: 0, why: "Every rearrangement must leave the new last node pointing to none." },
  { q: "How do you check that two pointers are on the same node in Python?", options: ["a is b", "a.val == b.val", "len(a) == len(b)"], answer: 0, why: "is compares identity: the very same object. Equal values can sit in different nodes." },
  { q: "What is none written as in C++?", options: ["nullptr", "None", "undefined"], answer: 0, why: "C++ uses nullptr for a pointer that points to nothing; Python uses None and Java and JavaScript use null." },
  { q: "In which of these languages does an unlinked node stay in memory until you free it yourself?", options: ["C++", "Python", "JavaScript"], answer: 0, why: "Python, Java and JavaScript free unreachable objects automatically; C++ needs delete for nodes made with new." },
];
