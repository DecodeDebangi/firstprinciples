import { useLayoutEffect, useRef, useState } from "react";
import type { ArrayStep, Tone } from "./trace";

/**
 * Draws `step.scene`: bars sized by value, an answer row, and an optional pile (a stack of blocks sized by value).
 * Every element keeps a stable key and is placed with a transform, so CSS transitions turn each step into movement.
 */
export function SceneView({ step }: { step: ArrayStep }) {
  const sc = step.scene!;
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = sc.bars.length, narrow = W < 460;
  const H = narrow ? 270 : 300;
  const hasPile = !!sc.pile;
  const left = 10, laneW = Math.max(0, (hasPile ? W * (narrow ? 0.56 : 0.6) : W - 20) - left);
  // Headroom above the tallest bar for its name tag and the floating note.
  const sw = n ? laneW / n : 0, base = H * 0.56;
  const lo = Math.min(...sc.bars), hi = Math.max(...sc.bars), span = hi - lo || 1;
  const barH = (v: number) => H * 0.08 + ((v - lo) / span) * H * 0.2;
  const bw = Math.min(46, sw * 0.7), slotS = Math.min(36, sw * 0.74);
  const barX = (i: number) => left + i * sw + (sw - bw) / 2;
  const slotX = (i: number) => left + i * sw + (sw - slotS) / 2, slotY = base + 44;
  const wellX = left + laneW + (narrow ? 12 : 22), wellW = Math.max(0, W - wellX - 10), wellBottom = H - 12, chipH = narrow ? 24 : 28;
  const blockW = (v: number) => wellW * (0.36 + ((v - lo) / span) * 0.6);
  const label = (v: number) => `${v}${sc.unit ?? ""}`;
  const name = (i: number) => {
    const full = sc.names?.[i] ?? String(i);
    return sw < 50 && /\s\d+$/.test(full) ? full[0] + full.split(" ").pop() : full;
  };
  const cls = (t?: Tone) => (t ? ` is-${t}` : "");
  const aria = `${sc.title ?? "Values"}: ${sc.bars.map(label).join(", ")}.${sc.pile ? ` ${sc.pile.title}: ${sc.pile.items.length ? sc.pile.items.map((i) => label(sc.bars[i])).join(", ") : "empty"}.` : ""}`;

  return (
    <div className="fp-scene" ref={ref} style={{ height: H }} role="img" aria-label={aria}>
      {W > 0 && <>
        <span className="fp-scene__zone" style={{ left, top: 8 }}>{sc.title ?? "Values"}</span>
        {sc.answers && <span className="fp-scene__zone" style={{ left, top: base + 22 }}>{sc.answers.title}</span>}
        {hasPile && <>
          <span className="fp-scene__zone" style={{ left: wellX, top: 8 }}>{sc.pile!.title}</span>
          <div className="fp-scene__well" style={{ left: wellX, top: 32, width: wellW, height: wellBottom - 32 }} />
        </>}
        {sc.bars.map((v, i) => {
          const h = barH(v);
          return (
            <div key={`b${i}`} className={`fp-scene__bar${cls(sc.tones?.[i])}${hasPile && sc.pile!.items.includes(i) ? " is-waiting" : ""}`}
              style={{ left: barX(i), top: base - h, width: bw, height: h }}>
              <span className="fp-scene__val">{label(v)}</span>
              <span className="fp-scene__name" style={{ top: h + 3 }}>{name(i)}</span>
            </div>
          );
        })}
        {sc.answers && sc.answers.values.map((v, i) => (
          <div key={`s${i}`} className={`fp-scene__slot${!hasPile && v !== null ? ` is-filled${cls(sc.answers!.tones?.[i] ?? "found")}` : ""}`}
            style={{ left: slotX(i), top: slotY, width: slotS, height: slotS }}>{!hasPile && v !== null ? v : ""}</div>
        ))}
        {hasPile && sc.bars.map((v, i) => {
          const at = sc.pile!.items.indexOf(i), ans = sc.answers?.values[i];
          let x: number, y: number, w: number, h: number, state: string, text: string;
          if (at >= 0) {
            w = blockW(v); h = chipH; x = wellX + (wellW - w) / 2; y = wellBottom - 8 - (at + 1) * (chipH + 5);
            state = `fp-scene__block${cls(sc.pile!.tones?.[i])}`; text = `${label(v)} · ${name(i)}`;
          } else if (ans !== null && ans !== undefined) {
            w = slotS; h = slotS; x = slotX(i); y = slotY;
            state = `fp-scene__block is-landed${ans === 0 ? " is-zero" : ""}`; text = String(ans);
          } else {
            w = bw; h = chipH; x = barX(i); y = base - barH(v);
            state = "fp-scene__block is-hidden"; text = "";
          }
          return <div key={`k${i}`} className={state} style={{ width: w, height: h, transform: `translate(${x}px, ${y}px)` }}>{text}</div>;
        })}
        {Object.entries(sc.tags ?? {}).map(([t, i]) => (
          <span key={`t${t}`} className={`fp-scene__tag${t === "j" ? " is-alt" : ""}`}
            style={{ transform: `translate(${barX(i) + bw / 2}px, ${base - barH(sc.bars[i]) - 22}px) translateX(-50%)` }}>{t}</span>
        ))}
        {sc.say && (
          <span key="say" className="fp-scene__say"
            style={{ transform: `translate(${Math.max(40, Math.min(W - 40, barX(sc.say.at) + bw / 2))}px, ${base - barH(sc.bars[sc.say.at]) - 50}px) translateX(-50%)` }}>{sc.say.text}</span>
        )}
        <span className="fp-scene__ops">operations <b>{step.ops}</b></span>
      </>}
    </div>
  );
}
