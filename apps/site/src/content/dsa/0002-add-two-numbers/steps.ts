import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

/** Each list holds a number's digits backwards: [6, 4, 9] is 946. */
export type Input = { l1: number[]; l2: number[] };
type P = Input;
export const example: Input = { l1: [6, 4, 9], l2: [8, 7] };
export const fields: InputField[] = [
  { key: "l1", label: "l1 digits (ones first)", kind: "numbers" },
  { key: "l2", label: "l2 digits (ones first)", kind: "numbers" },
];
export function prepare(raw: Input): Prepared<Input> {
  for (const [name, d] of [["l1", raw.l1], ["l2", raw.l2]] as const) {
    if (d.length === 0) return { error: `Give ${name} at least one digit.` };
    if (d.length > 5) return { error: `Keep ${name} to at most 5 digits so the answer fits.` };
    if (d.some((x) => !Number.isInteger(x) || x < 0 || x > 9)) return { error: `Each node of ${name} holds one digit, 0 to 9.` };
    if (d.length > 1 && d[d.length - 1] === 0) return { error: `${name}'s last node is its leading digit, so it can't be 0 (unless the number is just 0).` };
  }
  return { input: raw };
}

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const END = (id: string): N => ({ id, val: "none", kind: "null" });
const numOf = (d: number[]) => [...d].reverse().join("");
const listRow = (name: string, d: number[], at: number | null, tones: Record<number, Tone> = {}): ListRow => {
  const ids = d.map((_, i) => `${name}${i}`);
  return { label: `${name} (${numOf(d)})`, nodes: [...d.map((v, i) => ({ id: ids[i], val: v })), END(`${name}end`)], arrows: d.map(() => "right" as const),
    pointers: at == null ? {} : { [name]: at < d.length ? ids[at] : `${name}end` }, tones: Object.fromEntries(Object.entries(tones).map(([i, t]) => [ids[Number(i)], t])) };
};
const sumRow = (out: number[], lift?: number, done = false): ListRow => ({
  label: done ? `sum (${numOf(out)})` : "sum",
  nodes: [{ id: "dummy", val: "dummy", kind: "dummy" }, ...out.map((v, i) => ({ id: `s${i}`, val: v })), END("send")], arrows: [...out, 0].map(() => "right" as const),
  pointers: done ? { "dummy.next": out.length ? "s0" : "send" } : { tail: out.length ? `s${out.length - 1}` : "dummy" },
  tones: Object.fromEntries(out.map((_, i) => [`s${i}`, (done ? "settled" : i === lift ? "found" : "visited") as Tone])),
});

const viaNumbers: Approach<P> = {
  id: "numbers",
  name: "Turn them into numbers, add, turn back",
  code: `function toNumber(list)
    num ← 0
    place ← 1
    for each digit d in list
        num += d * place
        place *= 10
    return num

function addTwoNumbers(l1, l2)
    total ← toNumber(l1) + toNumber(l2)
    dummy ← new ListNode(0)
    tail ← dummy
    while true
        tail.next ← new ListNode(total % 10)
        tail ← tail.next
        total ← floor(total / 10)
        if total = 0 then return dummy.next
`,
  run({ l1, l2 }, t) {
    const out: number[] = [];
    const rows = (a: number | null, b: number | null, ta: Record<number, Tone> = {}, tb: Record<number, Tone> = {}, lift?: number, done = false) => [listRow("l1", l1, a, ta), listRow("l2", l2, b, tb), sumRow(out, lift, done)];
    t.step({ line: 10, array: [], lists: rows(null, null), vars: {},
      message: `The obvious way: read each list as an ordinary number, add them, and write the sum back as a list. The digits are stored backwards, so the first node is the ones digit.` });
    const nums: number[] = [];
    for (const [name, d] of [["l1", l1], ["l2", l2]] as const) {
      let num = 0, place = 1;
      for (let i = 0; i < d.length; i++) {
        t.op();
        num += d[i] * place;
        const vis = Object.fromEntries(Array.from({ length: i + 1 }, (_, k) => [k, (k === i ? "active" : "visited") as Tone]));
        t.step({ line: 5, array: [], lists: name === "l1" ? rows(i, null, vis) : rows(null, i, { }, vis), vars: { num, place },
          message: `${name}: the ${d[i]} is worth ${d[i]} × ${place} = ${d[i] * place}. num is now ${num}.` });
        place *= 10;
      }
      nums.push(num);
    }
    let total = nums[0] + nums[1];
    t.op();
    t.step({ line: 10, array: [], lists: rows(null, null), vars: { total },
      message: `${nums[0]} + ${nums[1]} = ${total}. Now write it back as a list, ones digit first.` });
    while (true) {
      t.op();
      out.push(total % 10);
      t.step({ line: 14, array: [], lists: rows(null, null, {}, {}, out.length - 1), vars: { total },
        message: `${total} % 10 = ${total % 10}: that's the next digit.` });
      total = Math.floor(total / 10);
      if (total === 0) break;
    }
    t.step({ line: 17, array: [], lists: rows(null, null, {}, {}, undefined, true), vars: { total }, done: "found",
      message: `total is 0: return dummy.next, ${out.join(" → ")}, which is ${numOf(out)}. It works here, but the problem allows lists of 100 digits, far too big for an ordinary number in most languages.` });
  },
};

