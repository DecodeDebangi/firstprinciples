import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** The prices passed to next(), one call each, in order. */
export type Input = { prices: number[] };
export const example: Input = { prices: [52, 47, 49, 49, 50, 55, 48] };
export const fields: InputField[] = [{ key: "prices", label: "prices passed to next()", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.prices.length < 1 || raw.prices.length > 9) return { error: "Use 1 to 9 prices so everything fits." };
  if (raw.prices.some((x) => !Number.isInteger(x) || x < 1 || x > 999)) return { error: "Use whole prices from 1 to 999." };
  return { input: raw };
}
const out = (spans: number[], hl = false) => ({ title: "next() returned", rows: [spans.length ? [...spans] : ["—"]], tones: hl && spans.length ? { [`0,${spans.length - 1}`]: "found" as Tone } : {} });

const scanBack: Approach<Input> = {
  id: "scan",
  name: "Keep every price and count back",
  code: `class StockSpanner
    prices ← empty list
    function next(price)
        prices.push(price)
        span ← 0
        i ← length(prices) - 1
        while i ≥ 0 and prices[i] ≤ price
            span += 1
            i -= 1
        return span
`,
  run({ prices }, t) {
    const seen: number[] = [], spans: number[] = [];
    t.step({ line: 2, array: [], grid: out(spans), vars: {},
      message: `Prices arrive one day at a time. For each, next() returns the span: how many days in a row, ending today, had a price no higher than today's. The simplest way: remember every price and count backwards from today.` });
    prices.forEach((p) => {
      seen.push(p);
      let i = seen.length - 1, span = 0;
      while (i >= 0) { t.op(); if (seen[i] > p) break; span++; i--; }
      spans.push(span);
      const today = seen.length - 1;
      t.step({ line: 10, array: [...seen], pointers: i >= 0 ? { i, today } : { today }, range: [i + 1, today],
        tones: { ...Object.fromEntries(Array.from({ length: span }, (_, k) => [today - k, "compare" as Tone])), [today]: "active", ...(i >= 0 ? { [i]: "miss" } : {}) }, badge: i >= 0 ? { at: i, text: `${seen[i]} > ${p}` } : undefined,
        grid: out(spans, true), vars: { price: p, span, "prices read": span + (i >= 0 ? 1 : 0) },
        message: i >= 0 ? `next(${p}): counting back from today, ${span === 1 ? "only today is" : `${span} prices in a row are`} no higher than ${p}; ${seen[i]} stops the walk. Span ${span}.` : `next(${p}): every price so far is no higher than ${p}, so the walk reaches the first day. Span ${span}.` });
    });
    t.step({ line: 10, array: [...seen], grid: out(spans), vars: { calls: prices.length }, done: "found",
      message: `Returned [${spans.join(", ")}]. But each call can walk back over every earlier price: on rising prices that's 1 + 2 + … + n reads, O(n²) for n calls.` });
  },
};

const stackPairs: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack of (price, span) pairs",
  code: `class StockSpanner
    stack ← empty stack  // (price, span) pairs
    function next(price)
        span ← 1
        while stack not empty
            (p, s) ← stack.top()
            if p > price
                break
            stack.pop()
            span += s  // its days count for us too
        stack.push((price, span))
        return span
`,
  run({ prices }, t) {
    const st: [number, number][] = [], spans: number[] = [];
    const frames = () => [...st].reverse().map(([p, s]) => `${p}, span ${s}`);
    t.step({ line: 2, array: [], stack: [], stackTitle: "(price, span), top first", grid: out(spans), vars: {},
      message: `Keep a stack of (price, span) pairs. When a price is popped, its span already counts every day it covered, so today's span just adds it. A popped price never comes back: today is at least as high, so anyone looking back past today also looks past it. (The row of prices is only drawn to help you follow; the class keeps just the stack.)` });
    let asked = 0;
    prices.forEach((p) => {
      let span = 1;
      const top0 = st.length ? st[st.length - 1] : null;
      const popped: [number, number][] = [];
      while (st.length) { t.op(); const [q, s] = st[st.length - 1]; if (q > p) break; st.pop(); span += s; popped.push([q, s]); }
      const opts = top0 ? [...new Set([String(span), String(popped.length + 1), "1"])] : [];
      const ask = asked < 2 && top0 && popped.length && opts.length > 1 ? (asked++, { ask: { q: `next(${p}): the top pair is (${top0[0]}, span ${top0[1]}). What span does next(${p}) return?`, options: opts, answer: 0 } }) : {};
      st.push([p, span]);
      spans.push(span);
      const today = spans.length - 1, seen = prices.slice(0, today + 1);
      const cover = { ...Object.fromEntries(Array.from({ length: span - 1 }, (_, k) => [today - 1 - k, "compare" as Tone])), [today]: "active" as Tone };
      t.step({ ...ask, line: popped.length ? 10 : 11, array: seen, pointers: { today }, range: [today - span + 1, today], tones: cover, stack: frames(), stackTitle: "(price, span), top first", grid: out(spans, true), vars: { price: p, popped: popped.length, span },
        message: popped.length
          ? `next(${p}): pop ${popped.map(([q, s]) => `(${q}, ${s})`).join(", ")}, since ${popped.length === 1 ? "that price is" : "those prices are"} no higher than ${p}. Span = 1 + ${popped.map(([, s]) => s).join(" + ")} = ${span}.${st.length > 1 ? ` ${st[st.length - 2][0]} > ${p} stops it.` : ""} Push (${p}, ${span}).`
          : top0 ? `next(${p}): the top price ${top0[0]} is higher, so nothing is popped. Span 1. Push (${p}, 1).` : `next(${p}): the stack is empty, so the span is just today: 1. Push (${p}, 1).` });
    });
    t.step({ line: 12, array: [...prices], stack: frames(), stackTitle: "(price, span), top first", grid: out(spans), vars: { calls: prices.length }, done: "found",
      message: `Returned [${spans.join(", ")}]. One call can pop several pairs, but each pair is pushed once and popped once, so n calls take O(n) in total: O(1) per call on average.` });
  },
};

export const approaches = { scan: scanBack, stack: stackPairs };

/** Rising prices: every scan walks back to the first day. */
export const growth = measureGrowth(
  [{ approach: scanBack, slot: 1 }, { approach: stackPairs, slot: 3 }],
  (n) => ({ prices: Array.from({ length: n }, (_, i) => i + 1) }),
  [8, 16, 32, 64, 128],
);
