import { measureGrowth, type Approach, type GraphData, type InputField, type Prepared, type Tone } from "@firstprinciples/ui";

/** Rooms as groups split by "/", each listing the keys inside: "1 3 / 3 0 1 / 2 / 0". */
export type Input = { rooms: string };
export const example: Input = { rooms: "1 2 / 4 / 3 / 1 / / 0" };
export const fields: InputField[] = [{ key: "rooms", label: "keys in each room (rooms split by /)", kind: "raw" }];
export const parseRooms = (s: string) => s.split("/").map((r) => r.trim().split(/[\s,]+/).filter(Boolean).map(Number));
export function prepare(raw: Input): Prepared<Input> {
  const rooms = parseRooms(raw.rooms), n = rooms.length;
  if (n < 1 || n > 7) return { error: "Use 1 to 7 rooms, split by /." };
  if (rooms.flat().some((k) => !Number.isInteger(k) || k < 0 || k >= n)) return { error: `Keys are room numbers from 0 to ${n - 1}.` };
  return { input: { rooms: rooms.map((r) => r.join(" ")).join(" / ") } };
}
const graph = (rooms: number[][], tones: Record<number, Tone>, notes: Record<number, string> = {}): GraphData[] => [{
  nodes: rooms.map((_, i) => ({ id: `r${i}`, label: i })),
  edges: rooms.flatMap((ks, i) => [...new Set(ks)].filter((k) => k !== i).map((k) => ({ a: `r${i}`, b: `r${k}` }))),
  directed: true,
  tones: Object.fromEntries(Object.entries(tones).map(([i, tn]) => [`r${i}`, tn])),
  notes: Object.fromEntries(Object.entries(notes).map(([i, s]) => [`r${i}`, s])),
}];

const passes: Approach<Input> = {
  id: "passes",
  name: "Sweep until no new room opens",
  code: `function canVisitAllRooms(rooms)
    open ← {0}
    repeat
        changed ← false
        for each room r in open
            for each key k in rooms[r]
                if k not in open
                    add k to open
                    changed ← true
    until not changed
    return size of open = length(rooms)
`,
  run({ rooms }, t) {
    const rs = parseRooms(rooms), open = new Set([0]);
    let sweeps = 0, changed = true;
    const tones = () => Object.fromEntries(rs.map((_, i) => [i, (open.has(i) ? "settled" : "discard") as Tone]));
    t.step({ line: 2, array: [], graphs: graph(rs, tones()), vars: { open: 1 }, message: `An arrow from room a to room b means room a holds the key to b. Room 0 is open. Sweep over every open room, collecting keys, and repeat until a sweep opens nothing new.` });
    while (changed) {
      changed = false; sweeps++;
      const fresh: number[] = [];
      for (const r of [...open]) for (const k of rs[r]) { t.op(); if (!open.has(k)) { open.add(k); fresh.push(k); changed = true; } }
      t.step({ line: changed ? 8 : 10, array: [], graphs: graph(rs, { ...tones(), ...Object.fromEntries(fresh.map((k) => [k, "found" as Tone])) }), vars: { sweep: sweeps, open: open.size },
        message: changed ? `Sweep ${sweeps} reads every key in the ${open.size - fresh.length} open room${open.size - fresh.length === 1 ? "" : "s"} again, and opens ${fresh.join(", ")}.` : `Sweep ${sweeps} opens nothing new: stop.` });
    }
    const ok = open.size === rs.length;
    t.step({ line: 11, array: [], graphs: graph(rs, tones()), vars: { open: open.size, rooms: rs.length }, done: ok ? "found" : "notfound",
      message: `${ok ? "Every room is open: return true." : `Only ${open.size} of ${rs.length} rooms open: return false.`} Each sweep rereads every key in every open room, and there can be up to n sweeps: O(n · (n + k)) for n rooms and k keys.` });
  },
};

const dfs: Approach<Input> = {
  id: "dfs",
  name: "Depth-first search from room 0",
  code: `function canVisitAllRooms(rooms)
    seen ← {0}
    stack ← [0]
    while stack not empty
        r ← stack.pop()
        for each key k in rooms[r]
            if k not in seen
                seen.add(k)
                stack.push(k)
    return size of seen = length(rooms)
`,
  run({ rooms }, t) {
    const rs = parseRooms(rooms), seen = new Set([0]), stack = [0];
    let asked = false;
    const tones = (cur?: number) => ({ ...Object.fromEntries(rs.map((_, i) => [i, (seen.has(i) ? "settled" : "discard") as Tone])), ...(cur !== undefined ? { [cur]: "active" as Tone } : {}) });
    t.step({ line: 3, array: [], graphs: graph(rs, tones()), stack: ["0"], stackTitle: "rooms to enter", vars: {}, message: `Rooms are nodes and keys are arrows: the question is whether every room can be reached from room 0. Search from it, entering each room once and pushing every new key's room.` });
    while (stack.length) {
      const r = stack.pop()!;
      const fresh: number[] = [];
      for (const k of rs[r]) { t.op(); if (!seen.has(k)) { seen.add(k); stack.push(k); fresh.push(k); } }
      const opts = [fresh.length ? fresh.join(", ") : "None: they're all seen", rs[r].join(", ")].filter((o, i, a) => a.indexOf(o) === i);
      const q = !asked && opts.length > 1 ? (asked = true, { ask: { q: `Room ${r} holds keys ${rs[r].join(", ")}. Which rooms get pushed?`, options: opts, answer: 0 } }) : {};
      t.step({ ...q, line: 9, array: [], graphs: graph(rs, { ...tones(r), ...Object.fromEntries(fresh.map((k) => [k, "found" as Tone])) }), stack: stack.map(String), stackTitle: "rooms to enter", vars: { room: r, seen: seen.size },
        message: rs[r].length ? `Enter room ${r}: keys ${rs[r].join(", ")}. ${fresh.length ? `New rooms ${fresh.join(", ")} go on the stack.` : "Every one is a room already seen."}` : `Enter room ${r}: it holds no keys.` });
    }
    const ok = seen.size === rs.length;
    t.step({ line: 10, array: [], graphs: graph(rs, tones()), stack: [], vars: { seen: seen.size, rooms: rs.length }, done: ok ? "found" : "notfound",
      message: `${ok ? "Every room was reached: return true." : `${rs.length - seen.size} room${rs.length - seen.size === 1 ? " was" : "s were"} never reached: return false.`} Each room is entered once and each key read once: O(n + k).` });
  },
};

export const approaches = { passes, dfs };

/** A chain where room i holds the key to room i − 1, listed from the end, so each sweep opens one room. */
export const growth = measureGrowth(
  [{ approach: passes, slot: 1 }, { approach: dfs, slot: 3 }],
  (n) => ({ rooms: Array.from({ length: n }, (_, i) => (i === 0 ? String(n - 1) : i > 1 ? String(i - 1) : "")).join(" / ") }),
  [4, 8, 16, 24, 32],
);
