import type { QuizQuestion } from "@firstprinciples/ui";

/** "Check yourself" on the page, and part of the question bank on /practice/. */
export const questions: QuizQuestion[] = [
  { q: "When is a binary tree height-balanced?", options: ["At every node, its two subtrees' heights differ by at most 1", "Every leaf is at the same depth", "The root's two subtrees hold the same number of nodes"], answer: 0, why: "The rule is about heights, and it must hold at every node, not only the root." },
  { q: "You insert 1, 2, 3, 4, 5 in that order into an empty BST. What do you get?", options: ["A chain going right, height 5", "A balanced tree of height 3", "A chain going left"], answer: 0, why: "Each value is bigger than everything before it, so it always goes right to the bottom." },
  { q: "Why does a BST need to stay balanced?", options: ["Search, insert and delete cost O(h), and balance keeps h near log n", "Balanced trees use less memory", "Unbalanced trees break the order rule"], answer: 0, why: "An unbalanced BST is still valid, just slow: a chain makes every operation O(n)." },
  { q: "Building a BST from a sorted list, which value should be the root?", options: ["The middle one", "The first one", "The last one"], answer: 0, why: "Half the values then go on each side, and repeating that in each half keeps every height difference at most 1." },
  { q: "Checking balance bottom-up, what does a call return for an unbalanced subtree?", options: ["−1, a signal no real height can have", "Its height as usual", "0"], answer: 0, why: "−1 travels up so every caller can stop without measuring anything again." },
  { q: "What do self-balancing trees like AVL and red-black trees do after an insert or delete?", options: ["Fix the shape with a few rotations so the height stays O(log n)", "Rebuild the whole tree", "Nothing: they're always balanced by luck"], answer: 0, why: "A rotation moves a child up and its parent down while keeping the order, in O(1), and only nodes on the changed path need it." },
];
