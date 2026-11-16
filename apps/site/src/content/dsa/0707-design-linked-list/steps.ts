import { measureGrowth, type Approach, type InputField, type ListRow, type Prepared, type Tone } from "@firstprinciples/ui";

/** Operations as text, e.g. "addAtHead 4, addAtTail 9, addAtIndex 1 6, get 2, deleteAtIndex 0, get 0". */
export type Input = { ops: string };
export const example: Input = { ops: "addAtHead 4, addAtTail 9, addAtIndex 1 6, get 2, deleteAtIndex 0, get 0" };
export const fields: InputField[] = [{ key: "ops", label: "operations", kind: "text" }];

type Op = { name: "get" | "addAtHead" | "addAtTail" | "addAtIndex" | "deleteAtIndex"; args: number[] };
const ARITY: Record<Op["name"], number> = { get: 1, addAtHead: 1, addAtTail: 1, addAtIndex: 2, deleteAtIndex: 1 };

function parse(text: string): Op[] | string {
  const ops: Op[] = [];
  for (const part of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [name, ...rest] = part.split(/\s+/);
    const op = Object.keys(ARITY).find((k) => k.toLowerCase() === name.toLowerCase()) as Op["name"] | undefined;
    if (!op) return `"${name}" isn't an operation. Use get, addAtHead, addAtTail, addAtIndex or deleteAtIndex.`;
    const args = rest.map(Number);
    if (args.length !== ARITY[op] || args.some((a) => !Number.isInteger(a))) return `${op} takes ${ARITY[op] === 2 ? "an index and a value" : "one whole number"}, e.g. "${op} ${ARITY[op] === 2 ? "1 6" : "4"}".`;
    ops.push({ name: op, args });
  }
  return ops;
}
const show = (o: Op) => `${o.name}(${o.args.join(", ")})`;

export function prepare(raw: Input): Prepared<Input> {
  const ops = parse(raw.ops);
  if (typeof ops === "string") return { error: ops };
  if (!ops.length || ops.length > 8) return { error: "Use 1 to 8 operations, separated by commas." };
  let size = 0;
  for (const o of ops) { if (o.name === "addAtHead" || o.name === "addAtTail" || (o.name === "addAtIndex" && o.args[0] >= 0 && o.args[0] <= size)) size++; if (o.name === "deleteAtIndex" && o.args[0] >= 0 && o.args[0] < size) size--; if (size > 6) return { error: "Keep the list to at most 6 values so it fits." }; }
  return { input: { ops: ops.map((o) => `${o.name} ${o.args.join(" ")}`).join(", ") } };
}

const returned = (out: (number | string)[], hl = false) => ({ title: "returned", rows: [out.length ? [...out] : ["—"]], tones: hl && out.length ? { [`0,${out.length - 1}`]: "found" as Tone } : {} });

