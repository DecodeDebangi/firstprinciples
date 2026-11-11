/**
 * The study roadmap on the home page: topics in the order they build on each other.
 * A problem appears under every topic whose tags it carries (its `topics` frontmatter),
 * so new problems slot in automatically. Add a tag here when a problem uses a new one.
 */
export interface RoadmapTopic {
  name: string;
  /** What the topic is for, in a few words. */
  blurb: string;
  tags: string[];
}

export interface RoadmapStep {
  title: string;
  topics: RoadmapTopic[];
}

export const roadmap: RoadmapStep[] = [
  {
    title: "Foundations",
    topics: [
      { name: "Arrays & hashing", blurb: "Store, look up and count in one pass.", tags: ["Array", "Hash map", "Prefix sum", "Math", "String"] },
    ],
  },
  {
    title: "Core patterns",
    topics: [
      { name: "Two pointers", blurb: "Walk from both ends to skip whole pairs.", tags: ["Two pointers"] },
      { name: "Stack", blurb: "Last in, first out: matching and undoing.", tags: ["Stack", "Queue"] },
    ],
  },
  {
    title: "Searching and sequences",
    topics: [
      { name: "Binary search", blurb: "Halve what's left with every comparison.", tags: ["Binary search"] },
      { name: "Sliding window", blurb: "Grow and shrink a range in one pass.", tags: ["Sliding window"] },
      { name: "Linked lists", blurb: "Rewire pointers without losing the chain.", tags: ["Linked list"] },
    ],
  },
  {
    title: "Recursion and structure",
    topics: [
      { name: "Trees", blurb: "Solve the left and right halves, then combine.", tags: ["Tree", "Binary tree", "BST"] },
      { name: "Heaps", blurb: "Always know the smallest or largest so far.", tags: ["Heap", "Priority queue"] },
      { name: "Backtracking", blurb: "Try a choice, recurse, then undo it.", tags: ["Backtracking", "Recursion"] },
    ],
  },
  {
    title: "Advanced",
    topics: [
      { name: "Graphs", blurb: "Explore connections with BFS and DFS.", tags: ["Graph", "BFS", "DFS"] },
      { name: "Dynamic programming", blurb: "Build each answer from smaller answers.", tags: ["Dynamic programming"] },
      { name: "Greedy & intervals", blurb: "Take the best local choice, safely.", tags: ["Greedy", "Intervals"] },
    ],
  },
];
