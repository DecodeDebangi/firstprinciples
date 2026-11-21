import type { Approach, InputField, Prepared, Tone, TreeData, TreeNodeData } from "@firstprinciples/ui";

/** A trie whose nodes are drawn with the call-tree layout: each node shows the letter on the edge into it. */
export class Trie {
  nodes: TreeNodeData[] = [];
  root: string;
  kids = new Map<string, Map<string, string>>();
  ends = new Set<string>();
  private k = 0;
  constructor() { this.root = this.make("•"); }
  make(val: string, parent?: string) {
    const id = `n${this.k++}`;
    const node: TreeNodeData = { id, val, left: null, right: null, kids: [] };
    this.nodes.push(node);
    this.kids.set(id, new Map());
    if (parent) {
      const p = this.nodes.find((x) => x.id === parent)!;
      // Keep children in alphabetical order so the drawing doesn't depend on insertion order.
      p.kids = [...p.kids!, id].sort((a, b) => String(this.val(a)).localeCompare(String(this.val(b))));
      this.kids.get(parent)!.set(val, id);
    }
    return id;
  }
  val(id: string) { return this.nodes.find((x) => x.id === id)!.val; }
  child(id: string, ch: string) { return this.kids.get(id)!.get(ch); }
  /** Inserts silently (no steps). */
  insert(word: string) { let n = this.root; for (const ch of word) n = this.child(n, ch) ?? this.make(ch, n); this.ends.add(n); return n; }
  /** The drawing: end-of-word nodes get a "✓ end" note. The current node is shown by its colour; a pointer label
   *  under it would collide with that note, so `_pointers` is accepted but not drawn. */
  view(tones: Record<string, Tone> = {}, _pointers: Record<string, string | null> = {}, extraNotes: Record<string, string> = {}): TreeData[] {
    const notes: Record<string, string> = Object.fromEntries([...this.ends].map((id) => [id, "✓ end"]));
    return [{ root: this.root, nodes: this.nodes.map((n) => ({ ...n, kids: [...n.kids!] })), tones, notes: { ...notes, ...extraNotes }, layout: "compact" }];
  }
  /** The path of node ids spelling `prefix`, from the root's child down; null if it leaves the trie. */
  path(prefix: string) { const out: string[] = []; let n = this.root; for (const ch of prefix) { const c = this.child(n, ch); if (!c) return null; out.push(c); n = c; } return out; }
}

export const parseWords = (s: string) => s.toLowerCase().split(/[\s,]+/).filter(Boolean);
export const wordPanel = (word: string, at?: number, tone: Tone = "active") => ({
  grid: { title: "word", rows: [word.length ? [...word] : [""]], tones: at === undefined || at < 0 ? {} : { [`0,${at}`]: tone } },
});
type T = Parameters<Approach<{ words: string }>["run"]>[1];

/** Insert `word` into `trie`, one step per letter. Shared with LC 208. */
export function insertSteps(trie: Trie, word: string, t: T, lines: { create: number; follow: number; end: number }, extraVars: Record<string, string | number> = {}, ask = false, extra: () => Record<string, unknown> = () => ({})) {
  let node = trie.root, asked = !ask;
  const path: string[] = [];
  [...word].forEach((ch, i) => {
    t.op();
    const existing = trie.child(node, ch);
    const q = !asked ? (asked = true, { ask: { q: `Inserting "${word}": does the current node already have a '${ch}' child?`, options: ["Yes: follow it", "No: create a new node"], answer: existing ? 0 : 1 } }) : {};
    if (existing) {
      node = existing; path.push(node);
      t.step({ ...extra(), ...q, line: lines.follow, array: [], trees: trie.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [node]: "compare" }, { node }), ...wordPanel(word, i), vars: { ...extraVars, word, ch },
        message: `'${ch}' is already there, shared with an earlier word: follow it. Nothing new is stored.` });
    } else {
      node = trie.make(ch, node); path.push(node);
      t.step({ ...extra(), ...q, line: lines.create, array: [], trees: trie.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [node]: "found" }, { node }), ...wordPanel(word, i), vars: { ...extraVars, word, ch },
        message: `No '${ch}' child here yet: create one and move to it.` });
    }
  });
  trie.ends.add(node);
  t.op();
  t.step({ ...extra(), line: lines.end, array: [], trees: trie.view({ ...Object.fromEntries(path.map((p) => [p, "settled" as Tone])) }, { node }), ...wordPanel(word), vars: { ...extraVars, word },
    message: `Mark the last node as the end of a word (✓). Without the mark, "${word}" would look like just the beginning of something longer.` });
}

