import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords, wordPanel } from "../../concepts/42-tries/steps";

export type Input = { products: string; word: string };
export const example: Input = { products: "bank, bag, cab, band, banana, bat", word: "ban" };
export const fields: InputField[] = [{ key: "products", label: "products", kind: "text" }, { key: "word", label: "typed word", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const p = parseWords(raw.products), w = raw.word.toLowerCase();
  if (!p.length || p.length > 7) return { error: "Give 1 to 7 products, separated by commas." };
  if (p.some((x) => !/^[a-z]{1,6}$/.test(x))) return { error: "Use products of 1 to 6 letters a to z." };
  if (!/^[a-z]{1,5}$/.test(w)) return { error: "Type a word of 1 to 5 letters a to z." };
  const t = new Trie(); p.forEach((x) => t.insert(x));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 20) return { error: "Those products branch too much to fit; use products that share beginnings." };
  return { input: { products: p.join(", "), word: w } };
}
const list = (a: string[]) => `[${a.join(", ")}]`;
const resultsMap = (word: string, out: string[][]) => ({ title: "suggestions", entries: out.map((r, k) => [word.slice(0, k + 1), r.join(", ") || "—"] as [string, string]) });
const sortCounted = (a: string[], t: Parameters<Approach<Input>["run"]>[1]) => [...a].sort((x, y) => { t.op(); return x < y ? -1 : x > y ? 1 : 0; });

const scan: Approach<Input> = {
  id: "scan", name: "Sort, then scan every product for each prefix",
  code: `function suggestedProducts(products, word)
    sort products
    out ← []
    for k from 1 to length(word)
        p ← word[0..k − 1]
        picks ← []
        for each item in products
            if item starts with p
                picks.push(item)
        picks ← the first 3 of picks
        out.push(picks)
    return out
`,
  run(raw, t) {
    const items = sortCounted(parseWords(raw.products), t), w = raw.word, out: string[][] = [];
    if (t.record) t.step({ line: 2, array: items, vars: {}, message: `Sort the products, so the first matches found are the alphabetically smallest: ${items.join(", ")}. Then, for each prefix of "${w}" as it's typed, check every product.` });
    for (let k = 1; k <= w.length; k++) {
      const p = w.slice(0, k), picks: string[] = [];
      for (const it of items) { t.op(p.length); if (it.startsWith(p)) picks.push(it); }
      picks.splice(3);
      out.push(picks);
      if (t.record) t.step({ line: 11, array: items, tones: Object.fromEntries(items.map((it, j) => [j, (picks.includes(it) ? "found" : it.startsWith(p) ? "side-a" : "discard") as Tone])), ...wordPanel(w, k - 1), map: resultsMap(w, out), vars: { prefix: p, checked: items.length },
        message: `"${p}": checked all ${items.length} products. ${picks.length ? `The first ${picks.length === 3 ? "three" : picks.length === 1 ? "match" : `${picks.length}`} in order: ${picks.join(", ")}.` : "None start with it."}` });
    }
    if (t.record) t.step({ line: 12, array: items, map: resultsMap(w, out), vars: { out: out.map(list).join(" ") }, done: "found",
      message: `Done. Every typed letter checked every product: O(L · n · L) after sorting, for L typed letters and n products.` });
  },
};

