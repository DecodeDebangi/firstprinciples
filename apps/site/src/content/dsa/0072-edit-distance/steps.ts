import { CallTree, measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { stringTable, twoFields, type TwoInput } from "../../concepts/45-dp-on-two-strings/steps";

export type Input = TwoInput;
export const example: Input = { a: "cat", b: "cut" };
export const fields: InputField[] = twoFields;
/** Number of calls plain recursion makes, to keep its tree small enough to draw. */
const calls = (a: string, b: string): number => {
  const go = (i: number, j: number): number => (i === 0 || j === 0 ? 1 : a[i - 1] === b[j - 1] ? 1 + go(i - 1, j - 1) : 1 + go(i - 1, j - 1) + go(i - 1, j) + go(i, j - 1));
  return go(a.length, b.length);
};
export function prepare(raw: Input): Prepared<Input> {
  const a = raw.a.toLowerCase(), b = raw.b.toLowerCase();
  if (!/^[a-z]*$/.test(a + b) || !(a + b).length) return { error: "Type two words of letters a to z (one may be empty)." };
  if (a.length > 5 || b.length > 5) return { error: "Use at most 5 letters per word so the table fits." };
  return { input: { a, b } };
}

const recursion: Approach<Input> = {
  id: "recursion",
  name: "Plain recursion",
  code: `function minDistance(a, b)
    return ed(length(a), length(b))
function ed(i, j)  // first i of a → first j of b
    if i = 0 or j = 0
        return i + j
    if a[i - 1] = b[j - 1]
        return ed(i - 1, j - 1)
    rep ← ed(i - 1, j - 1)  // replace
    del ← ed(i - 1, j)  // delete a's letter
    ins ← ed(i, j - 1)  // insert b's letter
    return 1 + min(rep, del, ins)
`,
  run({ a, b }, t) {
    // Only the drawn animation is capped; the growth chart's silent runs (record = false) go through.
    if (t.record && calls(a, b) > 25) {
      t.step({ line: 2, array: [], hideStage: true, vars: { a, b, calls: calls(a, b) }, done: "found",
        message: `Plain recursion would make ${calls(a, b)} calls for these words: too many to draw. Try shorter words (such as "cat" and "cut"), or see the table approach.` });
      return;
    }
    const tree = new CallTree();
    let n = 0;
    const rec = (i: number, j: number, parent: string | null): number => {
      const id = tree.add(parent, `${i},${j}`);
      n++;
      if (i === 0 || j === 0) {
        tree.log({ id, kind: "solution", line: 5, note: String(i + j), vars: { i, j, calls: n }, message: `ed(${i}, ${j}): ${i === 0 ? `building ${j} letter${j === 1 ? "" : "s"} from nothing takes ${j} insert${j === 1 ? "" : "s"}` : `removing ${i} letter${i === 1 ? "" : "s"} takes ${i} delete${i === 1 ? "" : "s"}`}.` });
        return i + j;
      }
      if (a[i - 1] === b[j - 1]) {
        tree.log({ id, kind: "call", line: 7, vars: { i, j, calls: n }, message: `ed(${i}, ${j}): '${a[i - 1]}' = '${b[j - 1]}', so the last letters need no edit: the answer is ed(${i - 1}, ${j - 1}).` });
        const v = rec(i - 1, j - 1, id);
        tree.events.push({ id, kind: "solution", line: 7, note: String(v), vars: { i, j, calls: n }, message: `ed(${i}, ${j}) = ${v}.` });
        return v;
      }
      tree.log({ id, kind: "call", line: 8, vars: { i, j, calls: n }, message: `ed(${i}, ${j}): '${a[i - 1]}' ≠ '${b[j - 1]}'. One edit is needed: replace it, delete '${a[i - 1]}', or insert '${b[j - 1]}'. Try all three.` });
      const r = rec(i - 1, j - 1, id), d = rec(i - 1, j, id), s = rec(i, j - 1, id), v = 1 + Math.min(r, d, s);
      tree.events.push({ id, kind: "solution", line: 11, note: String(v), vars: { i, j, calls: n }, message: `ed(${i}, ${j}) = 1 + min(${r}, ${d}, ${s}) = ${v}.` });
      return v;
    };
    const total = rec(a.length, b.length, null);
    tree.replay(t, {
      intro: { line: 2, vars: { a, b }, message: `ed(i, j) is the fewest edits to turn the first i letters of "${a}" into the first j letters of "${b}". Each node "i,j" is a call; its number is what it returned.` },
      finish: (g) => ({ line: 2, grid: g, vars: { edits: total, calls: n }, done: "found", message: `${total} edit${total === 1 ? "" : "s"}, after ${n} calls. Each mismatch branches three ways, so the calls grow exponentially, and the same (i, j) is solved many times.` }),
      stackLabel: (id) => `ed(${tree.nodes.find((x) => x.id === id)!.val})`,
    });
  },
};

const table: Approach<Input> = {
  id: "table",
  name: "Fill a table",
  code: `function minDistance(a, b)
    m, n ← length(a), length(b)
    dp ← (m + 1) × (n + 1) grid
    for i ← 0 to m
        for j ← 0 to n
            if i = 0 or j = 0
                dp[i][j] ← i + j  // one is empty
                continue
            diag, up, left ← the three neighbours
            if a[i - 1] = b[j - 1]
                dp[i][j] ← diag  // no edit needed
            else
                dp[i][j] ← 1 + min(diag, up, left)
    return dp[m][n]
`,
  run({ a, b }, t) {
    const m = a.length, n = b.length;
    const dp: (number | string)[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(""));
    const done: Record<string, Tone> = {};
    const title = "dp: fewest edits";
    t.step({ line: 3, array: [], hideStage: true, grid: stringTable(title, a, b, dp), vars: { a, b },
      message: `dp[i][j] is the fewest edits to turn the first i letters of "${a}" into the first j letters of "${b}". Moving diagonally means replacing (or keeping) a letter, down means deleting one of a's letters, right means inserting one of b's.` });
    let askedSame = false, askedDiff = false;
    for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
      t.op();
      if (i === 0 || j === 0) {
        dp[i][j] = i + j; done[`${i},${j}`] = "visited";
        if (i === 0 && j === n || j === 0 && i === m) t.step({ line: 7, array: [], hideStage: true, grid: stringTable(title, a, b, dp, done), vars: { i, j },
          message: `${i === 0 ? `Row 0: building j letters from nothing takes j inserts` : `Column 0: turning i letters into nothing takes i deletes`}.` });
        continue;
      }
      const diag = dp[i - 1][j - 1] as number, up = dp[i - 1][j] as number, left = dp[i][j - 1] as number;
      const same = a[i - 1] === b[j - 1];
      const v = same ? diag : 1 + Math.min(diag, up, left);
      const ask = same && !askedSame ? (askedSame = true, { ask: { q: `'${a[i - 1]}' = '${b[j - 1]}', and diagonally up-left is ${diag}. What is dp[${i}][${j}]?`, options: [String(diag), String(diag + 1), String(Math.min(up, left) + 1)].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } })
        : !same && !askedDiff ? (askedDiff = true, { ask: { q: `'${a[i - 1]}' ≠ '${b[j - 1]}'. The neighbours are ${diag} (diagonal), ${up} (above) and ${left} (left). What is dp[${i}][${j}]?`, options: [String(v), String(v - 1), String(v + 1)], answer: 0 } }) : {};
      dp[i][j] = v;
      const pick: Record<string, Tone> = same ? { [`${i - 1},${j - 1}`]: "compare" } : { [`${i - 1},${j - 1}`]: "compare", [`${i - 1},${j}`]: "compare", [`${i},${j - 1}`]: "compare" };
      t.step({ ...ask, line: same ? 11 : 13, array: [], hideStage: true, grid: stringTable(title, a, b, dp, { ...done, ...pick, [`${i},${j}`]: "found" }), vars: { i, j, "a[i]": a[i - 1], "b[j]": b[j - 1] },
        message: same ? `'${a[i - 1]}' = '${b[j - 1]}': keep it, no edit. Same as diagonally up-left: ${v}.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': one edit plus the cheapest of replace (${diag}), delete (${up}) and insert (${left}): 1 + ${Math.min(diag, up, left)} = ${v}.` });
      done[`${i},${j}`] = "settled";
    }
    t.step({ line: 14, array: [], hideStage: true, grid: stringTable(title, a, b, dp, { ...done, [`${m},${n}`]: "found" }), vars: { edits: dp[m][n] }, done: "found",
      message: `"${a}" becomes "${b}" in ${dp[m][n]} edit${dp[m][n] === 1 ? "" : "s"}. ${(m + 1) * (n + 1)} cells, one step each: O(m · n).` });
  },
};

export const approaches = { recursion, table };

/** Two words of n letters with nothing in common: every cell is a mismatch. */
export const growth = measureGrowth(
  [{ approach: recursion, slot: 1 }, { approach: table, slot: 3 }],
  (n) => ({ a: "ab".repeat(n).slice(0, n), b: "cd".repeat(n).slice(0, n) }),
  [1, 2, 3, 4, 5],
);
