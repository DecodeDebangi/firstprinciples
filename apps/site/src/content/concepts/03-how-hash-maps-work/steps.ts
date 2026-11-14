import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

export type Input = { keys: number[] };

export const example: Input = { keys: [12, 7, 22, 5, 17, 9, 30] };

export const fields: InputField[] = [{ key: "keys", label: "keys to insert", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.keys.length > 8) return { error: "Insert at most 8 keys so the table fits." };
  return { input: raw };
}

/** Python's % never returns a negative number; JavaScript's can, so normalise. */
const mod = (k: number, m: number) => ((k % m) + m) % m;

/** Three distinct bucket choices including the right one, in ascending order. */
function bucketOptions(right: number, m: number): { options: string[]; answer: number } {
  const set = [right, mod(right + 1, m), mod(right + m - 1, m)].filter((v, i, a) => a.indexOf(v) === i);
  while (set.length < 3) set.push(set.length + m);
  set.sort((a, b) => a - b);
  return { options: set.map((b) => `Bucket ${b}`), answer: set.indexOf(right) };
}

const chaining: Approach<Input> = {
  id: "chaining",
  name: "Separate chaining (with resizing)",
  code: `class HashMap
  constructor()
    buckets ← 4 empty lists
    size ← 0

  function put(key)
    b ← buckets[hash(key) % length(buckets)]
    if key in b
      return  // already stored
    b.push(key)
    size += 1
    if size > 0.75 * length(buckets)
      resize()

  function resize()
    old ← every key in every bucket
    buckets ← 2 × length(buckets) empty lists
    for each k in old
      add k to its bucket in the new list
`,
  run({ keys }, t) {
    let buckets: number[][] = Array.from({ length: 4 }, () => []);
    let size = 0;
    const rows = (tones: Record<string, Tone> = {}, hl?: number): ListRow[] =>
      buckets.map((b, i) => ({
        label: `${i}${hl === i ? " ←" : ""}`,
        nodes: b.map((k) => ({ id: `k${k}`, val: k })),
        arrows: b.slice(1).map(() => "right" as const),
        tones,
        compact: true,
      }));
    const vars = () => ({ buckets: buckets.length, size, "load": `${size}/${buckets.length} = ${(size / buckets.length).toFixed(2)}` });
    t.step({ line: 3, array: [], lists: rows(), vars: vars(),
      message: "A hash map is an array of buckets. A key's hash, taken modulo the number of buckets, says which bucket it lives in, so a lookup jumps straight there." });
    for (const key of keys) {
      const m = buckets.length;
      const idx = mod(key, m);
      t.op();
      const { options, answer } = bucketOptions(idx, m);
      const chain = buckets[idx];
      t.step({ ask: { q: `There are ${m} buckets. Which bucket does ${key} go to? (hash(${key}) = ${key})`, options, answer },
        line: 7, array: [], lists: rows(Object.fromEntries(chain.map((k) => [`k${k}`, "compare" as Tone])), idx), vars: vars(),
        message: `${key} % ${m} = ${idx}: bucket ${idx}.${chain.length ? ` It already holds ${chain.join(", ")}: check those first.` : " It's empty."}` });
      t.op(chain.length);
      if (chain.includes(key)) {
        t.step({ line: 9, array: [], lists: rows({ [`k${key}`]: "found" }, idx), vars: vars(), message: `${key} is already in bucket ${idx}. Nothing to add.` });
        continue;
      }
      chain.push(key);
      size++;
      t.step({ line: 10, array: [], lists: rows({ [`k${key}`]: chain.length > 1 ? "miss" : "found" }, idx), vars: vars(),
        message: chain.length > 1 ? `Collision: bucket ${idx} now chains ${chain.join(" → ")}. Lookups here must walk the chain.` : `${key} goes into bucket ${idx}.` });
      if (size > 0.75 * buckets.length) {
        const old = buckets.flat();
        buckets = Array.from({ length: 2 * m }, () => []);
        t.op(old.length);
        for (const k of old) buckets[mod(k, buckets.length)].push(k);
        t.step({ line: 17, array: [], lists: rows(Object.fromEntries(old.map((k) => [`k${k}`, "active" as Tone]))), vars: vars(),
          message: `${size} keys in ${m} buckets is more than 75% full. Double to ${buckets.length} buckets and re-insert all ${old.length} keys: each one's bucket is recomputed with % ${buckets.length}, so chains split up.` });
      }
    }
    t.step({ line: 13, array: [], lists: rows(), vars: vars(), done: "found",
      message: `${size} keys in ${buckets.length} buckets. Because the table grows before it gets crowded, chains stay short and lookups stay O(1) on average.` });
  },
};

const probing: Approach<Input> = {
  id: "probing",
  name: "Open addressing (linear probing)",
  code: `function put(table, key)
  m ← length(table)
  i ← hash(key) % m
  while table[i] ≠ none
    if table[i] = key
      return  // already stored
    i ← (i + 1) % m  // taken: try the next
  table[i] ← key
`,
  run({ keys }, t) {
    const m = 10; // with 10 slots a key's home slot is just its last digit
    const table: (number | string)[] = Array(m).fill("_");
    const filled = (): Record<number, Tone> => Object.fromEntries(table.map((v, k) => [k, v === "_" ? undefined : "settled"]).filter(([, v]) => v)) as Record<number, Tone>;
    t.step({ line: 2, array: [...table], vars: { m, key: null },
      message: `No chains: every key lives directly in a slot of one array. With ${m} slots, a key's home slot is its last digit. If that slot is taken, step forward to the next free one.` });
    for (const key of keys) {
      let i = mod(key, m);
      const home = i;
      t.op();
      const { options, answer } = bucketOptions(home, m);
      t.step({ ask: { q: `The table has ${m} slots. Which slot does ${key} try first?`, options: options.map((o) => o.replace("Bucket", "Slot")), answer },
        line: 3, array: [...table], pointers: { i }, tones: { ...filled(), [i]: "compare" }, vars: { m, key },
        message: `${key} % ${m} = ${i}: try slot ${i}.` });
      let probes = 0;
      let dup = false;
      while (table[i] !== "_") {
        if (table[i] === key) { dup = true; break; }
        t.op();
        probes++;
        const taken = i;
        i = (i + 1) % m;
        t.step({ line: 7, array: [...table], pointers: { i }, tones: { ...filled(), [taken]: "miss", [i]: "compare" }, badge: { at: taken, text: "taken" }, vars: { m, key },
          message: `Slot ${taken} holds ${table[taken]}. Probe the next slot, ${i}.` });
      }
      if (dup) {
        t.step({ line: 6, array: [...table], pointers: { i }, tones: { ...filled(), [i]: "found" }, vars: { m, key }, message: `${key} is already in slot ${i}.` });
        continue;
      }
      table[i] = key;
      t.step({ line: 8, array: [...table], pointers: { i }, tones: { ...filled(), [i]: "found" }, vars: { m, key },
        message: probes ? `${key} lands in slot ${i}, ${probes} step${probes > 1 ? "s" : ""} from its home slot ${home}. Filled slots bunch up into clusters, and clusters make later probes longer.` : `${key} lands in its home slot, ${i}.` });
    }
    const used = table.filter((v) => v !== "_").length;
    t.step({ line: 8, array: [...table], tones: filled(), vars: { m, key: null }, done: "found",
      message: `${used} of ${m} slots used. Real tables resize well before they fill: Java's HashMap at 75% full, Python's dict at about two-thirds.` });
  },
};

export const approaches = { chaining, probing };
