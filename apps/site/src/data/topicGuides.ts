/**
 * The teaching content of each topic page (/topics/<slug>/), keyed by the topic's name in roadmap.ts.
 * Written in our own words. A topic page is generated only once at least one problem practises it.
 */
export interface TopicGuide {
  /** One sentence: what the pattern does. */
  idea: string;
  /** Clues in a problem statement that this pattern applies. */
  signals: string[];
  /** A short pseudocode skeleton of the pattern (same notation as the code panels). */
  template: string;
  /** Why it beats the obvious approach, in one or two sentences. */
  payoff: string;
}

export const topicGuides: Record<string, TopicGuide> = {
  "Arrays & hashing": {
    idea: "Trade memory for speed: store what you've seen in a hash map or set, so \"have I met this before?\" costs O(1) instead of another scan.",
    signals: [
      "You need to find a partner, a duplicate or a count",
      "The brute force compares every pair",
      "Order doesn't matter, only membership or frequency",
      "Prefix or running totals would answer range questions",
    ],
    template: `seen ← empty map  // value → index
for each index i, value x in nums
    need ← target - x
    if need in seen  // O(1) lookup
        return seen[need], i
    seen[x] ← i`,
    payoff: "An O(n²) \"compare every pair\" becomes one O(n) pass, at the cost of O(n) memory.",
  },
  Sorting: {
    idea: "Put items in order so equal or related values sit together and binary search, two pointers and merging become possible. Which sort to use depends on the data and on what you need to preserve.",
    signals: [
      "Pairs, duplicates or neighbours are easier to spot in order",
      "You need the kth smallest, a median, or ranks",
      "Merging, scheduling or sweeping over intervals",
      "The input is almost sorted already, or has a small value range",
    ],
    template: `// use your language's built-in sort
sort items  // O(n log n)
sort intervals by end
sort people by score, highest first`,
    payoff: "A comparison sort costs O(n log n) once, and then many questions about the data become O(n) or O(log n).",
  },
  "Two pointers": {
    idea: "Walk two indices through the data, either inward from both ends or one reading and one writing, so each step rules something out for good.",
    signals: [
      "The input is sorted, or sorting it is allowed",
      "You compare a pair and can tell which side to move",
      "You must rearrange in place with O(1) extra space",
      "Palindromes, merging, or squeezing from both ends",
    ],
    template: `lo, hi ← 0, length(nums) - 1
while lo < hi
    s ← nums[lo] + nums[hi]
    if s = target
        return lo, hi
    else if s < target
        lo += 1  // drop nums[lo]
    else
        hi -= 1  // drop nums[hi]`,
    payoff: "Each comparison eliminates one element permanently, so a pair search drops from O(n²) to O(n) with O(1) space.",
  },
  Stack: {
    idea: "Keep unfinished items on a stack: the most recent one is always the next to be resolved.",
    signals: [
      "Matching pairs: brackets, tags, open and close",
      "\"The next greater (or smaller) element\" for each position",
      "Undo, nested structure, or evaluating expressions",
      "Something waits until a later item settles it",
    ],
    template: `stack ← empty stack  // waiting
for each index i, value x in nums
    while stack not empty and
            nums[stack.top()] < x
        j ← stack.pop()  // x settles j
        answer[j] ← i - j
    stack.push(i)`,
    payoff: "Each item is pushed once and popped once, so \"look ahead from every position\" in O(n²) becomes O(n).",
  },
  "Binary search": {
    idea: "In sorted data, one comparison with the middle rules out half of what's left, so the search shrinks n → n/2 → n/4 → … → 1.",
    signals: [
      "The input is sorted",
      "You're asked for O(log n)",
      "Find a position, a first or last occurrence, or an insertion point",
      "A yes/no condition flips once as the value grows",
    ],
    template: `lo, hi ← 0, length(nums) - 1
while lo ≤ hi
    mid ← floor((lo + hi) / 2)
    if nums[mid] = target
        return mid
    else if nums[mid] < target
        lo ← mid + 1
    else
        hi ← mid - 1
return lo  // insert position`,
    payoff: "About log₂ n comparisons instead of n: 20 checks for a million items.",
  },
  "Sliding window": {
    idea: "Keep a range [left, right] that you grow on the right and shrink on the left, updating its contents incrementally instead of recomputing them.",
    signals: [
      "Longest, shortest or best contiguous subarray or substring",
      "A condition on the window: no repeats, sum at most k, at most k distinct",
      "The brute force tries every start and every end",
    ],
    template: `left ← 0
for each index right, value x in s
    add(x)  // grow
    while not valid()  // shrink
        remove(s[left])
        left += 1
    best ← max(best, right - left + 1)`,
    payoff: "Each element enters and leaves the window at most once, so O(n²) start-and-end pairs become O(n).",
  },
  "Linked lists": {
    idea: "Rewire next pointers instead of copying values, and use a dummy head so the first node needs no special case.",
    signals: [
      "Reverse, merge, reorder or remove nodes",
      "O(1) extra space is required",
      "You need the node before the one you're changing",
    ],
    template: `prev, curr ← none, head
while curr ≠ none
    nxt ← curr.next  // save the rest
    curr.next ← prev  // flip one
    prev, curr ← curr, nxt
return prev`,
    payoff: "Relinking nodes in place takes O(n) time and O(1) space; copying into an array costs O(n) space.",
  },
  Trees: {
    idea: "Solve the left subtree and the right subtree recursively, then combine their answers at the node.",
    signals: ["Depth, height, balance or paths", "Compare, invert or validate a tree", "Level-by-level questions (use BFS instead)"],
    template: `function solve(node)
    if node = none
        return baseCase
    left ← solve(node.left)
    right ← solve(node.right)
    return combine(node, left, right)`,
    payoff: "Each node is visited once: O(n) time, with O(h) stack space for a tree of height h.",
  },
  Heaps: {
    idea: "A heap always hands you the smallest (or largest) item in O(log n), without sorting everything.",
    signals: ["Top k, kth largest or smallest", "Repeatedly take the best remaining option", "Merging k sorted sources"],
    template: `heap ← empty min-heap
for each x in nums
    heap.push(x)
    if length(heap) > k
        heap.popMin()  // keep k largest
return heap.min()`,
    payoff: "Top k in O(n log k) instead of sorting everything in O(n log n).",
  },
  Backtracking: {
    idea: "Build a candidate one choice at a time, recurse, then undo the choice and try the next.",
    signals: ["Generate all subsets, permutations or combinations", "Place items under constraints", "The answer is a list of every valid arrangement"],
    template: `function backtrack(path, choices)
    if done(path)
        results.push(copy(path))
        return
    for each c in choices
        path.push(c)  // choose
        backtrack(path, next(c))
        path.pop()  // undo`,
    payoff: "Pruning invalid branches early avoids exploring arrangements that can never work.",
  },
  Graphs: {
    idea: "Explore connections with BFS (level by level) or DFS (as deep as possible), marking nodes as visited.",
    signals: ["Grids, networks, dependencies or connections", "Shortest number of steps (BFS)", "Count connected regions"],
    template: `seen ← set {start}
queue ← queue of [start]
while queue not empty
    node ← queue.popFront()
    for each nxt in neighbours(node)
        if nxt not in seen
            seen.add(nxt)
            queue.push(nxt)`,
    payoff: "Every node and edge is handled once: O(V + E).",
  },
  "Dynamic programming": {
    idea: "Build each answer from smaller answers you've already computed, storing them so nothing is solved twice.",
    signals: ["Count the ways, or find the best value", "The answer for n depends on answers for smaller n", "A recursive solution repeats the same subproblems"],
    template: `dp ← array of n + 1, all base
for i ← 1 to n
    dp[i] ← best(dp[i - 1], dp[i - 2])
return dp[n]`,
    payoff: "Overlapping subproblems are solved once each, turning exponential recursion into polynomial time.",
  },
  "Greedy & intervals": {
    idea: "Make the locally best choice at each step when you can show it never rules out the best overall answer.",
    signals: ["Maximise or minimise with one pass", "Intervals to merge, schedule or count", "A running best that can be reset safely"],
    template: `best ← nums[0], cur ← nums[0]
for each x in nums[1..end]
    cur ← max(x, cur + x)
    best ← max(best, cur)
return best`,
    payoff: "One pass, O(n), when the greedy choice is provably safe.",
  },
};
