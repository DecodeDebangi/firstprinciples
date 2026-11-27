import { type Approach, type InputField, type Prepared, type Tone, type TreeData } from "@firstprinciples/ui";
import { Trie } from "../42-tries/steps";

/**
 * Binary tries: numbers stored as their bits, highest first, so the best XOR partner for x is found greedily by
 * taking the opposite bit whenever it exists. Used by the read and by LeetCode 421 and 1707.
 */
export const bitsOf = (x: number, B: number) => x.toString(2).padStart(B, "0");
export const widthFor = (nums: number[]) => Math.max(1, ...nums.map((x) => x.toString(2).length));
export class BitTrie extends Trie {
  owner = new Map<string, number>();
  constructor(public B: number) { super(); }
  /** Inserts silently; returns the path of node ids. */
  add(x: number) { let n = this.root; const path: string[] = []; for (const b of bitsOf(x, this.B)) { n = this.child(n, b) ?? this.make(b, n); path.push(n); } this.ends.add(n); this.owner.set(n, x); return path; }
  bview(tones: Record<string, Tone> = {}): TreeData[] {
    const notes = Object.fromEntries([...this.owner].map(([id, x]) => [id, `= ${x}`]));
    return [{ root: this.root, nodes: this.nodes.map((n) => ({ ...n, kids: [...n.kids!] })), tones, notes, layout: "compact" }];
  }
  /** Greedy walk for the best partner of x: prefer the opposite bit. Returns the path, the partner and the XOR. */
  best(x: number, t?: { op: () => void }) {
    let n = this.root, xor = 0; const path: string[] = [], took: boolean[] = [];
    for (let b = this.B - 1; b >= 0; b--) {
      t?.op();
      const bit = (x >> b) & 1, want = String(1 - bit), alt = this.child(n, want);
      if (alt) { n = alt; xor += 2 ** b; took.push(true); } else { n = this.child(n, String(bit))!; took.push(false); }
      path.push(n);
    }
    return { path, partner: this.owner.get(n)!, xor, took };
  }
}
type T = Parameters<Approach<unknown>["run"]>[1];
export const bitRows = (nums: number[], B: number) => ({ title: "in binary", rows: nums.map((x) => [...bitsOf(x, B)]), rowLabels: nums.map(String), colLabels: Array.from({ length: B }, (_, k) => `2^${B - 1 - k}`) });

/** One step per bit of a best-partner walk. Shared by the read and the problems. */
export function bestSteps(tr: BitTrie, x: number, t: T, lines: { take: number; keep: number }, extra: () => Record<string, unknown>, ask: boolean) {
  let n = tr.root, xor = 0; const path: string[] = [];
  let asked = !ask;
  const xb = bitsOf(x, tr.B);
  for (let b = tr.B - 1; b >= 0; b--) {
    t.op();
    const bit = (x >> b) & 1, want = String(1 - bit), alt = tr.child(n, want);
    const q = !asked && b < tr.B - 1 ? (asked = true, { ask: { q: `Bit 2^${b} of ${x} is ${bit}. The trie has ${alt ? `a ${want} branch here` : `only a ${bit} branch here`}. Which way?`, options: alt ? [`${want}: it makes this bit of the XOR 1`, `${bit}: same as x`] : [`${bit}: it's the only way`, `${want}`], answer: 0 } }) : {};
    if (alt) { n = alt; xor += 2 ** b; } else n = tr.child(n, String(bit))!;
    path.push(n);
    if (t.record) t.step({ ...extra(), ...q, line: alt ? lines.take : lines.keep, array: [], trees: tr.bview({ ...Object.fromEntries(path.map((p) => [p, "visited" as Tone])), [n]: alt ? "found" : "compare" }), vars: { x: `${x} = ${xb}`, bit: `2^${b}`, "xor so far": xor },
      message: alt ? `Bit 2^${b} of ${x} is ${bit}; the trie has a ${want} here, so take it: this bit of the XOR is 1 (+${2 ** b}). It's worth more than all the lower bits together, so this choice is always right.` : `Bit 2^${b} of ${x} is ${bit}, and no stored number has a ${want} here: follow the ${bit}. This bit of the XOR is 0.` });
  }
  return { partner: tr.owner.get(n)!, xor, path };
}

