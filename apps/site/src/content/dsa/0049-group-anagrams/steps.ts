import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { words: string };
export const example: Input = { words: "tap, pat, owl, low, apt, cat" };
export const fields: InputField[] = [{ key: "words", label: "words", kind: "text" }];

export const parseWords = (s: string) => s.split(/[\s,]+/).filter(Boolean);
export function prepare(raw: Input): Prepared<Input> {
  const w = parseWords(raw.words.toLowerCase());
  if (w.length === 0) return { error: "Give at least one word, separated by commas." };
  if (w.length > 7) return { error: "Use at most 7 words so they fit." };
  if (w.some((x) => !/^[a-z]+$/.test(x))) return { error: "Use the letters a to z only." };
  if (w.some((x) => x.length > 5)) return { error: "Keep each word to 5 letters or fewer so it fits." };
  return { input: { words: w.join(", ") } };
}

type T = Parameters<Approach<Input>["run"]>[1];
const sortKey = (w: string) => [...w].sort().join("");
/** The 26 counts, written as text. Only letters that appear are shown, in alphabetical order, so "tap" is "a×1 p×1 t×1". */
const countKey = (w: string) => {
  const c = new Map<string, number>();
  for (const ch of [...w].sort()) c.set(ch, (c.get(ch) ?? 0) + 1);
  return [...c].map(([ch, k]) => `${ch}×${k}`).join(" ");
};
const mapView = (title: string, g: Map<string, string[]>, hl?: string) => ({
  title, entries: [...g].map(([k, v]) => [k, v.join(", ")] as [string, string]), highlight: hl,
});
const allSettled = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, "settled" as Tone]));

const compareEach: Approach<Input> = {
  id: "compare",
  name: "Compare with each group",
  code: `function groupAnagrams(words)
    groups ← empty list
    for each w in words
        placed ← false
        for each g in groups
            if isAnagram(g[0], w)
                g.push(w)
                placed ← true
                break
        if not placed
            groups.push([w])
    return groups
`,
  run({ words }, t) {
    const ws = parseWords(words), groups: string[][] = [];
    const view = (hl?: number) => ({ title: "groups", entries: groups.map((g, k) => [`group ${k + 1}`, g.join(", ")] as [string, string]), highlight: hl === undefined ? undefined : `group ${hl + 1}` });
    t.step({ line: 2, array: ws, map: view(), vars: {},
      message: `Keep a list of groups. Each new word is checked against the first word of every group, until one turns out to be an anagram of it.` });
    let asked = false;
    ws.forEach((w, i) => {
      let placed = false;
      for (let g = 0; g < groups.length; g++) {
        const first = groups[g][0];
        t.op(first.length + w.length);
        const same = sortKey(first) === sortKey(w);
        const ask = !asked && same
          ? (asked = true, { ask: { q: `Is "${w}" an anagram of "${first}", the first word of group ${g + 1}?`, options: [`Yes: same letters, so it joins group ${g + 1}`, "No: the letters differ, try the next group"], answer: 0 } }) : {};
        t.step({ ...ask, line: 6, array: ws, pointers: { w: i }, tones: { [i]: "active", [ws.indexOf(first)]: "compare" }, badge: { at: i, text: same ? "same letters" : "different" }, map: view(g), vars: { w, "g[0]": first },
          message: same
            ? `"${w}" and "${first}" use the same letters. Checking that took about ${first.length + w.length} letter steps (as in Valid Anagram).`
            : `"${w}" and "${first}" don't use the same letters, so not group ${g + 1}. That check cost about ${first.length + w.length} letter steps.` });
        if (same) {
          groups[g].push(w);
          placed = true;
          t.step({ line: 7, array: ws, pointers: { w: i }, tones: { [i]: "found" }, map: view(g), vars: { w },
            message: `Add "${w}" to group ${g + 1}: ${groups[g].join(", ")}. Stop looking.` });
          break;
        }
      }
      if (!placed) {
        groups.push([w]);
        t.step({ line: 11, array: ws, pointers: { w: i }, tones: { [i]: "found" }, map: view(groups.length - 1), vars: { w },
          message: groups.length === 1
            ? `There are no groups yet, so "${w}" starts group 1.`
            : `No group matched, so "${w}" starts group ${groups.length}. It was compared with ${groups.length - 1} group${groups.length > 2 ? "s" : ""} first.` });
      }
    });
    t.step({ line: 12, array: ws, tones: allSettled(ws.length), map: view(), vars: {}, done: "found",
      message: `${groups.length} groups. With n words that are all different, word number i is compared with i groups: about n² / 2 comparisons, each costing the words' length. O(n² · k).` });
  },
};

