import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

type N = { id: string; val: number | string; kind?: "null" };
const END: N = { id: "end", val: "none", kind: "null" };

/* ---------- Adding up a list ---------- */
export type SumInput = { values: number[] };
export const sumExample: SumInput = { values: [4, 2, 6, 3] };
export const sumFields: InputField[] = [{ key: "values", label: "values", kind: "numbers" }];
export function sumPrepare(raw: SumInput): Prepared<SumInput> {
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  return { input: raw };
}

const sum: Approach<SumInput> = {
  id: "sum",
  name: "Adding up a list",
  code: `function sum(node)
    if node = none
        return 0  // base case
    rest ← sum(node.next)
    return node.val + rest
`,
  run({ values }, t) {
    const n = values.length;
    const row = (at: number, tones: Record<number, Tone> = {}): ListRow => ({
      nodes: [...values.map((v, i) => ({ id: `n${i}`, val: v })), END], arrows: values.map(() => "right" as const),
      pointers: { node: at >= n ? "end" : `n${at}` }, tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])),
    });
    const frames: string[] = [];
    t.step({ line: 1, array: [], lists: [row(0)], stack: [], vars: {},
      message: `A list is either empty (none), or one node followed by a smaller list. So the sum of a list is either 0, or this node's value plus the sum of the rest. That's the whole function: it trusts sum(node.next) to handle the rest.` });
    for (let i = 0; i < n; i++) {
      t.op();
      frames.push(`sum(${values[i]}): ${values[i]} + ?`);
      t.step({ line: 4, array: [], lists: [row(i, { [i]: "active", ...Object.fromEntries(Array.from({ length: i }, (_, k) => [k, "visited" as Tone])) })], stack: [...frames], vars: {},
        message: `sum(the ${values[i]}): the node isn't none, so call sum on the rest of the list${i + 1 < n ? `, starting at the ${values[i + 1]}` : ", which is none"}. This call can't finish until that one answers, so it waits on the call stack.` });
    }
    t.op();
    t.step({ ask: { q: "node is none: the rest of the list is empty. What should sum return?", options: ["0: an empty list adds up to nothing", "none", "The last value in the list"], answer: 0 },
      line: 3, array: [], lists: [row(n, Object.fromEntries(values.map((_, k) => [k, "visited" as Tone])))], stack: [...frames, "sum(none) = 0"], vars: {},
      message: `sum(none): the base case. An empty list adds up to 0, so return 0 straight away, with no further call. This is what stops the calls going on forever.` });
    let acc = 0;
    for (let i = n - 1; i >= 0; i--) {
      const rest = acc; acc += values[i];
      frames[i] = `sum(${values[i]}) = ${values[i]} + ${rest} = ${acc}`;
      t.step({ line: 5, array: [], lists: [row(i, { [i]: "found", ...Object.fromEntries(Array.from({ length: n - 1 - i }, (_, k) => [i + 1 + k, "settled" as Tone])) })], stack: frames.slice(0, i + 1), vars: { rest, returns: acc },
        message: `The call below answered ${rest}. Now sum(the ${values[i]}) can finish: ${values[i]} + ${rest} = ${acc}. It returns that and leaves the stack.` });
    }
    t.step({ line: 5, array: [], lists: [row(0, Object.fromEntries(values.map((_, k) => [k, "settled" as Tone])))], stack: [], vars: { answer: acc }, done: "found",
      message: n ? `The first call returns ${acc}. The calls went down the list one node at a time, then the additions happened on the way back up, last node first. ${n + 1} calls were on the stack at the deepest point: O(n) space.` : "The list was empty, so the very first call was the base case: 0." });
  },
};

/* ---------- Removing every v ---------- */
export type RemoveInput = { values: number[]; v: number };
export const removeExample: RemoveInput = { values: [7, 3, 7, 7, 5], v: 7 };
export const removeFields: InputField[] = [
  { key: "values", label: "values", kind: "numbers" },
  { key: "v", label: "remove every", kind: "number" },
];
export function removePrepare(raw: RemoveInput): Prepared<RemoveInput> {
  if (raw.values.length > 6) return { error: "Keep the list to at most 6 nodes so it fits." };
  return { input: raw };
}

