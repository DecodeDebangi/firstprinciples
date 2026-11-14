import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };

export const example: Input = { s: "([{}])" };

export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.s.length === 0) return { error: "Type at least one bracket." };
  if (/[^()[\]{}]/.test(raw.s)) return { error: "Use only the bracket characters ( ) [ ] { }." };
  return { input: raw };
}

const PAIRS = ["()", "[]", "{}"] as const;

const removePairs: Approach<Input> = {
  id: "remove",
  name: "Remove pairs until stuck",
  code: `function isValid(s)
  while true
    t ← s without any "()", "[]" or "{}"
    if t = s
      return s = ""
    s ← t
`,
  run({ s }, t) {
    // Each remaining character keeps its original position, shown under the cell.
    let cur = [...s].map((ch, i) => ({ ch, i }));
    const view = (c: typeof cur) => ({ array: c.map((x) => x.ch), labels: c.map((x) => `i=${x.i}`) });
    let pass = 1;
    t.step({ ...view(cur), line: 2, vars: { pass: null, length: cur.length },
      message: "In a valid string some pair like () always sits side by side. Delete such pairs and repeat. A valid string shrinks to nothing." });
    while (true) {
      const start = cur;
      for (const pair of PAIRS) {
        t.op(Math.max(cur.length, 1)); // replace() reads the whole string
        const hit: number[] = [];
        for (let k = 0; k + 1 < cur.length; ) {
          if (cur[k].ch === pair[0] && cur[k + 1].ch === pair[1]) { hit.push(k, k + 1); k += 2; } else k++;
        }
        if (hit.length === 0) {
          if (cur.length === 0) continue; // nothing to show on an empty string
          t.step({ ...view(cur), line: 3, vars: { pass, length: cur.length },
            message: `Pass ${pass}: scan all ${cur.length} characters for "${pair}"… none side by side.` });
          continue;
        }
        const tones: Record<number, Tone> = Object.fromEntries(hit.map((k) => [k, "found" as const]));
        t.step({ ...view(cur), line: 3, tones, vars: { pass, length: cur.length },
          message: `Pass ${pass}: scan all ${cur.length} characters for "${pair}"… found ${hit.length / 2}. Delete ${hit.length / 2 > 1 ? "them" : "it"}.` });
        const drop = new Set(hit);
        cur = cur.filter((_, k) => !drop.has(k));
      }
      if (cur.length === start.length) {
        const ok = cur.length === 0;
        t.step({ ...view(cur), line: 5, vars: { pass, length: cur.length }, done: ok ? "found" : "notfound",
          tones: ok ? {} : Object.fromEntries(cur.map((_, k) => [k, "miss" as const])),
          message: ok
            ? `Nothing left to delete and the string is empty, so it's valid. That took ${pass} passes over the string.`
            : `A whole pass deleted nothing, but ${cur.length} character${cur.length > 1 ? "s are" : " is"} left. Those can never be matched, so it's invalid.` });
        return;
      }
      t.step({ ...view(cur), line: 6, vars: { pass, length: cur.length },
        message: cur.length === 0
          ? `Pass ${pass} emptied the string. The loop still runs one more pass, finds nothing to delete, and only then stops.`
          : `Pass ${pass} shrank the string from ${start.length} to ${cur.length} characters. Deleting may have brought new pairs together, so scan again.` });
      pass++;
    }
  },
};

const stackApproach: Approach<Input> = {
  id: "stack",
  name: "Stack",
  code: `function isValid(s)
  match ← map {")": "(", "]": "[", "}": "{"}
  stack ← empty stack
  for each ch in s
    if ch in match
      if stack empty or stack.top() ≠ match[ch]
        return false
      stack.pop()
    else
      stack.push(ch)
  return stack is empty
`,
  run({ s }, t) {
    const match: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    const chars = [...s];
    const stack: number[] = []; // indices of unmatched openers
    const matched = new Set<number>();
    const stackTitle = "Stack (top first)";
    const frames = () => stack.map((k) => `${chars[k]}  from i=${k}`);
    const tonesFor = (extra: Record<number, Tone> = {}) => ({
      ...Object.fromEntries([...matched].map((k) => [k, "settled" as const])),
      ...extra,
    });
    t.step({ array: chars, line: 3, stack: [], stackTitle, vars: { ch: null },
      message: "Read left to right. Every opener waits on a stack; every closer must match the most recent opener still waiting." });
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      t.op();
      const top0 = stack.length ? chars[stack[stack.length - 1]] : null;
      const ask = (answer: number) => ({ q: `Next character: "${ch}". Top of the stack: ${top0 ? `"${top0}"` : "empty"}. What happens?`, options: ["Push it onto the stack", "Pop: it closes the opener on top", "Invalid: return false"], answer });
      if (ch in match) {
        const top = stack.length ? chars[stack[stack.length - 1]] : null;
        if (top !== match[ch]) {
          t.step({ ask: ask(2), badge: { at: i, text: top === null ? "nothing to close" : `${top} ${ch} ✗` }, array: chars, line: 7, pointers: { i }, tones: tonesFor({ [i]: "miss", ...(stack.length ? { [stack[stack.length - 1]]: "miss" } : {}) }),
            stack: frames(), stackTitle, vars: { ch, top, needs: match[ch] }, done: "notfound",
            message: top === null
              ? `"${ch}" is a closer, but nothing is waiting on the stack. It has no partner, so the string is invalid.`
              : `"${ch}" needs "${match[ch]}", but the most recent opener is "${top}". They cross over, so the string is invalid.` });
          return;
        }
        const j = stack.pop()!;
        matched.add(i).add(j);
        t.step({ ask: ask(1), badge: { at: i, text: `${top}${ch} ✓ pop` }, array: chars, line: 8, pointers: { i }, tones: tonesFor({ [i]: "found", [j]: "found" }), stack: frames(), stackTitle,
          vars: { ch, top, needs: match[ch] },
          message: `"${ch}" matches the "${top}" on top (from i=${j}). Pop it: that pair is closed.` });
      } else {
        stack.push(i);
        t.step({ ask: ask(0), badge: { at: i, text: "push" }, array: chars, line: 10, pointers: { i }, tones: tonesFor({ [i]: "active" }), stack: frames(), stackTitle,
          vars: { ch, top: ch, needs: null },
          message: `"${ch}" is an opener. Push it and wait for its closer.` });
      }
    }
    const ok = stack.length === 0;
    t.step({ ask: { q: "That was the last character. Is the string valid?", options: ["Valid", "Invalid"], answer: ok ? 0 : 1 }, array: chars, line: 11, tones: tonesFor(Object.fromEntries(stack.map((k) => [k, "miss" as const]))), stack: frames(), stackTitle,
      vars: { ch: null }, done: ok ? "found" : "notfound",
      message: ok
        ? "Reached the end with an empty stack: every opener was closed in the right order. Valid."
        : `Reached the end, but ${stack.length} opener${stack.length > 1 ? "s were" : " was"} never closed. Invalid.` });
  },
};

export const approaches = { remove: removePairs, stack: stackApproach };

/** Worst case for pair-removal: deeply nested, so each pass can delete only the innermost pair. */
const worstCase = (n: number): Input => ({ s: "(".repeat(n / 2) + ")".repeat(n / 2) });

export const growth = measureGrowth(
  [
    { approach: removePairs, slot: 1 },
    { approach: stackApproach, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
