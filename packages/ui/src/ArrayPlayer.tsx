import { useEffect, useMemo, useRef, useState } from "react";
import { Tracer, type Approach, type ArrayStep } from "./trace";
import { ArrayCells } from "./ArrayCells";
import { ListView } from "./ListView";
import { TreeView } from "./TreeView";
import { GraphView, BoardView } from "./GraphView";
import { SceneView } from "./SceneView";
import { InputForm, parseDraft, toText, type InputField, type InputValues, type Prepared } from "./input";
import { cueFor, playCue, useSound } from "./sound";
import "./player.css";

/** Each 4-space indent becomes a 4ch-wide span with a faint guide line, like an editor's indent guides. */
function Indented({ line }: { line: string }) {
  if (!line) return <>{" "}</>;
  const lead = line.length - line.trimStart().length;
  const levels = Math.floor(lead / 4);
  return (
    <>
      {Array.from({ length: levels }, (_, k) => <span key={k} className="fp-indent">{"    "}</span>)}
      {line.slice(levels * 4)}
    </>
  );
}

export type { InputField, InputValues, Prepared } from "./input";

export interface ArrayPlayerProps<I extends InputValues> {
  approach: Approach<I>;
  initialInput: I;
  fields: InputField[];
  /** Validate / normalise a user's input before running it. */
  prepare?: (raw: I) => Prepared<I>;
  maxLength?: number;
  /**
   * Study mode: predict mode starts on, the main button asks "What happens next?", key moments are marked on the
   * slider, and the less-used controls move to a second row.
   */
  study?: boolean;
}

export const SPEEDS = [
  { label: "0.5×", ms: 1800 },
  { label: "1×", ms: 1100 },
  { label: "2×", ms: 550 },
];

const show = (v: unknown) => (v === null || v === undefined ? "—" : String(v));

