import type { Approach, InputField, Prepared, Tone } from "@firstprinciples/ui";

/** Meetings as a flat list of start, end pairs; each meeting is the half-open time [start, end). */
export type Input = { pairs: number[] };

export const example: Input = { pairs: [0, 8, 1, 4, 3, 5, 4, 6, 6, 8] };

export const fields: InputField[] = [{ key: "pairs", label: "meetings (start, end pairs)", kind: "numbers" }];

export function prepare(raw: Input): Prepared<Input> {
  const p = raw.pairs;
  if (p.length % 2) return { error: "Give an even count of numbers: start, end, start, end…" };
  if (p.length < 4 || p.length > 14) return { error: "Use 2 to 7 meetings so the timeline fits." };
  for (let i = 0; i < p.length; i += 2) {
    const [s, e] = [p[i], p[i + 1]];
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e > 10 || s >= e) return { error: `Each meeting needs whole-number times with 0 ≤ start < end ≤ 10 (got ${s}, ${e}).` };
  }
  return { input: raw };
}

type M = { id: number; s: number; e: number };

const meetings = (p: number[]): M[] => Array.from({ length: p.length / 2 }, (_, i) => ({ id: i, s: p[2 * i], e: p[2 * i + 1] }));
const label = (m: M) => `${m.s}–${m.e}`;
const overlaps = (a: M, b: M) => a.s < b.e && b.s < a.e;

/** The best count, from the earliest-end rule (proved optimal below). */
export function bestCount(p: number[]) {
  let free = -Infinity, n = 0;
  for (const m of [...meetings(p)].sort((a, b) => a.e - b.e || a.s - b.s)) if (m.s >= free) { n++; free = m.e; }
  return n;
}

/** A timeline: one row per meeting (input order), one column per hour. */
function timeline(all: M[]) {
  const end = Math.max(...all.map((m) => m.e));
  const rows = all.map((m) => Array.from({ length: end }, (_, t) => (t >= m.s && t < m.e ? " " : "")));
  return (state: Record<number, Tone>) => {
    const tones: Record<string, Tone> = {};
    all.forEach((m, r) => { const tone = state[m.id]; if (tone) for (let t = m.s; t < m.e; t++) tones[`${r},${t}`] = tone; });
    return { title: "timeline (hours)", rows, tones, rowLabels: all.map(label), colLabels: Array.from({ length: end }, (_, t) => t), dense: true };
  };
}

type Rule = "start" | "short" | "end";

const keyOf: Record<Rule, (m: M) => number> = { start: (m) => m.s, short: (m) => m.e - m.s, end: (m) => m.e };
const ruleWords: Record<Rule, string> = { start: "the earliest start", short: "the shortest length", end: "the earliest end" };

const codes: Record<Rule, string> = {
  start: `function maxMeetings(meetings)
    sort meetings by start time
    count, freeAt ← 0, 0
    for each (start, end) in meetings
        if start ≥ freeAt  // room is free
            count += 1
            freeAt ← end
    return count
`,
  short: `function maxMeetings(meetings)
    sort meetings by length (end - start)
    kept ← empty list
    for each (s, e) in meetings
        ok ← no (a, b) in kept overlaps (s, e)
            // they overlap when s < b and a < e
        if ok  // clashes with nothing kept
            kept.push((s, e))
    return length(kept)
`,
  end: `function maxMeetings(meetings)
    sort meetings by end time
    count, freeAt ← 0, 0
    for each (start, end) in meetings
        if start ≥ freeAt  // room is free
            count += 1
            freeAt ← end
    return count
`,
};

function greedy(rule: Rule, id: string, name: string): Approach<Input> {
  return {
    id, name, code: codes[rule],
    run({ pairs }, t) {
      const all = meetings(pairs);
      const tl = timeline(all);
      const order = [...all].sort((a, b) => keyOf[rule](a) - keyOf[rule](b) || a.s - b.s || a.e - b.e);
      const cells = order.map(label);
      const state: Record<number, Tone> = {};
      const arrTones = (): Record<number, Tone> => Object.fromEntries(order.map((m, k) => [k, state[m.id]]).filter(([, v]) => v)) as Record<number, Tone>;
      const taken: M[] = [];
      let freeAt = 0;
      const line = rule === "short" ? { take: 8, check: 7 } : { take: 6, check: 5 };
      t.step({ line: 2, array: cells, grid: tl(state), vars: { count: 0 },
        message: `Fit as many meetings as possible into one room; they can't overlap, but one may start the moment another ends. Rule: always consider ${ruleWords[rule]} next. Here's that order.` });
      order.forEach((m, k) => {
        t.op();
        const clash = rule === "short" ? taken.find((x) => overlaps(x, m)) : m.s < freeAt ? taken[taken.length - 1] : undefined;
        const why = rule === "short" ? (clash ? `It overlaps ${label(clash)}, already taken.` : "It overlaps nothing taken so far.")
          : clash ? `The room is busy until ${freeAt}, and this one starts at ${m.s}.` : `The room is free from ${freeAt}, and this one starts at ${m.s}.`;
        const q = rule === "short" ? `Next: ${label(m)}. Taken so far: ${taken.length ? taken.map(label).join(", ") : "nothing"}. Take it?` : `Next: ${label(m)}. The room is free from ${freeAt}. Take it?`;
        const ask = { q, options: ["Take it", "Skip it: it overlaps"], answer: clash ? 1 : 0 };
        if (!clash) {
          taken.push(m);
          freeAt = Math.max(freeAt, m.e);
          state[m.id] = "found";
          t.step({ ask, line: line.take, array: cells, pointers: { next: k }, tones: arrTones(), grid: tl(state), vars: { count: taken.length, ...(rule === "short" ? {} : { freeAt: freeAt }) },
            message: `${label(m)}: ${why} Take it.` });
          state[m.id] = "settled";
        } else {
          state[m.id] = "miss";
          t.step({ ask, line: line.check, array: cells, pointers: { next: k }, tones: arrTones(), grid: tl(state), vars: { count: taken.length, ...(rule === "short" ? {} : { freeAt: freeAt }) },
            message: `${label(m)}: ${why} Skip it.` });
          state[m.id] = "discard";
        }
      });
      const best = bestCount(pairs);
      t.step({ line: rule === "short" ? 9 : 8, array: cells, tones: arrTones(), grid: tl(state), vars: { count: taken.length }, done: "found",
        message: taken.length === best
          ? `${taken.length} meeting${taken.length === 1 ? "" : "s"}: ${taken.map(label).join(", ")}.${rule === "end" ? ` That's the most possible. Sorting is O(n log n); the scan is O(n).` : " That happens to be the best possible here, but this rule can fail."}`
          : `Only ${taken.length}: ${taken.map(label).join(", ")}. But ${best} fit (try the earliest-end rule). Picking ${ruleWords[rule]} looked sensible and was wrong.` });
    },
  };
}

export const approaches = {
  start: greedy("start", "start", "Greedy by earliest start (tempting)"),
  shortest: greedy("short", "shortest", "Greedy by shortest (tempting)"),
  end: greedy("end", "end", "Greedy by earliest end (correct)"),
};