const bsearch: Approach<Input> = {
  id: "binary", name: "Sort, then binary search to each prefix",
  code: `function suggestedProducts(products, word)
    sort products
    out ← []
    for k from 1 to length(word)
        p ← word[0..k − 1]
        i ← first position with products[i] ≥ p
        picks ← []
        for each item in products[i..i + 2]
            if item starts with p
                picks.push(item)
        out.push(picks)
    return out
`,
  run(raw, t) {
    const items = sortCounted(parseWords(raw.products), t), w = raw.word, out: string[][] = [];
    let asked = 0;
    if (t.record) t.step({ line: 2, array: items, vars: {}, message: `In a sorted list, every product starting with a prefix sits in one block, and the block starts where the prefix itself would be inserted. Binary search finds that spot; the first three items from there are the answer if they match.` });
    for (let k = 1; k <= w.length; k++) {
      const p = w.slice(0, k);
      let lo = 0, hi = items.length;
      while (lo < hi) { t.op(p.length); const m = (lo + hi) >> 1; if (items[m] < p) lo = m + 1; else hi = m; }
      const picks: string[] = [];
      for (let j = lo; j < Math.min(lo + 3, items.length); j++) { t.op(p.length); if (items[j].startsWith(p)) picks.push(items[j]); }
      out.push(picks);
      const ask = t.record && asked < 1 && lo < items.length ? (asked++, { ask: { q: `"${p}" would be inserted at position ${lo}, before ${items[lo]}. Where are the products that start with "${p}"?`, options: [`From position ${lo} on, in one block`, "Anywhere in the list", `Before position ${lo}`], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 11, array: items, pointers: lo < items.length ? { i: lo } : {}, tones: Object.fromEntries(items.flatMap((it, j): [number, Tone][] => (picks.includes(it) ? [[j, "found"]] : j >= lo && j < lo + 3 ? [[j, "discard"]] : []))), ...wordPanel(w, k - 1), map: resultsMap(w, out), vars: { prefix: p, i: lo },
        message: `"${p}": binary search lands at position ${lo}${lo < items.length ? ` (${items[lo]})` : ", past the end"}. ${picks.length ? `Of the next three, ${picks.join(", ")} start${picks.length === 1 ? "s" : ""} with "${p}".` : `Nothing there starts with "${p}".`}` });
    }
    if (t.record) t.step({ line: 12, array: items, map: resultsMap(w, out), vars: { out: out.map(list).join(" ") }, done: "found",
      message: `Done. Each typed letter costs a binary search: O(L · log n · L) after sorting, instead of reading every product.` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie whose nodes keep their top three",
  code: `function suggestedProducts(products, word)
    sort products
    for each item in products  // smallest first
        node ← root
        for each letter c in item
            node ← node.child[c], made if missing
            if length(node.top) < 3
                node.top.push(item)
    out, node ← [], root
    for each letter c in word
        if node ≠ none
            node ← node.child[c]  // none if missing
        out.push(node.top if node ≠ none, else [])
    return out
`,
  run(raw, t) {
    const items = sortCounted(parseWords(raw.products), t), w = raw.word, tr = new Trie(), top = new Map<string, string[]>(), out: string[][] = [];
    let asked = 0;
    const notes = () => Object.fromEntries([...top].map(([id, a]) => [id, `·${a.length}`]));
    const view = (tones: Record<string, Tone> = {}) => tr.view(tones, {}, notes());
    if (t.record) t.step({ line: 2, array: items, trees: view(), vars: {}, message: "Give every trie node a short list: the first three products (alphabetically) that pass through it. Insert the products sorted, so each list fills with the smallest ones first. Under each node: how many it keeps." });
    for (const it of items) {
      let n = tr.root; const path: string[] = [], took: string[] = [];
      for (const ch of it) { t.op(); n = tr.child(n, ch) ?? tr.make(ch, n); path.push(n); const a = top.get(n) ?? []; if (a.length < 3) { a.push(it); top.set(n, a); took.push(n); } }
      tr.ends.add(n);
      if (t.record) t.step({ line: 8, array: items, tones: { [items.indexOf(it)]: "active" }, trees: view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), ...Object.fromEntries(took.map((p) => [p, "found" as Tone])) }), vars: { product: it, "lists joined": took.length },
        message: took.length === path.length ? `Insert "${it}": it joins the list at every node on its path.` : took.length ? `Insert "${it}": it joins ${took.length} node${took.length === 1 ? "'s list" : "s' lists"}. The first ${path.length - took.length} on its path already hold three smaller products.` : `Insert "${it}": every node on its path already holds three smaller products, so it joins none.` });
    }
    let node: string | undefined = tr.root; const path: string[] = [];
    for (let k = 0; k < w.length; k++) {
      t.op();
      if (node) node = tr.child(node, w[k]);
      if (node) path.push(node);
      const picks = node ? top.get(node) ?? [] : [];
      out.push(picks);
      const ask = t.record && asked < 1 && node && k > 0 ? (asked++, { ask: { q: `After typing "${w.slice(0, k + 1)}", where do the suggestions come from?`, options: ["The list stored at that node", "A search of every product", "Its children's lists"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: 13, array: items, trees: view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), ...(node ? { [node]: "found" } : {}) }), ...wordPanel(w, k, node ? "active" : "miss"), map: resultsMap(w, out), vars: { typed: w.slice(0, k + 1) },
        message: node ? `Type '${w[k]}': step to that child and read its list: ${picks.join(", ")}. One step per letter typed.` : `Type '${w[k]}': there's no such child, so no product starts with "${w.slice(0, k + 1)}", and none will for any longer prefix either.` });
    }
    if (t.record) t.step({ line: 14, array: items, trees: view(), map: resultsMap(w, out), vars: { out: out.map(list).join(" ") }, done: "found",
      message: `Done. Building costs one step per stored letter; after that, each typed letter is a single step: O(L) for the whole word.` });
  },
};

export const approaches = { scan, binary: bsearch, trie };
const name = (k: number) => [0, 1, 2, 3, 4, 5].map((j) => String.fromCharCode(97 + (Math.floor(k / 3 ** j) % 3))).join("");
/** n products of 6 letters from a, b, c; the typed word is 6 letters. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: bsearch, slot: 2 }, { approach: trie, slot: 3 }],
  (n) => ({ products: Array.from({ length: n }, (_, k) => name(k)).join(", "), word: "abcabc" }),
  [8, 16, 32, 64, 128, 256],
);
