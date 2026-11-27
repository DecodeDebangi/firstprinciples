import { type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import { Trie, parseWords } from "../42-tries/steps";

/**
 * Compressed tries (radix trees): every chain of single-child nodes that doesn't end a word is merged into one edge
 * labelled with a whole string. The read shows compressing a plain trie, and inserting into a radix tree directly.
 */
class Radix {
  nodes: TreeNodeData[] = []; ends = new Set<string>(); private k = 0; root: string;
  constructor() { this.root = this.make("•"); }
  make(label: string) { const n: TreeNodeData = { id: `r${this.k++}`, val: label, left: null, right: null, kids: [] }; this.nodes.push(n); return n.id; }
  node(id: string) { return this.nodes.find((n) => n.id === id)!; }
  label(id: string) { return String(this.node(id).val); }
  sortKids(id: string) { const n = this.node(id); n.kids = [...n.kids!].sort((a, b) => this.label(a).localeCompare(this.label(b))); }
  view(tones: Record<string, Tone> = {}, label = "compressed"): TreeData { return { label, root: this.root, nodes: this.nodes.map((n) => ({ ...n, kids: [...n.kids!] })), tones, notes: Object.fromEntries([...this.ends].map((id) => [id, "✓"])), layout: "compact" }; }
}
const trieView = (tr: Trie, tones: Record<string, Tone> = {}): TreeData => ({ ...tr.view(tones)[0], label: "trie" });

export type WordsInput = { words: string };
export const wordsExample: WordsInput = { words: "flow, flower, flight, dog" };
export const wordsFields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function wordsPrepare(raw: WordsInput): Prepared<WordsInput> {
  const w = [...new Set(parseWords(raw.words))];
  if (!w.length || w.length > 6) return { error: "Give 1 to 6 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,7}$/.test(x))) return { error: "Use words of 1 to 7 letters a to z." };
  const t = new Trie(); w.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 22) return { error: "Those words branch too much to fit; use words that share beginnings." };
  return { input: { words: w.join(", ") } };
}

/* ---------- Compress a plain trie ---------- */
export const compress: Approach<WordsInput> = {
  id: "compress", name: "Compress a trie: merge chains into one edge",
  code: `function compress(node)
    for each child c of node
        // merge chains: one child, no word ending
        while c has one child and c ends no word
            g ← c's only child
            c.label ← c.label + g.label
            c.children ← g.children
            c.ends ← g.ends
        compress(c)
`,
  run(raw, t) {
    const words = parseWords(raw.words), tr = new Trie(); words.forEach((w) => tr.insert(w));
    const before = tr.nodes.length;
    // Build the compressed tree from the plain trie, recording each merge.
    const r = new Radix(), map = new Map<string, string>(); map.set(tr.root, r.root);
    let merges = 0, asked = 0;
    const kidsOf = (id: string) => tr.nodes.find((n) => n.id === id)!.kids!;
    t.step({ line: 1, array: [], trees: [trieView(tr)], vars: { "trie nodes": before }, message: `A plain trie spends a node on every letter, even along stretches where nothing branches and no word ends, like the "${(() => { for (const n of tr.nodes) { if (n.id !== tr.root && n.kids!.length === 1 && !tr.ends.has(n.id)) return String(n.val); } return "…"; })()}…" chains here. A compressed trie merges each such chain into one node holding the whole string.` });
    const go = (tid: string, rid: string) => {
      for (const c of kidsOf(tid)) {
        t.op();
        let label = String(tr.val(c)), cur = c; const chain = [c];
        while (kidsOf(cur).length === 1 && !tr.ends.has(cur)) { t.op(); cur = kidsOf(cur)[0]; label += String(tr.val(cur)); chain.push(cur); }
        const nid = r.make(label); r.node(rid).kids!.push(nid); r.sortKids(rid);
        if (tr.ends.has(cur)) r.ends.add(nid);
        map.set(cur, nid);
        if (chain.length > 1) {
          merges += chain.length - 1;
          const ask = asked < 1 ? (asked++, { ask: { q: `"${String(tr.val(c))}" has one child and ends no word. What happens to it?`, options: ["It merges with its child into one node", "It stays a node of its own", "It's deleted with everything below"], answer: 0 } }) : {};
          t.step({ ...ask, line: 6, array: [], trees: [trieView(tr, Object.fromEntries(chain.map((x) => [x, "found" as Tone]))), r.view({ [nid]: "found" })], vars: { merged: label, "merges so far": merges },
            message: `${chain.map((x) => `"${tr.val(x)}"`).join(", ")}: nothing branches and no word ends until "${label}", so the chain becomes one node labelled "${label}".` });
        } else {
          t.step({ line: 2, array: [], trees: [trieView(tr, { [c]: "compare" }), r.view({ [nid]: "compare" })], vars: { node: label },
            message: `"${label}" ${tr.ends.has(c) ? "ends a word" : `branches into ${kidsOf(c).length}`}, so it stays a node on its own.` });
        }
        go(cur, nid);
      }
    };
    go(tr.root, r.root);
    t.step({ line: 9, array: [], trees: [trieView(tr), r.view()], vars: { "trie nodes": before, "compressed nodes": r.nodes.length }, done: "found",
      message: `${before} nodes became ${r.nodes.length}. Every node left either branches or ends a word, so a compressed trie has at most about twice as many nodes as words, however long the words are.` });
  },
};

/* ---------- Insert into a radix tree ---------- */
export const insertRadix: Approach<WordsInput> = {
  id: "insert", name: "Insert into a compressed trie, splitting labels",
  code: `function insert(word)
    node ← root
    while word ≠ ""
        c ← the child starting with word[0]
        if c = none
            add a child labelled word, ending a word
            return
        k ← how many letters c.label and word share
        if k < length(c.label)  // parts partway
            split c.label after k letters, with the
              rest moved to a new node below it
        node ← c (or its first part, after a split)
        word ← word[k..end]
    mark node as ending a word
`,
  run(raw, t) {
    const words = parseWords(raw.words), r = new Radix();
    let asked = 0;
    t.step({ line: 1, array: [], trees: [r.view()], vars: {}, message: "Build the compressed trie directly. Each word walks down matching whole labels. Where it parts from a label partway through, the label is split in two, so that a branch can start there." });
    for (const w0 of words) {
      let node = r.root, w = w0; const path: string[] = [];
      while (w) {
        t.op();
        const c = r.node(node).kids!.find((k) => r.label(k)[0] === w[0]);
        if (!c) {
          const nid = r.make(w); r.node(node).kids!.push(nid); r.sortKids(node); r.ends.add(nid); path.push(nid);
          t.step({ line: 6, array: [], trees: [r.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [nid]: "found" })], vars: { word: w0, "added label": w }, message: `Insert "${w0}": ${path.length > 1 ? `after following ${path.slice(0, -1).map((p) => `"${r.label(p)}"`).join(", ")}, ` : ""}no child starts with '${w[0]}', so add one labelled "${w}" (✓).` });
          w = ""; node = nid; break;
        }
        const lab = r.label(c); let k = 0; while (k < lab.length && k < w.length && lab[k] === w[k]) { t.op(); k++; }
        if (k < lab.length) {
          const ask = asked < 1 ? (asked++, { ask: { q: `"${w0}" shares "${lab.slice(0, k)}" with the label "${lab}", then parts from it. What happens to "${lab}"?`, options: [`It splits into "${lab.slice(0, k)}" with "${lab.slice(k)}" below`, "It's replaced", "Nothing: the word goes elsewhere"], answer: 0 } }) : {};
          const mid = r.make(lab.slice(0, k));
          const pn = r.node(node); pn.kids = pn.kids!.map((x) => (x === c ? mid : x)); r.sortKids(node);
          r.node(c).val = lab.slice(k); r.node(mid).kids = [c];
          t.step({ ...ask, line: 10, array: [], trees: [r.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [mid]: "found", [c]: "compare" })], vars: { word: w0, label: lab, shared: lab.slice(0, k) },
            message: `"${w}" and the label "${lab}" share only "${lab.slice(0, k)}". Split the label: a node "${lab.slice(0, k)}" with "${lab.slice(k)}" hanging below it, so "${w0}" can branch off there.` });
          node = mid;
        } else node = c;
        path.push(node);
        w = w.slice(k);
      }
      if (!r.ends.has(node)) {
        r.ends.add(node);
        t.step({ line: 14, array: [], trees: [r.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [node]: "found" })], vars: { word: w0 }, message: `"${w0}" ends exactly at the end of "${r.label(node)}": mark it ✓.` });
      }
    }
    t.step({ line: 14, array: [], trees: [r.view()], vars: { words: words.length, nodes: r.nodes.length }, done: "found", message: `${words.length} words in ${r.nodes.length} nodes (counting the root). The same shape as compressing a plain trie, built without ever making the one-letter nodes.` });
  },
};