function keyed(ws: string[], t: T, keyOf: (w: string) => string, keyLine: number, ops: (w: string) => number, explain: (w: string, key: string) => string, title: string, finish: string) {
  const g = new Map<string, string[]>();
  const offset = keyLine - 4; // lines after the key move down when the key takes more lines
  t.step({ line: 2, array: ws, map: mapView(title, g), vars: {},
    message: `Anagrams have the same letters, so give every word a key that depends only on its letters. Then words with the same key are anagrams, and a map from key to list collects them in one pass.` });
  let asks = 0;
  ws.forEach((w, i) => {
    t.op(ops(w));
    const key = keyOf(w);
    t.step({ line: keyLine, array: ws, pointers: { w: i }, tones: { [i]: "active" }, badge: { at: i, text: key }, map: mapView(title, g), vars: { w, key },
      message: explain(w, key) });
    t.op();
    const fresh = !g.has(key);
    const ask = asks < 2 ? (asks++, { ask: { q: `"${w}" has key "${key}". Is "${key}" already in the map?`, options: [`Yes: add "${w}" to its list`, `No: start a new list for "${key}"`], answer: fresh ? 1 : 0 } }) : {};
    if (fresh) {
      g.set(key, []);
      t.step({ ...ask, line: 6 + offset, array: ws, pointers: { w: i }, tones: { [i]: "active" }, map: mapView(title, g, key), vars: { w, key },
        message: `No list for "${key}" yet: start one.` });
    }
    g.get(key)!.push(w);
    t.step({ ...(fresh ? {} : ask), line: 7 + offset, array: ws, pointers: { w: i }, tones: { [i]: "found" }, map: mapView(title, g, key), vars: { w, key },
      message: fresh ? `"${w}" goes in the new "${key}" list.` : `"${key}" is already there, so "${w}" joins ${g.get(key)!.slice(0, -1).map((x) => `"${x}"`).join(", ")}: one lookup, no comparing with other words.` });
  });
  t.step({ line: 8 + offset, array: ws, tones: allSettled(ws.length), map: mapView(title, g), vars: {}, done: "found",
    message: `${g.size} groups: ${[...g.values()].map((v) => `[${v.join(", ")}]`).join(", ")}. ${finish}` });
}

const sortedKey: Approach<Input> = {
  id: "sorted",
  name: "Sorted letters as the key",
  code: `function groupAnagrams(words)
    groups ← empty map  // key → list of words
    for each w in words
        key ← w with its letters sorted
        if key not in groups
            groups[key] ← empty list
        groups[key].push(w)
    return all lists in groups
`,
  run({ words }, t) {
    keyed(parseWords(words), t, sortKey, 4, (w) => Math.ceil(w.length * Math.log2(Math.max(2, w.length))),
      (w, key) => `Sort the letters of "${w}": "${key}". Every anagram of "${w}" sorts to exactly the same text.`,
      "groups (sorted letters → words)",
      "Each word costs a sort of its k letters, O(k log k), plus one lookup: O(n · k log k) in total.");
  },
};

const countedKey: Approach<Input> = {
  id: "counts",
  name: "Letter counts as the key",
  code: `function groupAnagrams(words)
    groups ← empty map  // key → list of words
    for each w in words
        counts ← array of 26, all 0
        for each ch in w
            counts[code(ch) - code('a')] += 1
        key ← counts written as text
        if key not in groups
            groups[key] ← empty list
        groups[key].push(w)
    return all lists in groups
`,
  run({ words }, t) {
    keyed(parseWords(words), t, countKey, 7, (w) => w.length + 26,
      (w, key) => `Count the letters of "${w}" into 26 slots, then write the counts out as text. The page shows only the letters that appear: "${key}". Anagrams have the same counts, so the same key.`,
      "groups (letter counts → words)",
      "Each word costs one pass over its k letters plus 26 slots to write out: O(n · k) in total, with no sorting.");
  },
};

export const approaches = { compare: compareEach, sorted: sortedKey, counts: countedKey };

/** n words of 32 letters, no two of them anagrams: every word starts a new group. */
const K = 32, longWords: string[] = [];
for (let a = 0; a <= K && longWords.length < 64; a++) for (let b = 0; a + b <= K && longWords.length < 64; b++)
  longWords.push("a".repeat(a) + "b".repeat(b) + "c".repeat(K - a - b));
export const growth = measureGrowth(
  [{ approach: compareEach, slot: 1 }, { approach: sortedKey, slot: 2 }, { approach: countedKey, slot: 3 }],
  (n) => ({ words: longWords.slice(0, n).join(", ") }),
  [8, 16, 32, 48, 64],
);
