import type { ArrayStep, Tone, TreeData, TreeNodeData } from "./trace";

/** What happened at one call of a recursion, recorded during a first, silent run. */
export interface CallEvent {
  id: string;
  /** "call": the recursion reaches this node. "solution": it's recorded as an answer. "prune": rejected early. */
  kind: "call" | "solution" | "prune";
  line: number;
  message: string;
  vars?: ArrayStep["vars"];
  ask?: ArrayStep["ask"];
  grid?: ArrayStep["grid"];
  /** A short label left under the node from now on (e.g. the path so far, or ✗). */
  note?: string;
}

type StepSink = { step(s: Omit<ArrayStep, "ops">): void; op(): void };

/**
 * A recursion's call tree (any number of children per call). Record the whole tree and its events first, then
 * `replay` draws it faded from the start and lights each call in turn. Each call counts as one operation.
 */
export class CallTree {
  nodes: TreeNodeData[] = [];
  root: string | null = null;
  events: CallEvent[] = [];
  private parent = new Map<string, string | null>();
  private byId = new Map<string, TreeNodeData>();
  private k = 0;

  add(parent: string | null, val: number | string): string {
    const id = `c${this.k++}`;
    const node: TreeNodeData = { id, val, left: null, right: null, kids: [] };
    this.nodes.push(node);
    this.byId.set(id, node);
    this.parent.set(id, parent);
    if (parent) this.byId.get(parent)!.kids!.push(id);
    else this.root = id;
    return id;
  }

  log(e: CallEvent) { this.events.push(e); }

  private path(id: string) {
    const out: string[] = [];
    for (let p: string | null = id; p; p = this.parent.get(p) ?? null) out.unshift(p);
    return out;
  }

  /** Steps for every event, framed by an intro and a final step. `stackLabel` names a call for the call-stack panel. */
  replay(t: StepSink, opts: {
    intro: Omit<ArrayStep, "ops" | "array" | "trees">;
    finish: (grid: ArrayStep["grid"]) => Omit<ArrayStep, "ops" | "array" | "trees">;
    stackLabel: (id: string) => string;
  }) {
    const tones: Record<string, Tone> = Object.fromEntries(this.nodes.map((n) => [n.id, "discard" as Tone]));
    const notes: Record<string, string> = {};
    const solved = new Set<string>();
    const view = (extra: Record<string, Tone> = {}): TreeData[] => [{ root: this.root, nodes: this.nodes, tones: { ...tones, ...extra }, notes: { ...notes }, layout: "compact" }];
    t.step({ ...opts.intro, array: [], trees: view() });
    let lastGrid: ArrayStep["grid"] = opts.intro.grid;
    let onPath: string[] = [];
    for (const e of this.events) {
      const path = this.path(e.id);
      // Calls that have returned since the last event rest as visited (or settled if they were answers).
      for (const id of onPath) if (!path.includes(id)) tones[id] = solved.has(id) ? "settled" : "visited";
      onPath = path;
      for (const id of path.slice(0, -1)) tones[id] = solved.has(id) ? "settled" : "side-a";
      t.op(); // every event is one call
      if (e.note !== undefined) notes[e.id] = e.note;
      if (e.kind === "solution") solved.add(e.id);
      const now: Tone = e.kind === "solution" ? "found" : e.kind === "prune" ? "miss" : "active";
      if (e.grid) lastGrid = e.grid;
      t.step({ line: e.line, message: e.message, vars: e.vars, ...(e.ask ? { ask: e.ask } : {}), grid: lastGrid, array: [], trees: view({ [e.id]: now }), stack: path.map(opts.stackLabel) });
      tones[e.id] = e.kind === "solution" ? "settled" : e.kind === "prune" ? "visited" : "side-a";
    }
    for (const id of onPath) tones[id] = solved.has(id) ? "settled" : "visited";
    t.step({ ...opts.finish(lastGrid), array: [], trees: view(), stack: [] });
  }
}
