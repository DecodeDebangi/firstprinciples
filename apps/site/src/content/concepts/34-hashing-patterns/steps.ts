import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

const mapOf = (title: string, m: Map<string | number, string | number>, highlight?: string | number) => ({
  title,
  entries: [...m].map(([k, v]) => [String(k), String(v)] as [string, string]),
  highlight: highlight === undefined ? undefined : String(highlight),
});

/* ---------- Counting ---------- */
export type CountInput = { nums: number[] };
export const countExample: CountInput = { nums: [3, 1, 3, 2, 3, 1] };
export const countFields: InputField[] = [{ key: "nums", label: "values", kind: "numbers" }];
export function countPrepare(raw: CountInput): Prepared<CountInput> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  return { input: raw };
}

const count: Approach<CountInput> = {
  id: "count",
  name: "Count each value",
  code: `function countEach(a)
    count ← empty map  // value → how many
    for each x in a
        count[x] ← (count[x] or 0) + 1
    return count
`,
  run({ nums: a }, t) {
    const m = new Map<number, number>();
    const title = "count (value → how many)";
    t.step({ line: 2, array: a, map: mapOf(title, m), vars: {},
      message: `Count how often each value appears, in one pass. The map starts empty; each value will be a key, and what's stored under it is how many times it has appeared so far.` });
    let asked = false;
    a.forEach((x, i) => {
      t.op();
      const before = m.get(x) ?? 0;
      m.set(x, before + 1);
      const ask = !asked && before >= 1
        ? (asked = true, { ask: { q: `x = ${x}, and count[${x}] is ${before} so far. What is it after this line?`, options: [String(before + 1), String(before), String(before + 2)], answer: 0 } }) : {};
      t.step({ ...ask, line: 4, array: a, pointers: { x: i }, tones: { [i]: "active" }, map: mapOf(title, m, x), vars: { x },
        message: before === 0
          ? `${x} isn't in the map yet, so (count[${x}] or 0) is 0, and count[${x}] becomes 1.`
          : `${x} is already there with ${before}. Add one: count[${x}] is now ${before + 1}. One lookup, however many values the map holds.` });
    });
    const top = [...m].reduce((b, e) => (e[1] > b[1] ? e : b));
    t.step({ line: 5, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), map: mapOf(title, m), vars: {}, done: "found",
      message: `Done: one pass, O(n) time, and one entry per different value. Now any question about how often is a lookup: ${top[0]} appears most, ${top[1]} times.` });
  },
};

/* ---------- Grouping by a key ---------- */
export type GroupInput = { nums: number[] };
export const groupExample: GroupInput = { nums: [7, 3, 4, 9, 5, 12, 8] };
export const groupFields: InputField[] = [{ key: "nums", label: "values", kind: "numbers" }];
export function groupPrepare(raw: GroupInput): Prepared<GroupInput> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  if (raw.nums.some((x) => x < 0)) return { error: "Use values of 0 or more." };
  return { input: raw };
}

const group: Approach<GroupInput> = {
  id: "group",
  name: "Group by remainder",
  code: `function groupByRemainder(a)
    groups ← empty map  // key → list of values
    for each x in a
        key ← x % 3
        if key not in groups
            groups[key] ← empty list
        groups[key].push(x)
    return all lists in groups
`,
  run({ nums: a }, t) {
    const g = new Map<number, number[]>();
    const title = "groups (x % 3 → values)";
    const view = (hl?: number) => mapOf(title, new Map([...g].map(([k, v]) => [k, v.join(", ")])), hl);
    t.step({ line: 2, array: a, map: view(), vars: {},
      message: `Put values that share something into the same group. Here the shared thing, the key, is the remainder after dividing by 3. Values with the same key end up in the same list.` });
    let asked = false;
    a.forEach((x, i) => {
      t.op();
      const key = x % 3;
      t.step({ line: 4, array: a, pointers: { x: i }, tones: { [i]: "active" }, map: view(), vars: { x, key },
        message: `${x} % 3 = ${key}: ${x} belongs in group ${key}.` });
      const fresh = !g.has(key);
      const ask = !asked && !fresh
        ? (asked = true, { ask: { q: `${x} has key ${key}, and the map already has group ${key}. What happens?`, options: [`${x} joins group ${key}'s list`, `Group ${key} is replaced by a new list`, `${x} gets a group of its own`], answer: 0 } }) : {};
      if (fresh) {
        g.set(key, []);
        t.step({ line: 6, array: a, pointers: { x: i }, tones: { [i]: "active" }, map: view(key), vars: { x, key },
          message: `No group ${key} yet, so start an empty list for it.` });
      }
      g.get(key)!.push(x);
      t.step({ ...ask, line: 7, array: a, pointers: { x: i }, tones: { [i]: "found" }, map: view(key), vars: { x, key },
        message: `Add ${x} to group ${key}: [${g.get(key)!.join(", ")}].` });
    });
    t.step({ line: 8, array: a, tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), map: view(), vars: {}, done: "found",
      message: `${g.size} group${g.size > 1 ? "s" : ""}, built in one pass: O(n). Each value cost one key and one lookup, instead of comparing it with every other value.` });
  },
};

