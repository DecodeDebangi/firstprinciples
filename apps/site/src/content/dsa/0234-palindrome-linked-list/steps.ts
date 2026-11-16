import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { values: number[] };
type P = Input;
export const example: Input = { values: [3, 7, 5, 7, 3] };
export const fields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const id = (i: number) => (i < 0 ? "end" : `n${i}`);
/** The list as given: every node points right, the last to none. */
const plain = (values: number[], pointers: Record<string, number> = {}, tones: Record<number, Tone> = {}): ListRow => ({
  nodes: [...values.map((v, i) => ({ id: id(i), val: v })), END], arrows: values.map(() => "right" as const),
  pointers: Object.fromEntries(Object.entries(pointers).map(([k, i]) => [k, id(i)])), tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [id(Number(i)), t])),
});

const mirror: Approach<P> = {
  id: "mirror",
  name: "Walk to each node's mirror",
  code: `function isPalindrome(head)
    n ← length of the list
    left ← head
    for i ← 0 to floor(n / 2) - 1
        right ← head
        repeat n - 1 - i times
            right ← right.next
        if left.val ≠ right.val then return false
        left ← left.next
    return true
`,
  run({ values }, t) {
    const n = values.length;
    for (let k = 0; k < n; k++) t.op();
    t.step({ line: 2, array: [], lists: [plain(values, { left: 0 })], vars: { n },
      message: `A palindrome reads the same from both ends, so compare the 1st node with the last, the 2nd with the 2nd-last, and so on. Count the list first: n = ${n}. A singly linked list can't walk backwards, so each "mirror" node has to be reached from the head.` });
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const j = n - 1 - i;
      for (let k = 0; k < j; k++) t.op();
      t.op();
      const same = values[i] === values[j];
      t.step({ line: 8, array: [], lists: [plain(values, { left: i, right: j }, { [i]: same ? "found" : "miss", [j]: same ? "found" : "miss", ...Object.fromEntries(Array.from({ length: i }, (_, k) => [[k, "settled"], [n - 1 - k, "settled"]]).flat()) })], vars: { i, steps: j },
        message: same ? `Walk right ${j} step${j === 1 ? "" : "s"} from the head to the mirror of the ${values[i]}. It's ${values[j]}: ${values[i]} = ${values[j]}, so this pair matches.`
          : `Walk right ${j} step${j === 1 ? "" : "s"} from the head to the mirror of the ${values[i]}. It's ${values[j]}: ${values[i]} ≠ ${values[j]}, so the list isn't a palindrome.` });
      if (!same) {
        t.step({ line: 8, array: [], lists: [plain(values, { left: i, right: j }, { [i]: "miss", [j]: "miss" })], vars: { i }, done: "notfound", message: "Return false." });
        return;
      }
    }
    t.step({ line: 10, array: [], lists: [plain(values, {}, Object.fromEntries(values.map((_, k) => [k, "settled" as Tone])))], vars: {}, done: "found",
      message: `Every pair matched: return true. But each check walked from the head again: about 3n² / 8 steps in total, O(n²), with O(1) space.` });
  },
};

const array: Approach<P> = {
  id: "array",
  name: "Copy into an array, two pointers",
  code: `function isPalindrome(head)
    vals ← empty list
    curr ← head
    while curr ≠ none
        vals.push(curr.val)
        curr ← curr.next
    i, j ← 0, length(vals) - 1
    while i < j
        if vals[i] ≠ vals[j] then return false
        i += 1
        j -= 1
    return true
`,
  run({ values }, t) {
    const n = values.length;
    t.step({ line: 3, array: [], lists: [plain(values, { curr: 0 })], vars: {},
      message: "An array can be read from both ends; a singly linked list can't. So copy the values into an array first." });
    for (let k = 0; k < n; k++) {
      t.op();
      t.step({ line: 5, array: [], lists: [plain(values, { curr: k }, { ...Object.fromEntries(Array.from({ length: k }, (_, q) => [q, "visited" as Tone])), [k]: "active" })], vars: { copied: k + 1 },
        message: `Copy ${values[k]} into vals.` });
    }
    let i = 0, j = n - 1;
    const done: Record<number, Tone> = {};
    t.step({ line: 7, array: [...values], pointers: { i, j }, vars: { i, j },
      message: `vals is [${values.join(", ")}]. Now i starts at the front and j at the back, and they walk towards each other.` });
    while (i < j) {
      t.op();
      const same = values[i] === values[j];
      t.step({ line: 9, array: [...values], pointers: { i, j }, tones: { ...done, [i]: same ? "found" : "miss", [j]: same ? "found" : "miss" }, vars: { i, j },
        badge: { at: i, text: `${values[i]} ${same ? "=" : "≠"} ${values[j]}` },
        message: same ? `vals[${i}] = ${values[i]} and vals[${j}] = ${values[j]} match: move both inwards.` : `vals[${i}] = ${values[i]} but vals[${j}] = ${values[j]}: not a palindrome. Return false.` });
      if (!same) {
        t.step({ line: 9, array: [...values], pointers: { i, j }, tones: { ...done, [i]: "miss", [j]: "miss" }, vars: { i, j }, done: "notfound", message: "Return false." });
        return;
      }
      done[i] = "settled"; done[j] = "settled"; i++; j--;
    }
    t.step({ line: 12, array: [...values], pointers: { i: Math.min(i, n - 1), j: Math.max(j, 0) }, tones: Object.fromEntries(values.map((_, k) => [k, "settled" as Tone])), vars: { i, j }, done: "found",
      message: `i and j have met${n % 2 ? ` at the middle ${values[(n - 1) / 2]}, which matches itself` : ""}: every pair matched. Return true. O(n) time, but vals copies the whole list: O(n) space.` });
  },
};

