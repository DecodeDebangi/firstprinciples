import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, wordPanel } from "../../concepts/42-tries/steps";
import { CountTrie } from "../../concepts/68-trie-counts/steps";

/** Operations like "insert cat 3, sum ca". */
export type Input = { ops: string };
export const example: Input = { ops: "insert cat 3, insert cart 4, sum ca, insert dog 2, insert cat 1, sum ca" };
export const fields: InputField[] = [{ key: "ops", label: "operations (insert key val / sum prefix)", kind: "raw" }];
type Op = { kind: "insert"; key: string; val: number } | { kind: "sum"; key: string };
export function parseOps(s: string): Op[] | string {
  const out: Op[] = [];
  for (const part of s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean)) {
    const [k, w, v, extra] = part.split(/\s+/);
    if (extra !== undefined || !w || !/^[a-z]+$/i.test(w)) return `"${part}" should be "insert key value" or "sum prefix", with letters a to z.`;
    if (k === "insert") { if (!/^-?\d+$/.test(v ?? "")) return `"${part}" needs a whole-number value.`; out.push({ kind: "insert", key: w.toLowerCase(), val: Number(v) }); }
    else if (k === "sum" && v === undefined) out.push({ kind: "sum", key: w.toLowerCase() });
    else return `"${part}" should be "insert key value" or "sum prefix".`;
  }
  return out.length ? out : 'Write operations like "insert cat 3, sum ca", separated by commas.';
}
export function prepare(raw: Input): Prepared<Input> {
  const ops = parseOps(raw.ops); if (typeof ops === "string") return { error: ops };
  if (ops.length > 7) return { error: "Use at most 7 operations." };
  if (ops.some((o) => o.key.length > 6)) return { error: "Use keys of at most 6 letters." };
  const t = new Trie(); ops.filter((o) => o.kind === "insert").forEach((o) => t.insert(o.key));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6) return { error: "Those keys branch too much to fit; use keys that share beginnings." };
  return { input: raw };
}
const opText = (o: Op) => (o.kind === "insert" ? `insert ${o.key} ${o.val}` : `sum ${o.key}`);
const results = (r: string[]) => ({ title: "sum() returned", entries: r.map((x, k) => [String(k + 1), x] as [string, string]) });

