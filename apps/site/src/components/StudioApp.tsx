import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrayCells, BoardView, GraphView, ListView, TreeView, Tracer, type Approach, type ArrayStep, type Prepared } from "@firstprinciples/ui";

/**
 * Recording mode for reels: one problem's animation in a 9:16 frame, with big text and no page chrome.
 * The steps come from the problem's own steps.ts, so the reel always matches the site.
 */
type StepsModule = { approaches: Record<string, Approach<unknown>>; example: unknown; prepare?: (raw: unknown) => Prepared<unknown> };
const modules = import.meta.glob<StepsModule>("../content/dsa/*/steps.ts");

const SPEEDS = [{ label: "Slow", ms: 2600 }, { label: "Normal", ms: 1700 }, { label: "Fast", ms: 1000 }];

function View({ step }: { step: ArrayStep }) {
  if (step.trees) return <TreeView step={step} />;
  if (step.graphs) return <GraphView step={step} />;
  if (step.board) return <BoardView step={step} />;
  if (step.lists) return <ListView step={step} />;
  return <ArrayCells step={step} />;
}

/** The side panels, squeezed into one line each. */
function Panels({ step }: { step: ArrayStep }) {
  const rows: { title: string; items: string[]; hl?: number }[] = [];
  if (step.map) rows.push({ title: step.map.title, items: step.map.entries.map(([k, v]) => `${k} → ${v}`), hl: step.map.entries.findIndex(([k]) => k === step.map!.highlight) });
  if (step.stack) rows.push({ title: step.stackTitle ?? "Call stack", items: [...step.stack].reverse() , hl: 0 });
  if (step.grid && step.grid.rows.length === 1) rows.push({ title: step.grid.title, items: step.grid.rows[0].map(String) });
  if (!rows.length) return null;
  return (
    <div className="st-panels">
      {rows.map((r) => (
        <div className="st-panel" key={r.title}>
          <span className="st-panel__t">{r.title}</span>
          <span className="st-panel__items">
            {r.items.length ? r.items.slice(0, 8).map((x, i) => <span key={i} className={`st-chip${i === r.hl ? " is-hl" : ""}`}>{x}</span>) : <span className="st-chip is-empty">empty</span>}
            {r.items.length > 8 && <span className="st-chip is-empty">+{r.items.length - 8}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StudioApp({ folder, title, number }: { folder: string; title: string; number: number }) {
  const [mod, setMod] = useState<StepsModule | null>(null);
  const [error, setError] = useState("");
  const [approachId, setApproachId] = useState("");
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [chrome, setChrome] = useState(true);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    const load = modules[`../content/dsa/${folder}/steps.ts`];
    if (!load) { setError(`No animation found for ${folder}.`); return; }
    load().then((m) => {
      setMod(m);
      const q = new URLSearchParams(location.search).get("approach");
      const ids = Object.values(m.approaches).map((a) => a.id);
      setApproachId(q && ids.includes(q) ? q : ids[ids.length - 1]);
    }).catch(() => setError("Couldn't load the animation."));
  }, [folder]);

  const approach = useMemo(() => (mod ? Object.values(mod.approaches).find((a) => a.id === approachId) : undefined), [mod, approachId]);
  const steps = useMemo(() => {
    if (!mod || !approach) return [];
    const prepared = mod.prepare ? mod.prepare(mod.example) : { input: mod.example };
    if ("error" in prepared) return [];
    const t = new Tracer();
    approach.run(prepared.input, t);
    return t.steps;
  }, [mod, approach]);
  useEffect(() => { setI(0); setPlaying(false); }, [approachId]);

  const last = steps.length - 1;
  const go = useCallback((k: number) => setI(Math.max(0, Math.min(last, k))), [last]);

  // Autoplay: hold each step, pause a little longer on the last one, then stop.
  useEffect(() => {
    if (!playing) return;
    if (i >= last) { setPlaying(false); return; }
    const id = setTimeout(() => setI((k) => k + 1), SPEEDS[speed].ms);
    return () => clearTimeout(id);
  }, [playing, i, last, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("select, input")) return;
      if (e.key === " ") { e.preventDefault(); if (i >= last) { setI(0); setPlaying(true); } else setPlaying((p) => !p); }
      else if (e.key === "ArrowRight") { setPlaying(false); go(i + 1); }
      else if (e.key === "ArrowLeft") { setPlaying(false); go(i - 1); }
      else if (e.key === "r" || e.key === "R") { setPlaying(false); setI(0); }
      else if (e.key === "h" || e.key === "H") setChrome((c) => !c);
      else if (e.key === "c" || e.key === "C") setShowCode((c) => !c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, last, go]);

  if (error) return <p className="st-error">{error}</p>;
  const step = steps[i];
  const codeLine = step && approach ? approach.code.split("\n")[step.line - 1]?.trim() : "";

  return (
    <div className={`st${chrome ? "" : " is-bare"}`}>
      <div className="st-frame" aria-label={`${title}, recording frame`}>
        <header className="st-head">
          <span className="st-brand">first<em>principles</em></span>
          <h1 className="st-title">{title}</h1>
          <span className="st-sub">LeetCode {number}{approach ? ` · ${approach.name}` : ""}</span>
        </header>
        {step ? (
          <>
            <div className="st-stage"><View step={step} /></div>
            {showCode && codeLine && <code className="st-code">{codeLine}</code>}
            <p className={`st-msg${step.done ? ` is-${step.done}` : ""}`} key={i}>{step.message}</p>
            <Panels step={step} />
            <div className="st-bar" aria-hidden="true"><span style={{ width: `${steps.length > 1 ? (i / last) * 100 : 100}%` }} /></div>
          </>
        ) : <p className="st-msg">Loading…</p>}
        <footer className="st-foot"><span>firstprinciples.debangi.com</span><span>@stacknaut</span></footer>
      </div>

      {chrome && mod && (
        <aside className="st-controls" aria-label="Recording controls (press H to hide)">
          <label>Approach
            <select value={approachId} onChange={(e) => setApproachId(e.target.value)}>
              {Object.values(mod.approaches).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <div className="st-row">
            <button type="button" onClick={() => { setPlaying(false); setI(0); }}>Restart</button>
            <button type="button" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0}>◀</button>
            <button type="button" className="is-main" onClick={() => { if (i >= last) { setI(0); setPlaying(true); } else setPlaying((p) => !p); }}>{playing ? "Pause" : i >= last ? "Replay" : "Play"}</button>
            <button type="button" onClick={() => { setPlaying(false); go(i + 1); }} disabled={i >= last}>▶</button>
          </div>
          <div className="st-row">
            {SPEEDS.map((s, k) => <button key={s.label} type="button" aria-pressed={speed === k} onClick={() => setSpeed(k)}>{s.label}</button>)}
          </div>
          <label className="st-check"><input type="checkbox" checked={showCode} onChange={(e) => setShowCode(e.target.checked)} /> Show the code line</label>
          <p className="st-help">Step {i + 1} of {steps.length}. <kbd>Space</kbd> play/pause · <kbd>←</kbd> <kbd>→</kbd> step · <kbd>R</kbd> restart · <kbd>C</kbd> code line · <kbd>H</kbd> hide these controls for recording.</p>
        </aside>
      )}
    </div>
  );
}
