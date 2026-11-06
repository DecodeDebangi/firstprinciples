import { useEffect, useMemo, useRef, useState } from "react";
import { Tracer, type Approach, type ArrayStep } from "./trace";
import { ArrayCells } from "./ArrayCells";
import "./player.css";

export type InputValues = Record<string, number | number[] | string>;

export interface InputField {
  key: string;
  label: string;
  kind: "numbers" | "number" | "text";
  hint?: string;
}

export type Prepared<I> = { input: I; note?: string } | { error: string };

export interface ArrayPlayerProps<I extends InputValues> {
  approach: Approach<I>;
  initialInput: I;
  fields: InputField[];
  /** Validate / normalise a user's input before running it. */
  prepare?: (raw: I) => Prepared<I>;
  maxLength?: number;
}

const SPEEDS = [
  { label: "0.5×", ms: 1800 },
  { label: "1×", ms: 1100 },
  { label: "2×", ms: 550 },
];

function toText(v: number | number[] | string) {
  return Array.isArray(v) ? v.join(", ") : String(v);
}

export function ArrayPlayer<I extends InputValues>({
  approach,
  initialInput,
  fields,
  prepare,
  maxLength = 14,
}: ArrayPlayerProps<I>) {
  const [input, setInput] = useState<I>(initialInput);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, toText(initialInput[f.key])])),
  );
  const [formMsg, setFormMsg] = useState<{ kind: "error" | "note"; text: string } | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => {
    const t = new Tracer();
    approach.run(input, t);
    return t.steps;
  }, [approach, input]);

  const step: ArrayStep = steps[Math.min(idx, steps.length - 1)];
  const atEnd = idx >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setIdx((i) => i + 1), SPEEDS[speed].ms);
    return () => clearTimeout(id);
  }, [playing, idx, atEnd, speed]);

  function go(i: number) {
    setPlaying(false);
    setIdx(Math.max(0, Math.min(steps.length - 1, i)));
  }

  function togglePlay() {
    if (atEnd) setIdx(0);
    setPlaying((p) => !p || atEnd);
  }

  function onKey(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === " ") { e.preventDefault(); togglePlay(); }
  }

  function apply(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw: InputValues = {};
    for (const f of fields) {
      const text = (draft[f.key] ?? "").trim();
      if (f.kind === "text") {
        const compact = text.replace(/\s+/g, "");
        if (compact.length > maxLength) {
          setFormMsg({ kind: "error", text: `${f.label} can be at most ${maxLength} characters so the animation fits.` });
          return;
        }
        raw[f.key] = compact;
      } else if (f.kind === "number") {
        const n = Number(text);
        if (text === "" || !Number.isInteger(n)) {
          setFormMsg({ kind: "error", text: `${f.label} must be a whole number.` });
          return;
        }
        raw[f.key] = n;
      } else {
        const parts = text.split(/[\s,]+/).filter(Boolean);
        const nums = parts.map(Number);
        if (parts.length === 0 || nums.some((n) => !Number.isInteger(n))) {
          setFormMsg({ kind: "error", text: `${f.label} must be whole numbers separated by commas.` });
          return;
        }
        if (nums.length > maxLength) {
          setFormMsg({ kind: "error", text: `${f.label} can have at most ${maxLength} numbers so the animation fits.` });
          return;
        }
        raw[f.key] = nums;
      }
    }
    const res = prepare ? prepare(raw as I) : { input: raw as I };
    if ("error" in res) {
      setFormMsg({ kind: "error", text: res.error });
      return;
    }
    setFormMsg(res.note ? { kind: "note", text: res.note } : null);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, toText(res.input[f.key])])));
    setInput(res.input);
    setIdx(0);
    setPlaying(false);
  }

  function reset() {
    setDraft(Object.fromEntries(fields.map((f) => [f.key, toText(initialInput[f.key])])));
    setFormMsg(null);
    setInput(initialInput);
    setIdx(0);
    setPlaying(false);
  }

  const codeLines = approach.code.replace(/\n$/, "").split("\n");

  return (
    <div className="fp-player" ref={rootRef} tabIndex={0} onKeyDown={onKey}
      aria-label={`Animation: ${approach.name}. Use left and right arrow keys to step, space to play.`}>
      <div className="fp-player__top">
        <div className="fp-stage">
          <ArrayCells step={step} />

          <p className={`fp-message${step.done ? ` fp-message--${step.done}` : ""}`} aria-live="polite">
            {step.message}
          </p>

          <div className="fp-panels">
            {step.vars && Object.keys(step.vars).length > 0 && (
              <div className="fp-panel">
                <div className="fp-panel__title">Variables</div>
                <dl className="fp-vars">
                  {Object.entries(step.vars).map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v === null ? "—" : String(v)}</dd></div>
                  ))}
                </dl>
              </div>
            )}
            {step.map && (
              <div className="fp-panel">
                <div className="fp-panel__title">{step.map.title}</div>
                {step.map.entries.length === 0 ? (
                  <div className="fp-empty">empty</div>
                ) : (
                  <div className="fp-map">
                    {step.map.entries.map(([k, v]) => (
                      <div key={k} className={`fp-map__row${step.map!.highlight === k ? " is-hit" : ""}`}>
                        <span>{k}</span><span aria-hidden>→</span><span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {step.stack && (
              <div className="fp-panel">
                <div className="fp-panel__title">{step.stackTitle ?? "Call stack"} ({step.stack.length})</div>
                {step.stack.length === 0 && <div className="fp-empty">empty</div>}
                <ol className="fp-stack">
                  {[...step.stack].reverse().map((f, i) => (
                    <li key={i} className={i === 0 ? "is-top" : ""}>{f}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="fp-panel fp-panel--ops">
              <div className="fp-panel__title">Operations</div>
              <div className="fp-ops">{step.ops}</div>
            </div>
          </div>
        </div>

        <pre className="fp-code" aria-label="Code, current line highlighted">
          {codeLines.map((l, i) => (
            <div key={i} className={`fp-line${step.line === i + 1 ? " is-current" : ""}`}>
              <span className="fp-ln">{i + 1}</span>
              <code>{l || " "}</code>
            </div>
          ))}
        </pre>
      </div>

      <div className="fp-controls">
        <button type="button" onClick={() => go(0)} disabled={idx === 0} aria-label="First step">⏮</button>
        <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous step">◀</button>
        <button type="button" className="fp-play" onClick={togglePlay}>
          {playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </button>
        <button type="button" onClick={() => go(idx + 1)} disabled={atEnd} aria-label="Next step">▶</button>
        <input className="fp-scrub" type="range" min={0} max={steps.length - 1} value={idx}
          onChange={(e) => go(Number(e.target.value))} aria-label="Step" />
        <span className="fp-count">Step {idx + 1} / {steps.length}</span>
        <div className="fp-speed" role="group" aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <button type="button" key={s.label} className={i === speed ? "is-on" : ""}
              aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>
          ))}
        </div>
      </div>

      <form className="fp-input" onSubmit={apply}>
        <span className="fp-input__lead">Try your own input:</span>
        {fields.map((f) => (
          <label key={f.key}>
            <span>{f.label}</span>
            <input value={draft[f.key] ?? ""} inputMode={f.kind === "number" ? "numeric" : "text"}
              className={f.kind === "number" ? "" : "is-wide"}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
          </label>
        ))}
        <button type="submit">Run</button>
        <button type="button" className="fp-link" onClick={reset}>Reset example</button>
        {formMsg && <p className={`fp-formmsg fp-formmsg--${formMsg.kind}`} role="status">{formMsg.text}</p>}
      </form>
    </div>
  );
}
