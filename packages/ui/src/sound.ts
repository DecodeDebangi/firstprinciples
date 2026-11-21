import { useEffect, useState } from "react";
import type { ArrayStep, Tone } from "./trace";

/**
 * Optional sound cues for the players. Every sound is synthesised with the Web Audio API (no files), soft and short,
 * and only plays after the reader has switched sound on. The choice is one localStorage key shared by every player.
 */

const KEY = "firstprinciples:sound";
const EVENT = "fp-sound-change";

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode: just this page */ }
  if (on) audio(); // created inside the click, so the browser allows it to play
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}

/** The shared on/off setting, kept in step across every player on the page. */
export function useSound(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(soundOn());
    const update = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return [on, setSoundOn];
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** One soft, marimba-like note: a sine with a faint octave, a quick attack and a short decay. */
function note(freq: number, at: number, dur: number, gain: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  out.connect(a.destination);
  for (const [mult, level] of [[1, 1], [2, 0.18]] as const) {
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * mult, t0);
    g.gain.value = level;
    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
}

export type Cue = "tick" | "found" | "miss" | "done" | "fail" | "move" | "push" | "pop" | "right" | "wrong";
export type CueChoice = { cue: Cue; pitch?: number };

/** A noise burst swept through a band-pass filter: a soft "whoosh". */
function whoosh() {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime, dur = 0.14;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf;
  bp.type = "bandpass"; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(500, t0);
  bp.frequency.exponentialRampToValueAtTime(2200, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** A tiny glide between two pitches: up for a push, down for a pop. */
function blip(from: number, to: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime, osc = a.createOscillator(), g = a.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + 0.07);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + 0.12);
}

const SOUNDS: Record<Cue, (pitch?: number) => void> = {
  tick: (pitch) => note(pitch ?? 880, 0, 0.08, 0.035),
  found: () => { note(659, 0, 0.16, 0.06); note(988, 0.07, 0.2, 0.05); },
  miss: () => note(185, 0, 0.18, 0.08),
  done: () => { note(523, 0, 0.22, 0.05); note(659, 0.09, 0.22, 0.05); note(784, 0.18, 0.32, 0.055); },
  fail: () => { note(392, 0, 0.2, 0.05); note(311, 0.12, 0.32, 0.05); },
  move: () => whoosh(),
  push: () => blip(700, 1050),
  pop: () => blip(1050, 700),
  // Predict mode: a bright rising pair for a right guess, a soft low pair for a wrong one.
  right: () => { note(784, 0, 0.14, 0.06); note(1175, 0.06, 0.24, 0.055); },
  wrong: () => { note(233, 0, 0.22, 0.06); note(220, 0.05, 0.26, 0.05); },
};

let last = 0;
/** Plays a cue, skipping it if another played very recently (fast playback shouldn't become a buzz). */
export function playCue(choice: CueChoice | Cue | null) {
  if (!choice || !soundOn()) return;
  const { cue, pitch } = typeof choice === "string" ? { cue: choice, pitch: undefined } : choice;
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  if (now - last < 90) return;
  last = now;
  SOUNDS[cue](pitch);
}

/** Every tone shown anywhere in a step: cells, grid and board panels, trees, graphs and lists. */
function tonesOf(step: ArrayStep): Tone[] {
  const out: Tone[] = [];
  const add = (r?: Record<string | number, Tone>) => { if (r) out.push(...Object.values(r)); };
  add(step.tones);
  add(step.grid?.tones);
  add(step.board?.tones);
  step.trees?.forEach((t) => add(t.tones));
  step.graphs?.forEach((g) => add(g.tones));
  step.lists?.forEach((l) => add(l.tones));
  return out;
}
const count = (tones: Tone[], tone: Tone) => tones.filter((t) => t === tone).length;

/** Did two values of the main array trade places since the previous step? */
function swapped(step: ArrayStep, prev?: ArrayStep) {
  if (!prev || prev.array.length !== step.array.length || !step.array.length) return false;
  const diff = step.array.map((v, i) => (v !== prev.array[i] ? i : -1)).filter((i) => i >= 0);
  return diff.length === 2 && step.array[diff[0]] === prev.array[diff[1]] && step.array[diff[1]] === prev.array[diff[0]];
}

/** Five-note (pentatonic) scale over two octaves from A4: any two neighbours sound pleasant together. */
const SCALE = [440, 494, 554, 659, 740, 880, 988, 1109, 1319, 1480];
/** The pitch for the value in the main array's highlighted cell: low for the smallest value, high for the largest. */
function pitchFor(step: ArrayStep): number | undefined {
  const at = Object.entries(step.tones ?? {}).find(([, t]) => t === "compare" || t === "active")?.[0];
  if (at === undefined) return undefined;
  const nums = step.array.filter((v): v is number => typeof v === "number");
  const v = step.array[Number(at)];
  if (typeof v !== "number" || nums.length < 2) return undefined;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  if (hi === lo) return undefined;
  return SCALE[Math.round(((v - lo) / (hi - lo)) * (SCALE.length - 1))];
}

/**
 * The cue for arriving at a step, read from what the step already shows. In order of importance: the run's ending, a
 * mismatch (thud), a value moving or two values swapping (whoosh), something newly found (chime), the stack growing or
 * shrinking (blips), and otherwise a tick for anything being looked at, pitched by its value when it's a number.
 */
export function cueFor(step: ArrayStep, prev?: ArrayStep): CueChoice | null {
  if (step.done) return { cue: step.done === "found" ? "done" : "fail" };
  const tones = tonesOf(step);
  if (tones.includes("miss")) return { cue: "miss" };
  if (step.move || swapped(step, prev)) return { cue: "move" };
  // Only a new discovery chimes; a cell that stays green from one step to the next just ticks.
  if (count(tones, "found") > (prev ? count(tonesOf(prev), "found") : 0)) return { cue: "found" };
  const before = prev?.stack?.length ?? 0, after = step.stack?.length ?? 0;
  if (step.stack && prev?.stack && after > before) return { cue: "push" };
  if (step.stack && prev?.stack && after < before) return { cue: "pop" };
  if (tones.some((t) => t === "compare" || t === "active" || t === "found")) return { cue: "tick", pitch: pitchFor(step) };
  return null;
}
