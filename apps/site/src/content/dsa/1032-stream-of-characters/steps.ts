import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";
import { Trie, parseWords } from "../../concepts/42-tries/steps";

export type Input = { words: string; stream: string };
export const example: Input = { words: "at, sea, plan", stream: "seat" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }, { key: "stream", label: "letters, as they arrive", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words), s = raw.stream.toLowerCase();
  if (!w.length || w.length > 5) return { error: "Give 1 to 5 words, separated by commas." };
  if (w.some((x) => !/^[a-z]{1,5}$/.test(x))) return { error: "Use words of 1 to 5 letters a to z." };
  if (!/^[a-z]{1,8}$/.test(s)) return { error: "Give 1 to 8 letters a to z for the stream." };
  const t = new Trie(); w.forEach((x) => t.insert([...x].reverse().join("")));
  if (t.nodes.filter((n) => !n.kids!.length).length > 6 || t.nodes.length > 18) return { error: "Those words branch too much to fit; use fewer or shorter words." };
  return { input: { words: w.join(", "), stream: s } };
}
const answers = (a: boolean[]) => a.map((x) => (x ? "T" : "F")).join(" ");
const streamGrid = (s: string, tones: Record<string, Tone> = {}) => ({ title: "stream so far", rows: [s.length ? [...s] : [""]], colLabels: [...s].map((_, k) => k), tones });

const scan: Approach<Input> = {
  id: "scan", name: "Check every word against the end of the stream",
  code: `class StreamChecker
    constructor(words)
        stream ← ""
    function query(letter)
        stream ← stream + letter
        for each w in words
            if stream ends with w
                return true
        return false
`,
  run(raw, t) {
    const words = parseWords(raw.words), out: boolean[] = [];
    let s = "";
    if (t.record) t.step({ line: 3, array: [], grid: streamGrid(""), vars: {}, message: "Letters arrive one at a time. After each, say whether some word ends exactly at the end of the stream. The direct way compares every word with the stream's last letters." });
    for (const ch of raw.stream) {
      s += ch;
      let hit = "";
      for (const w of words) { t.op(w.length); if (!hit && s.endsWith(w)) hit = w; }
      out.push(!!hit);
      if (t.record) t.step({ line: hit ? 8 : 9, array: [], grid: streamGrid(s, hit ? Object.fromEntries([...hit].map((_, k) => [`0,${s.length - hit.length + k}`, "found" as Tone])) : { [`0,${s.length - 1}`]: "active" }), vars: { letter: ch, answers: answers(out) },
        message: `'${ch}' arrives. Compare all ${words.length} words with the end of "${s}": ${hit ? `"${hit}" ends here. True.` : "none ends here. False."}` });
    }
    if (t.record) t.step({ line: 9, array: [], grid: streamGrid(s), vars: { answers: answers(out) }, done: "found", message: `Answers: ${answers(out)}. Every letter compared every word: O(total length of the words) per letter.` });
  },
};

const reversed: Approach<Input> = {
  id: "trie", name: "A trie of the words written backwards",
  code: `class StreamChecker
    constructor(words)
        root ← a trie of every word, reversed
        stream ← ""
    function query(letter)
        stream ← stream + letter
        node ← root
        for i from length(stream) − 1 down to 0
            node ← node.child[stream[i]]
            if node = none
                return false
            if node ends a word
                return true
        return false
`,
  run(raw, t) {
    const words = parseWords(raw.words), tr = new Trie(), out: boolean[] = [], byEnd = new Map<string, string>();
    words.forEach((w) => byEnd.set(tr.insert([...w].reverse().join("")), w));
    t.op(words.join("").length);
    let s = "", asked = 0;
    if (t.record) t.step({ line: 3, array: [], trees: tr.view(), grid: streamGrid(""), vars: {}, message: `A word ends at the end of the stream if the stream, read backwards, starts with the word backwards. So store the words reversed (${words.map((w) => [...w].reverse().join("")).join(", ")}): "does a word end here?" becomes a prefix question, which a trie answers by walking.` });
    for (const ch of raw.stream) {
      s += ch;
      let node: string | undefined = tr.root, hit = ""; const path: string[] = [];
      for (let i = s.length - 1; i >= 0; i--) {
        t.op();
        node = tr.child(node!, s[i]);
        if (!node) break;
        path.push(node);
        if (tr.ends.has(node)) { hit = byEnd.get(node)!; break; }
      }
      out.push(!!hit);
      const read = path.length, failed = !hit && read < s.length;
      const ask = t.record && asked < 2 && s.length > 1 ? (asked++, { ask: { q: `'${ch}' arrives; the stream is "${s}". Which letters does the check read?`, options: ["The newest first, going backwards, until the trie runs out", "The whole stream from the start", "Only the newest letter"], answer: 0 } }) : {};
      if (t.record) t.step({ ...ask, line: hit ? 13 : 11, array: [], trees: tr.view({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), ...(hit ? { [path[path.length - 1]]: "found" } : {}) }), grid: streamGrid(s, { ...Object.fromEntries(Array.from({ length: read }, (_, k) => [`0,${s.length - 1 - k}`, (hit ? "found" : "compare") as Tone])), ...(failed ? { [`0,${s.length - 1 - read}`]: "miss" as Tone } : {}) }), vars: { letter: ch, "letters read": read, answers: answers(out) },
        message: hit ? `'${ch}' arrives. Read the stream backwards through the trie: ${[...s.slice(s.length - read)].reverse().join(", ")} reaches a ✓, the end of "${hit}". True.` : `'${ch}' arrives. ${!read ? `'${ch}' isn't the last letter of any word` : failed ? `Reading backwards, ${[...s.slice(s.length - read)].reverse().join(", ")} ${read === 1 ? "is" : "are"} in the trie, but '${s[s.length - 1 - read]}' isn't next` : `The whole stream, read backwards, is in the trie but reaches no ✓`}. False.` });
    }
    if (t.record) t.step({ line: 14, array: [], trees: tr.view(), grid: streamGrid(s), vars: { answers: answers(out) }, done: "found", message: `Answers: ${answers(out)}. Each letter reads at most as many letters as the longest word, however many words there are.` });
  },
};

export const approaches = { scan, trie: reversed };
const word = (k: number) => [0, 1, 2, 3].map((j) => String.fromCharCode(98 + (Math.floor(k / 5 ** j) % 5))).join("");
/** n words of 4 letters; a stream of 16 letters. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: reversed, slot: 3 }],
  (n) => ({ words: Array.from({ length: n }, (_, k) => word(k)).join(", "), stream: "abcdefabcdefabcd" }),
  [8, 16, 32, 64, 128, 256],
);