export function ArrayPlayer<I extends InputValues>({ approach, initialInput, fields, prepare, maxLength = 14, study = false }: ArrayPlayerProps<I>) {
  const [input, setInput] = useState<I>(initialInput);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // Predict mode
  const [predict, setPredict] = useState(study);
  const [asking, setAsking] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; answer: string } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  // Shareable links
  const [linked, setLinked] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ text: string; url?: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Optional sound cues (off until the reader switches them on; shared by every player on the page)
  const [sound, setSound] = useSound();
  const shownIdx = useRef<number | null>(null);
  /** Set once the reader steps, plays or scrubs; a page opened at a step doesn't count as playing it. */
  const moved = useRef(false);

  // Open at the step in the URL: ?approach=<id>&step=<n>[&<field>=<value>…]
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("approach") !== approach.id) return;
    let inp = initialInput;
    const given = Object.fromEntries(fields.filter((f) => q.has(f.key)).map((f) => [f.key, q.get(f.key)!]));
    if (Object.keys(given).length === fields.length) {
      const parsed = parseDraft(fields, given, maxLength);
      if (!("error" in parsed)) {
        const res = prepare ? prepare(parsed.raw as I) : { input: parsed.raw as I };
        if (!("error" in res)) inp = res.input;
      }
    }
    const t = new Tracer();
    approach.run(inp, t);
    const n = Number(q.get("step"));
    setInput(inp);
    setIdx(Number.isInteger(n) && n >= 1 ? Math.min(n, t.steps.length) - 1 : 0);
    setLinked(true);
    if (window.location.hash !== `#viz-${approach.id}`) rootRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function share() {
    const enc = (v: string) => encodeURIComponent(v).replace(/%2C/g, ",");
    const parts = [`approach=${enc(approach.id)}`, `step=${idx + 1}`];
    if (JSON.stringify(input) !== JSON.stringify(initialInput)) {
      for (const f of fields) parts.push(`${enc(f.key)}=${enc(toText(input[f.key]).replace(/\s+/g, ""))}`);
    }
    const url = `${window.location.origin}${window.location.pathname}?${parts.join("&")}#viz-${approach.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg({ text: `Link to step ${idx + 1} copied.` });
    } catch {
      setShareMsg({ text: "Copy this link:", url });
    }
  }

  const steps = useMemo(() => {
    const t = new Tracer();
    approach.run(input, t);
    return t.steps;
  }, [approach, input]);

  const step: ArrayStep = steps[Math.min(idx, steps.length - 1)];
  const prev = idx > 0 ? steps[idx - 1] : undefined;
  const atEnd = idx >= steps.length - 1;
  const hasAsks = steps.some((s) => s.ask);
  const question = asking !== null ? steps[asking].ask! : null;

  /** Move forward one step, stopping first to ask if predict mode is on. */
  function next() {
    moved.current = true;
    const target = idx + 1;
    if (target >= steps.length) return;
    if (predict && steps[target].ask && asking !== target) {
      setPlaying(false);
      setFeedback(null);
      setAsking(target);
      return;
    }
    setAsking(null);
    setFeedback(null);
    setIdx(target);
  }
  const nextRef = useRef(next);
  nextRef.current = next;

  // A sound for each step the reader moves to (not for the step shown when the page opens).
  useEffect(() => {
    if (shownIdx.current !== null && shownIdx.current !== idx && sound) playCue(cueFor(step, idx > 0 ? steps[idx - 1] : undefined));
    shownIdx.current = idx;
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tell the page when the reader reaches the end (the lesson path ticks the section off). Opening a shared link
  // at the last step doesn't count: only steps the reader moved through.
  useEffect(() => {
    if (atEnd && idx > 0 && moved.current) rootRef.current?.dispatchEvent(new CustomEvent("fp:finished", { bubbles: true, detail: { approach: approach.id } }));
  }, [atEnd, idx, approach.id]);

  useEffect(() => {
    if (!playing) return;
    if (atEnd) { setPlaying(false); return; }
    const id = setTimeout(() => nextRef.current(), SPEEDS[speed].ms);
    return () => clearTimeout(id);
  }, [playing, idx, atEnd, speed]);

  function go(i: number) {
    moved.current = true;
    setShareMsg(null);
    setPlaying(false);
    setAsking(null);
    setFeedback(null);
    setIdx(Math.max(0, Math.min(steps.length - 1, i)));
  }

  function togglePlay() {
    if (asking !== null) return;
    if (atEnd) { go(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  }

  function choose(option: number | null) {
    if (asking === null || !question) return;
    if (option !== null) {
      const ok = option === question.answer;
      if (sound) playCue(ok ? "right" : "wrong"); // the step's own cue right after is skipped, so this one is heard
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
      setFeedback({ ok, answer: question.options[question.answer] });
    } else {
      setFeedback(null);
    }
    moved.current = true;
    setIdx(asking);
    setAsking(null);
  }

  function togglePredict(on: boolean) {
    setPredict(on);
    setScore({ right: 0, total: 0 });
    go(0);
  }

  function onKey(e: React.KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || (tag === "BUTTON" && e.key === " ")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === " ") { e.preventDefault(); togglePlay(); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); setSound(!sound); }
  }

  const codeLines = approach.code.replace(/\n$/, "").split("\n");
  const opsChanged = prev !== undefined && prev.ops !== step.ops;

  return (
    <div className={`fp-player${linked ? " is-linked" : ""}${study ? " is-study" : ""}`} id={`viz-${approach.id}`} ref={rootRef} tabIndex={0} onKeyDown={onKey}
      aria-label={`Animation: ${approach.name}. Use left and right arrow keys to step, space to play.`}>
      <div className="fp-player__top">
        <div className="fp-stage">
          {/* A tree can come with a list underneath (e.g. matching a list along a tree path). */}
          {step.scene ? <SceneView step={step} /> : step.trees ? <>{<TreeView step={step} />}{step.lists && <ListView step={step} />}</> : step.graphs ? <GraphView step={step} /> : step.board ? <BoardView step={step} /> : step.lists ? <ListView step={step} /> : step.hideStage ? null : <ArrayCells step={step} />}

          {question ? (
            <div className="fp-ask" role="group" aria-label="Predict the next step">
              <p className="fp-ask__q"><span className="fp-ask__tag">Your call</span> {question.q}</p>
              <div className="fp-ask__options">
                {question.options.map((o, k) => (
                  <button type="button" key={k} onClick={() => choose(k)}>{o}</button>
                ))}
              </div>
              <button type="button" className="fp-link" onClick={() => choose(null)}>Skip, just show me</button>
            </div>
          ) : (
            <>
              {feedback && (
                <p className={`fp-feedback ${feedback.ok ? "is-right" : "is-wrong"}`} role="status">
                  {feedback.ok ? "✓ Right." : `✗ Not quite. It's: ${feedback.answer}`}
                </p>
              )}
              <p className={`fp-message${step.done ? ` fp-message--${step.done}` : ""}`} aria-live="polite">
                {step.message}
              </p>
            </>
          )}

          <div className="fp-panels">
            {step.vars && Object.keys(step.vars).length > 0 && (
              <div className="fp-panel">
                <div className="fp-panel__title">Variables</div>
                <dl className="fp-vars">
                  {Object.entries(step.vars).map(([k, v]) => {
                    const had = prev?.vars !== undefined && k in prev.vars;
                    const old = had ? prev!.vars![k] : undefined;
                    const changed = had && old !== v && !question;
                    return (
                      <div key={k} className={changed ? "is-changed" : ""}>
                        <dt>{k}</dt>
                        <dd key={changed ? `c${idx}` : "same"}>
                          {changed && <><span className="fp-old">{show(old)}</span><span className="fp-arrow" aria-label="changed to"> → </span></>}
                          {show(v)}
                        </dd>
                      </div>
                    );
                  })}
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
                    <li key={`${step.stack!.length - i}-${f}`} className={i === 0 ? "is-top" : ""}>{f}</li>
                  ))}
                </ol>
              </div>
            )}
            {step.grid && (
              <div className="fp-panel fp-panel--wide">
                <div className="fp-panel__title">{step.grid.title}</div>
                {step.grid.rows.length === 0 ? (
                  <div className="fp-empty">empty</div>
                ) : (
                  <div className={`fp-grid${step.grid.dense ? " is-dense" : ""}${step.grid.rowLabels ? " has-rowlabels" : ""}`} role="img"
                    // With row labels, one CSS grid keeps every column lined up, however wide each label is.
                    style={step.grid.rowLabels ? { gridTemplateColumns: `auto repeat(${Math.max(...step.grid.rows.map((r) => r.length), step.grid.colLabels?.length ?? 0)}, auto)` } : undefined}
                    aria-label={`${step.grid.title}: ${step.grid.rows.map((r) => r.join(" ")).join(" / ")}`}>
                    {step.grid.colLabels && (
                      <div className="fp-grid__row" aria-hidden="true">
                        {step.grid.rowLabels && <span className="fp-gcell fp-glabel is-rowlabel" />}
                        {step.grid.colLabels.map((v, c) => <span key={c} className="fp-gcell fp-glabel">{v}</span>)}
                      </div>
                    )}
                    {step.grid.rows.map((row, r) => (
                      <div className="fp-grid__row" key={r}>
                        {step.grid!.rowLabels && <span className="fp-gcell fp-glabel is-rowlabel" aria-hidden="true">{step.grid!.rowLabels[r]}</span>}
                        {row.map((v, c) => {
                          const tone = step.grid!.tones?.[`${r},${c}`];
                          return <span key={c} className={`fp-gcell${tone ? ` fp-cell--${tone}` : ""}`}>{v}</span>;
                        })}
                        {step.grid!.rowLabels && Array.from({ length: Math.max(0, Math.max(...step.grid!.rows.map((x) => x.length)) - row.length) }, (_, k) => <span key={`pad${k}`} className="fp-gcell" />)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={`fp-panel fp-panel--ops${opsChanged ? " is-changed" : ""}`}>
              <div className="fp-panel__title">Operations</div>
              <div className="fp-ops" key={opsChanged ? `o${idx}` : "same"}>{step.ops}</div>
            </div>
          </div>
        </div>

        <pre className="fp-code" aria-label="Code, current line highlighted">
          {codeLines.map((l, i) => (
            <div key={i} className={`fp-line${step.line === i + 1 && !question ? " is-current" : ""}`}>
              <span className="fp-ln">{i + 1}</span>
              <code><Indented line={l} /></code>
            </div>
          ))}
          <a className="fp-code-help" href="/concepts/how-to-read-the-code/">How to read this code</a>
        </pre>
      </div>

      {study ? (
        <>
          <div className="fp-controls">
            <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous step">◀</button>
            <button type="button" className="fp-next" disabled={asking !== null}
              onClick={() => (atEnd ? go(0) : next())}>
              {asking !== null ? "Pick an answer above" : atEnd ? "Start again" : predict && steps[idx + 1]?.ask ? "What happens next?" : "Next step"}
            </button>
            <button type="button" className="fp-play" onClick={togglePlay} disabled={asking !== null}>
              {playing ? "Pause" : "Play"}
            </button>
            <span className="fp-scrubwrap">
              <input className="fp-scrub" type="range" min={0} max={steps.length - 1} value={idx}
                onChange={(e) => go(Number(e.target.value))} aria-label="Step" />
              <span className="fp-marks" aria-hidden="true">
                {steps.map((s, k) => s.key ? <i key={k} style={{ left: `${(k / Math.max(1, steps.length - 1)) * 100}%` }} /> : null)}
              </span>
            </span>
            <span className="fp-count">Step {idx + 1} / {steps.length}</span>
          </div>
          <div className="fp-controls fp-controls--more">
            <button type="button" onClick={() => go(0)} disabled={idx === 0 && asking === null} aria-label="First step">⏮</button>
            <div className="fp-speed" role="group" aria-label="Speed">
              {SPEEDS.map((s, i) => (
                <button type="button" key={s.label} className={i === speed ? "is-on" : ""}
                  aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>
              ))}
            </div>
            <button type="button" className={`fp-sound${sound ? " is-on" : ""}`} aria-pressed={sound} onClick={() => setSound(!sound)}
              title={sound ? "Sound is on: each step plays a short cue (S)" : "Turn on short sound cues for each step (S)"}>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                {sound ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19.5 5.5a9 9 0 0 1 0 13" /></> : <path d="M17 9l5 6M22 9l-5 6" />}
              </svg>
              Sound
            </button>
            <button type="button" className="fp-share" onClick={share} title="Copy a link that opens this exact step">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
              </svg>
              Link to this step
            </button>
          </div>
        </>
      ) : (
      <div className="fp-controls">
        <button type="button" onClick={() => go(0)} disabled={idx === 0 && asking === null} aria-label="First step">⏮</button>
        <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous step">◀</button>
        <button type="button" className="fp-play" onClick={togglePlay} disabled={asking !== null}>
          {playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </button>
        <button type="button" onClick={next} disabled={atEnd || asking !== null} aria-label="Next step">▶</button>
        <input className="fp-scrub" type="range" min={0} max={steps.length - 1} value={idx}
          onChange={(e) => go(Number(e.target.value))} aria-label="Step" />
        <span className="fp-count">Step {idx + 1} / {steps.length}</span>
        <div className="fp-speed" role="group" aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <button type="button" key={s.label} className={i === speed ? "is-on" : ""}
              aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>
          ))}
        </div>
        <button type="button" className={`fp-sound${sound ? " is-on" : ""}`} aria-pressed={sound} onClick={() => setSound(!sound)}
          title={sound ? "Sound is on: each step plays a short cue (S)" : "Turn on short sound cues for each step (S)"}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            {sound ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19.5 5.5a9 9 0 0 1 0 13" /></> : <path d="M17 9l5 6M22 9l-5 6" />}
          </svg>
          Sound
        </button>
        <button type="button" className="fp-share" onClick={share} title="Copy a link that opens this exact step">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
          </svg>
          Link to this step
        </button>
      </div>
      )}
      {shareMsg && (
        <p className="fp-sharemsg" role="status">
          {shareMsg.text}
          {shareMsg.url && <input readOnly value={shareMsg.url} onFocus={(e) => e.currentTarget.select()} aria-label="Link to this step" />}
        </p>
      )}

      {hasAsks && (
        <div className="fp-predict">
          <label className="fp-toggle">
            <input type="checkbox" checked={predict} onChange={(e) => togglePredict(e.target.checked)} />
            <span className="fp-toggle__track" aria-hidden="true"><span /></span>
            <span>{study ? <><strong>Guess first</strong>: before each key step, choose what happens</> : <><strong>Predict mode</strong>: pause before each decision and guess what happens</>}</span>
          </label>
          {predict && score.total > 0 && (
            <span className="fp-score">{score.right} / {score.total} right</span>
          )}
        </div>
      )}

      {/* A fixed demonstration (no fields) has nothing to type in, so no input form. */}
      {fields.length > 0 && <InputForm fields={fields} initialInput={initialInput} shown={input} prepare={prepare} maxLength={maxLength}
        onApply={(inp) => { setInput(inp); go(0); setScore({ right: 0, total: 0 }); }} />}
    </div>
  );
}
