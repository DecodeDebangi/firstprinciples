import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, buildPrepare, parseWords } from "../../concepts/42-tries/steps";

export type Input = { roots: string; sentence: string };
export const example: Input = { roots: "re, run, sun", sentence: "rerun the sunny runway" };
export const fields: InputField[] = [
  { key: "roots", label: "roots", kind: "text" },
  { key: "sentence", label: "sentence", kind: "raw" },
];
export function prepare(raw: Input): Prepared<Input> {
  const b = buildPrepare({ words: raw.roots });
  if ("error" in b) return b;
  const ws = raw.sentence.toLowerCase().split(/\s+/).filter(Boolean);
  if (!ws.length) return { error: "Type a sentence." };
  if (ws.some((w) => !/^[a-z]+$/.test(w))) return { error: "Use words of the letters a to z, separated by spaces." };
  if (ws.length > 5 || ws.some((w) => w.length > 8)) return { error: "Use at most 5 words of up to 8 letters." };
  return { input: { roots: b.input.words, sentence: ws.join(" ") } };
}
const sentencePanel = (ws: string[], out: string[], at?: number) => ({
  grid: { title: "sentence → result", rows: [ws, ws.map((_, k) => out[k] ?? "")], rowLabels: ["word", "becomes"], tones: at === undefined ? {} : { [`0,${at}`]: "active" as Tone } },
});

const checkRoots: Approach<Input> = {
  id: "checkRoots",
  name: "Check every root against every word",
  code: `function replaceWords(roots, sentence)
    result ← empty list
    for each w in words of sentence
        best ← w
        for each r in roots
            if w starts with r
                if length(r) < length(best)
                    best ← r
        result.push(best)
    return join(result, " ")
`,
  run({ roots, sentence }, t) {
    const rs = parseWords(roots), ws = sentence.split(" "), out: string[] = [];
    t.step({ line: 2, array: rs, ...sentencePanel(ws, out), vars: {},
      message: `The roots are in the main row. For every word of the sentence, test every root: does the word start with it? Keep the shortest that does.` });
    ws.forEach((w, k) => {
      let best = w;
      const hits: number[] = [];
      rs.forEach((r, i) => {
        t.op(Math.min(r.length, w.length));
        if (w.startsWith(r)) { hits.push(i); if (r.length < best.length) best = r; }
      });
      out.push(best);
      t.step({ line: 9, array: rs, tones: Object.fromEntries(rs.map((r, i) => [i, (hits.includes(i) ? (r === best ? "found" : "compare") : "discard") as Tone])), ...sentencePanel(ws, out, k), vars: { w, best },
        message: hits.length ? `"${w}" starts with ${hits.map((i) => `"${rs[i]}"`).join(" and ")}: the shortest is "${best}". All ${rs.length} roots were tested.` : `No root starts "${w}", so it stays. All ${rs.length} roots were tested.` });
    });
    t.step({ line: 10, array: rs, ...sentencePanel(ws, out), vars: { result: `"${out.join(" ")}"` }, done: "found",
      message: `"${out.join(" ")}". Each word was tested against every root: O(W · R · L) for W words, R roots and lengths up to L.` });
  },
};

const withTrie: Approach<Input> = {
  id: "trie",
  name: "Walk each word down a trie of roots",
  code: `function replaceWords(roots, sentence)
    for each r in roots
        insert(r)  // into the trie
    result ← empty list
    for each w in words of sentence
        node, prefix ← root, ""
        for each ch in w
            if ch not in node.children
                break
            node ← node.children[ch]
            prefix ← prefix + ch
            if node.isEnd
                break
        result.push(node.isEnd ? prefix : w)
    return join(result, " ")
`,
  run({ roots, sentence }, t) {
    const trie = new Trie(), ws = sentence.split(" "), out: string[] = [];
    parseWords(roots).forEach((r) => { t.op(r.length); trie.insert(r); });
    t.step({ line: 4, array: [], trees: trie.view(), ...sentencePanel(ws, out), vars: {},
      message: `Put the roots in a trie. Then walk each word down it from the root. The first node marked "end" is the shortest root the word starts with, so stop there.` });
    let asked = false;
    ws.forEach((w, k) => {
      let node = trie.root, prefix = "";
      const path: string[] = [];
      let reason = "";
      for (const ch of w) {
        t.op();
        const kid = trie.child(node, ch);
        if (!kid) { reason = `no '${ch}' child`; break; }
        node = kid; prefix += ch; path.push(node);
        const end = trie.ends.has(node);
        const q = !asked && end ? (asked = true, { ask: { q: `Walking "${w}", the node for "${prefix}" ends a root. What now?`, options: [`Stop: "${prefix}" is the shortest root`, "Keep going to find a longer root", `Leave "${w}" unchanged`], answer: 0 } }) : {};
        t.step({ ...q, line: end ? 13 : 10, array: [], trees: trie.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [node]: end ? "found" : "compare" }, { node }), ...sentencePanel(ws, out, k), vars: { w, prefix },
          message: end ? `"${prefix}" ends a root: it's the shortest one "${w}" starts with. Stop.` : `'${ch}' is there: follow it. The prefix so far is "${prefix}".` });
        if (end) break;
      }
      const isEnd = trie.ends.has(node);
      out.push(isEnd ? prefix : w);
      t.step({ line: 14, array: [], trees: trie.view(Object.fromEntries(path.map((p) => [p, (isEnd ? "settled" : "discard") as Tone]))), ...sentencePanel(ws, out, k), vars: { w, prefix },
        message: isEnd ? `Replace "${w}" with "${prefix}".` : `${reason ? `The trie has ${reason} after "${prefix}"` : `"${w}" runs out before any root ends`}: no root fits, so "${w}" stays.` });
    });
    t.step({ line: 15, array: [], trees: trie.view(), ...sentencePanel(ws, out), vars: { result: `"${out.join(" ")}"` }, done: "found",
      message: `"${out.join(" ")}". Each word walks at most its own length down the trie, whatever the number of roots: O(total letters).` });
  },
};

export const approaches = { checkRoots, trie: withTrie };

/** R roots of 4 letters, and a sentence of 10 words that each match the last root only. */
const root4 = (i: number) => "a" + Array.from({ length: 3 }, (_, k) => String.fromCharCode(97 + (Math.floor(i / 26 ** k) % 26))).join("");
export const growth = measureGrowth(
  [{ approach: checkRoots, slot: 1 }, { approach: withTrie, slot: 3 }],
  (n) => ({ roots: Array.from({ length: n }, (_, i) => root4(i)).join(", "), sentence: Array.from({ length: 10 }, () => root4(n - 1) + "xyz").join(" ") }),
  [8, 16, 32, 48, 64],
);