const carry: Approach<P> = {
  id: "carry",
  name: "Add digit by digit with a carry (optimal)",
  code: `function addTwoNumbers(l1, l2)
    dummy ← new ListNode(0)
    tail ← dummy
    carry ← 0
    while l1 ≠ none or l2 ≠ none or carry > 0
        x ← (l1 ≠ none) ? l1.val : 0
        y ← (l2 ≠ none) ? l2.val : 0
        s ← x + y + carry
        tail.next ← new ListNode(s % 10)
        tail ← tail.next
        carry ← floor(s / 10)
        if l1 ≠ none then l1 ← l1.next
        if l2 ≠ none then l2 ← l2.next
    return dummy.next
`,
  run({ l1, l2 }, t) {
    const out: number[] = [];
    let c = 0, i = 0, firstCarry = true;
    const rows = (lift?: number, done = false) => [
      listRow("l1", l1, done ? null : i, Object.fromEntries(Array.from({ length: Math.min(i, l1.length) }, (_, k) => [k, "visited" as Tone]))),
      listRow("l2", l2, done ? null : i, Object.fromEntries(Array.from({ length: Math.min(i, l2.length) }, (_, k) => [k, "visited" as Tone]))),
      sumRow(out, lift, done),
    ];
    t.step({ line: 4, array: [], lists: rows(), vars: { carry: 0 },
      message: "Add the way you would on paper: ones first, then tens, carrying 1 when a column goes over 9. The lists already start at the ones digit, so just walk them together." });
    while (i < l1.length || i < l2.length || c > 0) {
      t.op();
      const x = i < l1.length ? l1[i] : 0, y = i < l2.length ? l2[i] : 0, c0 = c, s = x + y + c;
      const onlyCarry = i >= l1.length && i >= l2.length;
      const ask = onlyCarry ? { ask: { q: `Both lists are used up, but carry is ${c0}. What happens?`, options: [`Add one more node holding ${c0}`, "Stop and return the list", "Add a 0"], answer: 0 } }
        : firstCarry && s > 9 ? { ask: { q: `This column is ${x} + ${y}${c0 ? ` + ${c0}` : ""} = ${s}. What goes in the answer?`, options: [`${s % 10}, and carry 1`, `${s}, and carry 0`, `${s % 10}, and carry 0`], answer: 0 } } : {};
      if (s > 9) firstCarry = false;
      out.push(s % 10); c = Math.floor(s / 10);
      const lists = rows(out.length - 1);
      t.step({ ...ask, line: 9, array: [], lists, vars: { x, y, carry: c0, s },
        message: onlyCarry ? `Both lists are used up, but the last column carried ${c0}. The loop runs once more: 0 + 0 + ${c0} = ${s}, a new leading digit.`
          : `${i >= l1.length ? `l1 is none, so x = 0. ` : ""}${i >= l2.length ? `l2 is none, so y = 0. ` : ""}${x} + ${y}${c0 ? ` + carry ${c0}` : ""} = ${s}: write ${s % 10}${s > 9 ? ", carry 1" : ", carry 0"}.` });
      i++;
      if (!onlyCarry && (i < l1.length || i < l2.length || c > 0)) {
        t.step({ line: 13, array: [], lists: rows(), vars: { carry: c },
          message: `Move on to the next column${i >= l1.length && i >= l2.length ? ": both lists are now none" : ""}.` });
      }
    }
    t.step({ line: 14, array: [], lists: rows(undefined, true), vars: { carry: c }, done: "found",
      message: `Return dummy.next: ${out.join(" → ")}, which is ${numOf(l1)} + ${numOf(l2)} = ${numOf(out)}. One pass over the longer list, O(max(m, n)) time, and it works for any number of digits.` });
  },
};

export const approaches = { viaNumbers, carry };
