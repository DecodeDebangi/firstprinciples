import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { nums: number[]; values: number[] };
type P = Input;
export const example: Input = { nums: [3, 8], values: [3, 5, 8, 1, 3] };
export const fields: InputField[] = [
  { key: "nums", label: "nums (values to delete)", kind: "numbers" },
  { key: "values", label: "list", kind: "numbers" },
];
export function prepare(raw: Input): Prepared<Input> {
  if (raw.nums.length === 0) return { error: "Give at least one value to delete." };
  if (raw.nums.length > 8) return { error: "Keep nums to at most 8 values." };
  if (raw.values.length === 0) return { error: "Give the list at least one value." };
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  if (raw.values.every((v) => raw.nums.includes(v))) return { error: "Leave at least one node that isn't deleted (the problem promises the answer isn't empty)." };
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
type T = Parameters<Approach<P>["run"]>[1];
const END: N = { id: "end", val: "none", kind: "null" };
const DUMMY: N = { id: "dummy", val: "dummy", kind: "dummy" };
const row = (live: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [...live, END], arrows: live.map(() => "right" as const), ...extra });
const idOr = (n?: N) => n?.id ?? "end";

/** The shared walk: curr starts on the dummy and looks one node ahead. `inSet` decides; `side` draws the extra panel. */
function walk(t: T, values: number[], decide: (v: number) => boolean, lines: { check: number; unlink: number; move: number; ret: number }, side: (hl?: number) => object, opsPerCheck: number, askOnce: boolean) {
  const live: N[] = [DUMMY, ...values.map((v, i) => ({ id: `n${i}`, val: v }))];
  let c = 0, asked = !askOnce;
  while (c < live.length - 1) {
    t.op(opsPerCheck);
    const nx = live[c + 1], v = nx.val as number;
    const hit = decide(v);
    const ptr = { dummy: "dummy", curr: live[c].id };
    if (hit) {
      const ask = !asked && c > 0 ? (asked = true, { ask: { q: `curr.next holds ${v}, which must go. After unlinking it, what does curr do?`, options: ["Stays put: the node that slides in hasn't been checked", "Moves forward one node", "Goes back to the dummy"], answer: 0 } }) : {};
      t.step({ ...ask, ...side(v), line: lines.unlink, array: [], vars: {},
        lists: [{ ...row(live, { pointers: ptr, tones: { [live[c].id]: "active", [nx.id]: "miss" } }), arrows: live.map((_, i) => (i === c ? null : "right" as const)), skips: [{ from: live[c].id, to: idOr(live[c + 2]) }] }],
        message: `curr.next holds ${v}: it's in nums, so delete it. Point ${c === 0 ? "the dummy" : `the ${live[c].val}`} past it, to ${live[c + 2] ? `the ${live[c + 2].val}` : "none"}.${c === 0 ? " That's the head, and the dummy makes it no different from any other node." : ""} curr stays put: the node that slides into curr.next hasn't been checked yet.` });
      live.splice(c + 1, 1);
    } else {
      c++;
      t.step({ ...side(v), line: lines.move, array: [], vars: {}, lists: [row(live, { pointers: { dummy: "dummy", curr: live[c].id }, tones: { [live[c].id]: "compare" } })],
        message: `curr.next holds ${v}: not in nums, so keep it and move curr forward.` });
    }
  }
  const real = live.slice(1);
  t.step({ ...side(), line: lines.ret, array: [], vars: {}, done: "found",
    lists: [row(live, { pointers: { dummy: "dummy", "dummy.next": idOr(real[0]) }, tones: Object.fromEntries(real.map((x) => [x.id, "settled" as Tone])) })],
    message: `Return dummy.next: ${real.map((x) => x.val).join(" → ")} → none.` });
}

const scan: Approach<P> = {
  id: "scan",
  name: "Scan nums for every node",
  code: `function modifiedList(nums, head)
    dummy ← new ListNode(0)
    dummy.next ← head
    curr ← dummy
    while curr.next ≠ none
        found ← false
        for each x in nums
            if x = curr.next.val then found ← true
        if found
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return dummy.next
`,
  run({ nums, values }, t) {
    const side = (hl?: number) => ({ grid: { title: `nums (scanned in full for every node)`, rows: [nums], tones: hl === undefined ? {} : Object.fromEntries(nums.map((x, j) => [`0,${j}`, (x === hl ? "found" : "compare") as Tone])) } });
    t.step({ ...side(), line: 4, array: [], vars: {}, lists: [row([DUMMY, ...values.map((v, i) => ({ id: `n${i}`, val: v }))], { pointers: { dummy: "dummy", curr: "dummy" } })],
      message: "Delete every node whose value appears in nums. A dummy in front means deleting the head is no special case. The simple check: for each node, read through all of nums." });
    walk(t, values, (v) => nums.includes(v), { check: 8, unlink: 10, move: 12, ret: 13 }, side, nums.length, false);
    const last = t.steps[t.steps.length - 1]; // not recorded while the growth chart measures
    if (last) last.message += ` Every node read all ${nums.length} values of nums: O(n · m) time.`;
  },
};

const withSet: Approach<P> = {
  id: "set",
  name: "Put nums in a set first (optimal)",
  code: `function modifiedList(nums, head)
    remove ← empty set
    for each x in nums
        remove.add(x)
    dummy ← new ListNode(0)
    dummy.next ← head
    curr ← dummy
    while curr.next ≠ none
        if curr.next.val in remove
            curr.next ← curr.next.next
        else
            curr ← curr.next
    return dummy.next
`,
  run({ nums, values }, t) {
    const set = [...new Set(nums)];
    const side = (hl?: number) => ({ map: { title: "remove (a set)", entries: set.map((x) => [String(x), "delete"] as [string, string]), highlight: hl !== undefined && set.includes(hl) ? String(hl) : undefined } });
    t.op(nums.length);
    t.step({ ...side(), line: 4, array: [], vars: {}, lists: [row([DUMMY, ...values.map((v, i) => ({ id: `n${i}`, val: v }))])],
      message: `First put nums into a set: ${nums.length} quick adds${set.length < nums.length ? " (repeats are stored once)" : ""}. Now "should this value go?" is one O(1) lookup instead of a scan.` });
    walk(t, values, (v) => set.includes(v), { check: 9, unlink: 10, move: 12, ret: 13 }, side, 1, true);
    const last = t.steps[t.steps.length - 1];
    if (last) last.message += " Building the set is O(m) and the walk is O(n), with O(1) per check: O(n + m) time, O(m) space for the set.";
  },
};

export const approaches = { scan, withSet };

/** Nothing is deleted (the worst case for scanning): n nodes and m = n values in nums. */
export const growth = measureGrowth(
  [{ approach: scan, slot: 1 }, { approach: withSet, slot: 3 }],
  (n) => ({ nums: Array.from({ length: n }, (_, i) => 1000 + i), values: Array.from({ length: n }, (_, i) => i) }),
  [4, 8, 16, 24, 32],
);
