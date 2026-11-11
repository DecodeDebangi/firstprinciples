import { measureGrowth, type Approach, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

export type Input = { s: string };

export const example: Input = { s: "Top spot!" };

export const fields: InputField[] = [{ key: "s", label: "s", kind: "text" }];

export function prepare(raw: Input): Prepared<Input> {
  if (raw.s.length === 0) return { error: "Type at least one character." };
  return { input: raw };
}

const isAlnum = (c: string) => /[a-z0-9]/i.test(c);
const show = (c: string) => (c === " " ? "␣" : c);

const cleanReverse: Approach<Input> = {
  id: "reverse",
  name: "Clean, reverse, compare",
  code: `def is_palindrome(s):
    clean = [c.lower() for c in s if c.isalnum()]
    rev = clean[::-1]
    for a, b in zip(clean, rev):
        if a != b:
            return False
    return True
`,
  run({ s }, t) {
    const raw = [...s];
    t.step({ line: 2, array: raw.map(show), tones: Object.fromEntries(raw.map((c, k) => [k, isAlnum(c) ? undefined : "discard"]).filter(([, v]) => v)) as Record<number, Tone>,
      vars: { length: s.length }, message: "Only letters and digits count, and case doesn't matter. Spaces and punctuation are dropped." });
    t.op(raw.length);
    const clean = raw.filter(isAlnum).map((c) => c.toLowerCase());
    if (clean.length === 0) {
      t.step({ line: 7, array: [], vars: { length: 0 }, done: "found", message: "Nothing left after cleaning. An empty string reads the same both ways." });
      return;
    }
    t.op(clean.length); // building the reversed copy reads every character again
    t.step({ line: 3, array: clean, vars: { length: clean.length },
      message: `Cleaned: "${clean.join("")}". Now make a reversed copy, "${[...clean].reverse().join("")}", and compare the two letter by letter.` });
    const n = clean.length;
    for (let i = 0; i < n; i++) {
      const j = n - 1 - i; // rev[i] is clean[n - 1 - i]
      t.op();
      const [a, b] = [clean[i], clean[j]];
      if (a !== b) {
        t.step({ line: 6, array: clean, pointers: { i, "rev[i]": j }, tones: { [i]: "miss", [j]: "miss" }, badge: { at: i, text: `${a} ≠ ${b}` },
          vars: { i, a, b }, done: "notfound", message: `clean[${i}] = "${a}" but rev[${i}] = "${b}". Not a palindrome.` });
        return;
      }
      t.step({ line: 5, array: clean, pointers: { i, "rev[i]": j }, tones: { [i]: "compare", [j]: "compare" }, badge: { at: i, text: `${a} = ${b}` },
        vars: { i, a, b },
        message: i >= j ? `clean[${i}] = rev[${i}] = "${a}". This pair was already checked from the other side; the copy makes us check it twice.`
          : `clean[${i}] = rev[${i}] = "${a}". Keep going.` });
    }
    t.step({ line: 7, array: clean, tones: Object.fromEntries(clean.map((_, k) => [k, "settled" as const])), vars: { length: n }, done: "found",
      message: `All ${n} positions match. It's a palindrome, but we built two extra copies and compared every pair twice.` });
  },
};

const twoPointers: Approach<Input> = {
  id: "pointers",
  name: "Two pointers, in place",
  code: `def is_palindrome(s):
    i, j = 0, len(s) - 1
    while i < j:
        if not s[i].isalnum():
            i += 1
        elif not s[j].isalnum():
            j -= 1
        elif s[i].lower() != s[j].lower():
            return False
        else:
            i += 1
            j -= 1
    return True
`,
  run({ s }, t) {
    const arr = [...s].map(show);
    const raw = [...s];
    let i = 0, j = raw.length - 1;
    const tones: Record<number, Tone> = {};
    const opts = ["Skip i: it isn't a letter or digit", "Skip j: it isn't a letter or digit", "They match: move both inward", "Mismatch: return False"];
    t.step({ line: 2, array: arr, pointers: { i, j }, range: [i, j], vars: { i, j },
      message: "Read from both ends at once, skipping anything that isn't a letter or digit. No copies needed." });
    while (i < j) {
      t.op();
      const [a, b] = [raw[i], raw[j]];
      const ask = (answer: number) => ({ q: `s[i] = "${show(a)}", s[j] = "${show(b)}". What happens?`, options: opts, answer });
      const base = { array: arr, range: [i, j] as [number, number], vars: { i, j } };
      if (!isAlnum(a)) {
        tones[i] = "discard";
        t.step({ ...base, ask: ask(0), line: 5, pointers: { i, j }, tones: { ...tones }, message: `"${show(a)}" doesn't count. Move i right.` });
        i++;
      } else if (!isAlnum(b)) {
        tones[j] = "discard";
        t.step({ ...base, ask: ask(1), line: 7, pointers: { i, j }, tones: { ...tones }, message: `"${show(b)}" doesn't count. Move j left.` });
        j--;
      } else if (a.toLowerCase() !== b.toLowerCase()) {
        t.step({ ...base, ask: ask(3), line: 9, pointers: { i, j }, tones: { ...tones, [i]: "miss", [j]: "miss" }, badge: { at: i, text: `${a.toLowerCase()} ≠ ${b.toLowerCase()}` },
          done: "notfound", message: `"${a}" and "${b}" differ. Not a palindrome.` });
        return;
      } else {
        t.step({ ...base, ask: ask(2), line: 11, pointers: { i, j }, tones: { ...tones, [i]: "found", [j]: "found" }, badge: { at: i, text: `${a.toLowerCase()} = ${b.toLowerCase()}` },
          message: `"${a}" and "${b}" match (ignoring case). Move both inward.` });
        tones[i] = "settled"; tones[j] = "settled";
        i++; j--;
      }
    }
    t.step({ line: 13, array: arr, tones: { ...tones }, vars: { i, j }, done: "found",
      message: "The pointers met in the middle with every pair matching. It's a palindrome, checked once, with no extra memory." });
  },
};

export const approaches = { reverse: cleanReverse, pointers: twoPointers };

/** Worst case for both: a palindrome, so nothing stops early. */
const worstCase = (n: number): Input => ({ s: "a".repeat(n) });

export const growth = measureGrowth(
  [
    { approach: cleanReverse, slot: 1 },
    { approach: twoPointers, slot: 2 },
  ],
  worstCase,
  [8, 16, 32, 48, 64, 96, 128],
);
