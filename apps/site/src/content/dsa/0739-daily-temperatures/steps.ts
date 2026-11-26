import { measureGrowth, type Approach, type InputField, type Prepared, type SceneData, type Tone } from "@firstprinciples/ui";

export type Input = { temps: number[] };

export const example: Input = { temps: [70, 74, 71, 69, 72, 76, 73] };

export const fields: InputField[] = [{ key: "temps", label: "temperatures", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.temps.length < 1 || raw.temps.length > 10) return { error: "Use 1 to 10 temperatures so every day fits." };
  if (raw.temps.some((x) => !Number.isInteger(x) || x < -50 || x > 150)) return { error: "Use whole temperatures from -50 to 150." };
  return { input: raw };
}

const plural = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
/** The days as bars (taller = warmer) and the answer row under them. */
const scene = (a: number[], ans: (number | null)[], extra: Partial<SceneData> = {}): SceneData => ({
  bars: a, unit: "°", title: "Days", names: a.map((_, i) => `day ${i}`),
  answers: { title: "Days to wait", values: [...ans], tones: Object.fromEntries(ans.map((v, i) => [i, (v === 0 ? "visited" : "found") as Tone])) },
  ...extra,
});

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
    const ans: (number | null)[] = Array(n).fill(null);
    let asked = 0;
    t.step({ line: 3, array: a, scene: scene(a, ans), vars: { i: null, j: null },
      message: "Each bar is a day, as tall as its temperature. For each day, look forward one day at a time until a warmer day appears." });
    for (let i = 0; i < n; i++) {
      let found = false;
      for (let j = i + 1; j < n; j++) {
        t.op();
        const warm = a[j] > a[i];
        const ask = asked < 3 ? (asked++, { ask: { q: `Day ${i} is ${a[i]}° and day ${j} is ${a[j]}°. Is day ${j} the warmer day?`, options: ["Yes: stop and record the wait", "No: keep looking"], answer: warm ? 0 : 1 } }) : {};
        if (warm) {
          ans[i] = j - i; found = true;
          t.step({ ...ask, key: true, line: 7, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "found" }, badge: { at: j, text: `${a[j]} > ${a[i]}` },
            scene: scene(a, ans, { tones: { [i]: "active", [j]: "found" }, tags: { i, j }, say: { at: j, text: `${a[j]} > ${a[i]}` } }), vars: { i, j },
            message: `Day ${j} (${a[j]}°) is warmer than day ${i} (${a[i]}°): day ${i} waits ${j} − ${i} = ${plural(j - i)}. Stop looking.` });
          break;
        }
        t.step({ ...ask, line: 6, array: a, pointers: { i, j }, tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${a[j]} ≤ ${a[i]}` },
          scene: scene(a, ans, { tones: { [i]: "active", [j]: "compare" }, tags: { i, j }, say: { at: j, text: `${a[j]} ≤ ${a[i]}` } }), vars: { i, j },
          message: `${a[j]}° isn't warmer than ${a[i]}°. Keep looking.` });
      }
      if (!found) {
        ans[i] = 0;
        t.step({ line: 5, array: a, pointers: { i }, tones: { [i]: "active" }, scene: scene(a, ans, { tones: { [i]: "active" }, tags: { i } }), vars: { i, j: null },
          message: i === n - 1 ? `Day ${i} is the last day: nothing comes after it, so its answer stays 0.` : `No day after day ${i} is warmer than ${a[i]}°, so its answer stays 0.` });
      }
    }
    t.step({ line: 9, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), scene: scene(a, ans), vars: { i: null, j: null }, done: "found",
      message: `Done: [${ans.join(", ")}]. That took ${t.ops} comparison${t.ops === 1 ? "" : "s"}. When temperatures only fall, every day scans to the end: O(n²).` });
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
    const ans: (number | null)[] = Array(n).fill(null);
    const stack: number[] = [];
    let told = false;
    const pile = () => ({ title: "Stack", items: [...stack] });
    t.step({ line: 3, array: a, scene: scene(a, ans, { pile: pile() }), vars: { i: null },
      message: "Each bar is a day, as tall as its temperature. Days that haven't found a warmer day yet wait in the stack, as blocks as wide as their temperature." });
    for (let i = 0; i < n; i++) {
      const top = stack.length ? stack[stack.length - 1] : null;
      const pops = top !== null && a[top] < a[i];
      const ask = top === null ? null : { q: `Day ${i} is ${a[i]}°, and the day on top of the stack is ${a[top]}°. What happens?`,
        options: ["It's warmer: settle the day on top", "It isn't: day " + i + " waits on top"], answer: pops ? 0 : 1 };
      let asked = false;
      while (stack.length && a[stack[stack.length - 1]] < a[i]) {
        t.op();
        const j = stack.pop()!;
        ans[j] = i - j;
        t.step({ ...(asked || !ask ? {} : { ask }), key: true, line: 7, array: a, pointers: { i }, tones: { [j]: "found", [i]: "compare" }, badge: { at: j, text: `wait ${i - j}` },
          scene: scene(a, ans, { pile: pile(), tones: { [i]: "active" }, tags: { today: i }, say: { at: i, text: `${a[i]} > ${a[j]}` } }), vars: { i, j },
          message: `${a[i]}° is warmer than ${a[j]}° (day ${j}): day ${j} has found its warmer day after ${i} − ${j} = ${plural(i - j)}. Pop it into the answers.` });
        asked = true;
      }
      if (stack.length) t.op();
      const blocker = stack.length ? stack[stack.length - 1] : null;
      stack.push(i);
      const shape = !told && stack.length >= 3 ? (told = true, " The pile narrows toward the top: cooler days always sit higher, which is why it's called a monotonic stack.") : "";
      t.step({ ...(asked || !ask ? {} : { ask }), line: 8, array: a, pointers: { i }, tones: { [i]: "active" },
        scene: scene(a, ans, { pile: pile(), tones: { [i]: "active" }, tags: { today: i }, ...(blocker !== null ? { say: { at: i, text: `${a[i]} ≤ ${a[blocker]}` } } : {}) }), vars: { i },
        message: blocker !== null
          ? `${a[i]}° isn't warmer than ${a[blocker]}° on top, so it stops there. Day ${i} waits on top.${shape}`
          : asked ? `Nothing is left waiting. Day ${i} (${a[i]}°) goes into the stack.` : `Nobody is waiting, so day ${i} (${a[i]}°) goes into the stack.` });
    }
    const left = [...stack];
    left.forEach((j) => (ans[j] = 0));
    stack.length = 0;
    t.step({ line: 9, array: a, tones: Object.fromEntries(left.map((k) => [k, "settled" as Tone])), scene: scene(a, ans, { pile: pile() }), vars: { i: null }, done: "found",
      message: `Done: [${ans.join(", ")}].${left.length ? ` ${left.map((k) => `${a[k]}°`).join(" and ")} never saw a warmer day, so ${left.length === 1 ? "its answer stays" : "their answers stay"} 0.` : ""} Each day was pushed once and popped at most once: O(n).` });
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
