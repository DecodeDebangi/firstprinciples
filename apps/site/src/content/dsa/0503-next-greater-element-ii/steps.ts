import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { approaches as read, circPrepare } from "../../concepts/56-monotonic-stack-patterns/steps";

export type Input = { nums: number[] };
export const example: Input = { nums: [4, 2, 5, 1, 3] };
export const fields: InputField[] = [{ key: "nums", label: "nums (the end wraps to the start)", kind: "numbers" }];
export const prepare = (raw: Input): Prepared<Input> => circPrepare(raw);

const scan: Approach<Input> = {
  id: "scan",
  name: "Walk round the circle from each value",
  code: `function nextGreaterElements(a)
    n ← length(a)
    answer ← array of n, all -1
    for i ← 0 to n - 1
        for k ← 1 to n - 1
            j ← (i + k) mod n  // wraps round
            if a[j] > a[i]
                answer[i] ← a[j]
                break
    return answer
`,
  run({ nums: a }, t) {
    const n = a.length, ans: number[] = Array(n).fill(-1);
    let asked = false;
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "answer: next greater, wrapping round", rows: [[...ans]], tones });
    t.step({ line: 3, array: a, grid: grid(), vars: {},
      message: `The array is a circle: after the last value comes the first. For each value, walk forward round the circle, at most n − 1 steps, until a bigger value appears.` });
    for (let i = 0; i < n; i++) {
      let found = -1, steps = 0;
      for (let k = 1; k < n; k++) { t.op(); steps++; const j = (i + k) % n; if (a[j] > a[i]) { found = j; break; } }
      if (found >= 0) ans[i] = a[found];
      const opts = found >= 0 && found < i ? [String(a[found]), "-1"] : [];
      const q = !asked && opts.length ? (asked = true, { ask: { q: `No value after ${a[i]} (index ${i}) is bigger before the end. What is its answer?`, options: opts, answer: 0 } }) : {};
      const wrapped = found >= 0 && found < i;
      t.step({ ...q, line: found >= 0 ? 8 : 5, array: a, pointers: found >= 0 ? { i, j: found } : { i }, tones: { [i]: "active", ...(found >= 0 ? { [found]: "found" } : {}) }, badge: found >= 0 ? { at: found, text: `${a[found]} > ${a[i]}` } : undefined,
        grid: grid({ [`0,${i}`]: found >= 0 ? "found" : "miss" }), vars: { i, "steps walked": steps },
        message: found >= 0 ? `From ${a[i]} (index ${i}), walking ${steps} step${steps === 1 ? "" : "s"} forward${wrapped ? ", past the end and round to the start," : ""} reaches ${a[found]}: its next greater value.` : `From ${a[i]} (index ${i}), all ${steps} other values are checked and none is bigger: −1.` });
    }
    t.step({ line: 10, array: a, grid: grid(), vars: { answer: ans.join(" ") }, done: "found",
      message: `Done: [${ans.join(", ")}]. A value with no bigger one anywhere walks the whole circle, and if most values are equal, almost every walk does: O(n²).` });
  },
};

const twoLaps: Approach<Input> = {
  ...read.circular,
  id: "stack",
  name: "Monotonic stack, walking the circle twice",
  code: read.circular.code.replace("nextGreaterCircular", "nextGreaterElements"),
};

export const approaches = { scan, stack: twoLaps };

/** All values equal: nothing is bigger, so every walk goes all the way round. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: twoLaps, slot: 3 }],
  (n) => ({ nums: Array(n).fill(5) }),
  [8, 16, 32, 64, 128],
);
