import { useEffect, useMemo, useState } from "react";
import { ArrayCells } from "./ArrayCells";
import { ListView } from "./ListView";
import { TreeView } from "./TreeView";
import { SPEEDS } from "./ArrayPlayer";
import { InputForm, type InputField, type InputValues, type Prepared } from "./input";
import { Tracer, type Approach, type ArrayStep } from "./trace";
import "./player.css";

/** Index of the last step that has happened once `clock` operations have been done. */
function stepAt(steps: ArrayStep[], clock: number) {
  let k = 0;
  while (k + 1 < steps.length && steps[k + 1].ops <= clock) k++;
  return k;
}

/**
 * Two approaches side by side on the same input, sharing one clock measured in
 * operations, not animation steps. Each tick is the next moment either side does
 * work, so the slower approach visibly falls behind.
 */
export function ComparePlayer<I extends InputValues>({ approaches, initialInput, fields, prepare, maxLength = 14 }: {
  approaches: Approach<I>[];
  initialInput: I;
  fields: InputField[];
  prepare?: (raw: I) => Prepared<I>;
  maxLength?: number;
}) {
  const [input, setInput] = useState<I>(initialInput);
  const [pick, setPick] = useState<[number, number]>([0, approaches.length - 1]);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const traces = useMemo(() => pick.map((p) => {
    const t = new Tracer();
    approaches[p].run(input, t);
    return t.steps;
  }), [approaches, pick, input]);

  // Every distinct operation count at which either side changes.
  const frames = useMemo(() => [...new Set(traces.flatMap((s) => s.map((x) => x.ops)))].sort((a, b) => a - b), [traces]);
  const clock = frames[Math.min(frame, frames.length - 1)];
  const atEnd = frame >= frames.length - 1;
  const finals = traces.map((s) => s[s.length - 1].ops);
  const maxOps = Math.max(1, ...finals);

  useEffect(() => {
    if (!playing) return;
    if (atEnd) { setPlaying(false); return; }
    const id = setTimeout(() => setFrame((f) => f + 1), SPEEDS[speed].ms * 0.7);
    return () => clearTimeout(id);
  }, [playing, frame, atEnd, speed]);

  const go = (f: number) => { setPlaying(false); setFrame(Math.max(0, Math.min(frames.length - 1, f))); };
  const choose = (side: 0 | 1, p: number) => { setPick((cur) => (side === 0 ? [p, cur[1]] : [cur[0], p])); go(0); };

  const bothDone = traces.every((s) => stepAt(s, clock) === s.length - 1);
  const [a, b] = finals;
  const [nameA, nameB] = pick.map((p) => approaches[p].name);
  let verdict = "";
  if (bothDone) {
    if (a === b) verdict = `Both used ${a} operations on this input.`;
    else {
      const [fast, slow, fo, so] = a < b ? [nameA, nameB, a, b] : [nameB, nameA, b, a];
      const ratio = fo === 0 ? "" : ` That's ${(so / fo).toFixed(so / fo >= 10 ? 0 : 1)}× the work.`;
      verdict = `${fast} finished in ${fo} operations; ${slow} needed ${so}.${ratio}`;
    }
  }

  return (
    <div className="fp-player fp-compare-wrap">
      <p className="fp-compare__lead">
        Two approaches, same input, one shared clock that ticks once per operation. Pick any two.
      </p>
      <div className="fp-compare">
        {([0, 1] as const).map((side) => {
          const steps = traces[side];
          const k = stepAt(steps, clock);
          const step = steps[k];
          const done = k === steps.length - 1;
          return (
            <section className={`fp-lane${done ? " is-done" : ""}`} key={side} aria-label={`Approach ${side + 1}`}>
              <label className="fp-lane__pick">
                <span className="fp-sr">Approach {side + 1}</span>
                <select value={pick[side]} onChange={(e) => choose(side, Number(e.target.value))}>
                  {approaches.map((ap, i) => <option key={ap.id} value={i}>{ap.name}</option>)}
                </select>
              </label>
              {step.trees ? <TreeView step={step} /> : step.lists ? <ListView step={step} /> : <ArrayCells step={step} />}
              <p className={`fp-message fp-message--small${step.done ? ` fp-message--${step.done}` : ""}`}>{step.message}</p>
              <div className="fp-meter">
                <div className="fp-meter__label">
                  <span>Operations</span>
                  <b>{step.ops}</b>
                  {done && <span className="fp-meter__done">Finished</span>}
                </div>
                <div className="fp-meter__bar" aria-hidden="true">
                  <span style={{ width: `${(step.ops / maxOps) * 100}%`, background: `var(--series-${side + 1})` }} />
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <p className="fp-verdict" aria-live="polite">{verdict || " "}</p>

      <div className="fp-controls">
        <button type="button" onClick={() => go(0)} disabled={frame === 0} aria-label="Start over">⏮</button>
        <button type="button" onClick={() => go(frame - 1)} disabled={frame === 0} aria-label="Previous moment">◀</button>
        <button type="button" className="fp-play" onClick={() => (atEnd ? (go(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? "Pause" : atEnd ? "Replay" : "Race"}
        </button>
        <button type="button" onClick={() => go(frame + 1)} disabled={atEnd} aria-label="Next moment">▶</button>
        <input className="fp-scrub" type="range" min={0} max={frames.length - 1} value={frame}
          onChange={(e) => go(Number(e.target.value))} aria-label="Clock" />
        <span className="fp-count">Clock: {clock} ops</span>
        <div className="fp-speed" role="group" aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <button type="button" key={s.label} className={i === speed ? "is-on" : ""}
              aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>
          ))}
        </div>
      </div>

      <InputForm fields={fields} initialInput={initialInput} prepare={prepare} maxLength={maxLength}
        onApply={(inp) => { setInput(inp); go(0); }} />
    </div>
  );
}