/** Look up `word` (or just a prefix), one step per letter. Shared with LC 208. Returns "word", "prefix" or "none". */
export function searchSteps(trie: Trie, word: string, t: T, lines: { missing: number; follow: number; end: number }, prefixOnly: boolean, extraVars: Record<string, string | number> = {}, extra: (result?: boolean) => Record<string, unknown> = () => ({}), finish = true) {
  let node = trie.root;
  const path: string[] = [];
  for (let i = 0; i < word.length; i++) {
    t.op();
    const ch = word[i], next = trie.child(node, ch);
    if (!next) {
      t.step({ ...extra(false), line: lines.missing, array: [], trees: trie.view(Object.fromEntries(path.map((p) => [p, "visited" as Tone])), { node }), ...wordPanel(word, i, "miss"), vars: { ...extraVars, word, ch }, ...(finish ? { done: "notfound" as const } : {}),
        message: `The current node has no '${ch}' child, so no stored word ${i ? `starts with "${word.slice(0, i + 1)}"` : `starts with '${ch}'`}. Return false.` });
      return "none";
    }
    node = next; path.push(node);
    t.step({ ...extra(), line: lines.follow, array: [], trees: trie.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [node]: "compare" }, { node }), ...wordPanel(word, i), vars: { ...extraVars, word, ch },
      message: `'${ch}' is there: follow it.` });
  }
  t.op();
  const isEnd = trie.ends.has(node), ok = prefixOnly || isEnd;
  t.step({ ...extra(ok), ask: prefixOnly ? undefined : { q: `Every letter of "${word}" was found. Is it a stored word?`, options: ["Only if its last node is marked ✓", "Yes, always", "No, never"], answer: 0 },
    line: lines.end, array: [], trees: trie.view(Object.fromEntries(path.map((p) => [p, (ok ? "found" : "miss") as Tone])), { node }), ...wordPanel(word), vars: { ...extraVars, word, found: ok ? "true" : "false" }, ...(finish ? { done: ok ? "found" as const : "notfound" as const } : {}),
    message: prefixOnly
      ? `Every letter was found: some stored word starts with "${word}". Return true. ${word.length} steps, whatever the number of words.`
      : isEnd
        ? `The last node is marked ✓: "${word}" is a stored word. Return true. ${word.length} steps, whatever the number of words.`
        : `Every letter was found, but the last node isn't marked ✓: "${word}" is only the beginning of a longer word. Return false.` });
  return isEnd ? "word" : "prefix";
}

/* ---------- The read's two animations ---------- */
export type BuildInput = { words: string };
export const buildExample: BuildInput = { words: "car, cat, cart, dog" };
export const buildFields: InputField[] = [{ key: "words", label: "words", kind: "text" }];
export function buildPrepare(raw: BuildInput): Prepared<BuildInput> {
  const w = parseWords(raw.words);
  if (!w.length) return { error: "Give at least one word." };
  if (w.some((x) => !/^[a-z]+$/.test(x))) return { error: "Use the letters a to z only." };
  if (w.length > 5 || w.join("").length > 16) return { error: "Use at most 5 short words so the trie fits." };
  const t = new Trie(); w.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 7) return { error: "Those words branch too much to fit; try words that share more beginnings." };
  return { input: { words: w.join(", ") } };
}

const build: Approach<BuildInput> = {
  id: "build",
  name: "Insert words one by one",
  code: `function insert(root, word)
    node ← root
    for each ch in word
        if ch not in node.children
            node.children[ch] ← new node
        node ← node.children[ch]
    node.isEnd ← true
`,
  run({ words }, t) {
    const ws = parseWords(words), trie = new Trie();
    t.step({ line: 2, array: [], trees: trie.view({}, { node: trie.root }), ...wordPanel(""), vars: {},
      message: `A trie starts as a single empty root (•). Each node holds a map from letters to child nodes; a path from the root spells the beginning of a word.` });
    ws.forEach((w, k) => insertSteps(trie, w, t, { create: 5, follow: 6, end: 7 }, { "word no.": k + 1 }, k === 1));
    t.step({ line: 7, array: [], trees: trie.view(), ...wordPanel(""), vars: { words: ws.length, nodes: trie.nodes.length - 1 }, done: "found",
      message: `${ws.length} words, ${ws.join("").length} letters, but only ${trie.nodes.length - 1} letter nodes: shared beginnings are stored once. Inserting a word costs one step per letter: O(length).` });
  },
};

export type SearchInput = { words: string; query: string };
export const searchExample: SearchInput = { words: "car, cat, cart, dog", query: "ca" };
export const searchFields: InputField[] = [
  { key: "words", label: "words", kind: "text" },
  { key: "query", label: "search for", kind: "text" },
];
export function searchPrepare(raw: SearchInput): Prepared<SearchInput> {
  const b = buildPrepare({ words: raw.words });
  if ("error" in b) return b;
  const q = raw.query.toLowerCase();
  if (!/^[a-z]+$/.test(q)) return { error: "Search for a word of letters a to z." };
  if (q.length > 8) return { error: "Use at most 8 letters." };
  return { input: { words: b.input.words, query: q } };
}

const search: Approach<SearchInput> = {
  id: "search",
  name: "Look up a word",
  code: `function search(root, word)
    node ← root
    for each ch in word
        if ch not in node.children
            return false
        node ← node.children[ch]
    return node.isEnd
`,
  run({ words, query }, t) {
    const trie = new Trie();
    parseWords(words).forEach((w) => trie.insert(w));
    t.step({ line: 2, array: [], trees: trie.view({}, { node: trie.root }), ...wordPanel(query), vars: { word: query },
      message: `The trie holds ${words}. To look up "${query}", start at the root and follow one letter at a time.` });
    searchSteps(trie, query, t, { missing: 5, follow: 6, end: 7 }, false);
  },
};

export const buildApproaches = { build };
export const searchApproaches = { search };
