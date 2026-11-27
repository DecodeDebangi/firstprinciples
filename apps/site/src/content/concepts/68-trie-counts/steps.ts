import type { Approach, InputField, Prepared, Tone, TreeData } from "@firstprinciples/ui";
import { Trie, parseWords, wordPanel } from "../42-tries/steps";

/**
 * A trie that counts: each node stores how many stored words pass through it, and how many end there. Used by the read
 * on counting tries and by LeetCode 677 and 2416.
 */
export class CountTrie extends Trie {
  count = new Map<string, number>();
  endCount = new Map<string, number>();
  cnt = (id: string) => this.count.get(id) ?? 0;
  /** Count notes under every node: how many words pass through, and ✓ where words end. */
  countView(tones: Record<string, Tone> = {}, extraNotes: Record<string, string> = {}): TreeData[] {
    const notes = Object.fromEntries(this.nodes.filter((n) => n.id !== this.root).map((n) => [n.id, `×${this.cnt(n.id)}${(this.endCount.get(n.id) ?? 0) > 0 ? " ✓" : ""}`]));
    return [{ root: this.root, nodes: this.nodes.map((n) => ({ ...n, kids: [...n.kids!] })), tones, notes: { ...notes, ...extraNotes }, layout: "compact" }];
  }
  /** Removes a node and everything below it. */
  remove(id: string) {
    const parent = this.nodes.find((n) => n.kids!.includes(id))!;
    parent.kids = parent.kids!.filter((k) => k !== id);
    const ch = String(this.val(id));
    this.kids.get(parent.id)!.delete(ch);
    const gone = new Set<string>(); const walk = (x: string) => { gone.add(x); for (const k of this.nodes.find((n) => n.id === x)!.kids!) walk(k); }; walk(id);
    this.nodes = this.nodes.filter((n) => !gone.has(n.id));
    for (const g of gone) { this.count.delete(g); this.endCount.delete(g); this.ends.delete(g); this.kids.delete(g); }
  }
  /** Inserts silently, updating counts. */
  add(word: string) { let n = this.root; for (const ch of word) { n = this.child(n, ch) ?? this.make(ch, n); this.count.set(n, this.cnt(n) + 1); } this.endCount.set(n, (this.endCount.get(n) ?? 0) + 1); this.ends.add(n); return n; }
}
type T = Parameters<Approach<unknown>["run"]>[1];
const visited = (ids: string[], t: Tone = "visited") => Object.fromEntries(ids.map((p) => [p, t]));

/** Insert with counts, one step per letter. */
export function countInsertSteps(tr: CountTrie, word: string, t: T, lines: { create: number; count: number; end: number }, ask: boolean, extra: () => Record<string, unknown> = () => ({})) {
  let node = tr.root; const path: string[] = []; let asked = !ask;
  [...word].forEach((ch, i) => {
    t.op();
    const had = tr.child(node, ch);
    node = had ?? tr.make(ch, node); path.push(node);
    const before = tr.cnt(node);
    const q = !asked && had ? (asked = true, { ask: { q: `'${ch}' already has ×${before} under it. What is its count after "${word}" passes through?`, options: [`×${before + 1}`, `×${before}`, `×${before + 2}`], answer: 0 } }) : {};
    tr.count.set(node, before + 1);
    if (t.record) t.step({ ...extra(), ...q, line: had ? lines.count : lines.create, array: [], trees: tr.countView({ ...visited(path), [node]: had ? "compare" : "found" }), ...wordPanel(word, i), vars: { word, letter: ch, count: tr.cnt(node) },
      message: had ? `'${ch}' is already there: follow it and add 1 to its count, now ×${tr.cnt(node)}. That many stored words start with "${word.slice(0, i + 1)}".` : `No '${ch}' yet: create it with count ×1. Only "${word}" starts with "${word.slice(0, i + 1)}" so far.` });
  });
  t.op();
  tr.endCount.set(node, (tr.endCount.get(node) ?? 0) + 1); tr.ends.add(node);
  if (t.record) t.step({ ...extra(), line: lines.end, array: [], trees: tr.countView(visited(path, "settled")), ...wordPanel(word), vars: { word },
    message: `Mark the last node: a word ends here (✓).` });
}

