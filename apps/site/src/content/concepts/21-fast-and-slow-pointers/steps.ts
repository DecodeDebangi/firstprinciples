import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

type Row = (pointers: Record<string, number>, tones?: Record<number, Tone>) => ListRow;
const ord = (k: number) => (k === 1 ? "1st" : k === 2 ? "2nd" : k === 3 ? "3rd" : `${k}th`);

/* ---------- Finding the middle ---------- */
export type MiddleInput = { values: number[] };
export const middleExample: MiddleInput = { values: [4, 9, 2, 7, 5] };
export const middleFields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];
export function middlePrepare(raw: MiddleInput): Prepared<MiddleInput> {
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  return { input: raw };
}

const middle: Approach<MiddleInput> = {
  id: "middle",
  name: "Finding the middle",
  code: `function middle(head)
    slow, fast ← head, head
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
    return slow
`,
  run({ values }, t) {
    const n = values.length;
    const row: Row = (p, tones = {}) => ({
      nodes: [...values.map((v, i) => ({ id: `n${i}`, val: v })), { id: "end", val: "none", kind: "null" as const }], arrows: values.map(() => "right" as const),
      pointers: Object.fromEntries(Object.entries(p).map(([k, i]) => [k, i >= n ? "end" : `n${i}`])), tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])),
    });
    let slow = 0, fast = 0, round = 0;
    t.step({ line: 2, array: [], lists: [row({ slow, fast })], vars: { round },
      message: `How do you find the middle of a list without knowing its length? Send two pointers from the head: slow moves 1 node per round, fast moves 2. When fast runs out of list, slow has gone exactly half as far.` });
    while (fast < n && fast + 1 < n) {
      t.op();
      const last = !(fast + 2 < n && fast + 3 < n);
      slow++; fast += 2; round++;
      t.step({
        ...(last && round > 1 ? { ask: { q: "fast is about to run out of list. Where will slow be?", options: ["Halfway along: the middle", "At the end", "One node behind fast"], answer: 0 } } : {}),
        line: 5, array: [], lists: [row({ slow, fast }, { [slow]: "active" })], vars: { round, "slow has walked": slow, "fast has walked": fast },
        message: `Round ${round}: slow moves to the ${values[slow]}, fast to ${fast < n ? `the ${values[fast]}` : "none"}. fast has walked ${fast}, exactly twice as far as slow.` });
    }
    t.step({ line: 6, array: [], lists: [row({ slow }, { [slow]: "found" })], vars: { round }, done: "found",
      message: n % 2 ? `fast is on the last node, so fast.next is none: stop. slow is on the ${values[slow]}, the ${ord(slow + 1)} of ${n} nodes: the exact middle. Only about n / 2 rounds, and no counting.`
        : `fast is none: stop. With ${n} nodes there are two middles, the ${values[slow - 1]} and the ${values[slow]}. This version stops on the second one, which is where the second half starts.` });
  },
};

/* ---------- Catching a loop ---------- */
export type LoopInput = { values: number[]; loopTo: string };
export const loopExample: LoopInput = { values: [3, 6, 1, 8, 4, 7], loopTo: "2" };
export const loopFields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "loopTo", label: "last node links back to position (or none)", kind: "text" },
];
const parseLoop = (s: string) => { const x = s.trim().toLowerCase(); return x === "" || x === "none" ? -1 : Number(x); };
export function loopPrepare(raw: LoopInput): Prepared<LoopInput> {
  const n = raw.values.length, k = parseLoop(raw.loopTo);
  if (n === 0) return { error: "Give the list at least one value." };
  if (n > 7) return { error: "Keep the list to at most 7 nodes so it fits." };
  if (!Number.isInteger(k) || k < -1 || k >= n) return { error: `The link-back position must be a whole number from 0 to ${n - 1}, or none.` };
  return { input: { values: raw.values, loopTo: k < 0 ? "none" : String(k) } };
}