/* ---------- The read ---------- */
export type NumsInput = { nums: number[] };
export const numsExample: NumsInput = { nums: [3, 10, 5, 12, 9] };
export const numsFields: InputField[] = [{ key: "nums", label: "numbers (0 to 31)", kind: "numbers" }];
export function numsPrepare(raw: NumsInput): Prepared<NumsInput> {
  if (raw.nums.length < 2 || raw.nums.length > 6) return { error: "Use 2 to 6 numbers so the trie fits." };
  if (raw.nums.some((x) => !Number.isInteger(x) || x < 0 || x > 31)) return { error: "Use whole numbers from 0 to 31 (five bits)." };
  return { input: raw };
}
export const buildBits: Approach<NumsInput> = {
  id: "build", name: "Insert numbers bit by bit, highest bit first",
  code: `function insert(x)  // B bits, highest first
    node ← root
    for b from B − 1 down to 0
        bit ← (x >> b) & 1
        if node has no child bit
            node.child[bit] ← new node
        node ← node.child[bit]
`,
  run({ nums }, t) {
    const B = widthFor(nums), tr = new BitTrie(B);
    t.step({ line: 1, array: [], grid: bitRows(nums, B), trees: tr.bview(), vars: { B }, message: `Write every number with the same ${B} bits, highest first, and store those bits in a trie: each node has at most two children, 0 and 1. Numbers that start with the same bits share a path.` });
    for (const x of nums) {
      const path = tr.add(x); t.op(B);
      t.step({ line: 7, array: [], grid: bitRows(nums, B), trees: tr.bview(Object.fromEntries(path.map((p) => [p, "found" as Tone]))), vars: { x, bits: bitsOf(x, B) }, message: `Insert ${x} = ${bitsOf(x, B)}: follow or create one child per bit.` });
    }
    t.step({ line: 7, array: [], grid: bitRows(nums, B), trees: tr.bview(), vars: { numbers: nums.length }, done: "found", message: `${nums.length} numbers, ${B} steps each. A path from the root to a leaf spells one number.` });
  },
};
export type QueryInput = { nums: number[]; x: number };
export const queryExample: QueryInput = { nums: [3, 10, 5, 12, 9], x: 6 };
export const queryFields: InputField[] = [{ key: "nums", label: "stored numbers (0 to 31)", kind: "numbers" }, { key: "x", label: "x", kind: "number" }];
export function queryPrepare(raw: QueryInput): Prepared<QueryInput> {
  const r = numsPrepare({ nums: raw.nums }); if ("error" in r) return r;
  if (!Number.isInteger(raw.x) || raw.x < 0 || raw.x > 31) return { error: "Use x from 0 to 31." };
  return { input: raw };
}
export const bestPartner: Approach<QueryInput> = {
  id: "best", name: "Find the stored number that XORs highest with x",
  code: `function bestXor(x)
    node, xor ← root, 0
    for b from B − 1 down to 0
        bit ← (x >> b) & 1
        if node has child 1 − bit
            node ← node.child[1 − bit]
            xor ← xor + 2^b
        else
            node ← node.child[bit]
    return xor
`,
  run({ nums, x }, t) {
    const B = widthFor([...nums, x]), tr = new BitTrie(B); nums.forEach((v) => tr.add(v));
    t.step({ line: 2, array: [], grid: bitRows([x], B), trees: tr.bview(), vars: { x: `${x} = ${bitsOf(x, B)}` }, message: `Which stored number gives the biggest x xor y? XOR is 1 where the bits differ, and a higher bit is worth more than all lower bits together. So go from the highest bit down, and at each bit take the branch that differs from x's bit, if there is one.` });
    const r = bestSteps(tr, x, t, { take: 7, keep: 9 }, () => ({ grid: bitRows([x], B) }), true);
    t.step({ line: 10, array: [], grid: bitRows([x, r.partner], B), trees: tr.bview(Object.fromEntries(r.path.map((p) => [p, "found" as Tone]))), vars: { x, partner: r.partner, xor: r.xor }, done: "found",
      message: `The walk ends at ${r.partner}: ${x} xor ${r.partner} = ${r.xor}, the largest possible with these numbers. ${B} steps, however many numbers are stored.` });
  },
};
