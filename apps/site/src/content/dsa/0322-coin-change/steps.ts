import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { dpGrid } from "../../concepts/55-one-dimensional-dp/steps";

export type Input = { coins: number[]; amount: number };
export const example: Input = { coins: [1, 3, 4], amount: 6 };
export const fields: InputField[] = [
  { key: "coins", label: "coins (distinct)", kind: "numbers" },
  { key: "amount", label: "amount", kind: "number" },
];
/** Calls the plain recursion makes. */
export function callsFor(coins: number[], amount: number) {
  const memo = new Map<number, number>();
  const c = (a: number): number => { if (a === 0) return 1; if (memo.has(a)) return memo.get(a)!; let s = 1; for (const x of coins) if (x <= a) s += c(a - x); memo.set(a, s); return s; };
  return c(amount);
}
export function prepare(raw: Input): Prepared<Input> {
  const c = raw.coins;
  if (!c.length || c.length > 4) return { error: "Use 1 to 4 coin values." };
  if (c.some((x) => !Number.isInteger(x) || x < 1 || x > 20)) return { error: "Coin values are whole numbers from 1 to 20." };
  if (new Set(c).size !== c.length) return { error: "Coin values must be distinct." };
  if (!Number.isInteger(raw.amount) || raw.amount < 0 || raw.amount > 12) return { error: "Use an amount from 0 to 12 so the table fits." };
  if (callsFor(c, raw.amount) > 40) return { error: `The plain recursion would make ${callsFor(c, raw.amount)} calls, too many to draw. Try a smaller amount or bigger coins.` };
  return { input: { coins: [...c].sort((a, b) => a - b), amount: raw.amount } };
}
const inf = (v: number) => (v === Infinity ? "∞" : String(v));

const recurse: Approach<Input> = {
  id: "recurse",
  name: "Plain recursion: try each coin last",
  code: `function coinChange(coins, amount)
    r ← fewest(amount)
    return r if it's not ∞, else -1
function fewest(a)  // fewest coins adding to a
    if a = 0
        return 0
    best ← ∞
    for each c in coins
        if c ≤ a
            best ← min(best, 1 + fewest(a - c))
    return best
`,
  run({ coins, amount }, t) {
    const tree = new CallTree(), seen = new Set<number>(), label = new Map<string, string>();
    let repeats = 0;
    const go = (parent: string | null, a: number): number => {
      const id = tree.add(parent, a);
      label.set(id, `fewest(${a})`);
      const again = seen.has(a);
      seen.add(a);
      if (a === 0) { tree.log({ id, kind: "solution", line: 6, note: "0", vars: { a }, message: `Amount 0 needs no coins.` }); return 0; }
      const opts: string[] = [];
      let best = Infinity;
      for (const c of coins) if (c <= a) { const r = go(id, a - c); best = Math.min(best, 1 + r); opts.push(`${c} last: 1 + ${inf(r)}`); }
      if (again) repeats++;
      tree.log({ id, kind: again ? "prune" : "call", line: 11, note: inf(best), vars: { a, returns: inf(best) },
        message: `${again ? `fewest(${a}) again, from scratch. ` : ""}Amount ${a}: ${opts.length ? `${opts.join("; ")}. Best: ${inf(best)}.` : "every coin is bigger, so it can't be made: ∞."}` });
      return best;
    };
    const r = go(null, amount), ans = r === Infinity ? -1 : r;
    tree.replay(t, {
      intro: { line: 2, message: `The last coin used could be any coin c, leaving amount − c to make as cheaply as possible. Try every coin, recursively. Each node is an amount; the number under it is the fewest coins for it.`, vars: { amount } },
      finish: () => ({ line: 3, message: `${ans === -1 ? `${amount} can't be made: return -1.` : `${amount} needs ${ans} coin${ans === 1 ? "" : "s"}.`} But ${tree.nodes.length} calls answered only ${seen.size} different amounts, and ${repeats} of them redid an amount already worked out, with everything below it (red). The calls grow exponentially with the amount.`, vars: { answer: ans }, done: ans === -1 ? "notfound" : "found" }),
      stackLabel: (id) => label.get(id)!,
    });
  },
};

const table: Approach<Input> = {
  id: "table",
  name: "Fill a table for every amount up to the target",
  code: `function coinChange(coins, amount)
    dp ← array of amount + 1, all ∞
    dp[0] ← 0
    for a ← 1 to amount
        for each c in coins
            if c ≤ a
                dp[a] ← min(dp[a], dp[a - c] + 1)
    return dp[amount] if it's not ∞, else -1
`,
  run({ coins, amount }, t) {
    const amounts = Array.from({ length: amount + 1 }, (_, i) => i), dp = Array(amount + 1).fill(Infinity) as number[];
    dp[0] = 0;
    const g = (tones: Record<string, Tone> = {}) => dpGrid(amounts, dp.map(inf), tones, ["amount", "coins"]);
    t.step({ line: 3, array: [], grid: g({ "1,0": "found" }), vars: { coins: coins.join(", ") },
      message: `dp[a] is the fewest coins that add up to exactly a, or ∞ if a can't be made. dp[0] = 0. Then each amount tries every coin as the last one: dp[a] = 1 + dp[a − c].` });
    let asked = false;
    for (let a = 1; a <= amount; a++) {
      const opts: string[] = [], used: number[] = [];
      for (const c of coins) { t.op(); if (c <= a) { used.push(a - c); opts.push(`${c}: 1 + dp[${a - c}] = ${inf(1 + dp[a - c])}`); dp[a] = Math.min(dp[a], dp[a - c] + 1); } }
      const ask = !asked && used.length > 1 ? (asked = true, { ask: { q: `Amount ${a}: the options are ${opts.map((o) => o.split(" = ")[1]).join(", ")}. What's dp[${a}]?`, options: [...new Set([inf(dp[a]), ...opts.map((o) => o.split(" = ")[1])])], answer: 0 } }) : {};
      t.step({ ...(ask.ask && ask.ask.options.length > 1 ? ask : {}), line: 7, array: [], grid: g({ ...Object.fromEntries(used.map((x) => [`1,${x}`, "compare" as Tone])), [`1,${a}`]: dp[a] === Infinity ? "miss" : "found" }), vars: { a, [`dp[${a}]`]: inf(dp[a]) },
        message: opts.length ? `Amount ${a}, ending with coin ${opts.join("; or ")}. Fewest: ${inf(dp[a])}.` : `Amount ${a}: every coin is bigger, so it can't be made: ∞.` });
    }
    const ans = dp[amount] === Infinity ? -1 : dp[amount];
    t.step({ line: 8, array: [], grid: g({ [`1,${amount}`]: ans === -1 ? "miss" : "found" }), vars: { answer: ans }, done: ans === -1 ? "notfound" : "found",
      message: `${ans === -1 ? `dp[${amount}] is ∞: return -1.` : `dp[${amount}] = ${ans}.`} Each of the ${amount} amounts tried each of the ${coins.length} coins once: O(amount · k) time, O(amount) space.` });
  },
};

export const approaches = { recurse, table };

export const growth = measureGrowth(
  [{ approach: recurse, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ coins: [1, 3, 4], amount: n }),
  [4, 6, 8, 10, 12],
);
