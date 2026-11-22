import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { num: string; k: number };
export const example: Input = { num: "4825173", k: 3 };
export const fields: InputField[] = [
  { key: "num", label: "num (digits)", kind: "raw" },
  { key: "k", label: "k (digits to remove)", kind: "number" },
];
export function prepare(raw: Input): Prepared<Input> {
  const num = String(raw.num).trim();
  if (!/^\d{1,10}$/.test(num)) return { error: "Use 1 to 10 digits, nothing else." };
  if (num.length > 1 && num[0] === "0") return { error: "The number can't start with 0 (unless it's just 0)." };
  if (!Number.isInteger(raw.k) || raw.k < 0 || raw.k > num.length) return { error: `k must be from 0 to ${num.length}.` };
  return { input: { num, k: raw.k } };
}
const finish = (ds: string[]) => ds.join("").replace(/^0+/, "") || "0";

const rounds: Approach<Input> = {
  id: "rounds",
  name: "Remove one digit per round, k times",
  code: `function removeKdigits(num, k)
    repeat k times
        i ← first position where
                num[i] > num[i + 1]
        if there is none
            i ← length(num) - 1
        remove num[i]  // shifts the rest left
    strip leading zeros from num
    return num, or "0" if it's empty
`,
  run({ num, k }, t) {
    const ds = num.split("");
    t.step({ line: 2, array: [...ds], vars: { k },
      message: `To make the number as small as possible, its first digits matter most. Each round, remove the first digit that's bigger than the digit after it: that makes an early digit smaller. If the digits never drop, remove the last one.` });
    for (let r = 1; r <= k; r++) {
      let i = 0;
      while (i < ds.length - 1) { t.op(); if (ds[i] > ds[i + 1]) break; i++; }
      const drop = i < ds.length - 1;
      t.op(ds.length - i);
      t.step({ line: drop ? 7 : 6, array: [...ds], pointers: { i }, tones: { [i]: "miss", ...(drop ? { [i + 1]: "compare" } : {}) }, badge: drop ? { at: i, text: `${ds[i]} > ${ds[i + 1]}` } : undefined, vars: { round: r, "scanned": i + 1 },
        message: drop ? `Round ${r}: scanning from the left, ${ds[i]} at position ${i} is the first digit bigger than the next (${ds[i + 1]}). Remove it.` : `Round ${r}: the digits never drop, so remove the last one, ${ds[i]}.` });
      ds.splice(i, 1);
    }
    const res = finish(ds);
    t.step({ line: 9, array: ds.length ? [...ds] : [], vars: { answer: res }, done: "found",
      message: `${ds.join("") !== res ? `Strip the leading zeros: the smallest is ` : "The smallest is "}${res}. But every round rescans from the start and shifts the rest: O(n · k).` });
  },
};

const stack: Approach<Input> = {
  id: "stack",
  name: "Monotonic stack of kept digits",
  code: `function removeKdigits(num, k)
    stack ← empty stack  // digits rise upward
    for each digit d in num
        while k > 0 and stack not empty and
                stack.top() > d
            stack.pop()
            k -= 1
        stack.push(d)
    remove k more digits from the top
    result ← stack's digits, bottom to top
    strip leading zeros from result
    return result, or "0" if it's empty
`,
  run({ num, k: k0 }, t) {
    const ds = num.split(""), st: { d: string; i: number }[] = [];
    let k = k0, asked = 0;
    const gone = new Set<number>();
    const tones = (): Record<number, Tone> => ({ ...Object.fromEntries([...gone].map((i) => [i, "discard" as Tone])), ...Object.fromEntries(st.map(({ i }) => [i, "settled" as Tone])) });
    const kept = () => st.map(({ d }) => d);
    t.step({ line: 2, array: ds, stack: [], stackTitle: "kept digits (top first)", vars: { k },
      message: `Read the digits left to right, keeping them on a stack. A smaller digit arriving should replace bigger digits just before it, because an earlier digit counts more. So while removals are left and the top is bigger, pop it.` });
    ds.forEach((d, i) => {
      const top0 = st.length ? st[st.length - 1].d : null, k1 = k;
      const popped: string[] = [];
      while (k > 0 && st.length && st[st.length - 1].d > d) { t.op(); const p = st.pop()!; gone.add(p.i); popped.push(p.d); k--; }
      if (k > 0 && st.length) t.op();
      const q = asked < 2 && top0 !== null && k1 > 0 ? (asked++, { ask: { q: `${d} arrives with ${k1} removal${k1 === 1 ? "" : "s"} left; the kept digit on top is ${top0}. What happens?`, options: [`Pop ${top0}: it's bigger, and ${d} in its place makes the number smaller`, `Keep ${top0} and push ${d}`], answer: top0 > d ? 0 : 1 } }) : {};
      st.push({ d, i });
      t.step({ ...q, line: popped.length ? 7 : 8, array: ds, pointers: { i }, tones: { ...tones(), [i]: "active" }, stack: [...kept()].reverse(), stackTitle: "kept digits (top first)", vars: { d, "k left": k, kept: kept().join("") },
        message: popped.length ? `${d} is smaller than ${popped.join(" and ")}: remove ${popped.length === 1 ? "it" : "them"} (${k} left), then push ${d}.` : top0 === null ? `Nothing kept yet: push ${d}.` : k === 0 ? `No removals left: just push ${d}.` : `${top0} on top isn't bigger than ${d}: push ${d}.` });
    });
    if (k > 0) {
      const cut = st.splice(st.length - k, k);
      cut.forEach(({ i }) => gone.add(i));
      t.step({ line: 9, array: ds, tones: tones(), stack: [...kept()].reverse(), stackTitle: "kept digits (top first)", vars: { removed: cut.map(({ d }) => d).join(""), kept: kept().join("") },
        message: `${k} removal${k === 1 ? " is" : "s are"} left. The kept digits never drop, so the biggest are at the end: remove the last ${k}.` });
      k = 0;
    }
    const res = finish(kept());
    t.step({ line: 12, array: ds, tones: tones(), stack: [...kept()].reverse(), stackTitle: "kept digits (top first)", vars: { answer: res }, done: "found",
      message: `${kept().join("") !== res ? `Strip the leading zeros: ` : `Read the kept digits bottom to top: `}${res}. Each digit is pushed once and popped at most once: O(n), whatever k is.` });
  },
};

export const approaches = { rounds, stack };

/** Rising digits with k = n / 2: no digit ever drops, so every round scans to the end. */
export const growth = measureGrowth(
  [{ approach: rounds, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => ({ num: Array.from({ length: n }, (_, i) => String(1 + Math.floor((9 * i) / n))).join(""), k: n / 2 }),
  [8, 16, 32, 64, 128],
);
