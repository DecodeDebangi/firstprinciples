import type { Approach, ArrayStep, InputField, Prepared, Tone } from "@firstprinciples/ui";

type T = Parameters<Approach<{ nums: number[] }>["run"]>[1];

/* ---------- A timeline of intervals, shared by the interval problems ---------- */
export type Iv = [number, number];
export const parseIntervals = (p: number[]): Iv[] => Array.from({ length: Math.floor(p.length / 2) }, (_, i) => [p[2 * i], p[2 * i + 1]] as Iv);
export function intervalsPrepare(p: number[], max = 6): string | null {
  if (p.length % 2) return "Give an even count of numbers: start, end, start, end…";
  if (p.length < 2 || p.length > max * 2) return `Use 1 to ${max} intervals so the timeline fits.`;
  for (let i = 0; i < p.length; i += 2) if (!Number.isInteger(p[i]) || !Number.isInteger(p[i + 1]) || p[i] < 0 || p[i + 1] > 10 || p[i] > p[i + 1]) return `Each interval needs 0 ≤ start ≤ end ≤ 10 (got ${p[i]}, ${p[i + 1]}).`;
  return null;
}
/** One row per interval, one column per point 0 … 10; an interval [s, e] fills columns s to e. */
export function timeline(rows: { iv: Iv; label?: string; tone?: Tone }[], title = "timeline"): ArrayStep["grid"] {
  const end = Math.max(10, ...rows.map((r) => r.iv[1]));
  const tones: Record<string, Tone> = {};
  rows.forEach((r, k) => { if (r.tone) for (let x = r.iv[0]; x <= r.iv[1]; x++) tones[`${k},${x}`] = r.tone; });
  return {
    title, dense: true, tones,
    // A filled cell (a space with a border) for each point the interval covers; empty strings are invisible.
    rows: rows.length ? rows.map((r) => Array.from({ length: end + 1 }, (_, x) => (x >= r.iv[0] && x <= r.iv[1] ? " " : ""))) : [[""]],
    rowLabels: rows.length ? rows.map((r) => r.label ?? `${r.iv[0]}–${r.iv[1]}`) : [""],
    colLabels: Array.from({ length: end + 1 }, (_, x) => x),
  };
}

/* ---------- The farthest reach (Jump Game) ---------- */
export type JumpInput = { nums: number[] };
export const jumpExample: JumpInput = { nums: [2, 3, 0, 1, 0, 2, 1] };
export const jumpFields: InputField[] = [{ key: "nums", label: "jump lengths", kind: "numbers" }];
export function jumpPrepare(raw: JumpInput): Prepared<JumpInput> {
  if (!raw.nums.length || raw.nums.length > 9) return { error: "Give 1 to 9 values." };
  if (raw.nums.some((v) => v < 0 || v > 9)) return { error: "Each jump length is from 0 to 9." };
  return { input: raw };
}

/** Walks once, keeping the farthest position reachable so far. Shared with LC 55. */
export function reachSteps(nums: number[], t: T, lines: { stuck: number; extend: number; done: number }) {
  const n = nums.length;
  let far = 0, asked = false;
  const tones = (i: number, extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries(nums.map((_, k) => [k, (k <= far ? (k < i ? "visited" : "settled") : "discard") as Tone])), ...extra });
  t.step({ line: 2, array: nums, pointers: { far: 0 }, vars: { far },
    message: `Each value is how far you may jump from there (any distance up to it). Instead of trying every route, keep one number: the farthest position you can reach so far. Walk forward while you're within it.` });
  for (let i = 0; i < n; i++) {
    t.op();
    if (i > far) {
      t.step({ line: lines.stuck, array: nums, pointers: { i, far }, tones: tones(i, { [i]: "miss" }), vars: { i, far }, done: "notfound",
        message: `Position ${i} is beyond the farthest reachable position, ${far}. Nothing can get here, so the end can't be reached. Return false.` });
      return false;
    }
    const before = far;
    far = Math.max(far, i + nums[i]);
    const opts = [String(far), String(before), String(i + 1)].filter((o, k, a) => a.indexOf(o) === k);
    const q = !asked && i > 0 && opts.length > 1 ? (asked = true, { ask: { q: `At position ${i} (jump up to ${nums[i]}), the farthest reach is ${before}. What is it now?`, options: opts, answer: 0 } }) : {};
    if (far >= n - 1) {
      t.step({ ...q, line: lines.done, array: nums, pointers: { i, far: n - 1 }, tones: tones(i, { [n - 1]: "found", [i]: "active" }), vars: { i, far }, done: "found",
        message: `From ${i}, a jump of up to ${nums[i]} reaches ${i + nums[i]}, which covers the last position, ${n - 1}. Return true. One pass: O(n), O(1) space.` });
      return true;
    }
    t.step({ ...q, line: lines.extend, array: nums, pointers: { i, far }, tones: tones(i, { [i]: "active" }), vars: { i, far },
      message: far > before ? `From ${i}, up to ${i + nums[i]} is reachable: the farthest reach grows to ${far}.` : `From ${i}, up to ${i + nums[i]}: no better than ${before}.` });
  }
  return false;
}
export const reachCode = `function canJump(nums)
    far ← 0  // the farthest reachable position
    for i ← 0 to length(nums) - 1
        if i > far
            return false  // stuck before i
        far ← max(far, i + nums[i])
        if far ≥ length(nums) - 1
            return true
`;

