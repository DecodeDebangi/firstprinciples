import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { temps: number[] };

export const example: Input = { temps: [70, 74, 71, 69, 72, 76, 73] };

export const fields: InputField[] = [{ key: "temps", label: "temperatures", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force: look ahead from each day",
  code: `function dailyTemperatures(temps)
    n ← length(temps)
    answer ← array of n, all 0
    for i ← 0 to n - 1
        for j ← i + 1 to n - 1
            if temps[j] > temps[i]
                answer[i] ← j - i
                break
    return answer
`,
  run({ temps: a }, t) {
    const n = a.length;
    const ans = Array(n).fill(0);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "answer (days to wait)", rows: [[...ans]], tones });
    t.step({ line: 3, array: a, grid: grid(), vars: { i: null, j: null }, message: "For each day, scan forward until a warmer day appears." });
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        t.op();
        if (a[j] > a[i]) {
          ans[i] = j - i;
          t.step({ line: 7, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "found" }, badge: { at: j, text: `${a[j]} > ${a[i]}` },
            grid: grid({ [`0,${i}`]: "found" }), vars: { i, j }, message: `Day ${j} (${a[j]}) is warmer than day ${i} (${a[i]}): wait ${j - i}.` });
          break;
        }
        t.step({ line: 6, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${a[j]} ≤ ${a[i]}` },
          grid: grid(), vars: { i, j }, message: `${a[j]} isn't warmer than ${a[i]}. Keep looking.` });
      }
    }
    t.step({ line: 9, array: a, grid: grid(Object.fromEntries(ans.map((_, k) => [`0,${k}`, "settled" as Tone]))), vars: { i: null, j: null }, done: "found",
      message: `Done: [${ans.join(", ")}]. Days with no warmer day ahead stay 0.` });
  },
};

const monoStack: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack",
  code: `function dailyTemperatures(temps)
    answer ← array of length(temps), all 0
    stack ← empty stack  // days still waiting
    for each index i, value t in temps
        while stack's top day is colder than t
            j ← stack.pop()
            answer[j] ← i - j
        stack.push(i)
    return answer
`,
  run({ temps: a }, t) {
    const n = a.length;
    const ans = Array(n).fill(0);
    const stack: number[] = [];
    const frames = () => stack.map((k) => `${a[k]} on day ${k}`);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "answer (days to wait)", rows: [[...ans]], tones });
    const waiting = (): Record<number, Tone> => Object.fromEntries(stack.map((k) => [k, "side-b" as Tone]));
    t.step({ line: 3, array: a, grid: grid(), stack: frames(), stackTitle: "Waiting days (top first)", vars: { i: null },
      message: "Walk forward once. Days that haven't found a warmer day wait on a stack; each new day settles every cooler day on top." });
    for (let i = 0; i < n; i++) {
      const top = stack.length ? stack[stack.length - 1] : null;
      const pops = top !== null && a[top] < a[i];
      const ask = { q: top === null ? `Today is ${a[i]} and nobody is waiting. What happens?` : `Today is ${a[i]}; the day on top of the stack is ${a[top]}. What happens?`,
        options: ["Warmer: pop that day and record its wait", "Not warmer: push today and move on"], answer: pops ? 0 : 1 };
      let asked = false;
      while (stack.length && a[stack[stack.length - 1]] < a[i]) {
        t.op();
        const j = stack.pop()!;
        ans[j] = i - j;
        t.step({ ...(asked ? {} : { ask }), line: 7, array: a, pointers: { i }, tones: { ...waiting(), [j]: "found", [i]: "compare" },
          badge: { at: j, text: `wait ${i - j}` }, grid: grid({ [`0,${j}`]: "found" }), stack: frames(), stackTitle: "Waiting days (top first)", vars: { i, j },
          message: `${a[i]} is warmer than ${a[j]} (day ${j}). Pop it: it waited ${i - j} day${i - j > 1 ? "s" : ""}.` });
        asked = true;
      }
      t.op();
      stack.push(i);
      t.step({ ...(asked ? {} : { ask }), line: 8, array: a, pointers: { i }, tones: { ...waiting(), [i]: "active" }, grid: grid(),
        stack: frames(), stackTitle: "Waiting days (top first)", vars: { i },
        message: `Push day ${i} (${a[i]}). The stack stays coolest on top, so the next warm day settles the right ones first.` });
    }
    t.step({ line: 9, array: a, tones: waiting(), grid: grid(Object.fromEntries(ans.map((_, k) => [`0,${k}`, "settled" as Tone]))), stack: frames(), stackTitle: "Waiting days (top first)",
      vars: { i: null }, done: "found", message: `Done: [${ans.join(", ")}]. Days still on the stack never saw a warmer day, so they stay 0.` });
  },
};

export const approaches = { brute: bruteForce, stack: monoStack };

/** Worst case for the brute force: temperatures only fall, so every scan runs to the end. */
const worstCase = (n: number): Input => ({ temps: Array.from({ length: n }, (_, i) => 100 - i) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: monoStack, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