const arrayBacked: Approach<Input> = {
  id: "array",
  name: "Backed by an array",
  code: `class MyLinkedList  // secretly an array
    constructor()
        this.a ← empty list
    function get(index)
        if index ≥ length(this.a) then return -1
        return this.a[index]
    function addAtHead(val)
        this.addAtIndex(0, val)
    function addAtTail(val)
        this.addAtIndex(length(this.a), val)
    function addAtIndex(index, val)
        if index > length(this.a) then return
        this.a.push(none)  // grow by one
        for i ← length(this.a) - 1 down to index + 1
            this.a[i] ← this.a[i - 1]  // shift
        this.a[index] ← val
    function deleteAtIndex(index)
        if index ≥ length(this.a) then return
        for i ← index to length(this.a) - 2
            this.a[i] ← this.a[i + 1]  // shift left
        this.a.pop()
`,
  run({ ops: text }, t) {
    const ops = parse(text) as Op[];
    const a: (number | string)[] = [], out: (number | string)[] = [];
    t.step({ line: 3, array: [], grid: returned(out), vars: {}, message: "One way to build it: keep the values in a plain array and pretend it's a linked list. Every operation is available, so let's see what each one costs." });
    for (const o of ops) {
      if (o.name === "get") {
        const [k] = o.args; t.op();
        const ok = k >= 0 && k < a.length;
        out.push(ok ? a[k] as number : -1);
        t.step({ line: ok ? 6 : 5, array: [...a], tones: ok ? { [k]: "found" } : {}, grid: returned(out, true), vars: { op: show(o) },
          message: ok ? `${show(o)}: jump straight to position ${k} and return ${a[k]}. Arrays are great at this: O(1).` : `${show(o)}: there's no position ${k}, so return -1.` });
        continue;
      }
      if (o.name === "deleteAtIndex") {
        const [k] = o.args;
        if (k < 0 || k >= a.length) { t.step({ line: 18, array: [...a], grid: returned(out), vars: { op: show(o) }, message: `${show(o)}: there's no position ${k}, so nothing happens.` }); continue; }
        const gone = a[k];
        for (let i = k; i < a.length - 1; i++) {
          t.op(); a[i] = a[i + 1];
          t.step({ line: 20, array: [...a], tones: { [i + 1]: "active", [i]: "compare" }, move: { from: i + 1, to: i }, grid: returned(out), vars: { op: show(o) },
            message: `${show(o)}: ${gone} leaves a gap, so ${a[i]} slides one place left into position ${i}.` });
        }
        a.pop();
        t.step({ line: 21, array: [...a], grid: returned(out), vars: { op: show(o) }, message: `Drop the last slot. Removing position ${k} moved ${a.length - k} value${a.length - k === 1 ? "" : "s"}: deleting near the front is O(n).` });
        continue;
      }
      const index = o.name === "addAtHead" ? 0 : o.name === "addAtTail" ? a.length : o.args[0];
      const val = o.name === "addAtIndex" ? o.args[1] : o.args[0];
      if (index < 0 || index > a.length) { t.step({ line: 12, array: [...a], grid: returned(out), vars: { op: show(o) }, message: `${show(o)}: position ${index} is past the end, so nothing happens.` }); continue; }
      a.push("_");
      t.step({ line: 13, array: [...a], tones: { [a.length - 1]: "active" }, grid: returned(out), vars: { op: show(o) },
        message: `${show(o)}: make room by adding a slot at the end${index === a.length - 1 ? ", which is exactly where the new value goes" : ""}.` });
      for (let i = a.length - 1; i > index; i--) {
        t.op(); a[i] = a[i - 1];
        t.step({ line: 15, array: [...a], tones: { [i - 1]: "active", [i]: "compare" }, move: { from: i - 1, to: i }, grid: returned(out), vars: { op: show(o) },
          message: `Shift ${a[i]} one place right, into position ${i}, to open a gap at ${index}.` });
      }
      t.op(); a[index] = val;
      t.step({ line: 16, array: [...a], tones: { [index]: "found" }, grid: returned(out), vars: { op: show(o) },
        message: `Write ${val} into position ${index}.${index < a.length - 1 ? ` Adding near the front shifted ${a.length - 1 - index} value${a.length - 2 - index ? "s" : ""}: O(n).` : " Adding at the end shifted nothing."}` });
    }
    t.step({ line: 3, array: [...a], grid: returned(out), vars: {}, done: "found",
      message: `Done: [${a.join(", ")}]. get is O(1), but adding or deleting at the front shifts everything after it: O(n) each.` });
  },
};

type N = { id: string; val: number | string; kind?: "null" | "dummy" };
const DUMMY: N = { id: "dummy", val: "dummy", kind: "dummy" };
const END: N = { id: "end", val: "none", kind: "null" };
const row = (nodes: N[], extra: Partial<ListRow> = {}): ListRow => ({ nodes: [DUMMY, ...nodes, END], arrows: [DUMMY, ...nodes].map(() => "right" as const), ...extra });

