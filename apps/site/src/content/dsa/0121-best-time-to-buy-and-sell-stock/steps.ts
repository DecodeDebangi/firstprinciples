import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";

export type Input = { prices: number[] };

export const example: Input = { prices: [8, 3, 6, 2, 9, 4] };

export const fields: InputField[] = [{ key: "prices", label: "prices", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.prices.length < 2) return { error: "Give at least two days of prices." };
  if (raw.prices.some((p) => p < 0)) return { error: "Prices can't be negative." };
  return { input: raw };
}

const bruteForce: Approach<Input> = {
  id: "brute",
  name: "Brute force",
  code: `def max_profit(prices):
    best = 0
    for i in range(len(prices)):
        for j in range(i + 1, len(prices)):
            best = max(best, prices[j] - prices[i])
    return best
`,
  run({ prices: p }, t) {
    let best = 0, bi = -1, bj = -1;
    t.step({ line: 2, array: p, labels: p.map((_, k) => `day ${k}`), vars: { best },
      message: "Try every buy day with every later sell day, and keep the biggest profit." });
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        t.op();
        const profit = p[j] - p[i];
        const better = profit > best;
        if (better) { best = profit; bi = i; bj = j; }
        t.step({ line: 5, array: p, labels: p.map((_, k) => `day ${k}`), pointers: { buy: i, sell: j },
          tones: { [i]: "active", [j]: "compare" }, badge: { at: j, text: `${p[j]} − ${p[i]} = ${profit}` }, vars: { best },
          message: better ? `Buy at ${p[i]}, sell at ${p[j]}: profit ${profit}. New best.` : `Buy at ${p[i]}, sell at ${p[j]}: profit ${profit}. Best stays ${best}.` });
      }
    }
    t.step({ line: 6, array: p, labels: p.map((_, k) => `day ${k}`), pointers: bi >= 0 ? { buy: bi, sell: bj } : {},
      tones: bi >= 0 ? { [bi]: "found", [bj]: "found" } : {}, vars: { best }, done: "found",
      message: best > 0 ? `Best: buy at ${p[bi]} on day ${bi}, sell at ${p[bj]} on day ${bj}, profit ${best}.` : "Prices only fall, so the best is not to trade: profit 0." });
  },
};

const onePass: Approach<Input> = {
  id: "window",
  name: "One pass: cheapest day so far",
  code: `def max_profit(prices):
    cheapest = prices[0]
    best = 0
    for p in prices[1:]:
        if p < cheapest:
            cheapest = p
        else:
            best = max(best, p - cheapest)
    return best
`,
  run({ prices: p }, t) {
    let buy = 0, best = 0, bi = -1, bj = -1;
    const labels = p.map((_, k) => `day ${k}`);
    t.step({ line: 2, array: p, labels, pointers: { buy }, range: [0, 0], vars: { cheapest: p[0], best },
      message: "The best day to sell from today only depends on the cheapest day before it. Keep that one number as you walk." });
    for (let day = 1; day < p.length; day++) {
      t.op();
      const opts = ["New cheapest day: move the buy day here", "Sell today: check the profit"];
      const ask = (answer: number) => ({ q: `Today's price is ${p[day]}; the cheapest so far is ${p[buy]}. What happens?`, options: opts, answer });
      if (p[day] < p[buy]) {
        t.step({ ask: ask(0), line: 6, array: p, labels, pointers: { buy: day, today: day }, range: [day, day], tones: { [day]: "active" },
          badge: { at: day, text: `${p[day]} < ${p[buy]}` }, vars: { cheapest: p[day], best },
          message: `${p[day]} is cheaper than ${p[buy]}. Any later sale does better buying here, so the window restarts at day ${day}.` });
        buy = day;
      } else {
        const profit = p[day] - p[buy];
        const better = profit > best;
        if (better) { best = profit; bi = buy; bj = day; }
        t.step({ ask: ask(1), line: 8, array: p, labels, pointers: { buy, today: day }, range: [buy, day], tones: { [buy]: "active", [day]: "compare" },
          badge: { at: day, text: `${p[day]} − ${p[buy]} = ${profit}` }, vars: { cheapest: p[buy], best },
          message: better ? `Selling today makes ${profit}. New best.` : `Selling today makes ${profit}. Best stays ${best}.` });
      }
    }
    t.step({ line: 9, array: p, labels, pointers: bi >= 0 ? { buy: bi, sell: bj } : {}, tones: bi >= 0 ? { [bi]: "found", [bj]: "found" } : {},
      range: bi >= 0 ? [bi, bj] : null, vars: { cheapest: p[buy], best }, done: "found",
      message: best > 0 ? `One pass, profit ${best}: buy on day ${bi}, sell on day ${bj}.` : "Prices only fall, so the best is not to trade: profit 0." });
  },
};

export const approaches = { brute: bruteForce, window: onePass };

const worstCase = (n: number): Input => ({ prices: Array.from({ length: n }, (_, i) => (i * 7) % 11) });

export const growth = measureGrowth(
  [
    { approach: bruteForce, slot: 1 },
    { approach: onePass, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