/* ---------- The read: build with counts ---------- */
export type WordsInput = { words: string };
export const wordsExample: WordsInput = { words: "car, cat, cart, dog" };
export const wordsFields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
const fits = (words: string[]) => { const t = new Trie(); words.forEach((w) => t.insert(w)); return t.nodes.filter((n) => !n.kids!.length).length <= 6 && t.nodes.length <= 18; };
export function wordsPrepare(raw: WordsInput): Prepared<WordsInput> {
  const w = parseWords(raw.words);
  if (!w.length || w.length > 6) return { error: "Give 1 to 6 words, separated by commas." };
  if (w.some((x) => !/^[a-z]+$/.test(x) || x.length > 6)) return { error: "Use words of the letters a to z, at most 6 letters each." };
  if (!fits(w)) return { error: "Those words branch too much to fit; use words that share beginnings." };
  return { input: { words: w.join(", ") } };
}
const insertCode = `function insert(word)
    node ← root
    for each letter c in word
        if node has no child c
            node.child[c] ← new node
        node ← node.child[c]
        node.count ← node.count + 1  // one more
    node.ends ← node.ends + 1
`;
export const buildCounts: Approach<WordsInput> = {
  id: "build", name: "Insert, counting words through each node",
  code: insertCode,
  run(raw, t) {
    const tr = new CountTrie(), words = parseWords(raw.words);
    t.step({ line: 1, array: [], trees: tr.countView(), vars: {}, message: "Each node gets a count: how many stored words pass through it. Since every word passing through a node starts with the letters on the path to it, that count is exactly how many words start with that prefix." });
    words.forEach((w, k) => countInsertSteps(tr, w, t, { create: 5, count: 7, end: 8 }, k === 2));
    t.step({ line: 8, array: [], trees: tr.countView(), vars: { words: words.length }, done: "found", message: `Every count says how many of the ${words.length} words start with the letters on its path: the root's children add up to all of them.` });
  },
};

/* ---------- The read: count words with a prefix ---------- */
export type PrefixInput = { words: string; prefix: string };
export const prefixExample: PrefixInput = { words: "car, cat, cart, dog", prefix: "ca" };
export const prefixFields: InputField[] = [{ key: "words", label: "words", kind: "text" }, { key: "prefix", label: "prefix", kind: "text" }];
export function prefixPrepare(raw: PrefixInput): Prepared<PrefixInput> {
  const r = wordsPrepare({ words: raw.words }); if ("error" in r) return { error: r.error };
  if (!/^[a-z]{1,6}$/.test(raw.prefix.toLowerCase())) return { error: "Use a prefix of 1 to 6 letters a to z." };
  return { input: { words: r.input.words, prefix: raw.prefix.toLowerCase() } };
}
export const countPrefix: Approach<PrefixInput> = {
  id: "prefix", name: "Count the words that start with a prefix",
  code: `function countPrefix(p)  // words starting with p
    node ← root
    for each letter c in p
        if node has no child c
            return 0
        node ← node.child[c]
    return node.count
`,
  run(raw, t) {
    const tr = new CountTrie(); parseWords(raw.words).forEach((w) => tr.add(w));
    const p = raw.prefix, path: string[] = [];
    let node = tr.root;
    t.step({ line: 2, array: [], trees: tr.countView(), ...wordPanel(p), vars: { prefix: p }, message: `How many stored words start with "${p}"? Walk down the letters of "${p}" and read the count where they end. The words below are never visited.` });
    for (let i = 0; i < p.length; i++) {
      t.op();
      const nx = tr.child(node, p[i]);
      if (!nx) { t.step({ line: 5, array: [], trees: tr.countView(visited(path)), ...wordPanel(p, i, "miss"), vars: { prefix: p, answer: 0 }, done: "notfound", message: `No '${p[i]}' here: no stored word starts with "${p.slice(0, i + 1)}". Return 0.` }); return; }
      node = nx; path.push(node);
      t.step({ line: 6, array: [], trees: tr.countView({ ...visited(path), [node]: "compare" }), ...wordPanel(p, i), vars: { prefix: p, count: tr.cnt(node) }, message: `'${p[i]}' is there (×${tr.cnt(node)}): follow it.` });
    }
    t.step({ line: 7, array: [], trees: tr.countView({ ...visited(path), [node]: "found" }), ...wordPanel(p), vars: { prefix: p, answer: tr.cnt(node) }, done: "found",
      message: `The count here is ${tr.cnt(node)}: that many stored words start with "${p}". ${p.length} steps, however many words there are, and without visiting any of them.` });
  },
};

