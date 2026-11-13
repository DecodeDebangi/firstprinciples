import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ArrayStep } from "./trace";
import "./player.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PTR_ROW = 18;

type Geo = { x: number; w: number; top: number; h: number };

/**
 * The array row in the "lift and settle" style: the cell being examined lifts off the
 * page, ruled-out cells sink and grey out, and the range still in play sits on a shelf
 * that shrinks. Pointers ride a rail underneath and slide between cells (they're keyed
 * by name, so `lo` moving from 0 to 5 is one element gliding across).
 */
export function ArrayCells({ step }: { step: ArrayStep }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState<Geo[]>([]);
  const n = step.array.length;

  useIsoLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const nodes = el.querySelectorAll<HTMLElement>(":scope > .fp-cells > .fp-col");
      setCols([...nodes].map((c) => {
        const cell = c.querySelector<HTMLElement>(".fp-cell")!;
        // Columns and cells are both positioned relative to the track (the nearest positioned ancestor).
        return { x: c.offsetLeft, w: c.offsetWidth, top: cell.offsetTop, h: cell.offsetHeight };
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  // Stack pointers that share an index (lo = mid = hi) instead of overlapping them.
  const rowAt = new Map<number, number>();
  const ptrs = Object.entries(step.pointers ?? {})
    .filter(([, i]) => i >= 0 && i < n)
    .map(([name, i]) => {
      const row = rowAt.get(i) ?? 0;
      rowAt.set(i, row + 1);
      return { name, i, row };
    });
  const rows = Math.max(1, ...ptrs.map((p) => p.row + 1));

  // The shelf spans the range still in play.
  const r = step.range;
  const a = r ? cols[r[0]] : undefined, b = r ? cols[r[1]] : undefined;
  const shelf = a && b ? { left: a.x - 3, width: b.x + b.w - a.x + 6, top: a.top - 6, height: a.h + 12 } : null;

  const badgeCol = step.badge ? cols[step.badge.at] : undefined;

  return (
    <div className="fp-track" ref={trackRef}>
      <div className={`fp-shelf${shelf ? "" : " is-off"}`} aria-hidden="true"
        style={shelf ? { transform: `translateX(${shelf.left}px)`, width: shelf.width, top: shelf.top, height: shelf.height } : undefined} />
      <div className="fp-cells" role="img" aria-label={`Array: ${step.array.join(", ")}`}>
        {step.array.map((v, i) => {
          const outside = step.range ? i < step.range[0] || i > step.range[1] : false;
          const tone = step.tones?.[i] ?? (outside ? "discard" : undefined);
          return (
            <div className="fp-col" key={i}>
              <div className={`fp-cell${tone ? ` fp-cell--${tone}` : ""}`}>
                {/* Keyed by value: a changed digit re-mounts and pops. */}
                <span className="fp-val" key={String(v)}>{v}</span>
              </div>
              <div className="fp-idx">{step.labels?.[i] ?? i}</div>
            </div>
          );
        })}
      </div>
      {step.badge && badgeCol && (
        <div key={`${step.badge.at}-${step.badge.text}`}
          className={`fp-badge${step.badge.at <= 1 ? " is-start" : step.badge.at >= n - 2 ? " is-end" : ""}`}
          style={{
            left: step.badge.at <= 1 ? badgeCol.x : step.badge.at >= n - 2 ? badgeCol.x + badgeCol.w : badgeCol.x + badgeCol.w / 2,
            top: Math.max(0, badgeCol.top - 40),
          }}>
          {step.badge.text}
        </div>
      )}
      <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 10 }} aria-hidden="true">
        {ptrs.map(({ name, i, row }) => {
          const c = cols[i];
          if (!c) return null;
          return (
            <span className="fp-ptr" key={name}
              style={{ width: c.w, transform: `translate(${c.x}px, ${row * PTR_ROW}px)` }}>
              {name}
            </span>
          );
        })}
      </div>
      {(ptrs.length > 0 || step.badge) && (
        <span className="fp-sr">
          {step.badge ? `${step.badge.text}. ` : ""}
          {ptrs.length > 0 ? `Pointers: ${ptrs.map((p) => `${p.name} at ${p.i}`).join(", ")}` : ""}
        </span>
      )}
    </div>
  );
}
