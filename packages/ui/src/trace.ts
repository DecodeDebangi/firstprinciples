/**
 * Every animation is generated from the algorithm itself: an approach's `run`
 * function executes the real algorithm and calls `t.step(...)` with a full
 * snapshot whenever something worth seeing happens. The player replays those
 * snapshots, so stepping backwards is free and no animation is hand-drawn.
 */

export type Tone = "compare" | "found" | "active" | "miss" | "discard";

export interface ArrayStep {
  /** 1-based line in the approach's `code` to highlight. */
  line: number;
  /** The decision being made, in plain words. */
  message: string;
  array: (number | string)[];
  /** Text under each cell. Defaults to the index. */
  labels?: string[];
  /** Named pointers, e.g. { lo: 0, hi: 7 }. */
  pointers?: Record<string, number>;
  tones?: Record<number, Tone>;
  /** Inclusive window still being considered; cells outside are dimmed. */
  range?: [number, number] | null;
  vars?: Record<string, string | number | boolean | null>;
  /** A hash map / set panel. */
  map?: { title: string; entries: [string, string][]; highlight?: string };
  /** A stack panel, top (innermost) last. */
  stack?: string[];
  /** Heading for the stack panel. Defaults to "Call stack". */
  stackTitle?: string;
  /** A 2D panel (e.g. Pascal's triangle). Tones are keyed "row,col". Rows are centred. */
  grid?: { title: string; rows: (number | string)[][]; tones?: Record<string, Tone> };
  /**
   * Predict mode: asked *before* this step is shown, while the learner still sees the previous one.
   * `answer` is the index of the correct option; this step's message explains it.
   */
  ask?: { q: string; options: string[]; answer: number };
  /** Basic operations counted so far (filled in by the tracer). */
  ops: number;
  done?: "found" | "notfound";
}

export class Tracer {
  steps: ArrayStep[] = [];
  ops = 0;
  constructor(public readonly record = true) {}
  /** Count basic operations (comparisons, lookups). */
  op(n = 1) {
    this.ops += n;
  }
  step(s: Omit<ArrayStep, "ops">) {
    if (this.record) this.steps.push({ ...s, ops: this.ops });
  }
}

export interface Approach<I> {
  id: string;
  name: string;
  /** Python shown next to the animation; step `line`s refer to it. */
  code: string;
  run: (input: I, t: Tracer) => void;
}

export interface GrowthSeries {
  name: string;
  /** Categorical slot 1-3, fixed per approach so colour follows the approach. */
  slot: 1 | 2 | 3;
  points: [n: number, ops: number][];
}

/** Run approaches without recording to count operations as n grows. */
export function measureGrowth<I>(
  approaches: { approach: Approach<I>; slot: 1 | 2 | 3 }[],
  worstCase: (n: number) => I,
  sizes: number[],
): GrowthSeries[] {
  return approaches.map(({ approach, slot }) => ({
    name: approach.name,
    slot,
    points: sizes.map((n) => {
      const t = new Tracer(false);
      approach.run(worstCase(n), t);
      return [n, t.ops] as [number, number];
    }),
  }));
}