const plain: Approach<Input> = {
  id: "map", name: "A map of keys, scanned on every sum",
  code: `class MapSum
    vals ← empty map  // key → its value
    function insert(key, val)
        vals[key] ← val
    function sum(prefix)
        total ← 0
        for each key k in vals
            if k starts with prefix
                total ← total + vals[k]
        return total
`,
  run(raw, t) {
    const vals = new Map<string, number>(), out: string[] = [];
    if (t.record) t.step({ line: 2, array: [], vars: {}, map: { title: "vals", entries: [] }, message: "Keep each key's value in a map. A sum has to look at every key and add up the ones that start with the prefix." });
    for (const o of parseOps(raw.ops) as Op[]) {
      if (o.kind === "insert") {
        t.op(); const had = vals.has(o.key); vals.set(o.key, o.val);
        if (t.record) t.step({ line: 4, array: [], map: { title: "vals", entries: [...vals].map(([k, v]) => [k, String(v)] as [string, string]), highlight: o.key }, vars: { op: opText(o) }, message: `${opText(o)}: ${had ? `${o.key} was already there; its value is replaced` : `store ${o.key} → ${o.val}`}. One step.` });
      } else {
        let total = 0; const hit: string[] = [];
        for (const [k, v] of vals) { t.op(o.key.length); if (k.startsWith(o.key)) { total += v; hit.push(k); } }
        out.push(String(total));
        if (t.record) t.step({ line: 9, array: [], map: { title: "vals", entries: [...vals].map(([k, v]) => [k, String(v)] as [string, string]) }, vars: { op: opText(o), matched: hit.join(", ") || "none", total }, message: `${opText(o)}: check all ${vals.size} keys. ${hit.length ? `${hit.join(" and ")} start${hit.length === 1 ? "s" : ""} with "${o.key}": ${hit.map((k) => vals.get(k)).join(" + ")} = ${total}` : `None start with "${o.key}": 0`}.` });
      }
    }
    if (t.record) t.step({ line: 10, array: [], map: results(out), vars: {}, done: "found", message: `Answers: ${out.join(", ")}. Inserts are O(L), but each sum reads every key: O(n · L) per sum.` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie whose nodes keep running totals",
  code: `class MapSum  // node.sum: total of keys below it
    vals ← empty map  // key → its value
    function insert(key, val)
        diff ← val − (vals[key] or 0)
        vals[key] ← val
        node ← root
        for each letter c in key
            if node has no child c
                node.child[c] ← new node
            node ← node.child[c]
            node.sum ← node.sum + diff
    function sum(prefix)
        node ← root
        for each letter c in prefix
            if node has no child c
                return 0
            node ← node.child[c]
        return node.sum
`,
  run(raw, t) {
    const tr = new CountTrie(), vals = new Map<string, number>(), out: string[] = [];
    let asked = 0;
    const notes = () => Object.fromEntries(tr.nodes.filter((n) => n.id !== tr.root).map((n) => [n.id, `Σ${tr.cnt(n.id)}`]));
    const view = (tones: Record<string, Tone> = {}) => tr.countView(tones, notes());
    if (t.record) t.step({ line: 1, array: [], trees: view(), vars: {}, message: "Each trie node keeps the total value of every key that passes through it (Σ under it). Then a sum is just the total at the end of the prefix: no scanning." });
    for (const o of parseOps(raw.ops) as Op[]) {
      if (o.kind === "insert") {
        const old = vals.get(o.key) ?? 0, diff = o.val - old; vals.set(o.key, o.val);
        let node = tr.root; const path: string[] = [];
        for (const ch of o.key) { t.op(); node = tr.child(node, ch) ?? tr.make(ch, node); tr.count.set(node, tr.cnt(node) + diff); path.push(node); }
        tr.ends.add(node);
        const ask = t.record && asked < 1 && vals.size > 1 && old !== 0 ? (asked++, { ask: { q: `${o.key} was ${old} and is now ${o.val}. How much changes on its path?`, options: [`${diff >= 0 ? "+" : ""}${diff} on each node`, `+${o.val} on each node`, "Nothing"], answer: 0 } }) : {};
        if (t.record) t.step({ ...ask, line: 11, array: [], trees: view(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), ...wordPanel(o.key), vars: { op: opText(o), diff },
          message: old ? `${opText(o)}: ${o.key} was ${old}, so every total on its path changes by ${diff >= 0 ? "+" : ""}${diff}, not +${o.val}. Adding the difference keeps a replaced value from being counted twice.` : `${opText(o)}: add ${o.val} to every node on the path of "${o.key}".` });
      } else {
        let node: string | undefined = tr.root; const path: string[] = [];
        for (const ch of o.key) { t.op(); node = node ? tr.child(node, ch) : undefined; if (!node) break; path.push(node); }
        const total = node && path.length === o.key.length ? tr.cnt(node) : 0;
        out.push(String(total));
        if (t.record) t.step({ line: node ? 18 : 16, array: [], trees: view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), ...(node ? { [node]: "found" } : {}) }), ...wordPanel(o.key), vars: { op: opText(o), answer: total },
          message: node ? `${opText(o)}: walk down "${o.key}" and read the total there: ${total}. ${o.key.length} steps, whatever the number of keys.` : `${opText(o)}: the path leaves the trie, so no key starts with "${o.key}": 0.` });
      }
    }
    if (t.record) t.step({ line: 18, array: [], trees: view(), map: results(out), vars: {}, done: "found", message: `Answers: ${out.join(", ")}. Both operations walk one key's letters: O(L).` });
  },
};

export const approaches = { map: plain, trie };
const key = (k: number) => [0, 1, 2, 3].map((j) => String.fromCharCode(97 + (Math.floor(k / 26 ** j) % 26))).join("");
/** n inserts of different 4-letter keys, each followed by a sum. */
export const growth = measureGrowth(
  [{ approach: plain, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ ops: Array.from({ length: n }, (_, k) => `insert ${key(k)} ${k % 7}, sum ${key(k).slice(0, 2)}`).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
