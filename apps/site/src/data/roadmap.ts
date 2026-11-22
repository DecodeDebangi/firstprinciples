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
    title: "Start here",
    topics: [
      { name: "Coding basics", blurb: "How to read the code, arrays, loops, numbers, strings, references, recursion, and how to read a problem.", tags: ["Basics"] },
    ],
  },
  {
    title: "Foundations",
    topics: [
      { name: "Big-O & complexity", blurb: "How to measure and compare an algorithm's cost.", tags: ["Complexity"] },
      { name: "Arrays & hashing", blurb: "Store, look up and count in one pass, and find your way around a grid.", tags: ["Array", "Hash map", "Prefix sum", "Matrix", "Math"] },
      { name: "Strings", blurb: "Count characters, compare and search text, and take it apart.", tags: ["String", "Palindrome", "String matching"] },
      { name: "Sorting", blurb: "Put things in order, and know which sort to use when.", tags: ["Sorting"] },
    ],
  },
  {
    title: "Core patterns",
    topics: [
      { name: "Two pointers", blurb: "Walk from both ends to skip whole pairs.", tags: ["Two pointers"] },
      { name: "Stack", blurb: "Last in, first out: matching, undoing and evaluating.", tags: ["Stack", "Queue"] },
      { name: "Monotonic stack", blurb: "Find the next or previous bigger or smaller item for everything, in one pass.", tags: ["Monotonic stack"] },
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
      { name: "Tries", blurb: "Store words letter by letter, so shared beginnings are stored once.", tags: ["Trie"] },
      { name: "Heaps", blurb: "Always know the smallest or largest so far.", tags: ["Heap", "Priority queue"] },
      { name: "Backtracking", blurb: "Try a choice, recurse, then undo it.", tags: ["Backtracking", "Recursion"] },
    ],
  },
  {
    title: "Advanced",
    topics: [
      { name: "Graphs", blurb: "Explore connections with BFS and DFS.", tags: ["Graph", "BFS", "DFS"] },
      { name: "Union-find", blurb: "Keep track of which things are connected as links are added.", tags: ["Union-find"] },
      { name: "Dynamic programming", blurb: "Build each answer from smaller answers.", tags: ["Dynamic programming"] },
      { name: "Greedy & intervals", blurb: "Take the best local choice, safely.", tags: ["Greedy", "Intervals"] },
      { name: "Bit manipulation", blurb: "Work directly with the 0s and 1s inside a number.", tags: ["Bit manipulation"] },
    ],
  },
];

/** Tags nearly every problem carries; they decide a problem's home only when nothing more specific does. */
export const GENERIC = new Set(["Array", "Math"]);
export const allTopics = roadmap.flatMap((s) => s.topics);
export const topicSlug = (name: string) =>
  name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const topicOf = (tag: string) => allTopics.find((t) => t.tags.includes(tag));

/** The ONE topic a problem lives under: its first specific tag, else its first generic one. */
export function homeTopic(tags: string[]): RoadmapTopic | undefined {
  const specific = tags.find((tag) => !GENERIC.has(tag) && topicOf(tag));
  return topicOf(specific ?? tags.find((tag) => topicOf(tag)) ?? "");
}

/** Every topic a problem practises: its home plus any topic matched by a specific tag. */
export function practisedTopics(tags: string[]): RoadmapTopic[] {
  const home = homeTopic(tags);
  return allTopics.filter((t) => t === home || tags.some((tag) => !GENERIC.has(tag) && t.tags.includes(tag)));
}
