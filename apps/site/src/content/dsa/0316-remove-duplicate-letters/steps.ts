import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };
export const example: Input = { s: "bdcadbc" };
export const fields: InputField[] = [{ key: "s", label: "s (lowercase letters)", kind: "raw" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = String(raw.s).trim();
  if (!/^[a-z]{1,10}$/.test(s)) return { error: "Use 1 to 10 lowercase letters." };
  return { input: { s } };
}

const pick: Approach<Input> = {
  id: "pick",
  name: "Pick the smallest safe letter, one at a time",
  code: `function removeDuplicateLetters(s)
    result ← ""
    while s not empty
        for each letter c in s, smallest first
            i ← first position of c in s
            if s[i..end] holds every letter of s
                break  // c is safe to take now
        result ← result + c
        s ← s[i + 1..end] with every c removed
    return result
`,
  run({ s: s0 }, t) {
    let s = s0, res = "";
    t.step({ line: 2, array: s0.split(""), vars: { result: "—" },
      message: `Keep exactly one copy of each letter, in order, so the result reads as early in the alphabet as possible. Build it one letter at a time: take the smallest letter whose first copy still has every other needed letter after it.` });
    while (s.length) {
      const letters = [...new Set(s)].sort();
      let c = "", i = 0;
      const tried: string[] = [];
      for (const x of letters) {
        const at = s.indexOf(x), need = new Set(s);
        const rest = new Set(s.slice(at));
        t.op(s.length - at);
        tried.push(x);
        if ([...need].every((y) => rest.has(y))) { c = x; i = at; break; }
      }
      res += c;
      const skipped = tried.slice(0, -1);
      t.step({ line: 8, array: s.split(""), pointers: { i }, tones: { ...Object.fromEntries(Array.from({ length: i }, (_, k) => [k, "discard" as Tone])), [i]: "found" }, vars: { took: c, result: res },
        message: `${skipped.length ? `${skipped.length > 1 ? `${skipped.slice(0, -1).join(", ")} and ${skipped.at(-1)}` : skipped[0]} ${skipped.length === 1 ? "is" : "are"} smaller, but taking ${skipped.length === 1 ? "it" : "any of them"} first would skip past the last copy of another letter. ` : ""}Take ${c}: from its first copy, every remaining letter still appears. Drop everything before it, and every other ${c}.` });
      s = s.slice(i + 1).split(c).join("");
    }
    t.step({ line: 10, array: s0.split(""), vars: { result: res }, done: "found",
      message: `The result is "${res}". Each pick tries up to k letters (k different letters), checking the rest of the string each time, and there are k picks: O(k² · n).` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack, popping only letters that come again",
  code: `function removeDuplicateLetters(s)
    last ← empty map  // c → its last position
    for each index i, letter c in s
        last[c] ← i
    stack ← empty stack
    inStack ← empty set
    for each index i, letter c in s
        if c in inStack
            continue
        while stack not empty and stack.top() > c
                and last[stack.top()] > i
            inStack.remove(stack.pop())
        stack.push(c)
        inStack.add(c)
    return stack's letters, bottom to top
`,
  run({ s }, t) {
    const ch = s.split(""), last: Record<string, number> = {};
    ch.forEach((c, i) => { t.op(); last[c] = i; });
    const st: { c: string; i: number }[] = [], dropped = new Set<number>();
    const tones = (): Record<number, Tone> => ({ ...Object.fromEntries([...dropped].map((i) => [i, "discard" as Tone])), ...Object.fromEntries(st.map(({ i }) => [i, "settled" as Tone])) });
    const frames = () => [...st].reverse().map(({ c, i }) => `${c} (last at ${last[c]})`);
    const word = () => st.map(({ c }) => c).join("");
    let asked = 0;
    t.step({ line: 5, array: ch, stack: [], stackTitle: "kept letters (top first)", vars: { last: Object.entries(last).sort().map(([c, i]) => `${c}:${i}`).join(" ") },
      message: `First note where each letter appears for the last time. Then read left to right, keeping letters on a stack. A smaller letter may pop a bigger one before it, but only if the bigger letter comes again later; otherwise it would be lost for good.` });
    ch.forEach((c, i) => {
      t.op();
      if (st.some((x) => x.c === c)) {
        dropped.add(i);
        t.step({ line: 9, array: ch, pointers: { i }, tones: { ...tones(), [i]: "miss" }, stack: frames(), stackTitle: "kept letters (top first)", vars: { i, c, kept: word() },
          message: `${c} is already kept, in a place that's at least as good: skip this copy.` });
        return;
      }
      const top0 = st.length ? st[st.length - 1] : null;
      const popped: string[] = [];
      while (st.length && st[st.length - 1].c > c && last[st[st.length - 1].c] > i) { t.op(); const p = st.pop()!; dropped.add(p.i); popped.push(p.c); }
      if (st.length) t.op();
      const top1 = st.length ? st[st.length - 1] : null;
      const blocked = top1 && top1.c > c ? top1 : null;
      const q = asked < 2 && top0 && top0.c > c ? (asked++, { ask: { q: `${c} arrives at position ${i}; ${top0.c} is on top, and its last copy is at position ${last[top0.c]}. Can ${c} pop it?`, options: [`Yes: ${top0.c} comes again later`, `No: this is ${top0.c}'s last chance`], answer: last[top0.c] > i ? 0 : 1 } }) : {};
      st.push({ c, i });
      t.step({ ...q, line: popped.length ? 12 : 13, array: ch, pointers: { i }, tones: { ...tones(), [i]: "active" }, stack: frames(), stackTitle: "kept letters (top first)", vars: { i, c, kept: word() },
        message: `${popped.length ? `${c} is smaller than ${popped.join(" and ")}, and ${popped.length === 1 ? "it comes" : "they come"} again later: pop ${popped.length === 1 ? "it" : "them"}. ` : ""}${blocked ? `${blocked.c} is bigger, but position ${last[blocked.c]} was its last copy, so it must stay. ` : !popped.length ? (top1 ? `${top1.c} on top is smaller, so it stays. ` : "Nothing is kept yet. ") : ""}Push ${c}.` });
    });
    t.step({ line: 15, array: ch, tones: tones(), stack: frames(), stackTitle: "kept letters (top first)", vars: { result: word() }, done: "found",
      message: `Read the stack bottom to top: "${word()}". Each letter is pushed and popped at most once: O(n), with O(k) space for k different letters.` });
  },
};

export const approaches = { pick, stack };

/** Distinct letters repeated twice, falling: every pick must try many letters. */
export const growth = measureGrowth(
  [{ approach: pick, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => { const k = Math.min(26, n / 2), part = Array.from({ length: k }, (_, i) => String.fromCharCode(97 + k - 1 - i)).join(""); return { s: (part + part).slice(0, n) }; },
  [8, 16, 24, 32, 40, 52],
);