/* ---------- Prefix totals in a map ---------- */
export type SumInput = { nums: number[]; k: number };
export const sumExample: SumInput = { nums: [2, 1, -1, 3, 1], k: 3 };
export const sumFields: InputField[] = [
  { key: "nums", label: "values", kind: "numbers" },
  { key: "k", label: "target sum k", kind: "number" },
];
export function sumPrepare(raw: SumInput): Prepared<SumInput> {
  if (raw.nums.length === 0) return { error: "Give at least one value." };
  if (raw.nums.length > 8) return { error: "Use at most 8 values." };
  return { input: raw };
}

/** The steps of "count stretches adding up to k" with a running total and a map; shared with LC 560. */
export function prefixCountSteps(a: number[], k: number, t: Parameters<Approach<SumInput>["run"]>[1], askAll = false) {
  const seen = new Map<number, number>([[0, 1]]);
  const title = "seen (total → how many times)";
  // where[total] lists the positions p (stretch start) whose earlier total was that value.
  const starts = new Map<number, number[]>([[0, [0]]]);
  let total = 0, cnt = 0;
  t.step({ line: 3, array: a, map: mapOf(title, seen, 0), vars: { total, count: cnt },
    message: `A stretch adds up to ${k} when this running total minus an earlier one is ${k}. So keep every earlier total in a map, with how often it appeared. Start with 0 once: the total before any value.` });
  let asked = 0;
  a.forEach((x, i) => {
    t.op();
    total += x;
    const need = total - k;
    const hits = seen.get(need) ?? 0;
    const ask = (askAll || asked < 2) && seen.size > 1
      ? (asked++, { ask: { q: `The total is now ${total}, so a stretch ending here adds up to ${k} when an earlier total was ${total} − ${k} = ${need}. How many earlier totals were ${need}?`, options: [...new Set([String(hits), String(hits + 1), String(hits === 0 ? 2 : hits - 1)])], answer: 0 } }) : {};
    cnt += hits;
    const first = hits ? starts.get(need)![0] : -1;
    t.step({ ...ask, line: 8, array: a, pointers: { x: i }, tones: { [i]: "active" }, ...(hits ? { range: [first, i] as [number, number] } : {}),
      badge: { at: i, text: `total ${total}` }, map: mapOf(title, seen, hits ? need : undefined), vars: { x, total, need, count: cnt },
      message: hits
        ? `total = ${total}. Need an earlier total of ${total} − ${k} = ${need}, and the map has it ${hits} time${hits > 1 ? "s" : ""}: ${hits} stretch${hits > 1 ? "es" : ""} ending at position ${i} add${hits > 1 ? "" : "s"} up to ${k}${hits > 1 ? `, e.g. ${first}..${i}` : ` (${first}..${i})`}. count is now ${cnt}.`
        : `total = ${total}. Need an earlier total of ${total} − ${k} = ${need}. It isn't in the map, so no stretch ending at position ${i} adds up to ${k}.` });
    seen.set(total, (seen.get(total) ?? 0) + 1);
    starts.set(total, [...(starts.get(total) ?? []), i + 1]);
    t.step({ line: 9, array: a, pointers: { x: i }, tones: { [i]: "visited" }, map: mapOf(title, seen, total), vars: { x, total, need, count: cnt },
      message: `Record this total: seen[${total}] is now ${seen.get(total)}, ready for later positions.` });
  });
  t.step({ line: 10, array: a, tones: Object.fromEntries(a.map((_, j) => [j, "settled" as Tone])), map: mapOf(title, seen), vars: { total, count: cnt }, done: cnt ? "found" : "notfound",
    message: `${cnt} stretch${cnt === 1 ? "" : "es"} add${cnt === 1 ? "s" : ""} up to ${k}. One pass and one lookup per value: O(n) time, and up to n + 1 totals in the map: O(n) space.` });
  return cnt;
}

export const prefixCountCode = `function countSums(a, k)
    seen ← empty map  // total → how many times
    seen[0] ← 1
    total ← 0
    count ← 0
    for each x in a
        total += x
        count += (seen[total - k] or 0)
        seen[total] ← (seen[total] or 0) + 1
    return count
`;

const prefixMap: Approach<SumInput> = {
  id: "prefixMap",
  name: "Running total and a map",
  code: prefixCountCode,
  run({ nums, k }, t) { prefixCountSteps(nums, k, t); },
};

export const countApproaches = { count };
export const groupApproaches = { group };
export const sumApproaches = { prefixMap };