const remove: Approach<RemoveInput> = {
  id: "remove",
  name: "Removing every v",
  code: `function removeAll(node, v)
    if node = none
        return none
    node.next ← removeAll(node.next, v)
    if node.val = v
        return node.next  // skip this node
    return node
`,
  run({ values, v }, t) {
    const n = values.length;
    const links = values.map((_, i) => i + 1); // links[i] = index of node i's next (n = none)
    const gone = new Set<number>();
    const id = (i: number) => (i >= n ? "end" : `n${i}`);
    const name = (i: number) => (i >= n ? "none" : `the ${values[i]}`);
    const short = (i: number) => (i >= n ? "none" : String(values[i]));
    const row = (ptr: Record<string, number>, tones: Record<number, Tone> = {}): ListRow => ({
      nodes: [...values.map((val, i) => ({ id: `n${i}`, val })), END],
      arrows: values.map((_, i) => (links[i] === i + 1 ? "right" as const : null)),
      skips: values.flatMap((_, i) => (links[i] !== i + 1 && !gone.has(i) ? [{ from: `n${i}`, to: id(links[i]) }] : [])),
      pointers: Object.fromEntries(Object.entries(ptr).map(([k, i]) => [k, id(i)])),
      tones: { ...Object.fromEntries([...gone].map((i) => [`n${i}`, "discard" as Tone])), ...Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`n${i}`, tn])) },
    });
    const frames: string[] = [];
    t.step({ line: 1, array: [], lists: [row({ node: 0 })], stack: [], vars: { v },
      message: `Same shape, but now the function returns a list: "the rest of the list with every ${v} removed". Each call trusts the next one to clean up the rest, then decides only about its own node.` });
    for (let i = 0; i < n; i++) {
      t.op();
      frames.push(`removeAll(${short(i)}): waiting`);
      t.step({ line: 4, array: [], lists: [row({ node: i }, { [i]: "active" })], stack: [...frames], vars: { v },
        message: `removeAll(${name(i)}): first clean up the rest of the list, starting at ${name(i + 1)}. Wait for that answer.` });
    }
    t.op();
    t.step({ line: 3, array: [], lists: [row({ node: n })], stack: [...frames, "removeAll(none) = none"], vars: { v },
      message: "removeAll(none): the base case. An empty list has nothing to remove: return none." });
    let ret = n, asked = false;
    for (let i = n - 1; i >= 0; i--) {
      links[i] = ret;
      const drop = values[i] === v;
      const ask = drop && !asked ? (asked = true, { ask: { q: `The rest is clean, and node.next now points to it. This node holds ${v}. What does this call return?`, options: ["node.next: the cleaned rest, skipping this node", "node: this node", "none"], answer: 0 } }) : {};
      if (drop) gone.add(i);
      const before = ret;
      ret = drop ? links[i] : i;
      frames[i] = `removeAll(${short(i)}) → ${short(ret)}`;
      t.step({ ...ask, line: drop ? 6 : 7, array: [], lists: [row({ node: i, returns: ret }, drop ? {} : { [i]: "found" })], stack: frames.slice(0, i + 1), vars: { v },
        message: drop ? `The call below returned ${name(before)}, so node.next ← ${name(before)}. This node holds ${v}, so return node.next: the caller will link straight past it.`
          : `The call below returned ${name(before)}, so node.next ← ${name(before)}. ${values[i]} ≠ ${v}, so keep this node: return it.` });
    }
    const kept = values.map((_, i) => i).filter((i) => !gone.has(i));
    t.step({ line: 7, array: [], lists: [row({ result: ret }, Object.fromEntries(kept.map((i) => [i, "settled" as Tone])))], stack: [], vars: { v }, done: "found",
      message: `The first call returns ${name(ret)}, the head of the cleaned list: ${kept.length ? kept.map((i) => values[i]).join(" → ") + " → none" : "none (every node was removed)"}. No dummy node and no special case for the head: the head is just one more call deciding about its own node.` });
  },
};

export const sumApproaches = { sum };
export const removeApproaches = { remove };