const linked: Approach<Input> = {
  id: "linked",
  name: "A real linked list with a dummy head (optimal)",
  code: `class MyLinkedList
    constructor()
        this.dummy ← new ListNode(0)
        this.size ← 0
    function get(index)
        if index ≥ this.size then return -1
        curr ← this.dummy.next
        repeat index times
            curr ← curr.next
        return curr.val
    function addAtHead(val)
        this.addAtIndex(0, val)
    function addAtTail(val)
        this.addAtIndex(this.size, val)
    function addAtIndex(index, val)
        if index > this.size then return
        prev ← this.dummy
        repeat index times
            prev ← prev.next
        added ← new ListNode(val)
        added.next ← prev.next
        prev.next ← added
        this.size += 1
    function deleteAtIndex(index)
        if index ≥ this.size then return
        prev ← this.dummy
        repeat index times
            prev ← prev.next
        prev.next ← prev.next.next
        this.size -= 1
`,
  run({ ops: text }, t) {
    const ops = parse(text) as Op[];
    const list: N[] = [], out: (number | string)[] = [];
    let next = 0;
    t.step({ line: 4, array: [], lists: [row(list, { pointers: { dummy: "dummy" } })], grid: returned(out), vars: { size: 0 },
      message: "Start with just a dummy node and a size of 0. The dummy means adding or deleting at position 0 works exactly like anywhere else, and size answers \"is this index valid?\" without walking." });
    const walk = (index: number, line: number, ptr: string, label: string) => {
      let at = "dummy";
      for (let i = 0; i < index; i++) {
        t.op(); at = list[i].id;
        t.step({ line, array: [], lists: [row(list, { pointers: { [ptr]: at }, tones: { [at]: "compare" } })], grid: returned(out), vars: { size: list.length, op: label },
          message: `Walk ${ptr} one node forward (${i + 1} of ${index}).` });
      }
      return at;
    };
    for (const o of ops) {
      const label = show(o);
      if (o.name === "get") {
        const [k] = o.args;
        if (k < 0 || k >= list.length) { out.push(-1); t.step({ line: 6, array: [], lists: [row(list)], grid: returned(out, true), vars: { size: list.length, op: label }, message: `${label}: size is ${list.length}, so index ${k} doesn't exist. Return -1 without walking.` }); continue; }
        let at = list[0].id;
        t.step({ line: 7, array: [], lists: [row(list, { pointers: { curr: at }, tones: { [at]: "compare" } })], grid: returned(out), vars: { size: list.length, op: label }, message: `${label}: start at the first real node and step forward ${k} time${k === 1 ? "" : "s"}.` });
        for (let i = 0; i < k; i++) { t.op(); at = list[i + 1].id; t.step({ line: 9, array: [], lists: [row(list, { pointers: { curr: at }, tones: { [at]: "compare" } })], grid: returned(out), vars: { size: list.length, op: label }, message: `Step to the next node (${i + 1} of ${k}).` }); }
        out.push(list[k].val);
        t.step({ line: 10, array: [], lists: [row(list, { pointers: { curr: at }, tones: { [at]: "found" } })], grid: returned(out, true), vars: { size: list.length, op: label }, message: `Return ${list[k].val}. Reaching index ${k} took ${k} step${k === 1 ? "" : "s"}: get is O(index), the one thing an array does better.` });
        continue;
      }
      if (o.name === "deleteAtIndex") {
        const [k] = o.args;
        if (k < 0 || k >= list.length) { t.step({ line: 25, array: [], lists: [row(list)], grid: returned(out), vars: { size: list.length, op: label }, message: `${label}: no node at index ${k}, so nothing happens.` }); continue; }
        t.step({ line: 26, array: [], lists: [row(list, { pointers: { prev: "dummy" }, tones: { dummy: "compare" } })], grid: returned(out), vars: { size: list.length, op: label }, message: `${label}: to unlink index ${k}, stop on the node just before it. Start prev on the dummy.` });
        const prev = walk(k, 28, "prev", label);
        const gone = list[k], after = list[k + 1]?.id ?? "end";
        const allPrev = [DUMMY, ...list];
        t.op();
        t.step({ line: 29, array: [], lists: [{ ...row(list, { pointers: { prev }, tones: { [prev]: "active", [gone.id]: "miss" } }), arrows: allPrev.map((_, i) => (i === k ? null : "right" as const)), skips: [{ from: prev, to: after }] }],
          grid: returned(out), vars: { size: list.length, op: label }, message: `Point prev's next past ${gone.val}, straight at ${list[k + 1]?.val ?? "none"}. One pointer change, nothing shifts.` });
        list.splice(k, 1);
        t.step({ line: 30, array: [], lists: [row(list)], grid: returned(out), vars: { size: list.length, op: label }, message: `${gone.val} is gone. size is now ${list.length}.` });
        continue;
      }
      const index = o.name === "addAtHead" ? 0 : o.name === "addAtTail" ? list.length : o.args[0];
      const val = o.name === "addAtIndex" ? o.args[1] : o.args[0];
      if (index < 0 || index > list.length) { t.step({ line: 16, array: [], lists: [row(list)], grid: returned(out), vars: { size: list.length, op: label }, message: `${label}: index ${index} is past the end (size ${list.length}), so nothing happens.` }); continue; }
      t.step({ line: 17, array: [], lists: [row(list, { pointers: { prev: "dummy" }, tones: { dummy: "compare" } })], grid: returned(out), vars: { size: list.length, op: label },
        message: `${label}${o.name !== "addAtIndex" ? ` is addAtIndex(${index}, ${val})` : ""}: walk prev to the node before index ${index}${index === 0 ? ". That's the dummy itself, so no walking at all" : ""}.` });
      const prev = walk(index, 19, "prev", label);
      const node: N = { id: `v${next++}`, val };
      t.step({ line: 20, array: [], lists: [row(list, { pointers: { prev } }), { label: "new", nodes: [node], arrows: [], tones: { [node.id]: "active" } }], grid: returned(out), vars: { size: list.length, op: label }, message: `Make the new node ${val}.` });
      const at = list.findIndex((x) => x.id === prev) + 1; // 0 when prev is the dummy
      const mid = [...list.slice(0, at), node, ...list.slice(at)];
      const afterId = list[at]?.id ?? "end";
      t.op();
      t.step({ line: 21, array: [], lists: [{ ...row(mid, { pointers: { prev, added: node.id }, tones: { [node.id]: "active" } }), arrows: [DUMMY, ...mid].map((_, i) => (i === at ? null : "right" as const)), skips: [{ from: prev, to: afterId }] }],
        grid: returned(out), vars: { size: list.length, op: label }, message: `First attach ${val} to the rest: its next is ${list[at]?.val ?? "none"}.` });
      list.splice(at, 0, node); t.op();
      t.step({ line: 23, array: [], lists: [row(list, { tones: { [node.id]: "found" } })], grid: returned(out), vars: { size: list.length, op: label },
        message: `Then link it in after prev, and size becomes ${list.length}. Two pointer changes${index === 0 ? ", no walking: adding at the head is O(1)" : `, after walking ${index} node${index === 1 ? "" : "s"}`}.` });
    }
    t.step({ line: 4, array: [], lists: [row(list)], grid: returned(out), vars: { size: list.length }, done: "found",
      message: `Done: ${list.map((x) => x.val).join(" → ") || "empty"}. Adding or deleting costs O(index) to walk there plus O(1) to rewire, so the head is O(1) and nothing ever shifts.` });
  },
};

export const approaches = { arrayBacked, linked };

/** n addAtHead calls: the array shifts everything every time, the list never does. */
export const growth = measureGrowth(
  [{ approach: arrayBacked, slot: 1 }, { approach: linked, slot: 2 }],
  (n) => ({ ops: Array.from({ length: n }, (_, i) => `addAtHead ${i}`).join(", ") }),
  [4, 8, 16, 24, 32],
);
