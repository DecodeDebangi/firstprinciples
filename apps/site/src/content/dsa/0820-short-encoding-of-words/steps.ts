import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string };
export const example: Input = { words: "same, me, game, ame, toy" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words);
  if (!w.length || w.length > 6) return { error: "Give 1 to 6 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,5}$/.test(x))) return { error: "Use words of 1 to 5 letters a to z." };
  const t = new Trie(); w.forEach((x) => t.insert([...x].reverse().join("")));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 18) return { error: "Those words branch too much to fit; use words that share endings." };
  return { input: { words: w.join(", ") } };
}

const set: Approach<Input> = {
  id: "set", name: "A set, removing every word's endings",
  code: `function minimumLengthEncoding(words)
    keep ← set of words
    for each w in words  // drop its shorter endings
        for k from 1 to length(w) − 1
            remove w[k..end] from keep
    total ← 0
    for each w in keep  // w, then a "#"
        total ← total + length(w) + 1
    return total
`,
  run(raw, t) {
    const words = parseWords(raw.words), keep = new Set(words);
    const entries = () => [...new Set(words)].map((w) => [w, keep.has(w) ? "kept" : "inside another"] as [string, string]);
    if (t.record) t.step({ line: 2, array: [], map: { title: "words", entries: entries() }, vars: {}, message: `Words are written into one string, each followed by "#". A word that is the end of another word needs no space of its own: "me#" can be read from inside "game#". So drop every word that is some other word's ending.` });
    for (const w of words) {
      const gone: string[] = [];
      for (let k = 1; k < w.length; k++) { t.op(w.length - k); const suf = w.slice(k); if (keep.delete(suf)) gone.push(suf); }
      if (t.record) t.step({ line: 5, array: [], map: { title: "words", entries: entries(), highlight: w }, vars: { word: w, removed: gone.join(", ") || "none" },
        message: `"${w}" ends with ${[...w].slice(1).map((_, k) => `"${w.slice(k + 1)}"`).join(", ") || "nothing shorter"}. ${gone.length ? `${gone.map((g) => `"${g}"`).join(" and ")} ${gone.length === 1 ? "is" : "are"} in the list, so ${gone.length === 1 ? "it's" : "they're"} removed.` : "None of those is in the list."} Each ending is copied out to look it up.` });
    }
    let total = 0; for (const w of keep) { t.op(); total += w.length + 1; }
    if (t.record) t.step({ line: 9, array: [], map: { title: "words", entries: entries() }, vars: { kept: [...keep].join(", "), total }, done: "found",
      message: `Kept: ${[...keep].join(", ")}. Each takes its length plus one "#": ${[...keep].map((w) => w.length + 1).join(" + ")} = ${total}. Copying every ending of a word of length L costs O(L²).` });
  },
};

const reversed: Approach<Input> = {
  id: "trie", name: "A trie of the reversed words: count its leaves",
  code: `function minimumLengthEncoding(words)
    root ← empty trie
    for each distinct w in words
        insert reverse(w) into the trie
    total ← 0
    for each leaf of the trie  // nobody ends in it
        total ← total + depth(leaf) + 1
    return total
`,
  run(raw, t) {
    const words = [...new Set(parseWords(raw.words))], tr = new Trie(), at = new Map<string, string>();
    let asked = 0;
    if (t.record) t.step({ line: 2, array: [], trees: tr.view(), vars: {}, message: "Written backwards, a word's ending becomes its beginning. In a trie of reversed words, a word that is the ending of another lies on that word's path, so only the words at the leaves need space." });
    for (const w of words) {
      const r = [...w].reverse().join(""); let n = tr.root; const path: string[] = [];
      for (const ch of r) { t.op(); n = tr.child(n, ch) ?? tr.make(ch, n); path.push(n); }
      tr.ends.add(n); at.set(n, w);
      if (t.record) t.step({ line: 4, array: [], trees: tr.view(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), vars: { word: w, reversed: r }, message: `Insert "${w}" backwards, as "${r}".` });
    }
    const leaves = tr.nodes.filter((n) => n.id !== tr.root && !n.kids!.length).map((n) => n.id);
    const depth = (id: string) => { let d = 0; const up = (x: string): boolean => { if (x === id) return true; for (const k of tr.nodes.find((n) => n.id === x)!.kids!) { d++; if (up(k)) return true; d--; } return false; }; up(tr.root); return d; };
    let total = 0; const parts: number[] = [];
    for (const l of leaves) { t.op(); const d = depth(l); total += d + 1; parts.push(d + 1); }
    const inner = words.filter((w) => !leaves.some((l) => at.get(l) === w));
    const ask = t.record && asked < 1 && inner.length ? (asked++, { ask: { q: `"${inner[0]}" ends at a node that has children. Does it need its own space?`, options: ["No: it's the ending of a longer word", "Yes: every word does"], answer: 0 } }) : {};
    if (t.record) t.step({ ...ask, line: 7, array: [], trees: tr.view({ ...Object.fromEntries(leaves.map((l) => [l, "found" as Tone])), ...Object.fromEntries(tr.nodes.filter((n) => tr.ends.has(n.id) && !leaves.includes(n.id)).map((n) => [n.id, "visited" as Tone])) }), vars: { leaves: leaves.length, total },
      message: `The leaves end ${leaves.map((l) => `"${at.get(l)}"`).join(", ")}: each needs its length plus "#", ${parts.join(" + ")} = ${total}.${inner.length ? ` ${inner.map((w) => `"${w}"`).join(", ")} end${inner.length === 1 ? "s" : ""} inside a path, so ${inner.length === 1 ? "it's" : "they're"} free.` : ""}` });
    if (t.record) t.step({ line: 8, array: [], trees: tr.view(Object.fromEntries(leaves.map((l) => [l, "found" as Tone]))), vars: { total }, done: "found", message: `${total}. One step per letter to build, and nothing is copied: O(total letters).` });
  },
};

export const approaches = { set, trie: reversed };
/** n words: one long word and all its endings, so every ending is looked up. */
export const growth = measureGrowth(
  [{ approach: set, slot: 1 }, { approach: reversed, slot: 3 }],
  (n) => { const base = Array.from({ length: n }, (_, k) => String.fromCharCode(97 + (k % 26))).join(""); return { words: [base, base.slice(n / 2), base.slice(1)].join(", ") }; },
  [8, 16, 32, 64, 128, 256],
);
