import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { nums: number[] };

export const example: Input = { nums: [2, 7, 3, 5, 4, 6, 8] };

export const fields: InputField[] = [{ key: "nums", label: "items", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length > 10) return { error: "Use at most 10 items so everything fits." };
  return { input: raw };
}

const stack: Approach<Input> = {
  id: "stack",
  name: "Stack: last in, first out",
  code: `stack = []
for x in items:
    stack.append(x)  # push onto the top
out = []
while stack:
    out.append(stack.pop())  # take from the top
`,
  run({ nums }, t) {
    const s: number[] = [];
    const out: number[] = [];
    const grid = () => ({ title: "out (in the order items leave)", rows: [out.length ? [...out] : ["—"]] });
    const labels = () => s.map((_, k) => (k === s.length - 1 ? "top" : k === 0 ? "bottom" : ""));
    t.step({ line: 1, array: [], grid: grid(), vars: { size: 0 }, message: "A stack only lets you touch its top: push adds there, pop removes from there. Like a pile of plates." });
    for (const x of nums) {
      t.op();
      s.push(x);
      t.step({ line: 3, array: [...s], labels: labels(), pointers: { top: s.length - 1 }, tones: { [s.length - 1]: "found" }, grid: grid(), vars: { size: s.length },
        message: `Push ${x} on top.` });
    }
    while (s.length) {
      t.op();
      const k = s.length - 1;
      const x = s[k];
      t.step({ ask: { q: `The stack holds [${s.join(", ")}] (bottom to top). Which item comes out next?`, options: [`${x}, the most recent`, `${s[0]}, the oldest`].filter((o, i, a) => a.indexOf(o) === i).concat(s.length === 1 ? ["Nothing"] : []), answer: 0 },
        line: 6, array: [...s], labels: labels(), pointers: { top: k }, tones: { [k]: "miss" }, grid: grid(), vars: { size: s.length },
        message: `Pop the top: ${x}, the last item pushed.` });
      s.pop();
      out.push(x);
    }
    t.step({ line: 6, array: [], grid: grid(), vars: { size: 0 }, done: "found",
      message: `Out came [${out.join(", ")}]: the input reversed. Last in, first out.` });
  },
};

const queue: Approach<Input> = {
  id: "queue",
  name: "Queue: first in, first out",
  code: `from collections import deque
queue = deque()
for x in items:
    queue.append(x)  # join at the back
out = []
while queue:
    out.append(queue.popleft())  # leave from the front
`,
  run({ nums }, t) {
    const q: number[] = [];
    const out: number[] = [];
    const grid = () => ({ title: "out (in the order items leave)", rows: [out.length ? [...out] : ["—"]] });
    const labels = () => q.map((_, k) => (k === 0 ? "front" : k === q.length - 1 ? "back" : ""));
    t.step({ line: 2, array: [], grid: grid(), vars: { size: 0 }, message: "A queue is a line: new items join at the back, and items leave from the front." });
    for (const x of nums) {
      t.op();
      q.push(x);
      t.step({ line: 4, array: [...q], labels: labels(), pointers: { back: q.length - 1 }, tones: { [q.length - 1]: "found" }, grid: grid(), vars: { size: q.length },
        message: `${x} joins at the back.` });
    }
    while (q.length) {
      t.op();
      const x = q[0];
      t.step({ ask: { q: `The queue holds [${q.join(", ")}] (front to back). Which item leaves next?`, options: [`${x}, the oldest`, `${q[q.length - 1]}, the newest`].filter((o, i, a) => a.indexOf(o) === i).concat(q.length === 1 ? ["Nothing"] : []), answer: 0 },
        line: 7, array: [...q], labels: labels(), pointers: { front: 0 }, tones: { 0: "miss" }, grid: grid(), vars: { size: q.length },
        message: `${x} leaves from the front: it has waited longest.` });
      q.shift();
      out.push(x);
    }
    t.step({ line: 7, array: [], grid: grid(), vars: { size: 0 }, done: "found",
      message: `Out came [${out.join(", ")}]: the same order they went in. First in, first out.` });
  },
};

const monotonic: Approach<Input> = {
  id: "monotonic",
  name: "Monotonic stack: next greater element",
  code: `def next_greater(nums):
    answer = [-1] * len(nums)
    stack = []  # indices; values decrease upward
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            answer[stack.pop()] = x
        stack.append(i)
    return answer
`,
  run({ nums: a }, t) {
    const ans: number[] = Array(a.length).fill(-1);
    const st: number[] = [];
    const frames = () => st.map((k) => `${a[k]} (index ${k})`);
    const grid = (tones: Record<string, Tone> = {}) => ({ title: "answer: next greater element", rows: [[...ans]], tones });
    const waiting = (): Record<number, Tone> => Object.fromEntries(st.map((k) => [k, "side-b" as Tone]));
    t.step({ line: 3, array: a, grid: grid(), stack: [], stackTitle: "Waiting (top first)", vars: { i: null },
      message: "For each number, find the first bigger number to its right. Numbers still waiting sit on a stack; a bigger arrival answers them, most recent first." });
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const top = st.length ? st[st.length - 1] : null;
      const ask = { q: top === null ? `${x} arrives and nothing is waiting. What happens?` : `${x} arrives; the top waiting number is ${a[top]}. What happens?`,
        options: ["It's bigger: pop the waiting number and record the answer", "It's not bigger: push it and wait"], answer: top !== null && a[top] < x ? 0 : 1 };
      let asked = false;
      while (st.length && a[st[st.length - 1]] < x) {
        t.op();
        const j = st.pop()!;
        ans[j] = x;
        t.step({ ...(asked ? {} : { ask }), line: 6, array: a, pointers: { i }, tones: { ...waiting(), [j]: "found", [i]: "compare" }, badge: { at: j, text: `next: ${x}` },
          grid: grid({ [`0,${j}`]: "found" }), stack: frames(), stackTitle: "Waiting (top first)", vars: { i, x },
          message: `${x} > ${a[j]}: ${a[j]}'s next greater element is ${x}. Pop it.` });
        asked = true;
      }
      t.op();
      st.push(i);
      t.step({ ...(asked ? {} : { ask }), line: 7, array: a, pointers: { i }, tones: { ...waiting(), [i]: "active" }, grid: grid(), stack: frames(), stackTitle: "Waiting (top first)", vars: { i, x },
        message: `Push ${x}. Everything below it on the stack is bigger, so the stack's values only decrease toward the top: that's the "monotonic" part.` });
    }
    t.step({ line: 8, array: a, tones: waiting(), grid: grid(), stack: frames(), stackTitle: "Waiting (top first)", vars: { i: null }, done: "found",
      message: `Done: [${ans.join(", ")}]. Whatever is still waiting has no bigger number after it (−1). Each index was pushed once and popped at most once: O(n).` });
  },
};

export const approaches = { stack, queue, monotonic };
