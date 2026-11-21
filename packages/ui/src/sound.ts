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

export type Cue = "tick" | "found" | "miss" | "done" | "fail";

const SOUNDS: Record<Cue, () => void> = {
  tick: () => note(880, 0, 0.07, 0.035),
  found: () => { note(659, 0, 0.16, 0.06); note(988, 0.07, 0.2, 0.05); },
  miss: () => note(185, 0, 0.18, 0.08),
  done: () => { note(523, 0, 0.22, 0.05); note(659, 0.09, 0.22, 0.05); note(784, 0.18, 0.32, 0.055); },
  fail: () => { note(392, 0, 0.2, 0.05); note(311, 0.12, 0.32, 0.05); },
};

let last = 0;
/** Plays a cue, skipping it if another played very recently (fast playback shouldn't become a buzz). */
export function playCue(cue: Cue | null) {
  if (!cue || !soundOn()) return;
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  if (now - last < 90) return;
  last = now;
  SOUNDS[cue]();
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
  step.lists?.forEach((l) => add((l as { tones?: Record<string, Tone> }).tones));
  return out;
}

/**
 * The cue for arriving at a step, read from what the step already shows: a finished run gets its ending, a red
 * mismatch a thud, a green find a chime, and anything being looked at a tick.
 */
export function cueFor(step: ArrayStep): Cue | null {
  if (step.done) return step.done === "found" ? "done" : "fail";
  const tones = tonesOf(step);
  if (tones.includes("miss")) return "miss";
  if (tones.includes("found")) return "found";
  if (tones.some((t) => t === "compare" || t === "active")) return "tick";
  return null;
}