/* ---------- A running balance (Gas Station) ---------- */
export type GasInput = { gas: number[]; cost: number[] };
export const gasExample: GasInput = { gas: [2, 5, 1, 4, 3], cost: [3, 2, 4, 1, 4] };
export const gasFields: InputField[] = [
  { key: "gas", label: "gas at each station", kind: "numbers" },
  { key: "cost", label: "cost to the next", kind: "numbers" },
];
export function gasPrepare(raw: GasInput): Prepared<GasInput> {
  if (!raw.gas.length || raw.gas.length > 8 || raw.gas.length !== raw.cost.length) return { error: "Give 1 to 8 stations, with as many costs as gas values." };
  if ([...raw.gas, ...raw.cost].some((v) => v < 0 || v > 9)) return { error: "Use values from 0 to 9." };
  return { input: raw };
}

/** One pass: restart after any station where the tank would go negative. Shared with LC 134. */
export function tankSteps({ gas, cost }: GasInput, t: T, lines: { add: number; restart: number; done: number }) {
  const n = gas.length, net = gas.map((g, i) => g - cost[i]);
  let tank = 0, total = 0, start = 0, asked = false;
  t.step({ line: 2, array: net, labels: net.map((_, i) => `st ${i}`), vars: { start, tank, total },
    message: `The row shows gas − cost at each station: what the tank gains (or loses) by filling up there and driving to the next. Drive from a start, adding these up; if the tank ever goes below 0, no station in that stretch can be the start.` });
  for (let i = 0; i < n; i++) {
    t.op();
    tank += net[i]; total += net[i];
    if (tank < 0) {
      const q = !asked ? (asked = true, { ask: { q: `Starting at ${start}, the tank drops to ${tank} after station ${i}. Could any station from ${start} to ${i} be the start?`, options: ["No: try starting at the next station", "Yes: try the next one in that stretch", "Only station 0"], answer: 0 } }) : {};
      t.step({ ...q, line: lines.restart, array: net, labels: net.map((_, k) => `st ${k}`), range: [start, i], tones: { ...Object.fromEntries(Array.from({ length: i - start + 1 }, (_, k) => [start + k, "miss" as Tone])) }, vars: { start, tank, total },
        message: `The tank goes below 0 after station ${i}. Every station from ${start} to ${i} would arrive here with even less gas (they'd skip the surplus gathered before them), so none can be the start. Try starting at ${i + 1}, with an empty tank.` });
      start = i + 1; tank = 0;
      continue;
    }
    t.step({ line: lines.add, array: net, labels: net.map((_, k) => `st ${k}`), range: [start, i], tones: { [i]: "active" }, vars: { start, tank, total },
      message: `Station ${i}: ${net[i] >= 0 ? "+" : ""}${net[i]}, the tank holds ${tank}.` });
  }
  const ok = total >= 0 && start < n;
  t.step({ line: lines.done, array: net, labels: net.map((_, k) => `st ${k}`), ...(ok ? { tones: { [start]: "found" }, pointers: { start } } : {}), vars: { start: ok ? start : -1, total }, done: ok ? "found" : "notfound",
    message: ok ? `All the gas adds up to ${total} more than all the costs (≥ 0), so a full lap is possible, and the last restart, station ${start}, never ran dry afterwards. Return ${start}. One pass: O(n).` : `Overall, gas minus cost is ${total} < 0: no start can complete the lap. Return -1.` });
  return ok ? start : -1;
}
export const tankCode = `function canCompleteCircuit(gas, cost)
    tank, total, start ← 0, 0, 0
    for i ← 0 to length(gas) - 1
        tank += gas[i] - cost[i]
        total += gas[i] - cost[i]
        if tank < 0  // can't reach i + 1 from start
            start, tank ← i + 1, 0
    return total ≥ 0 ? start : -1
`;

const reach: Approach<JumpInput> = { id: "reach", name: "Keep the farthest reach", code: reachCode, run({ nums }, t) { reachSteps(nums, t, { stuck: 5, extend: 6, done: 8 }); } };
const tank: Approach<GasInput> = { id: "tank", name: "Restart when the tank runs dry", code: tankCode, run(input, t) { tankSteps(input, t, { add: 5, restart: 7, done: 8 }); } };
export const reachApproaches = { reach };
export const tankApproaches = { tank };
