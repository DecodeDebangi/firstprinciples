import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };
export const example: Input = { s: "cbbcadda" };
export const fields: InputField[] = [{ key: "s", label: "s (a to z)", kind: "text" }];
export function prepare(raw: Input): Prepared<Input> {
  const s = raw.s.toLowerCase();
  if (!/^[a-z]+$/.test(s)) return { error: "Use the letters a to z." };
  if (s.length > 9) return { error: "Use at most 9 letters so they fit." };
  return { input: { s } };
}

const rescan: Approach<Input> = {
  id: "rescan",
  name: "Find a pair, delete it, start again",
  code: `function removeDuplicates(s)
    repeat
        i ← first position with s[i] = s[i + 1]
        if there is none
            return s
        delete s[i] and s[i + 1]
`,
  run({ s }, t) {
    let a = [...s];
    t.step({ line: 2, array: [...a], vars: { length: a.length },
      message: `Look for two equal letters side by side, delete them, and start looking again from the beginning: deleting a pair can make two new letters meet.` });
    let asked = false;
    for (;;) {
      let i = -1;
      for (let k = 0; k + 1 < a.length; k++) { t.op(); if (a[k] === a[k + 1]) { i = k; break; } }
      if (i < 0) {
        t.step({ line: 5, array: [...a], tones: Object.fromEntries(a.map((_, k) => [k, "settled" as Tone])), vars: { result: `"${a.join("")}"` }, done: "found",
          message: `No neighbouring pair is left: "${a.join("")}". Each deletion meant another scan from the start, up to n / 2 deletions of O(n) each: O(n²).` });
        return;
      }
      const ask = !asked && i > 0 ? (asked = true, { ask: { q: `"${a[i]}${a[i + 1]}" at ${i} and ${i + 1} is deleted. Which letters become neighbours?`, options: [`'${a[i - 1]}' and '${a[i + 2] ?? "nothing"}'`, `'${a[i]}' and '${a[i + 1]}'`, "None: the string ends there"].filter((o, k, arr) => arr.indexOf(o) === k), answer: 0 } }) : {};
      t.step({ ...ask, line: 6, array: [...a], tones: { [i]: "miss", [i + 1]: "miss" }, vars: { i },
        message: `'${a[i]}' and '${a[i + 1]}' at ${i} and ${i + 1} are equal: delete both.${i > 0 && i + 2 < a.length ? ` Now '${a[i - 1]}' and '${a[i + 2]}' are neighbours.` : ""}` });
      t.op(a.length - i);
      a = [...a.slice(0, i), ...a.slice(i + 2)];
    }
  },
};

const withStack: Approach<Input> = {
  id: "stack",
  name: "Build the answer on a stack",
  code: `function removeDuplicates(s)
    stack ← empty stack
    for each ch in s
        if stack not empty and stack.top() = ch
            stack.pop()  // the pair cancels
        else
            stack.push(ch)
    return join(stack)
`,
  run({ s }, t) {
    const a = [...s], st: string[] = [];
    t.step({ line: 2, array: a, stack: [], stackTitle: "kept so far", vars: {},
      message: `Keep the letters that survive so far on a stack. A new letter either cancels the one on top (if they're equal) or is kept. Cancelling exposes the letter below, ready to meet the next one.` });
    let asked = false;
    a.forEach((ch, i) => {
      t.op();
      const cancel = st.length > 0 && st[st.length - 1] === ch;
      const ask = !asked && st.length > 0 ? (asked = true, { ask: { q: `The top of the stack is '${st[st.length - 1]}' and the next letter is '${ch}'. What happens?`, options: ["They cancel: pop", `Push '${ch}'`], answer: cancel ? 0 : 1 } }) : {};
      if (cancel) st.pop(); else st.push(ch);
      t.step({ ...ask, line: cancel ? 5 : 7, array: a, pointers: { ch: i }, tones: { [i]: cancel ? "miss" : "active" }, stack: [...st], stackTitle: "kept so far", vars: { ch },
        message: cancel ? `'${ch}' matches the top: they cancel. Pop.${st.length ? ` '${st[st.length - 1]}' is on top again, and could cancel with the next letter.` : ""}` : `'${ch}' doesn't match ${st.length > 1 ? `the top '${st[st.length - 2]}'` : "anything"}: push it.` });
    });
    t.step({ line: 8, array: a, stack: [...st], stackTitle: "kept so far", vars: { result: `"${st.join("")}"` }, done: "found",
      message: `The stack, bottom to top, is the answer: "${st.join("")}". One push or pop per letter: O(n) time and O(n) space.` });
  },
};

export const approaches = { rescan, stack: withStack };

/** A string that collapses from the middle outwards: "abc…cba". */
export const growth = measureGrowth(
  [{ approach: rescan, slot: 1 }, { approach: withStack, slot: 3 }],
  (n) => { const half = Array.from({ length: n / 2 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(""); return { s: half + [...half].reverse().join("") }; },
  [4, 8, 16, 24, 32],
);