const loop: Approach<LoopInput> = {
  id: "loop",
  name: "Catching a loop",
  code: `function hasLoop(head)
    slow, fast ← head, head
    while fast ≠ none and fast.next ≠ none
        slow ← slow.next
        fast ← fast.next.next
        if slow = fast
            return true
    return false
`,
  run({ values, loopTo }, t) {
    const n = values.length, k = parseLoop(loopTo);
    const next = (i: number) => (i < n - 1 ? i + 1 : k);
    const row: Row = (p, tones = {}) => ({
      nodes: [...values.map((v, i) => ({ id: `n${i}`, val: v })), ...(k < 0 ? [{ id: "end", val: "none", kind: "null" as const }] : [])],
      arrows: Array.from({ length: k < 0 ? n : n - 1 }, () => "right" as const), skips: k >= 0 ? [{ from: `n${n - 1}`, to: `n${k}` }] : undefined,
      pointers: Object.fromEntries(Object.entries(p).map(([q, i]) => [q, i < 0 ? "end" : `n${i}`])), tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])),
    });
    const onLoop = (i: number) => k >= 0 && i >= k;
    /** How many nodes fast is behind slow, going round the loop. */
    const gap = (s: number, f: number) => { let d = 0, i = f; while (i !== s && d <= n) { i = next(i); d++; } return d; };
    let slow = 0, fast = 0, round = 0, askedGap = false;
    t.step({ line: 2, array: [], lists: [row({ slow, fast })], vars: { round },
      message: k >= 0 ? `This list loops: the ${values[n - 1]} points back to the ${values[k]}. Same two pointers. If there were an end, fast would find it. Instead, watch fast lap round and come up behind slow.`
        : "Same two pointers. If the list has an end, fast reaches it first, and we know there's no loop." });
    while (true) {
      t.op();
      const f1 = fast < 0 ? -1 : next(fast);
      if (fast < 0 || f1 < 0) {
        t.step({ line: 8, array: [], lists: [row({ slow, fast }, fast >= 0 ? { [fast]: "miss" } : {})], vars: { round }, done: "notfound",
          message: `fast found the end of the list, so there's no loop: return false.` });
        return;
      }
      const before = onLoop(slow) && onLoop(fast) && round > 0 ? gap(slow, fast) : null;
      slow = next(slow); fast = next(f1); round++;
      const met = slow === fast;
      const g = onLoop(slow) && onLoop(fast) ? gap(slow, fast) : null;
      const ask = before !== null && !askedGap && !met ? (askedGap = true, { ask: { q: `On the loop, fast was ${before} node${before === 1 ? "" : "s"} behind slow. After one more round, how far behind is it?`, options: [`${before - 1}: it gains one node per round`, `${before}: they move together`, `${before + 1}: slow pulls away`], answer: 0 } }) : {};
      t.step({ ...ask, line: 6, array: [], lists: [row({ slow, fast }, met ? { [slow]: "found" } : { [slow]: "active", [fast]: "compare" })], vars: { round, ...(g !== null && !met ? { "fast behind by": g } : {}) },
        message: met ? `slow moves to the ${values[slow]}, fast jumps two to the same node: they've met, so the list must loop. Return true.`
          : g !== null ? `slow moves to the ${values[slow]}, fast to the ${values[fast]}. Both are on the loop now, and fast is ${g} node${g === 1 ? "" : "s"} behind slow. Every round, fast moves 2 and slow moves 1, so the gap shrinks by exactly 1.`
          : `slow moves to the ${values[slow]}, fast to ${fast < 0 ? "none" : `the ${values[fast]}`}.` });
      if (met) {
        t.step({ line: 7, array: [], lists: [row({ slow, fast }, { [slow]: "found" })], vars: { round }, done: "found",
          message: `Because the gap shrinks by exactly 1 each round, it has to hit 0. fast can never jump over slow: from 1 behind, its two steps land exactly on slow's new spot.` });
        return;
      }
    }
  },
};

export const middleApproaches = { middle };
export const loopApproaches = { loop };
