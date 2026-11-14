import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [4, 1, 9, 3, 2] };

export const fields: InputField[] = [{ key: "nums", label: "nums", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length < 2) return { error: "nums needs at least two numbers." };
  if (raw.nums.some((x) => x < 0)) return { error: "Use numbers that are 0 or more." };
  const max = Math.max(...raw.nums);
  if (raw.nums.filter((x) => x === max).length > 1) return { error: `The largest number (${max}) must appear only once.` };
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `function dominantIndex(nums)
  for i ← 0 to length(nums) - 1
    ok ← true
    for j ← 0 to length(nums) - 1
      if j ≠ i and nums[i] < 2 * nums[j]
        ok ← false
        break
    if ok
      return i
  return -1
`,
  run({ nums }, t) {
    const n = nums.length;
    t.step({ line: 2, array: nums, vars: { i: null, j: null },
      message: "Test every number as the candidate: is it at least double every other number?" });
    for (let i = 0; i < n; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        t.op();
        const tones: Record<number, Tone> = { [i]: "active", [j]: "compare" };
        if (nums[i] < 2 * nums[j]) {
          t.step({ badge: { at: j, text: `${nums[i]} < 2×${nums[j]}` }, line: 6, array: nums, pointers: { i, j }, tones: { [i]: "miss", [j]: "compare" }, vars: { i, j, double: 2 * nums[j] },
            message: `${nums[i]} < 2 × ${nums[j]} = ${2 * nums[j]}. Candidate ${nums[i]} fails. Throw away its checks and try the next one.` });
          ok = false;
          break;
        }
        t.step({ badge: { at: j, text: `${nums[i]} ≥ 2×${nums[j]}` }, line: 5, array: nums, pointers: { i, j }, tones, vars: { i, j, double: 2 * nums[j] },
          message: `${nums[i]} ≥ 2 × ${nums[j]} = ${2 * nums[j]}. So far so good.` });
      }
      if (ok) {
        t.step({ line: 9, array: nums, pointers: { i }, tones: { [i]: "found" }, vars: { i, j: null }, done: "found",
          message: `${nums[i]} is at least double every other number. Return its index, ${i}.` });
        return;
      }
    }
    t.step({ line: 10, array: nums, vars: { i: null, j: null }, done: "notfound", message: "No candidate passed. Return -1." });
  },
};

const twoPasses: Approach<Input> = {
  id: "two",
  name: "Find max, then check",
  code: `function dominantIndex(nums)
  best ← 0
  for i ← 1 to length(nums) - 1
    if nums[i] > nums[best]
      best ← i
  for i ← 0 to length(nums) - 1
    if i ≠ best and nums[best] < 2 * nums[i]
      return -1
  return best
`,
  run({ nums }, t) {
    const n = nums.length;
    let best = 0;
    t.step({ line: 2, array: nums, pointers: { best }, tones: { 0: "active" }, vars: { best, i: null },
      message: "Only the largest number could possibly be double all the others, so find it first." });
    for (let i = 1; i < n; i++) {
      t.op();
      if (nums[i] > nums[best]) {
        t.step({ line: 5, array: nums, pointers: { best, i }, tones: { [i]: "active", [best]: "discard" }, vars: { best: i, i },
          message: `${nums[i]} > ${nums[best]}. New largest at index ${i}.` });
        best = i;
      } else {
        t.step({ line: 4, array: nums, pointers: { best, i }, tones: { [best]: "active", [i]: "compare" }, vars: { best, i },
          message: `${nums[i]} isn't bigger than ${nums[best]}. Keep index ${best}.` });
      }
    }
    for (let i = 0; i < n; i++) {
      if (i === best) continue;
      t.op();
      const ask = (yes: boolean) => ({ q: `Is ${nums[best]} at least 2 × ${nums[i]} = ${2 * nums[i]}?`, options: ["Yes: keep checking", "No: return -1"], answer: yes ? 0 : 1 });
      if (nums[best] < 2 * nums[i]) {
        t.step({ ask: ask(false), badge: { at: i, text: `${nums[best]} < 2×${nums[i]}` }, line: 8, array: nums, pointers: { best, i }, tones: { [best]: "miss", [i]: "compare" }, vars: { best, i }, done: "notfound",
          message: `${nums[best]} < 2 × ${nums[i]} = ${2 * nums[i]}. Even the largest fails, so nothing can pass. Return -1.` });
        return;
      }
      t.step({ ask: ask(true), badge: { at: i, text: `${nums[best]} ≥ 2×${nums[i]}` }, line: 7, array: nums, pointers: { best, i }, tones: { [best]: "active", [i]: "compare" }, vars: { best, i },
        message: `${nums[best]} ≥ 2 × ${nums[i]} = ${2 * nums[i]}. Check the next one.` });
    }
    t.step({ line: 9, array: nums, pointers: { best }, tones: { [best]: "found" }, vars: { best, i: null }, done: "found",
      message: `${nums[best]} is at least double everything else. Return ${best}.` });
  },
};

