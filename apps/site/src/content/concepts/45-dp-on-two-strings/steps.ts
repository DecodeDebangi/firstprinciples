import type { Approach, ArrayStep, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ a: string; b: string }>["run"]>[1];
export type TwoInput = { a: string; b: string };
export const twoFields: InputField[] = [
  { key: "a", label: "word a (down the side)", kind: "text" },
  { key: "b", label: "word b (along the top)", kind: "text" },
];
export function twoPrepare(raw: TwoInput, max = 6): Prepared<TwoInput> {
  const a = raw.a.toLowerCase(), b = raw.b.toLowerCase();
  if (!a.length || !b.length) return { error: "Type both words." };
  if (!/^[a-z]+$/.test(a + b)) return { error: "Use the letters a to z." };
  if (a.length > max || b.length > max) return { error: `Use at most ${max} letters per word so the table fits.` };
  return { input: { a, b } };
}

/** A (|a| + 1) × (|b| + 1) table with the letters as headers; row and column 0 stand for "no letters yet". */
export const stringTable = (title: string, a: string, b: string, dp: (number | string)[][], tones: Record<string, Tone> = {}): ArrayStep["grid"] => ({
  title, rows: dp.map((r) => [...r]), rowLabels: ["·", ...a], colLabels: ["·", ...b], dense: true, tones,
});

/** Fills the LCS table cell by cell, then walks back to read the subsequence. Shared with LC 1143. */
export function lcsSteps(a: string, b: string, t: T, lines: { init: number; same: number; differ: number; done: number }) {
  const m = a.length, n = b.length;
  const dp: (number | string)[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : "")));
  const filled: Record<string, Tone> = {};
  for (let i = 0; i <= m; i++) filled[`${i},0`] = "visited";
  for (let j = 0; j <= n; j++) filled[`0,${j}`] = "visited";
  t.op(m + n);
  t.step({ line: lines.init, array: [], hideStage: true, grid: stringTable("dp: longest common subsequence so far", a, b, dp, filled), vars: { a, b },
    message: `dp[i][j] will be the length of the longest common subsequence of the first i letters of "${a}" and the first j letters of "${b}". Row 0 and column 0 mean "no letters yet": nothing in common, so 0.` });
  let askedSame = false, askedDiff = false;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    t.op();
    const x = a[i - 1], y = b[j - 1];
    if (x === y) {
      const v = (dp[i - 1][j - 1] as number) + 1;
      const ask = !askedSame && v > 1 ? (askedSame = true, { ask: { q: `'${x}' = '${y}', and dp[${i - 1}][${j - 1}] (diagonally up-left) is ${v - 1}. What is dp[${i}][${j}]?`, options: [String(v), String(v - 1), String(v + 1)], answer: 0 } }) : {};
      dp[i][j] = v;
      t.step({ ...ask, line: lines.same, array: [], hideStage: true, grid: stringTable("dp: longest common subsequence so far", a, b, dp, { ...filled, [`${i - 1},${j - 1}`]: "compare", [`${i},${j}`]: "found" }), vars: { i, j, "a[i]": x, "b[j]": y },
        message: `'${x}' and '${y}' match: use them both. Take the best without them, dp[${i - 1}][${j - 1}] = ${v - 1}, and add 1: ${v}.` });
    } else {
      const up = dp[i - 1][j] as number, left = dp[i][j - 1] as number, v = Math.max(up, left);
      const ask = !askedDiff && up !== left ? (askedDiff = true, { ask: { q: `'${x}' ≠ '${y}'. Above is ${up} and to the left is ${left}. What is dp[${i}][${j}]?`, options: [String(v), String(Math.min(up, left)), String(up + left)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      dp[i][j] = v;
      t.step({ ...ask, line: lines.differ, array: [], hideStage: true, grid: stringTable("dp: longest common subsequence so far", a, b, dp, { ...filled, [`${i - 1},${j}`]: "compare", [`${i},${j - 1}`]: "compare", [`${i},${j}`]: "active" }), vars: { i, j, "a[i]": x, "b[j]": y },
        message: `'${x}' ≠ '${y}': they can't both end the subsequence. Drop one of them: the better of dp[${i - 1}][${j}] = ${up} (without '${x}') and dp[${i}][${j - 1}] = ${left} (without '${y}') is ${v}.` });
    }
    filled[`${i},${j}`] = "settled";
  }
  // Walk back from the corner to read one longest subsequence.
  let i = m, j = n;
  const path: Record<string, Tone> = {}, letters: string[] = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { path[`${i},${j}`] = "found"; letters.unshift(a[i - 1]); i--; j--; }
    else if ((dp[i - 1][j] as number) >= (dp[i][j - 1] as number)) { path[`${i},${j}`] = "compare"; i--; }
    else { path[`${i},${j}`] = "compare"; j--; }
  }
  t.step({ line: lines.done, array: [], hideStage: true, grid: stringTable("dp: longest common subsequence so far", a, b, dp, { ...Object.fromEntries(Object.keys(filled).map((k) => [k, "visited" as Tone])), ...path }), vars: { length: dp[m][n], subsequence: `"${letters.join("")}"` }, done: "found",
    message: `The corner says ${dp[m][n]}. Walking back from it (diagonal on a match, otherwise towards the larger neighbour) spells "${letters.join("")}". ${(m + 1) * (n + 1)} cells, one step each: O(m · n).` });
  return dp[m][n] as number;
}

export const lcsCode = `function longestCommonSubsequence(a, b)
    m, n ← length(a), length(b)
    dp ← (m + 1) × (n + 1) grid, all 0
    for i ← 1 to m
        for j ← 1 to n
            up, left ← dp[i - 1][j], dp[i][j - 1]
            if a[i - 1] = b[j - 1]  // letters match
                dp[i][j] ← dp[i - 1][j - 1] + 1
            else
                dp[i][j] ← max(up, left)
    return dp[m][n]
`;
export const lcsExample: TwoInput = { a: "cart", b: "chat" };
const lcs: Approach<TwoInput> = { id: "lcs", name: "Longest common subsequence table", code: lcsCode, run({ a, b }, t) { lcsSteps(a, b, t, { init: 3, same: 8, differ: 10, done: 11 }); } };
export const lcsApproaches = { lcs };
