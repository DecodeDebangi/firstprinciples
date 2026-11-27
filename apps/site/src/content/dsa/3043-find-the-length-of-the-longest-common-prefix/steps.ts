import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie } from "../../concepts/42-tries/steps";

export type Input = { arr1: number[]; arr2: number[] };
export const example: Input = { arr1: [125, 1203, 98], arr2: [120, 9, 1250] };
export const fields: InputField[] = [{ key: "arr1", label: "arr1", kind: "numbers" }, { key: "arr2", label: "arr2", kind: "numbers" }];
export function prepare(raw: Input): Prepared<Input> {
  for (const a of [raw.arr1, raw.arr2]) {
    if (!a.length || a.length > 5) return { error: "Give 1 to 5 numbers in each list." };
    if (a.some((x) => !Number.isInteger(x) || x < 1 || x > 99999)) return { error: "Use whole numbers from 1 to 99999." };
  }
  const t = new Trie(); raw.arr1.forEach((x) => t.insert(String(x)));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6) return { error: "Those numbers branch too much to fit." };
  return { input: raw };
}
const common = (a: string, b: string) => { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; };

const pairs: Approach<Input> = {
  id: "pairs", name: "Compare every pair of numbers",
  code: `function longestCommonPrefix(arr1, arr2)
    best ← 0
    for each x in arr1
        for each y in arr2
            k ← leading digits x and y share
            best ← max(best, k)
    return best
`,
  run({ arr1, arr2 }, t) {
    let best = 0, at = "";
    if (t.record) t.step({ line: 2, array: arr1, vars: { best }, message: "Write the numbers as digits. For every pair, one from each list, count how many leading digits they share, and keep the most." });
    for (const x of arr1) {
      const parts: string[] = [];
      for (const y of arr2) { const k = common(String(x), String(y)); t.op(Math.min(String(x).length, String(y).length)); parts.push(`${y}: ${k}`); if (k > best) { best = k; at = `${x} and ${y}`; } }
      if (t.record) t.step({ line: 6, array: arr1, tones: { [arr1.indexOf(x)]: "active" }, vars: { x, shares: parts.join(", "), best }, message: `${x} against each of ${arr2.join(", ")}: shared leading digits ${parts.join(", ")}.` });
    }
    if (t.record) t.step({ line: 7, array: arr1, vars: { answer: best }, done: "found", message: `${best}${at ? `, from ${at}` : ""}. Every pair compared: O(n · m · D) for D digits.` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie of arr1's digits, walked by arr2",
  code: `function longestCommonPrefix(arr1, arr2)
    root ← a trie of the digits of every x in arr1
    best ← 0
    for each y in arr2
        node, k ← root, 0
        for each digit d of y
            if node has no child d
                leave this loop
            node, k ← node.child[d], k + 1
        best ← max(best, k)
    return best
`,
  run({ arr1, arr2 }, t) {
    const tr = new Trie(); arr1.forEach((x) => { tr.insert(String(x)); t.op(String(x).length); });
    let best = 0, asked = 0;
    if (t.record) t.step({ line: 2, array: arr2, trees: tr.view(), vars: { best }, message: `Put arr1's numbers in a trie, digit by digit. Any prefix two numbers share is a path in it, so each number of arr2 just walks down as far as its digits match: the depth reached is its best shared prefix with all of arr1 at once.` });
    for (const y of arr2) {
      let n = tr.root, k = 0; const path: string[] = [];
      for (const d of String(y)) { t.op(); const c = tr.child(n, d); if (!c) break; n = c; k++; path.push(c); }
      const ask = t.record && asked < 1 && k > 0 ? (asked++, { ask: { q: `${y} walks down "${String(y).slice(0, k)}" and then stops. What does it share with arr1?`, options: [`${k} leading digit${k === 1 ? "" : "s"}, with whichever number continues that path`, "Nothing", `${String(y).length} digits`], answer: 0 } }) : {};
      best = Math.max(best, k);
      if (t.record) t.step({ ...ask, line: 10, array: arr2, tones: { [arr2.indexOf(y)]: "active" }, trees: tr.view(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), vars: { y, depth: k, best },
        message: k ? `${y} matches "${String(y).slice(0, k)}"${k < String(y).length ? `, then the trie has no '${String(y)[k]}'` : ""}: ${k} shared digit${k === 1 ? "" : "s"}.` : `${y}: no number in arr1 starts with '${String(y)[0]}'.` });
    }
    if (t.record) t.step({ line: 11, array: arr2, trees: tr.view(), vars: { answer: best }, done: "found", message: `${best}. Each number is inserted or walked once, digit by digit: O((n + m) · D).` });
  },
};

export const approaches = { pairs, trie };
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ arr1: Array.from({ length: n }, (_, k) => 10000 + k * 37), arr2: Array.from({ length: n }, (_, k) => 10000 + k * 53) }),
  [8, 16, 32, 64, 128, 256],
);