const onePass: Approach<Input> = {
  id: "one",
  name: "One pass: largest and runner-up",
  code: `function dominantIndex(nums)
  first, second ← -1, -1  // top two
  best ← -1
  for each index i, value x in nums
    if x > first
      second ← first
      first, best ← x, i
    else if x > second
      second ← x
  return first ≥ 2 * second ? best : -1
`,
  run({ nums }, t) {
    let first = -1, second = -1, best = -1;
    const show = (v: number) => (v < 0 ? "—" : v);
    t.step({ line: 2, array: nums, vars: { first: "—", second: "—", best: "—" },
      message: "Key insight: if the largest is at least double the runner-up, it's at least double everyone. Track just those two." });
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      t.op();
      const [f0, s0] = [show(first), show(second)]; // captured before this step updates them
      const ask = (answer: number) => ({ q: `x = ${x}. Largest so far: ${f0}, runner-up: ${s0}. What changes?`, options: [`${x} becomes the new largest`, `${x} becomes the new runner-up`, "Nothing changes"], answer });
      if (x > first) {
        second = first;
        first = x;
        best = i;
        t.step({ ask: ask(0), badge: { at: i, text: "new largest" }, line: 7, array: nums, pointers: { i }, tones: { [i]: "active" }, vars: { first, second: show(second), best },
          message: `${x} is the new largest. The old largest${second < 0 ? " (none yet)" : `, ${second},`} becomes the runner-up.` });
      } else if (x > second) {
        second = x;
        t.step({ ask: ask(1), badge: { at: i, text: "new runner-up" }, line: 9, array: nums, pointers: { i }, tones: { [best]: "active", [i]: "compare" }, vars: { first, second, best },
          message: `${x} isn't the largest but beats the runner-up. New runner-up: ${x}.` });
      } else {
        t.step({ ask: ask(2), line: 8, array: nums, pointers: { i }, tones: { [best]: "active" }, vars: { first, second: show(second), best },
          message: `${x} is neither the largest nor the runner-up. Nothing changes.` });
      }
    }
    const ok = first >= 2 * second;
    t.step({ ask: { q: `Done. Largest ${first}, runner-up ${second}. What is the answer?`, options: [`Return ${best}`, "Return -1"], answer: ok ? 0 : 1 }, line: 10, array: nums, pointers: { best }, tones: { [best]: ok ? "found" : "miss" }, vars: { first, second, best },
      done: ok ? "found" : "notfound",
      message: ok
        ? `${first} ≥ 2 × ${second} = ${2 * second}. Beating the runner-up means beating everyone. Return ${best}.`
        : `${first} < 2 × ${second} = ${2 * second}. Return -1.` });
  },
};

export const approaches = { brute: bruteForce, two: twoPasses, one: onePass };

/** Worst case for brute force: 1..n ascending, so each candidate scans about half the list before failing. */
const worstCase = (n: number): Input => ({ nums: Array.from({ length: n }, (_, i) => i + 1) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: twoPasses, slot: 2 },
    { approach: onePass, slot: 3 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