/* ---------- The read: delete a word ---------- */
export type EraseInput = { words: string; word: string };
export const eraseExample: EraseInput = { words: "car, cat, cart, dog", word: "cart" };
export const eraseFields: InputField[] = [{ key: "words", label: "words", kind: "text" }, { key: "word", label: "delete", kind: "text" }];
export function erasePrepare(raw: EraseInput): Prepared<EraseInput> {
  const r = wordsPrepare({ words: raw.words }); if ("error" in r) return { error: r.error };
  const w = raw.word.toLowerCase();
  if (!parseWords(r.input.words).includes(w)) return { error: "Pick a word that is in the list, so there's something to delete." };
  return { input: { words: r.input.words, word: w } };
}
export const erase: Approach<EraseInput> = {
  id: "erase", name: "Delete a word, removing what nothing else uses",
  code: `function erase(word)  // word must be stored
    node ← root
    for each letter c in word
        next ← node.child[c]
        next.count ← next.count − 1
        if next.count = 0  // nothing else uses it
            remove node.child[c]
            return
        node ← next
    node.ends ← node.ends − 1
`,
  run(raw, t) {
    const tr = new CountTrie(); parseWords(raw.words).forEach((x) => tr.add(x));
    const w = raw.word, path: string[] = [];
    let node = tr.root, asked = false;
    t.step({ line: 2, array: [], trees: tr.countView(), ...wordPanel(w), vars: { word: w }, message: `Delete "${w}" by walking its letters and taking 1 off each count. A node whose count reaches 0 isn't used by any other word, so it and everything below it can go.` });
    for (let i = 0; i < w.length; i++) {
      t.op();
      const nx = tr.child(node, w[i])!;
      const after = tr.cnt(nx) - 1;
      const q = !asked ? (asked = true, { ask: { q: `'${w[i]}' has count ×${tr.cnt(nx)}. After taking 1 off, is it still needed?`, options: after > 0 ? [`Yes: ${after} other word${after === 1 ? " uses" : "s use"} it`, "No: remove it"] : ["No: remove it and everything below", `Yes: keep it`], answer: 0 } }) : {};
      tr.count.set(nx, after);
      if (after === 0) {
        const below = [nx]; const walk = (x: string) => { for (const k of tr.nodes.find((n) => n.id === x)!.kids!) { below.push(k); walk(k); } }; walk(nx);
        t.step({ ...q, line: 7, array: [], trees: tr.countView({ ...visited(path), ...visited(below, "miss") }), ...wordPanel(w, i, "miss"), vars: { word: w, count: 0 },
          message: `'${w[i]}' drops to ×0: no other word goes through it. Remove it${below.length > 1 ? ` and the ${below.length - 1} node${below.length === 2 ? "" : "s"} below it` : ""}. Done.` });
        tr.remove(nx);
        t.step({ line: 8, array: [], trees: tr.countView(visited(path, "settled")), vars: { word: w }, done: "found", message: `"${w}" is gone, and so is every node only it used. Every other word, and every count on its path, is still right.` });
        return;
      }
      node = nx; path.push(node);
      t.step({ ...q, line: 5, array: [], trees: tr.countView({ ...visited(path), [node]: "compare" }), ...wordPanel(w, i), vars: { word: w, count: after },
        message: `'${w[i]}' drops to ×${after}: ${after} other word${after === 1 ? " still uses" : "s still use"} it, so keep it and go on.` });
    }
    tr.endCount.set(node, (tr.endCount.get(node) ?? 1) - 1); if (!tr.endCount.get(node)) tr.ends.delete(node);
    t.op();
    t.step({ line: 10, array: [], trees: tr.countView(visited(path, "settled")), vars: { word: w }, done: "found", message: `Every node on the path is still used by a longer word, so only the ✓ goes: "${w}" is no longer stored, but the words that start with it are.` });
  },
};