const reverseHalf: Approach<P> = {
  id: "reverse-half",
  name: "Reverse the second half (optimal)",
  code: `function isPalindrome(head)
    slow, fast ← head, head
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
    prev ← none  // reverse from slow on
    curr ← slow
    while curr ≠ none
        nxt ← curr.next
        curr.next ← prev
        prev ← curr
        curr ← nxt
    left, right ← head, prev
    while right ≠ none
        if left.val ≠ right.val then return false
        left ← left.next
        right ← right.next
    return true
`,
  run({ values }, t) {
    const n = values.length;
    /** The list after reversing nodes m..done-1 (done = first node not yet reversed). */
    let m = 0, doneUpTo = 0;
    const row = (pointers: Record<string, number>, tones: Record<number, Tone> = {}): ListRow => {
      const arrows: ListRow["arrows"] = values.map((_, i) => {
        // arrow between node i and i+1 (or END)
        if (i === n - 1 && m === n - 1) return "right"; // a one-node second half: it points to none
        if (i < m - 1) return "right";
        if (i === m - 1) return "right"; // node m-1 still points to m
        if (i + 1 < doneUpTo) return "left"; // i+1 has been reversed to point back at i
        if (i < doneUpTo) return null; // i is reversed, i+1 not yet: no link between them
        return "right";
      });
      const r = plain(values, pointers, tones);
      return { ...r, arrows, skips: doneUpTo > m && m < n - 1 ? [{ from: id(m), to: "end" }] : undefined };
    };
    let slow = 0, fast = 0;
    t.step({ line: 2, array: [], lists: [row({ slow, fast })], vars: {},
      message: "No extra array this time. Step 1: find the middle. slow moves one node per round, fast moves two, so when fast reaches the end, slow is halfway." });
    while (fast < n && fast + 1 < n) {
      t.op();
      const lastRound = !(fast + 2 < n && fast + 3 < n);
      slow++; fast += 2;
      t.step({
        ...(lastRound ? { ask: { q: "fast is about to reach the end. Where will slow be?", options: ["At the middle of the list", "At the end too", "Still at the head"], answer: 0 } } : {}),
        line: 5, array: [], lists: [row({ slow, ...(fast < n ? { fast } : { fast: -1 }) }, { [slow]: "active" })], vars: {},
        message: `slow moves to the ${values[slow]}, fast jumps to ${fast < n ? `the ${values[fast]}` : "none"}.${lastRound ? ` fast can't go two more, so slow is at the middle: the second half starts at the ${values[slow]}.` : ""}` });
    }
    if (n === 1) t.op();
    m = slow; doneUpTo = m;
    t.step({ line: 7, array: [], lists: [row({ curr: m }, { [m]: "active" })], vars: {},
      message: `Step 2: reverse the second half, from the ${values[m]} to the end, so it can be read backwards. Same three-pointer reversal as Reverse Linked List.` });
    for (let c = m; c < n; c++) {
      t.op();
      doneUpTo = c + 1;
      t.step({ line: 12, array: [], lists: [row({ prev: c, ...(c + 1 < n ? { curr: c + 1 } : { curr: -1 }) }, { [c]: "active" })], vars: {},
        message: c === m ? `The ${values[c]} now points to none: it will be the end of the reversed half.` : `The ${values[c]} now points back to the ${values[c - 1]}.${c === n - 1 ? " curr is none: the second half is reversed, and prev is its new first node." : ""}` });
    }
    let left = 0, right = n - 1;
    const settled: Record<number, Tone> = {};
    t.step({ ...(m < n - 1 ? { ask: { q: "The second half is reversed. Which node is prev on?", options: [`The ${values[n - 1]} that was last: the reversed half starts there`, `The ${values[m]} at the middle`, "none"], answer: 0 } } : {}),
      line: 13, array: [], lists: [row({ left, right })], vars: {},
      message: `Step 3: left starts at the head, right at prev, the old last node. Walking right now goes backwards through the original list.` });
    while (right >= m) {
      t.op();
      const same = values[left] === values[right];
      t.step({ line: 15, array: [], lists: [row({ left, right }, { ...settled, [left]: same ? "found" : "miss", [right]: same ? "found" : "miss" })], vars: {},
        message: same ? `left holds ${values[left]}, right holds ${values[right]}: they match.${left === right ? " (That's the middle node compared with itself.)" : ""}` : `left holds ${values[left]}, right holds ${values[right]}: ${values[left]} ≠ ${values[right]}, not a palindrome. Return false.` });
      if (!same) {
        t.step({ line: 15, array: [], lists: [row({ left, right }, { [left]: "miss", [right]: "miss" })], vars: {}, done: "notfound", message: "Return false." });
        return;
      }
      settled[left] = "settled"; settled[right] = "settled";
      left++; right--;
      t.step({ line: 17, array: [], lists: [row({ left: Math.min(left, n - 1), right: right >= m ? right : -1 }, settled)], vars: {},
        message: right >= m ? `Move both on: left to the ${values[left]}, right to the ${values[right]}.` : "right is none: the reversed half is used up." });
    }
    t.step({ line: 18, array: [], lists: [row({}, Object.fromEntries(values.map((_, k) => [k, "settled" as Tone])))], vars: {}, done: "found",
      message: "Every pair matched: return true. Three O(n) walks and a handful of pointers: O(n) time, O(1) space." });
  },
};

export const approaches = { mirror, array, reverseHalf };

export const growth = measureGrowth(
  [{ approach: mirror, slot: 1 }, { approach: array, slot: 2 }, { approach: reverseHalf, slot: 3 }],
  (n) => ({ values: Array.from({ length: n }, (_, i) => Math.min(i, n - 1 - i)) }),
  [4, 8, 16, 24, 32],
);
