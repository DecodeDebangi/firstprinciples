import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { prices: number[] };
export const example: Input = { prices: [9, 4, 6, 2, 7, 7, 3] };
export const fields: InputField[] = [{ key: "prices", label: "prices", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.prices.length < 1 || raw.prices.length > 9) return { error: "Use 1 to 9 prices so everything fits." };
  if (raw.prices.some((x) => !Number.isInteger(x) || x < 1 || x > 99)) return { error: "Use whole prices from 1 to 99." };
  return { input: raw };
}
const grid = (ans: number[], tones: Record<string, Tone> = {}) => ({ title: "price you pay", rows: [[...ans]], tones });

const scan: Approach<Input> = {
  id: "scan",
  name: "Look right from each item",
  code: `function finalPrices(prices)
    n ← length(prices)
    answer ← copy(prices)
    for i ← 0 to n - 1
        for j ← i + 1 to n - 1
            if prices[j] ≤ prices[i]
                answer[i] ← prices[i] - prices[j]
                break
    return answer
`,
  run({ prices: a }, t) {
    const n = a.length, ans = [...a];
    t.step({ line: 3, array: a, grid: grid(ans), vars: {},
      message: `Each item is discounted by the first later item whose price is no higher than its own. Start with every item at full price, then look right from each one for its discount.` });
    for (let i = 0; i < n; i++) {
      let j = i + 1;
      for (; j < n; j++) { t.op(); if (a[j] <= a[i]) break; }
      const hit = j < n;
      if (hit) ans[i] = a[i] - a[j];
      t.step({ line: hit ? 7 : 5, array: a, pointers: hit ? { i, j } : { i }, tones: { [i]: "active", ...(hit ? { [j]: "found" } : {}) }, badge: hit ? { at: j, text: `${a[j]} ≤ ${a[i]}` } : undefined,
        grid: grid(ans, { [`0,${i}`]: hit ? "found" : "miss" }), vars: { i, "items checked": (hit ? j : n) - i - 1 + (hit ? 1 : 0) },
        message: hit ? `Item ${i} (${a[i]}): the first later price no higher is ${a[j]} at item ${j}. Pay ${a[i]} − ${a[j]} = ${ans[i]}.` : `Item ${i} (${a[i]}): ${i === n - 1 ? "nothing comes after it" : "every later price is higher"}, so no discount: pay ${a[i]}.` });
    }
    t.step({ line: 9, array: a, grid: grid(ans), vars: { answer: ans.join(" ") }, done: "found",
      message: `Pay [${ans.join(", ")}]. When prices only rise, no item finds a discount and every scan runs to the end: O(n²).` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack of items still waiting",
  code: `function finalPrices(prices)
    answer ← copy(prices)
    stack ← empty stack  // prices rise upward
    for each index i, value x in prices
        while stack not empty and
                prices[stack.top()] ≥ x
            j ← stack.pop()
            answer[j] ← prices[j] - x
        stack.push(i)
    return answer
`,
  run({ prices: a }, t) {
    const ans = [...a], st: number[] = [];
    const frames = () => [...st].reverse().map((k) => `${a[k]} (item ${k})`);
    const waiting = (): Record<number, Tone> => Object.fromEntries(st.map((k) => [k, "side-b" as Tone]));
    t.step({ line: 3, array: a, grid: grid(ans), stack: [], stackTitle: "waiting (top first)", vars: {},
      message: `Walk left to right. Items still waiting for their discount sit on a stack. A new price that's no higher than an item on top is that item's discount: it pops and settles it.` });
    let asked = 0;
    a.forEach((x, i) => {
      const top0 = st.length ? st[st.length - 1] : null;
      const got: number[] = [];
      while (st.length && a[st[st.length - 1]] >= x) { t.op(); const j = st.pop()!; ans[j] = a[j] - x; got.push(j); }
      if (st.length) t.op();
      const q = asked < 2 && top0 !== null ? (asked++, { ask: { q: `${x} arrives; the item waiting on top costs ${a[top0]}. What happens?`, options: ["It's no higher: pop that item and discount it", "It's higher: push it and wait"], answer: a[top0] >= x ? 0 : 1 } }) : {};
      st.push(i);
      t.step({ ...q, line: got.length ? 8 : 9, array: a, pointers: { i }, tones: { ...waiting(), ...Object.fromEntries(got.map((j) => [j, "found" as Tone])), [i]: "active" },
        grid: grid(ans, Object.fromEntries(got.map((j) => [`0,${j}`, "found" as Tone]))), stack: frames(), stackTitle: "waiting (top first)", vars: { i, x },
        message: got.length ? `${x} is no higher than ${got.map((j) => a[j]).join(" and ")}: ${got.map((j) => `item ${j} pays ${a[j]} − ${x} = ${ans[j]}`).join(", ")}. Push item ${i} to wait.` : top0 === null ? `Nothing is waiting. Push item ${i} (${x}).` : `${x} is higher than ${a[top0]} on top, so it settles nothing. Push item ${i} to wait.` });
    });
    t.step({ line: 10, array: a, tones: waiting(), grid: grid(ans), stack: frames(), stackTitle: "waiting (top first)", vars: { answer: ans.join(" ") }, done: "found",
      message: `Pay [${ans.join(", ")}]. ${st.length ? `Items still waiting (${st.map((k) => a[k]).join(", ")}) never found a lower or equal price, so they pay in full. ` : ""}Each item is pushed and popped at most once: O(n).` });
  },
};

export const approaches = { scan, stack };

/** Prices that only rise: nobody gets a discount, so every scan runs to the end. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => ({ prices: Array.from({ length: n }, (_, i) => i + 1) }),
  [8, 16, 32, 64, 128],
);
